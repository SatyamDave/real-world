"""Append-only forecast receipts: salted leaves, a daily Merkle root, and a chain of day records.

The format is fixed by research/decisions/0002-benchmark-and-receipts.md.
"""

import argparse
import hashlib
import json
import math
import secrets
import sqlite3
import sys
import urllib.request
from collections.abc import Sequence
from datetime import UTC, datetime
from datetime import date as Date
from pathlib import Path
from typing import Any, Literal

from rw import db, settings

GENESIS_ROOT = "0" * 64
FIXTURE_PREFIX = "fx-"
AnchorStatus = Literal["not_anchored", "pending", "anchored"]
SHA256_OID = bytes.fromhex("608648016503040201")
TSTINFO_OID = bytes.fromhex("2a864886f70d0109100104")
# The attestation tag an OpenTimestamps calendar puts on a proof not yet in a Bitcoin block.
OTS_PENDING_TAG = bytes.fromhex("83dfe30d2ef90c8e")


FIXTURE_ANCHOR = "fixture days are not sent to public timestamp servers"


class LedgerConflict(Exception):
    pass


def canonical_json(obj: Any) -> bytes:
    _reject_numbers(obj)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def _reject_numbers(obj: Any) -> None:
    if isinstance(obj, dict):
        for key, value in obj.items():
            if not isinstance(key, str):
                raise TypeError(f"canonical JSON keys must be strings, got {key!r}")
            _reject_numbers(value)
    elif isinstance(obj, list | tuple):
        for value in obj:
            _reject_numbers(value)
    # Python and JavaScript print some floats and large ints differently, so numbers travel as
    # strings; bool is an int subclass but serializes the same in both.
    elif isinstance(obj, int | float) and not isinstance(obj, bool):
        raise TypeError(f"canonical JSON takes numbers as strings, got {obj!r}")


def prob_str(p: float) -> str:
    if not (math.isfinite(p) and 0 <= p <= 1):
        raise ValueError(f"probability {p!r} is not in [0, 1]")
    return f"{p:.4f}"


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def leaf_hash(entry: dict[str, Any], salt: str) -> str:
    if "salt" in entry:
        raise ValueError("an entry may not carry its own salt key")
    return sha256_hex(b"\x00" + canonical_json({**entry, "salt": salt}))


def merkle_root(leaf_hashes: Sequence[str]) -> str:
    if not leaf_hashes:
        raise ValueError("a Merkle root needs at least one leaf")
    level = [bytes.fromhex(h) for h in sorted(leaf_hashes)]
    while len(level) > 1:
        paired = [
            hashlib.sha256(b"\x01" + level[i] + level[i + 1]).digest()
            for i in range(0, len(level) - 1, 2)
        ]
        level = paired + level[len(level) - 1 :] if len(level) % 2 else paired
    return level[0].hex()


def inclusion_proof(leaf_hashes: Sequence[str], target: str) -> list[dict[str, str]]:
    """The siblings from a leaf up to merkle_root's root, each as {position, hash} where position
    is the side the sibling sits on. A level's odd last node is promoted and adds no sibling."""
    ordered = sorted(leaf_hashes)
    if target not in ordered:
        raise ValueError("the leaf is not in this day")
    at = ordered.index(target)
    level = [bytes.fromhex(h) for h in ordered]
    proof = []
    while len(level) > 1:
        if at ^ 1 < len(level):
            proof.append({"position": "left" if at % 2 else "right", "hash": level[at ^ 1].hex()})
        paired = [
            hashlib.sha256(b"\x01" + level[i] + level[i + 1]).digest()
            for i in range(0, len(level) - 1, 2)
        ]
        level = paired + level[len(level) - 1 :] if len(level) % 2 else paired
        at //= 2
    return proof


def verify_inclusion(target: str, proof: Sequence[dict[str, str]], root: str) -> bool:
    node = bytes.fromhex(target)
    for step in proof:
        sibling = bytes.fromhex(step["hash"])
        pair = sibling + node if step["position"] == "left" else node + sibling
        node = hashlib.sha256(b"\x01" + pair).digest()
    return node.hex() == root


def record_hash(day_record: dict[str, str]) -> str:
    return sha256_hex(canonical_json(day_record))


def _der(tag: int, body: bytes) -> bytes:
    n = len(body)
    if n < 0x80:
        return bytes([tag, n]) + body
    size = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return bytes([tag, 0x80 | len(size)]) + size + body


