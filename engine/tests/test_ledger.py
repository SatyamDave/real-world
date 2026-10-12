import hashlib
import json
import os
import sqlite3
from pathlib import Path

import pytest

from rw import db, ledger, settings

VECTOR = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "receipts_test_vector.json"
PROTOCOL = "a" * 64


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


@pytest.fixture
def conn():
    return db.connect()


def entry(date, question_id="fx-q1", forecaster="sim", p=0.625, supersedes=""):
    return {
        "kind": "forecast" if not supersedes else "correction",
        "date": date,
        "question_id": question_id,
        "forecaster": forecaster,
        "probability": ledger.prob_str(p),
        "supersedes": supersedes,
    }


@pytest.fixture
def anchorable(monkeypatch):
    """The recorded vector and the helper entries use fx- ids, which anchor_day refuses."""
    monkeypatch.setattr(ledger, "FIXTURE_PREFIX", "never-")


def three_entries(date):
    return [entry(date, forecaster=f) for f in ("sim", "plain_llm", "market")]


def tamper(conn, sql, params=()):
    """Simulate someone editing the SQLite file directly, around the triggers."""
    conn.executescript(
        "DROP TRIGGER ledger_leaves_no_update; DROP TRIGGER ledger_leaves_no_delete;"
        "DROP TRIGGER ledger_days_no_update; DROP TRIGGER ledger_days_no_delete;"
    )
    with conn:
        conn.execute(sql, params)


def test_test_vector_reproduces():
    vector = json.loads(VECTOR.read_text())
    for item in vector["entries"]:
        assert ledger.leaf_hash(item["entry"], item["salt"]) == item["leaf_hash"]
    leaves = [item["leaf_hash"] for item in vector["entries"]]
    assert ledger.merkle_root(leaves) == vector["day"]["root"]
    assert ledger.record_hash(vector["day"]) == vector["record_hash"]
    assert ledger.receipt_problems(vector) == []


def test_canonical_json_is_sorted_compact_utf8_and_refuses_numbers():
    assert (
        ledger.canonical_json({"b": "1", "a": ["ü", True, None]})
        == '{"a":["ü",true,null],"b":"1"}'.encode()
    )
    for bad in ({"p": 0.5}, {"n": 3}, {"nested": [{"x": 1.0}]}, {1: "a"}):
        with pytest.raises(TypeError):
            ledger.canonical_json(bad)


def test_prob_str_has_four_decimals_and_refuses_out_of_range():
    assert ledger.prob_str(0.625) == "0.6250"
    assert ledger.prob_str(0) == "0.0000"
    assert ledger.prob_str(1) == "1.0000"
    for bad in (-0.01, 1.01, float("nan"), float("inf")):
        with pytest.raises(ValueError):
            ledger.prob_str(bad)


def test_merkle_root_sorts_leaves_and_carries_the_odd_node_up():
    a, b, c = (hashlib.sha256(x).hexdigest() for x in (b"a", b"b", b"c"))
    raw = sorted(bytes.fromhex(h) for h in (a, b, c))
    ab = hashlib.sha256(b"\x01" + raw[0] + raw[1]).digest()
    expected = hashlib.sha256(b"\x01" + ab + raw[2]).hexdigest()
    assert ledger.merkle_root([c, a, b]) == expected
    assert ledger.merkle_root([a]) == a
    with pytest.raises(ValueError):
        ledger.merkle_root([])


def test_leaf_hash_refuses_an_entry_with_a_salt_key():
    with pytest.raises(ValueError):
        ledger.leaf_hash({"salt": "x"}, "y")


def test_commit_chains_days_and_verifies(conn):
    first = ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    second = ledger.commit_day(conn, "2026-10-02", three_entries("2026-10-02"), PROTOCOL)
    assert first["day"]["prev_root"] == ledger.GENESIS_ROOT
    assert second["day"]["prev_root"] == first["day"]["root"]
    assert first["day"]["leaf_count"] == "3"
    assert first["day"]["engine_version"] == settings.ENGINE_VERSION
    assert ledger.verify_day(conn, "2026-10-02") == []
    salts = [e["salt"] for e in ledger.entries(conn, "2026-10-01")]
    assert len(set(salts)) == 3 and all(len(s) == 32 for s in salts)


