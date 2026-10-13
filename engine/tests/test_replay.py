import json

import pytest

from rw import daily, db, forecast, ledger, population, replay

DAY = daily.FIXTURE_DAYS[1]


@pytest.fixture(scope="module")
def conn(tmp_path_factory):
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(tmp_path_factory.mktemp("rw") / "var"))
        for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
            mp.delenv(var, raising=False)
        for day in daily.FIXTURE_DAYS[:2]:
            daily.run(day, world_agents=2000)
        yield db.connect()


def test_a_fixture_day_replays_with_zero_diff(conn):
    out = replay.replay_day(conn, DAY)
    committed = [e["entry"] for e in ledger.entries(conn, DAY) if e["entry"]["kind"] == "forecast"]
    assert out["missing"] == [] and out["calls_used"] > 0
    assert len(out["forecasts"]) == sum(e["forecaster"] != "market" for e in committed)
    for row in out["forecasts"]:
        assert row["matches"] and row["diff"] == 0 and row["replayed"] == row["committed"]


def test_replay_matches_the_exact_forecast_values_and_spends_nothing(conn):
    q = forecast.open_questions(DAY)[0]
    agents = population.read_snapshot(DAY)
    before = conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]
    out = replay.replay_forecast(conn, DAY, q, agents)
    stored = conn.execute(
        "SELECT probability, p10, p90 FROM forecasts WHERE date = ? AND question_id = ?"
        " AND forecaster = 'sim'",
        (DAY, q["id"]),
    ).fetchone()
    assert out["sim"] == pytest.approx(tuple(stored), abs=1e-12)
    assert conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0] == before


def test_segment_answers_describe_each_segment_asked(conn):
    q = forecast.open_questions(DAY)[0]
    rows = replay.segment_answers(conn, DAY, q)
    assert rows and all(0 <= r["prior_share"] <= 1 and 0 <= r["yes_share"] <= 1 for r in rows)
    assert all(r["description"].startswith("adults aged ") for r in rows)
    assert len(replay.plain_samples(conn, DAY, q)) == 5


def test_a_changed_recorded_output_is_reported_as_a_diff(conn):
    q = forecast.open_questions(DAY)[0]
    row = replay.segment_answers(conn, DAY, q)[0]
    original = conn.execute(
        "SELECT output_json FROM llm_calls WHERE id = ?", (row["call_id"],)
    ).fetchone()[0]
    flipped = json.loads(original)
    flipped["answer"]["probabilities"]["yes"] = 0.99 if row["yes_share"] < 0.5 else 0.01
    try:
        with conn:
            conn.execute(
                "UPDATE llm_calls SET output_json = ? WHERE id = ?",
                (json.dumps(flipped), row["call_id"]),
            )
        out = replay.replay_day(conn, DAY)
    finally:
        with conn:
            conn.execute(
                "UPDATE llm_calls SET output_json = ? WHERE id = ?", (original, row["call_id"])
            )
    differs = [r for r in out["forecasts"] if not r["matches"]]
    assert differs and all(r["diff"] != 0 for r in differs)
    assert {r["question_id"] for r in differs} == {q["id"]}


def test_an_unrecorded_call_leaves_the_forecast_missing_not_matching(conn):
    q = forecast.open_questions(DAY)[0]
    row = replay.segment_answers(conn, DAY, q)[0]
    saved = conn.execute("SELECT * FROM llm_calls WHERE id = ?", (row["call_id"],)).fetchone()
    try:
        with conn:
            conn.execute("UPDATE llm_calls SET output_json = NULL WHERE id = ?", (row["call_id"],))
        out = replay.replay_day(conn, DAY)
    finally:
        with conn:
            conn.execute(
                "UPDATE llm_calls SET output_json = ? WHERE id = ?",
                (saved["output_json"], row["call_id"]),
            )
    assert out["missing"] == [q["id"]]
    gone = [r for r in out["forecasts"] if r["question_id"] == q["id"] and r["forecaster"] == "sim"]
    assert gone[0]["replayed"] is None and gone[0]["matches"] is False