def _der_items(der: bytes) -> list[tuple[int, bytes]]:
    """The (tag, body) of each element in a run of DER; raises ValueError on malformed input."""
    items, i = [], 0
    while i < len(der):
        if i + 2 > len(der):
            raise ValueError("truncated DER header")
        tag, n, i = der[i], der[i + 1], i + 2
        if n & 0x80:
            width = n & 0x7F
            if not 1 <= width <= 4 or i + width > len(der):
                raise ValueError("unsupported DER length")
            n, i = int.from_bytes(der[i : i + width], "big"), i + width
        if i + n > len(der):
            raise ValueError("truncated DER body")
        items.append((tag, der[i : i + n]))
        i += n
    return items


def _der_seq(der: bytes) -> list[tuple[int, bytes]]:
    items = _der_items(der)
    if not items or items[0][0] != 0x30:
        raise ValueError("expected a DER SEQUENCE")
    return _der_items(items[0][1])


def rfc3161_request(digest: bytes) -> bytes:
    """A DER TimeStampReq for a SHA-256 digest, asking the TSA to include its certificate."""
    algorithm = _der(0x30, _der(0x06, SHA256_OID) + b"\x05\x00")
    imprint = _der(0x30, algorithm + _der(0x04, digest))
    return _der(0x30, b"\x02\x01\x01" + imprint + b"\x01\x01\xff")


def rfc3161_imprint(response: bytes) -> tuple[bytes, str]:
    """The SHA-256 digest and genTime a granted TimeStampResp vouches for. Raises ValueError
    otherwise. The CMS signature and certificate chain are not checked here."""
    try:
        resp = _der_seq(response)
        if _der_items(resp[0][1])[0][1] not in (b"\x00", b"\x01") or len(resp) < 2:
            raise ValueError("the TSA did not grant the request")
        signed_data = _der_seq(_der_items(resp[1][1])[1][1])
        content_type, content = _der_items(signed_data[2][1])[:2]
        if content_type[1] != TSTINFO_OID:
            raise ValueError("the token does not hold a TSTInfo")
        tst_info = _der_seq(_der_items(content[1])[0][1])
        algorithm, digest = _der_items(tst_info[2][1])
        if _der_items(algorithm[1])[0][1] != SHA256_OID:
            raise ValueError("the token imprint is not SHA-256")
        if tst_info[4][0] != 0x18:
            raise ValueError("the token has no GeneralizedTime")
        t = tst_info[4][1].decode()
    except IndexError as e:
        raise ValueError(f"malformed TimeStampResp: {e}") from e
    return digest[1], f"{t[0:4]}-{t[4:6]}-{t[6:8]}T{t[8:10]}:{t[10:12]}:{t[12:14]}Z"


def _post(url: str, body: bytes, headers: dict[str, str]) -> bytes:
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=settings.ANCHOR_TIMEOUT_S) as response:
        return response.read()


def anchors(conn: sqlite3.Connection, date: str) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM ledger_anchors WHERE date = ? ORDER BY kind", (date,)
    ).fetchall()


def anchor_status(conn: sqlite3.Connection, date: str) -> tuple[AnchorStatus, str | None]:
    """("anchored", genTime) only when a stored RFC 3161 token vouches for the day's record_hash;
    otherwise "pending" with an OpenTimestamps calendar proof, else "not_anchored"."""
    row = _day_row(conn, date)
    if row is None:
        return "not_anchored", None
    pending = False
    for a in anchors(conn, date):
        if a["kind"] == "rfc3161":
            try:
                digest, at = rfc3161_imprint(a["proof"])
            except ValueError:
                continue
            if digest.hex() == row["record_hash"]:
                return "anchored", at
        elif OTS_PENDING_TAG in a["proof"]:
            pending = True
    return ("pending" if pending else "not_anchored"), None