def test_empty_day_is_refused(conn):
    with pytest.raises(ValueError):
        ledger.commit_day(conn, "2026-10-01", [], PROTOCOL)
    assert conn.execute("SELECT count(*) FROM ledger_days").fetchone()[0] == 0


def test_recommitting_identical_entries_is_a_noop(conn):
    first = ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    again = ledger.commit_day(
        conn, "2026-10-01", list(reversed(three_entries("2026-10-01"))), PROTOCOL
    )
    assert again == first
    assert conn.execute("SELECT count(*) FROM ledger_leaves").fetchone()[0] == 3


def test_recommitting_different_entries_raises(conn):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    changed = three_entries("2026-10-01")
    changed[0]["probability"] = "0.6251"
    with pytest.raises(ledger.LedgerConflict):
        ledger.commit_day(conn, "2026-10-01", changed, PROTOCOL)
    with pytest.raises(ledger.LedgerConflict):
        ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01")[:2], PROTOCOL)
    with pytest.raises(ledger.LedgerConflict):
        ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), "b" * 64)


def test_a_day_before_a_committed_day_is_refused(conn):
    ledger.commit_day(conn, "2026-10-02", three_entries("2026-10-02"), PROTOCOL)
    with pytest.raises(ledger.LedgerConflict):
        ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)


@pytest.mark.parametrize("table", ["ledger_leaves", "ledger_days"])
def test_update_and_delete_are_refused(conn, table):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    with pytest.raises((sqlite3.IntegrityError, sqlite3.OperationalError)):
        conn.execute(f"UPDATE {table} SET date = '2026-09-30'")
    with pytest.raises((sqlite3.IntegrityError, sqlite3.OperationalError)):
        conn.execute(f"DELETE FROM {table}")
    assert ledger.verify_day(conn, "2026-10-01") == []


REPLACE_SQL = {
    "ledger_leaves": "SELECT date, leaf_hash, entry_json, 'x' FROM ledger_leaves",
    "ledger_days": "SELECT date, prev_root, '" + "f" * 64 + "', leaf_count, protocol_hash,"
    " engine_version, record_hash FROM ledger_days",
}


@pytest.mark.parametrize("verb", ["INSERT OR REPLACE", "REPLACE"])
@pytest.mark.parametrize("table", ["ledger_leaves", "ledger_days"])
def test_replace_is_refused(conn, table, verb):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    with pytest.raises((sqlite3.IntegrityError, sqlite3.OperationalError)):
        conn.execute(f"{verb} INTO {table} {REPLACE_SQL[table]}")
    assert ledger.verify_day(conn, "2026-10-01") == []


def test_changing_one_byte_of_an_entry_fails_verify(conn):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    target = ledger.entries(conn, "2026-10-01")[0]["leaf_hash"]
    tamper(
        conn,
        "UPDATE ledger_leaves SET entry_json = replace(entry_json, '0.6250', '0.6251')"
        " WHERE leaf_hash = ?",
        (target,),
    )
    problems = ledger.verify_day(conn, "2026-10-01")
    assert any(target in p and "recomputes" in p for p in problems)
    assert any("root recomputes" in p for p in problems)


def test_dropping_a_leaf_fails_verify(conn):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    target = ledger.entries(conn, "2026-10-01")[0]["leaf_hash"]
    tamper(conn, "DELETE FROM ledger_leaves WHERE leaf_hash = ?", (target,))
    problems = ledger.verify_day(conn, "2026-10-01")
    assert any("2 leaves stored, record says 3" in p for p in problems)
    assert any("root recomputes" in p for p in problems)


def test_editing_prev_root_fails_verify_on_that_day_and_later(conn):
    for d in ("2026-10-01", "2026-10-02", "2026-10-03"):
        ledger.commit_day(conn, d, three_entries(d), PROTOCOL)
    tamper(conn, "UPDATE ledger_days SET prev_root = ? WHERE date = '2026-10-02'", ("f" * 64,))
    problems = ledger.verify_day(conn, "2026-10-03")
    assert any(p.startswith("2026-10-02: prev_root") for p in problems)
    assert any(p.startswith("2026-10-02: record_hash") for p in problems)
    assert ledger.verify_day(conn, "2026-10-01") == []


