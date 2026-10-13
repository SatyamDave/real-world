"""Make, list and revoke API keys: uv run python -m rw_api.keys create --label <name> --cap-usd <n>.

A key is printed once by create; only its SHA-256 is stored (product/simulate-api.md).
"""

import argparse
import hashlib
import math
import secrets
import sqlite3

from rw import llm
from rw_api.app import _now, connect, key_spent


def create(conn: sqlite3.Connection, label: str, cap_usd: float) -> str:
    if not (math.isfinite(cap_usd) and cap_usd > 0):
        raise ValueError("--cap-usd must be a number above 0")
    key = f"rw_{secrets.token_hex(16)}"
    with conn:
        conn.execute(
            "INSERT INTO api_keys (label, key_sha256, cap_usd, created_at) VALUES (?, ?, ?, ?)",
            (label, hashlib.sha256(key.encode()).hexdigest(), cap_usd, _now()),
        )
    return key


def rows(conn: sqlite3.Connection) -> list[str]:
    keys = conn.execute("SELECT id, label, cap_usd, revoked_at FROM api_keys ORDER BY id")
    provider = llm.decider().name
    return ["id\tlabel\tcap\tspent\tstatus"] + [
        f"{r['id']}\t{r['label']}\t${r['cap_usd']:g}"
        f"\t{llm.cost_text(key_spent(conn, r['id']), provider)}"
        f"\t{'revoked ' + r['revoked_at'] if r['revoked_at'] else 'live'}"
        for r in keys.fetchall()
    ]


def revoke(conn: sqlite3.Connection, key_id: int) -> None:
    with conn:
        cur = conn.execute(
            "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
            (_now(), key_id),
        )
    if cur.rowcount == 0:
        raise ValueError(f"no live key with id {key_id}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m rw_api.keys")
    sub = parser.add_subparsers(dest="command", required=True)
    make = sub.add_parser("create", help="make a key and print it once")
    make.add_argument("--label", required=True)
    make.add_argument("--cap-usd", type=float, required=True)
    sub.add_parser("list", help="id, label, cap, spend so far and status of every key")
    gone = sub.add_parser("revoke", help="stop a key working")
    gone.add_argument("--id", type=int, required=True)
    args = parser.parse_args(argv)
    conn = connect()
    try:
        if args.command == "create":
            print(create(conn, args.label, args.cap_usd))
        elif args.command == "list":
            print("\n".join(rows(conn)))
        else:
            revoke(conn, args.id)
            print(f"revoked {args.id}")
    except ValueError as e:
        parser.exit(1, f"{e}\n")


if __name__ == "__main__":
    main()
