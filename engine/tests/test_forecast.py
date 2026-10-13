import csv
import json
import time

import pytest

from rw import db, forecast, llm, news, population, sources

DAY = "2026-10-02"
DAYS = [f"2026-10-0{d}" for d in range(1, 6)]


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


@pytest.fixture(scope="module")
def world():
    return population.sample_population(400, 11)


def read(name):
    with (forecast.FIXTURES / name).open(newline="") as f:
        return list(csv.DictReader(f))


def calls(conn, purpose=None):
    sql = "SELECT count(*) FROM llm_calls" + (" WHERE purpose = ?" if purpose else "")
    return conn.execute(sql, (purpose,) if purpose else ()).fetchone()[0]


def run_day(world, day=DAY):
    conn = db.connect()
    budget = llm.Budget(5.0)
    news.ingest_day(conn, day, budget)
    forecast.forecast_day(conn, day, world, budget)
    return conn


def test_fixtures_are_well_formed():
    qs = forecast.load_questions()
    topics = set(news.topics())
    countries = set(news.country_names())
    assert 8 <= len(qs) <= 12 and len({q["id"] for q in qs}) == len(qs)
    for q in qs:
        assert q["id"].startswith("fx-") and q["text"].startswith("FIXTURE:")
        assert q["topic"] in topics and set(q["countries"]) <= countries
        assert q["opens"] <= q["closes"] < q["resolves_by"]
        assert q["resolution_source"] and q["tie_break"] and q["market_source"]
        assert len(forecast.question_hash(q)) == 64
    assert sorted(q["daily_on"] for q in qs if q["daily_on"]) == DAYS
    for q in qs:
        if q["daily_on"]:
            assert q in forecast.open_questions(q["daily_on"])

    sources.require(forecast.MARKETS_SOURCE)
    ids = {q["id"] for q in qs}
    for r in read("markets.csv"):
        assert r["question_id"] in ids and 0 <= float(r["price"]) <= 1
    outcomes = read("outcomes.csv")
    assert sum(DAYS[0] <= r["resolved_on"] <= DAYS[-1] for r in outcomes) >= 3
    for r in outcomes:
        assert r["question_id"] in ids and r["outcome"] in ("0", "1")


def test_three_forecasts_per_open_question_with_bounded_probabilities(world):
    conn = run_day(world)
    open_ids = {q["id"] for q in forecast.open_questions(DAY)}
    rows = conn.execute("SELECT * FROM forecasts WHERE date = ?", (DAY,)).fetchall()
    assert {(r["question_id"], r["forecaster"]) for r in rows} == {
        (qid, f) for qid in open_ids for f in ("sim", "plain_llm", "market")
    }
    assert len(rows) == 3 * len(open_ids)
    for r in rows:
        assert 0 <= r["probability"] <= 1
        assert r["market_price_at_commit"] == forecast.market_price(r["question_id"], DAY)
        if r["forecaster"] == "sim":
            assert 0 <= r["p10"] <= r["probability"] <= r["p90"] <= 1
        if r["forecaster"] == "market":
            assert r["probability"] == r["market_price_at_commit"]
    assert calls(conn, "forecast_plain") == len(open_ids) * forecast.settings.PLAIN_LLM_SAMPLES


def test_closed_questions_are_skipped(world):
    conn = run_day(world)
    closed = [q["id"] for q in forecast.load_questions() if q not in forecast.open_questions(DAY)]
    assert "fx-fra-strike" in closed
    marks = ",".join("?" * len(closed))
    got = conn.execute(f"SELECT count(*) FROM forecasts WHERE question_id IN ({marks})", closed)
    assert got.fetchone()[0] == 0


def test_rerun_makes_no_new_model_call_and_no_new_row(world):
    conn = run_day(world)
    before = calls(conn)
    rows = conn.execute("SELECT count(*) FROM forecasts").fetchone()[0]
    forecast.forecast_day(conn, DAY, world, llm.Budget(5.0))
    assert calls(conn) == before
    assert conn.execute("SELECT count(*) FROM forecasts").fetchone()[0] == rows


def test_sim_prompts_never_hold_a_market_price_or_source(world):
    conn = db.connect()
    budget = llm.Budget(20.0)
    for day in DAYS:
        news.ingest_day(conn, day, budget)
        forecast.forecast_day(conn, day, world, budget)
    prompts = [
        r[0] for r in conn.execute("SELECT prompt FROM llm_calls WHERE purpose = 'forecast_sim'")
    ]
    assert prompts
    banned = {r["price"] for r in read("markets.csv")}
    banned |= {q["market_source"] for q in forecast.load_questions()}
    for prompt in prompts:
        assert not [b for b in banned if b in prompt]


def test_one_sim_call_per_present_segment_and_option_order_varies(world):
    conn = run_day(world)
    q = next(q for q in forecast.open_questions(DAY) if len(q["countries"]) > 1)
    in_q = [c in q["countries"] for c in world["country"]]
    segments = set(world["segment"][in_q].tolist())
    prompts = [
        r[0]
        for r in conn.execute("SELECT prompt FROM llm_calls WHERE purpose = 'forecast_sim'")
        if q["text"] in r[0]
    ]
    assert len(prompts) == len(segments)
    requests = [json.loads(p) for p in prompts]
    orders = {tuple(r["questions"]["answer"]["criteria"]) for r in requests}
    assert orders == {("yes", "no"), ("no", "yes")}
    shared_prefix = {r["state"].split("\nGroup of people")[0] for r in requests}
    assert len(shared_prefix) == 1


def test_forecasting_a_day_on_2000_agents_is_fast():
    world = population.sample_population(2000, 3)
    conn = db.connect()
    budget = llm.Budget(5.0)
    news.ingest_day(conn, DAY, budget)
    start = time.perf_counter()
    forecast.forecast_day(conn, DAY, world, budget)
    assert time.perf_counter() - start < 10
