import pytest
from fastapi.testclient import TestClient

from rw import daily
from rw_api.app import app

DAYS = daily.FIXTURE_DAYS[:2]


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(tmp_path_factory.mktemp("rw") / "var"))
        for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
            mp.delenv(var, raising=False)
        for day in DAYS:
            daily.run(day, world_agents=2000)
        yield TestClient(app)


def test_the_latest_cycle_is_a_run_log_of_every_step(client):
    body = client.get("/v1/cycle").json()
    assert body["date"] == DAYS[-1] and body["dates"] == DAYS
    assert body["provider"] == "fake" and body["model"] == "fake"
    assert [s["step"] for s in body["steps"]] == list(daily.STEPS)
    assert all(s["status"] == "ok" for s in body["steps"])
    forecast_step = next(s for s in body["steps"] if s["step"] == "forecast")
    assert forecast_step["model_calls"] > 0
    for s in body["steps"]:
        assert sum(s["by_purpose"].values()) == s["model_calls"]
    assert body["assimilation"] and body["audit"] and body["ledger"]["leaf_count"] > 0


def test_a_cycle_by_date_and_its_replay_match_the_ledger(client):
    assert client.get(f"/v1/cycle/{DAYS[0]}").json()["date"] == DAYS[0]
    replay = client.get(f"/v1/cycle/{DAYS[-1]}/replay").json()
    assert replay["missing"] == [] and replay["forecasts"]
    assert all(r["matches"] for r in replay["forecasts"])


@pytest.mark.parametrize("path", ["/v1/cycle/1999-01-01", "/v1/cycle/1999-01-01/replay"])
def test_a_day_that_never_ran_is_not_found(client, path):
    r = client.get(path)
    assert r.status_code == 404 and isinstance(r.json()["detail"], str)
