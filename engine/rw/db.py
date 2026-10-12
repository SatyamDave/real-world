import sqlite3
from pathlib import Path

from rw import settings

SQL_DIR = Path(__file__).parent / "sql"


def connect(path: Path | None = None) -> sqlite3.Connection:
    if path is None:
        home = settings.rw_home()
        home.mkdir(parents=True, exist_ok=True)
        path = home / "rw.sqlite"
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    for schema in sorted(SQL_DIR.glob("*.sql")):
        apply(conn, schema)
    return conn


def apply(conn: sqlite3.Connection, path: Path) -> None:
    conn.executescript(Path(path).read_text())
