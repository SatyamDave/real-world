import pytest
from fastapi.testclient import TestClient

from rw import daily, forecast, settings
from rw_api import app as api

QUESTION = "fx-usa-cpi-rise"


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
            mp.delenv(var, raising=False)
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=2000)
    return path


@pytest.fixture
def client(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))
    for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
        monkeypatch.delenv(var, raising=False)
    with TestClient(api.app) as c:
        yield c


def test_question_carries_every_forecast_with_its_receipt(client):
    body = client.get(f"/v1/questions/{QUESTION}").json()
    q = next(q for q in forecast.load_questions() if q["id"] == QUESTION)
    assert body["question"]["question_hash"] == forecast.question_hash(q)
    assert body["question"]["countries"] == [{"iso3": "USA", "name": "United States", "tier": "A"}]
    assert body["members"] == settings.DAILY_FORECAST_MEMBERS
    assert [d["date"] for d in body["days"]] == sorted(d["date"] for d in body["days"])
    assert body["days"], "the fixture question is forecast on at least one day"
    for day in body["days"]:
        assert set(day["forecasts"]) == {"sim", "plain_llm", "market"}
        sim = day["forecasts"]["sim"]
        assert sim["p10"] <= sim["probability"] <= sim["p90"]
        assert day["forecasts"]["market"]["p10"] is None
        assert all(f["leaf_hash"] and f["salt"] for f in day["forecasts"].values())
        receipt = client.get(f"/v1/receipts/{day['date']}").json()
        leaves = {e["leaf_hash"]: e["entry"] for e in receipt["entries"]}
        for who, f in day["forecasts"].items():
            assert leaves[f["leaf_hash"]]["forecaster"] == who
            assert f["probability"] == float(leaves[f["leaf_hash"]]["probability"])


def test_question_shows_the_model_answers_behind_each_forecast(client):
    day = client.get(f"/v1/questions/{QUESTION}").json()["days"][0]
    assert day["segments"]
    assert all(0 <= s["yes_share"] <= 1 and 0 <= s["prior_share"] <= 1 for s in day["segments"])
    assert all(s["segment"].startswith("USA|") for s in day["segments"])
    assert len(day["plain_samples"]) == settings.PLAIN_LLM_SAMPLES
    assert day["headlines"]


def test_question_scores_follow_the_outcome(client):
    body = client.get(f"/v1/questions/{QUESTION}").json()
    resolved = body["outcome"] is not None
    for day in body["days"]:
        for f in day["forecasts"].values():
            assert (f["brier"] is not None) == resolved
            if resolved:
                assert f["brier"] == pytest.approx(
                    (f["probability"] - body["outcome"]["outcome"]) ** 2
                )


def test_unknown_question_is_not_found(client):
    r = client.get("/v1/questions/nope")
    assert r.status_code == 404
    assert r.json() == {"detail": "no question nope"}
