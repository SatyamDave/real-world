from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from rw import daily, settings
from rw_api import app as api


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=2000)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))


@pytest.fixture
def client():
    with TestClient(api.app) as c:
        yield c


@pytest.fixture
def conn():
    return api.connect()


def test_status_reads_the_latest_cycle_and_ledger_head(client, conn):
    day = daily.FIXTURE_DAYS[-1]
    body = client.get("/v1/status").json()
    head = conn.execute(
        "SELECT root, record_hash FROM ledger_days WHERE date = ?", (day,)
    ).fetchone()
    assert body["date"] == day
    assert body["cycle_status"] == "ok"
    assert body["root"] == head["root"]
    assert body["record_hash"] == head["record_hash"]
    assert body["anchor"] == "not_anchored"
    assert body["model"] == "fake" and body["provider"] == "fake"
    assert body["nightly_budget_usd"] == settings.NIGHTLY_BUDGET_USD
    assert body["engine_version"] == settings.ENGINE_VERSION
    assert body["spent_today_usd"] >= 0


def test_status_names_a_failed_step(client, conn):
    day = "2999-01-01"
    now = datetime.now(UTC).isoformat()
    conn.execute(
        "INSERT INTO stage_runs (date, step, status, started_at) VALUES (?, 'sample', 'failed', ?)",
        (day, now),
    )
    conn.commit()
    try:
        body = client.get("/v1/status").json()
        assert (body["date"], body["cycle_status"], body["root"]) == (day, "failed", None)
    finally:
        conn.execute("DELETE FROM stage_runs WHERE date = ?", (day,))
        conn.commit()