def anchor_day(conn: sqlite3.Connection, date: str) -> list[str]:
    """Send a verified day's record_hash to the TSA and the OpenTimestamps calendar, store each
    proof that checks out, and return what failed. A kind already stored is not requested again."""
    if is_fixture(entries(conn, date)):
        raise LedgerConflict(f"{date}: {FIXTURE_ANCHOR}")
    problems = verify_day(conn, date)
    if problems:
        raise LedgerConflict(f"{date} fails verification: " + "; ".join(problems))
    row = _day_row(conn, date)
    assert row is not None
    digest = bytes.fromhex(row["record_hash"])
    done = {a["kind"] for a in anchors(conn, date)}
    requests = {
        "rfc3161": (
            settings.TSA_URL,
            rfc3161_request(digest),
            {"Content-Type": "application/timestamp-query"},
        ),
        "opentimestamps": (
            settings.OTS_CALENDAR_URL + "/digest",
            digest,
            {"Accept": "application/vnd.opentimestamps.v1"},
        ),
    }
    failures = []
    for kind, (url, body, headers) in requests.items():
        if kind in done:
            continue
        try:
            proof = _post(url, body, headers)
            if kind == "rfc3161" and rfc3161_imprint(proof)[0] != digest:
                raise ValueError("the token vouches for a different digest")
            if kind == "opentimestamps" and OTS_PENDING_TAG not in proof:
                raise ValueError("the calendar reply is not a pending timestamp")
        except (OSError, ValueError) as e:
            failures.append(f"{date}: {kind} via {url} failed: {e}")
            continue
        with conn:
            conn.execute(
                "INSERT INTO ledger_anchors (date, kind, service, requested_at, proof)"
                " VALUES (?, ?, ?, ?, ?)",
                (date, kind, url, datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"), proof),
            )
    return failures


def _check_date(date: str) -> None:
    if Date.fromisoformat(date).isoformat() != date:
        raise ValueError(f"{date!r} is not a YYYY-MM-DD date")


def _day_record(row: sqlite3.Row) -> dict[str, str]:
    return {
        "date": row["date"],
        "prev_root": row["prev_root"],
        "root": row["root"],
        "leaf_count": str(row["leaf_count"]),
        "protocol_hash": row["protocol_hash"],
        "engine_version": row["engine_version"],
    }


def _day_row(conn: sqlite3.Connection, date: str) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM ledger_days WHERE date = ?", (date,)).fetchone()


def entries(conn: sqlite3.Connection, date: str) -> list[dict[str, Any]]:
    """Every leaf of a day as {entry, salt, leaf_hash}, in leaf-hash order."""
    rows = conn.execute(
        "SELECT entry_json, salt, leaf_hash FROM ledger_leaves WHERE date = ? ORDER BY leaf_hash",
        (date,),
    ).fetchall()
    return [
        {"entry": json.loads(r["entry_json"]), "salt": r["salt"], "leaf_hash": r["leaf_hash"]}
        for r in rows
    ]


def is_fixture(items: Sequence[dict[str, Any]]) -> bool:
    """True when a day's {entry, ...} items name a fixture question. Such a day is illustrative:
    it is never anchored or mirrored (product/world.md)."""
    for item in items:
        e = item["entry"]
        if any(
            q.startswith(FIXTURE_PREFIX)
            for q in [e.get("question_id", "")] + e.get("question_ids", [])
        ):
            return True
    return False


def commit_day(
    conn: sqlite3.Connection, date: str, day_entries: Sequence[dict[str, Any]], protocol_hash: str
) -> dict[str, Any]:
    """Salt and commit a day's entries; return the day record and its record_hash."""
    _check_date(date)
    if not day_entries:
        raise ValueError(f"{date}: an empty day is not committed")
    new = sorted(canonical_json(e) for e in day_entries)

    existing = _day_row(conn, date)
    if existing is not None:
        stored = sorted(canonical_json(e["entry"]) for e in entries(conn, date))
        if stored != new or existing["protocol_hash"] != protocol_hash:
            raise LedgerConflict(f"{date} is already committed with different entries")
        return {"day": _day_record(existing), "record_hash": existing["record_hash"]}

    later = conn.execute("SELECT date FROM ledger_days WHERE date > ? LIMIT 1", (date,)).fetchone()
    if later is not None:
        raise LedgerConflict(f"{date} comes before committed day {later['date']}")
    prev = conn.execute(
        "SELECT root FROM ledger_days WHERE date < ? ORDER BY date DESC LIMIT 1", (date,)
    ).fetchone()

    leaves = []
    for entry in day_entries:
        salt = secrets.token_hex(16)
        leaves.append((date, leaf_hash(entry, salt), canonical_json(entry).decode(), salt))
    record = {
        "date": date,
        "prev_root": GENESIS_ROOT if prev is None else prev["root"],
        "root": merkle_root([leaf[1] for leaf in leaves]),
        "leaf_count": str(len(leaves)),
        "protocol_hash": protocol_hash,
        "engine_version": settings.ENGINE_VERSION,
    }
    digest = record_hash(record)
    with conn:
        conn.executemany(
            "INSERT INTO ledger_leaves (date, leaf_hash, entry_json, salt) VALUES (?, ?, ?, ?)",
            leaves,
        )
        conn.execute(
            "INSERT INTO ledger_days (date, prev_root, root, leaf_count, protocol_hash,"
            " engine_version, record_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                date,
                record["prev_root"],
                record["root"],
                len(leaves),
                protocol_hash,
                record["engine_version"],
                digest,
            ),
        )
    return {"day": record, "record_hash": digest}