def test_tampering_with_an_earlier_day_fails_verify_of_a_later_day(conn):
    for d in ("2026-10-01", "2026-10-02"):
        ledger.commit_day(conn, d, three_entries(d), PROTOCOL)
    tamper(conn, "UPDATE ledger_leaves SET salt = ? WHERE date = '2026-10-01'", ("0" * 32,))
    assert any(p.startswith("2026-10-01:") for p in ledger.verify_day(conn, "2026-10-02"))


def test_verify_reports_an_uncommitted_day(conn):
    assert ledger.verify_day(conn, "2026-10-01") == ["2026-10-01: no committed day"]


def test_correction_keeps_the_original_leaf(conn):
    ledger.commit_day(conn, "2026-10-01", [entry("2026-10-01")], PROTOCOL)
    original = ledger.entries(conn, "2026-10-01")[0]
    correction = entry("2026-10-02", p=0.6, supersedes=original["leaf_hash"])
    ledger.commit_day(conn, "2026-10-02", [correction], PROTOCOL)
    assert ledger.entries(conn, "2026-10-01") == [original]
    assert ledger.entries(conn, "2026-10-02")[0]["entry"]["supersedes"] == original["leaf_hash"]
    assert ledger.verify_day(conn, "2026-10-02") == []


def test_export_writes_a_receipt_that_verifies_on_its_own(conn):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    path = ledger.export_day(conn, "2026-10-01")
    assert path == settings.rw_home() / "receipts" / "2026-10-01.json"
    receipt = json.loads(path.read_text())
    assert set(receipt) == {"day", "record_hash", "entries"}
    assert ledger.receipt_problems(receipt) == []


def test_export_refuses_a_day_that_fails_verify(conn):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    tamper(conn, "UPDATE ledger_days SET root = ?", ("0" * 64,))
    with pytest.raises(ledger.LedgerConflict):
        ledger.export_day(conn, "2026-10-01")
    assert not (settings.rw_home() / "receipts" / "2026-10-01.json").exists()


def test_cli_verify_and_export(conn, capsys):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    assert ledger.main(["verify", "--date", "2026-10-01"]) == 0
    assert capsys.readouterr().out == "OK\n"
    assert ledger.main(["verify", "--date", "2026-10-02"]) == 1
    assert "no committed day" in capsys.readouterr().out
    assert ledger.main(["export", "--date", "2026-10-01"]) == 0
    assert (settings.rw_home() / "receipts" / "2026-10-01.json").exists()


DATA = Path(__file__).parent / "data"
# Recorded on 2026-10-12 by anchoring the test vector's day; see engine/tests/data/README.md.
TSR = (DATA / "freetsa_2026-10-01.tsr").read_bytes()
OTS = (DATA / "ots_2026-10-01.bin").read_bytes()


@pytest.fixture
def vector_day(conn, monkeypatch, anchorable):
    """Commit the test vector's day with its own salts, so its record_hash is the recorded one."""
    vector = json.loads(VECTOR.read_text())
    salts = iter(item["salt"] for item in vector["entries"])
    monkeypatch.setattr(ledger.secrets, "token_hex", lambda n: next(salts))
    day = vector["day"]
    out = ledger.commit_day(
        conn, day["date"], [item["entry"] for item in vector["entries"]], day["protocol_hash"]
    )
    assert out["record_hash"] == vector["record_hash"]
    return day["date"]


def replay(monkeypatch, tsa: bytes | Exception = TSR, ots: bytes | Exception = OTS):
    sent = []

    def post(url, body, headers):
        sent.append((url, body))
        reply = tsa if url == settings.TSA_URL else ots
        if isinstance(reply, Exception):
            raise reply
        return reply

    monkeypatch.setattr(ledger, "_post", post)
    return sent


