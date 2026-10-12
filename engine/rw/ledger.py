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
from collections.abc import Sequence
from datetime import date as Date
from pathlib import Path
from typing import Any

from rw import db, settings

GENESIS_ROOT = "0" * 64


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


def record_hash(day_record: dict[str, str]) -> str:
    return sha256_hex(canonical_json(day_record))


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
    for name in ("verify", "export"):
        sub.add_parser(name).add_argument("--date", required=True)
    args = parser.parse_args(argv)

    conn = db.connect()
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