def receipt_problems(receipt: dict[str, Any]) -> list[str]:
    """Check one exported day ({day, record_hash, entries}) on its own; the chain is not checked."""
    day = receipt["day"]
    problems = []
    recomputed = []
    for item in receipt["entries"]:
        try:
            actual = leaf_hash(item["entry"], item["salt"])
        except (TypeError, ValueError) as e:
            problems.append(f"{day['date']}: leaf {item['leaf_hash']} cannot be hashed: {e}")
            continue
        if actual != item["leaf_hash"]:
            problems.append(f"{day['date']}: leaf {item['leaf_hash']} recomputes to {actual}")
        recomputed.append(actual)
    stored = len(receipt["entries"])
    if str(stored) != day["leaf_count"]:
        problems.append(f"{day['date']}: {stored} leaves stored, record says {day['leaf_count']}")
    root = merkle_root(recomputed) if recomputed else None
    if root != day["root"]:
        problems.append(f"{day['date']}: root recomputes to {root}, record says {day['root']}")
    if record_hash(day) != receipt["record_hash"]:
        problems.append(f"{day['date']}: record_hash does not match the day record")
    return problems


def verify_day(conn: sqlite3.Connection, date: str) -> list[str]:
    """Recompute every day from genesis through date; return what is broken, or []."""
    if _day_row(conn, date) is None:
        return [f"{date}: no committed day"]
    problems = []
    prev_root = GENESIS_ROOT
    days = conn.execute("SELECT * FROM ledger_days WHERE date <= ? ORDER BY date", (date,))
    for row in days.fetchall():
        if row["prev_root"] != prev_root:
            problems.append(
                f"{row['date']}: prev_root {row['prev_root']} does not match {prev_root}"
            )
        try:
            receipt = _receipt(conn, row)
        except json.JSONDecodeError as e:
            problems.append(f"{row['date']}: a stored entry is not valid JSON: {e}")
        else:
            problems.extend(receipt_problems(receipt))
        for a in anchors(conn, row["date"]):
            if a["kind"] != "rfc3161":
                continue
            try:
                digest = rfc3161_imprint(a["proof"])[0].hex()
            except ValueError as e:
                problems.append(f"{row['date']}: the RFC 3161 token cannot be read: {e}")
                continue
            if digest != row["record_hash"]:
                problems.append(f"{row['date']}: the RFC 3161 token vouches for {digest}")
        prev_root = row["root"]
    return problems


def _receipt(conn: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    return {
        "day": _day_record(row),
        "record_hash": row["record_hash"],
        "entries": entries(conn, row["date"]),
    }


def export_day(conn: sqlite3.Connection, date: str) -> Path:
    problems = verify_day(conn, date)
    if problems:
        raise LedgerConflict(f"{date} fails verification: " + "; ".join(problems))
    row = _day_row(conn, date)
    assert row is not None
    path = settings.rw_home() / "receipts" / f"{date}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    receipt = _receipt(conn, row)
    path.write_text(json.dumps(receipt, sort_keys=True, indent=2, ensure_ascii=False) + "\n")
    return path


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m rw.ledger")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("verify", "export", "anchor"):
        sub.add_parser(name).add_argument("--date", required=True)
    sub.add_parser(
        "fixture", help="print each exported receipt that is a fixture day"
    ).add_argument("receipts", nargs="+", type=Path)
    sub.add_parser(
        "check-export", help="check each exported receipt on its own; exit 1 if any fails"
    ).add_argument("receipts", nargs="+", type=Path)
    args = parser.parse_args(argv)

    if args.command == "check-export":
        failed = False
        for path in args.receipts:
            try:
                problems = receipt_problems(json.loads(path.read_text()))
            except (OSError, ValueError, KeyError, TypeError, AttributeError) as e:
                problems = [f"cannot be read as a receipt: {e!r}"]
            for problem in problems:
                print(f"{path}: {problem}", file=sys.stderr)
            failed = failed or bool(problems)
        return 1 if failed else 0
    if args.command == "fixture":
        for path in args.receipts:
            if is_fixture(json.loads(path.read_text())["entries"]):
                print(path)
        return 0
    conn = db.connect()
    if args.command == "anchor":
        try:
            failures = anchor_day(conn, args.date)
        except LedgerConflict as e:
            print(e, file=sys.stderr)
            return 1
        for failure in failures:
            print(failure, file=sys.stderr)
        status, at = anchor_status(conn, args.date)
        print(status if at is None else f"{status} {at}")
        return 1 if failures else 0
    if args.command == "verify":
        problems = verify_day(conn, args.date)
        for problem in problems:
            print(problem)
        if problems:
            return 1
        print("OK")
        return 0
    try:
        print(export_day(conn, args.date))
    except LedgerConflict as e:
        print(e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