def test_rfc3161_request_is_the_der_for_a_sha256_imprint():
    digest = bytes(range(32))
    assert ledger.rfc3161_request(digest).hex() == (
        "30390201013031300d060960864801650304020105000420" + digest.hex() + "0101ff"
    )


def test_recorded_token_vouches_for_the_vector_record_hash():
    digest, at = ledger.rfc3161_imprint(TSR)
    assert digest.hex() == json.loads(VECTOR.read_text())["record_hash"]
    assert at == "2026-10-12T17:19:19Z"


@pytest.mark.parametrize("reply", [b"", b"\x30\x03\x02\x01\x02", TSR[:200], b"<html>"])
def test_rfc3161_imprint_refuses_a_refused_or_malformed_reply(reply):
    with pytest.raises(ValueError):
        ledger.rfc3161_imprint(reply)


def test_anchor_stores_both_proofs_once_and_marks_the_day_anchored(conn, vector_day, monkeypatch):
    assert ledger.anchor_status(conn, vector_day) == ("not_anchored", None)
    sent = replay(monkeypatch)
    assert ledger.anchor_day(conn, vector_day) == []
    digest = bytes.fromhex(json.loads(VECTOR.read_text())["record_hash"])
    assert sent == [
        (settings.TSA_URL, ledger.rfc3161_request(digest)),
        (settings.OTS_CALENDAR_URL + "/digest", digest),
    ]
    assert ledger.anchor_status(conn, vector_day) == ("anchored", "2026-10-12T17:19:19Z")
    assert ledger.verify_day(conn, vector_day) == []
    assert ledger.anchor_day(conn, vector_day) == [] and len(sent) == 2


def test_anchors_are_append_only(conn, vector_day, monkeypatch):
    replay(monkeypatch)
    ledger.anchor_day(conn, vector_day)
    for sql in (
        "UPDATE ledger_anchors SET proof = x'00'",
        "DELETE FROM ledger_anchors",
        "REPLACE INTO ledger_anchors SELECT date, kind, service, requested_at, x'00'"
        " FROM ledger_anchors",
    ):
        with pytest.raises((sqlite3.IntegrityError, sqlite3.OperationalError)):
            conn.execute(sql)
    assert ledger.anchor_status(conn, vector_day)[0] == "anchored"


def test_a_token_for_another_digest_is_not_stored(conn, monkeypatch, anchorable):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    replay(monkeypatch, ots=b"not a proof")
    failures = ledger.anchor_day(conn, "2026-10-01")
    assert len(failures) == 2 and "different digest" in failures[0]
    assert ledger.anchors(conn, "2026-10-01") == []
    assert ledger.anchor_status(conn, "2026-10-01") == ("not_anchored", None)


def test_tsa_down_leaves_the_day_pending_on_the_calendar_proof(conn, vector_day, monkeypatch):
    replay(monkeypatch, tsa=OSError("connection refused"))
    failures = ledger.anchor_day(conn, vector_day)
    assert len(failures) == 1 and "rfc3161" in failures[0]
    assert ledger.anchor_status(conn, vector_day) == ("pending", None)
    sent = replay(monkeypatch)
    assert ledger.anchor_day(conn, vector_day) == [] and [u for u, _ in sent] == [settings.TSA_URL]
    assert ledger.anchor_status(conn, vector_day)[0] == "anchored"


def test_anchor_refuses_a_day_that_fails_verify(conn, monkeypatch):
    sent = replay(monkeypatch)
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    tamper(conn, "UPDATE ledger_days SET root = ?", ("0" * 64,))
    with pytest.raises(ledger.LedgerConflict):
        ledger.anchor_day(conn, "2026-10-01")
    assert sent == []


def test_verify_fails_on_a_stored_token_for_another_digest(conn):
    ledger.commit_day(conn, "2026-10-01", three_entries("2026-10-01"), PROTOCOL)
    with conn:
        conn.execute(
            "INSERT INTO ledger_anchors VALUES ('2026-10-01', 'rfc3161', 'x', 'x', ?)", (TSR,)
        )
    assert "the RFC 3161 token vouches for" in ledger.verify_day(conn, "2026-10-01")[0]
    assert ledger.anchor_status(conn, "2026-10-01") == ("not_anchored", None)


