import pytest
from fastapi.testclient import TestClient

from rw import daily, score
from rw_api import app as api
from rw_api import routes_scores

AGENTS = 2000


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
            mp.delenv(var, raising=False)
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=AGENTS)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))
    for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
        monkeypatch.delenv(var, raising=False)


@pytest.fixture
def board():
    with TestClient(api.app) as c:
        return c.get("/v1/scoreboard").json()


def test_scoreboard_carries_the_protocol_and_its_hash(board):
    p = board["protocol"]
    assert p["hash"] == score.protocol_hash()
    assert p["bootstrap"] == score.load_protocol()["bootstrap"]
    assert board["first_commit"] == daily.FIXTURE_DAYS[0]
    assert board["resolved_questions"] > 0 and board["open_questions"] > 0


def test_every_resolved_question_day_is_listed_newest_first_with_its_brier(board):
    keys = [(r["date"], r["question_id"]) for r in board["resolved"]]
    assert keys == sorted(keys, reverse=True)
    for r in board["resolved"]:
        assert set(r["forecasts"]) == {"sim", "plain_llm", "market"}
        for f in r["forecasts"].values():
            assert f["brier"] == pytest.approx(score.brier(f["probability"], r["outcome"]))
    assert sum(len(r["forecasts"]) for r in board["resolved"]) == sum(
        f["n_forecasts"] for f in board["forecasters"]
    )


def test_forecaster_means_match_the_rows_and_show_no_interval_below_ten_questions(board):
    for f in board["forecasters"]:
        briers = [r["forecasts"][f["forecaster"]]["brier"] for r in board["resolved"]]
        assert f["mean_brier"] == pytest.approx(sum(briers) / len(briers))
        assert f["n_questions"] < routes_scores.MIN_N_FOR_INTERVAL
        assert f["brier_low"] is None and f["brier_high"] is None


def test_the_interval_is_a_repeatable_day_block_bootstrap_from_ten_questions():
    rows = [
        {
            "question_id": f"q{i}",
            "date": f"2026-10-{1 + i % 5:02d}",
            "probability": 0.1 * i % 1,
            "outcome": i % 2,
        }
        for i in range(12)
    ]
    protocol = score.load_protocol()
    a = routes_scores._forecaster("sim", rows, protocol)
    b = routes_scores._forecaster("sim", rows, protocol)
    assert a.brier_low is not None and a.brier_high is not None
    assert a.brier_low <= a.mean_brier <= a.brier_high
    assert (a.brier_low, a.brier_high) == (b.brier_low, b.brier_high)
    assert routes_scores._forecaster("sim", rows[:9], protocol).brier_low is None


def test_reliability_bins_hold_every_forecast_once(board):
    for f in board["forecasters"]:
        bins = board["reliability"][f["forecaster"]]
        assert sum(b["n"] for b in bins) == f["n_forecasts"]
        for b in bins:
            assert b["bin_low"] <= b["mean_probability"] <= b["bin_high"]
            assert 0 <= b["observed_rate"] <= 1


def test_misses_are_the_worst_sim_forecasts(board):
    misses = board["misses"]
    assert len(misses) == daily.BIGGEST_MISSES
    assert [m["brier"] for m in misses] == sorted((m["brier"] for m in misses), reverse=True)
    sim = [r["forecasts"]["sim"]["brier"] for r in board["resolved"]]
    assert misses[0]["brier"] == max(sim)
    assert {m["forecaster"] for m in misses} == {"sim"}


def test_skill_is_what_scores_returns(board):
    with TestClient(api.app) as c:
        assert board["skill"] == c.get("/v1/scores").json()
