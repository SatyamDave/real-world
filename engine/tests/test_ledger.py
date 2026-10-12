import hashlib
import json
import sqlite3
from pathlib import Path

import pytest

from rw import db, ledger, settings

VECTOR = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "receipts_test_vector.json"
PROTOCOL = "a" * 64


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


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
