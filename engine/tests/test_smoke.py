import pytest

import rw
from rw import db, settings


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


def test_connect_creates_database_under_rw_home():
    assert rw.__name__ == "rw"
    conn = db.connect()
    assert (settings.rw_home() / "rw.sqlite").exists()
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    assert "llm_calls" in tables


def test_connect_twice_is_safe():
    db.connect().close()
    db.connect().close()


def test_apply_runs_an_extra_schema(tmp_path):
    schema = tmp_path / "extra.sql"
    schema.write_text("CREATE TABLE IF NOT EXISTS extra (id INTEGER PRIMARY KEY);")
    conn = db.connect()
    db.apply(conn, schema)
    assert conn.execute("SELECT count(*) FROM extra").fetchone()[0] == 0