def test_cli_anchor(conn, vector_day, monkeypatch, capsys):
    replay(monkeypatch, ots=OSError("timed out"))
    assert ledger.main(["anchor", "--date", vector_day]) == 1
    out = capsys.readouterr()
    assert out.out == "anchored 2026-10-12T17:19:19Z\n" and "opentimestamps" in out.err
    assert ledger.main(["anchor", "--date", "2026-10-02"]) == 1


@pytest.mark.skipif(os.environ.get("RW_LIVE_TESTS") != "1", reason="set RW_LIVE_TESTS=1")
def test_live_anchor_of_the_vector_day(conn, vector_day):
    assert ledger.anchor_day(conn, vector_day) == []
    assert ledger.anchor_status(conn, vector_day)[0] == "anchored"
    assert ledger.verify_day(conn, vector_day) == []


def test_a_fixture_day_is_never_sent_to_a_timestamp_server(conn, monkeypatch, capsys):
    def refuse(*a):
        raise AssertionError("a fixture day reached the network")

    monkeypatch.setattr(ledger, "_post", refuse)
    ledger.commit_day(conn, "2026-10-01", [entry("2026-10-01", "fx-q1")], PROTOCOL)
    with pytest.raises(ledger.LedgerConflict, match="not sent to public timestamp servers"):
        ledger.anchor_day(conn, "2026-10-01")
    assert ledger.main(["anchor", "--date", "2026-10-01"]) == 1
    assert "not sent to public timestamp servers" in capsys.readouterr().err


# sha256 of the single bytes 0x00..0x04, the same leaves web/src/verify.test.ts proves.
FIVE = [hashlib.sha256(bytes([i])).hexdigest() for i in range(5)]
FIVE_ROOT = "03156a7c81bdf6a8609cdad5ccc0592188fa49ff734eb7a66f963fd470ea4101"
FIVE_PROOFS = {
    "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d": [
        {
            "position": "right",
            "hash": "dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986",
        },
        {
            "position": "left",
            "hash": "d3ca56e2028d9891d1a52237db85a8c73ede36af9ee037f9f21d44ef7cbfe7a0",
        },
        {
            "position": "right",
            "hash": "e52d9c508c502347344d8c07ad91cbd6068afc75ff6292f062a09ca381c89e71",
        },
    ],
    # The odd last leaf is promoted twice and meets the rest of the tree only at the root.
    "e52d9c508c502347344d8c07ad91cbd6068afc75ff6292f062a09ca381c89e71": [
        {
            "position": "left",
            "hash": "81adf34334159cc0cf9b990034055fc1dc628af9384f2b4bf7633f6c8a479be5",
        }
    ],
}


def test_inclusion_proofs_match_the_pinned_vector():
    assert ledger.merkle_root(FIVE) == FIVE_ROOT
    for leaf, proof in FIVE_PROOFS.items():
        assert ledger.inclusion_proof(FIVE, leaf) == proof
        assert ledger.verify_inclusion(leaf, proof, FIVE_ROOT)


@pytest.mark.parametrize("n", range(1, 10))
def test_every_leaf_of_every_size_proves_into_the_root(n):
    leaves = [hashlib.sha256(bytes([i, n])).hexdigest() for i in range(n)]
    root = ledger.merkle_root(leaves)
    for leaf in leaves:
        assert ledger.verify_inclusion(leaf, ledger.inclusion_proof(leaves, leaf), root)


def test_an_inclusion_proof_fails_on_a_changed_leaf_sibling_or_side():
    leaf = "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d"
    proof = FIVE_PROOFS[leaf]
    assert not ledger.verify_inclusion(FIVE[1], proof, FIVE_ROOT)
    flipped = [{**proof[0], "position": "left"}, *proof[1:]]
    assert not ledger.verify_inclusion(leaf, flipped, FIVE_ROOT)
    other = [{**proof[0], "hash": FIVE[1]}, *proof[1:]]
    assert not ledger.verify_inclusion(leaf, other, FIVE_ROOT)
    with pytest.raises(ValueError):
        ledger.inclusion_proof(FIVE, "0" * 64)
