import csv
import json

import pytest

from rw import daily, db, forecast, ledger, llm, population, settings

AGENTS = 2000
DAYS = daily.FIXTURE_DAYS


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


def run_fixtures():
    return [daily.run(day, world_agents=AGENTS) for day in DAYS]


def counts(conn):
    return {
        table: conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
        for table in ("llm_calls", "ledger_leaves", "ledger_days", "scores", "forecasts")
    }


def test_fixture_days_run_verify_and_chain():
    assert DAYS == [f"2026-10-0{d}" for d in range(1, 6)]
    summaries = run_fixtures()
    conn = db.connect()
    for s in summaries:
        assert s["ran"] == list(daily.STEPS) and s["root"] and s["forecasts_committed"] > 0
    statuses = conn.execute("SELECT DISTINCT status FROM stage_runs").fetchall()
    assert [r[0] for r in statuses] == ["ok"]

    prev = ledger.GENESIS_ROOT
    for day in DAYS:
        assert ledger.verify_day(conn, day) == []
        row = conn.execute("SELECT * FROM ledger_days WHERE date = ?", (day,)).fetchone()
        assert row["prev_root"] == prev
        prev = row["root"]

        kinds = [e["entry"]["kind"] for e in ledger.entries(conn, day)]
        first = day == DAYS[0]
        assert kinds.count("protocol") == kinds.count("question_set") == int(first)
        n_forecasts = conn.execute("SELECT count(*) FROM forecasts WHERE date = ?", (day,))
        assert kinds.count("forecast") == n_forecasts.fetchone()[0]
        sha = daily.snapshot_sha256(day)
        for e in ledger.entries(conn, day):
            if e["entry"]["kind"] == "forecast":
                assert e["entry"]["snapshot_sha256"] == sha
                assert e["entry"]["config_hash"] == daily.config_hash()
                assert e["entry"]["committed_at"].endswith("Z")

    with (forecast.FIXTURES / "outcomes.csv").open(newline="") as f:
        resolved = {r["question_id"] for r in csv.DictReader(f) if r["resolved_on"] <= DAYS[-1]}
    forecast_ids = {
        e["entry"]["question_id"]
        for day in DAYS
        for e in ledger.entries(conn, day)
        if e["entry"]["kind"] == "forecast"
    }
    # fx-fra-strike closed before the first fixture day, so it has a resolution but no forecast.
    expected = resolved & forecast_ids
    assert len(expected) >= 4
    scored = conn.execute("SELECT question_id, forecaster FROM scores").fetchall()
    assert {(r[0], r[1]) for r in scored} >= {
        (q, f) for q in expected for f in ("sim", "plain_llm", "market")
    }
    assert {r[0] for r in scored} == expected

    tiers = {r["iso3"] for r in population.countries()}
    status = conn.execute("SELECT iso3 FROM country_status WHERE date = ?", (DAYS[-1],))
    assert {r[0] for r in status} == tiers
    learn = conn.execute(
        "SELECT detail FROM stage_runs WHERE date = ? AND step = 'learn'", (DAYS[-1],)
    ).fetchone()
    assert len(json.loads(learn[0])["biggest_misses"]) == daily.BIGGEST_MISSES

    before = counts(conn)
    again = run_fixtures()
    assert counts(conn) == before
    assert all(s["ran"] == [] and s["model_calls"] == 0 for s in again)


def test_nudges_are_capped_and_recorded():
    run_fixtures()
    conn = db.connect()
    rows = conn.execute("SELECT * FROM nudges").fetchall()
    polls = conn.execute("SELECT count(DISTINCT date || iso3 || topic) FROM observations")
    assert len(rows) == polls.fetchone()[0] > 0
    assert all(abs(r["applied"]) <= settings.NUDGE_CAP_LOGIT + 1e-12 for r in rows)


def test_no_assimilation_or_sim_prompt_holds_a_market_price():
    run_fixtures()
    conn = db.connect()
    prompts = [
        r[0]
        for r in conn.execute(
            "SELECT prompt FROM llm_calls WHERE purpose IN ('signal', 'forecast_sim')"
        )
    ]
    assert prompts
    with (forecast.FIXTURES / "markets.csv").open() as f:
        banned = {line.strip().split(",")[2] for line in f.readlines()[1:]}
    banned |= {q["market_source"] for q in forecast.load_questions()}
    for prompt in prompts:
        assert not [b for b in banned if b in prompt]


def test_crash_after_forecast_resumes_at_publish(monkeypatch):
    day = DAYS[0]

    def killed(*args):
        raise KeyboardInterrupt

    with monkeypatch.context() as m:
        m.setitem(daily.STEP_FUNCS, "publish", killed)
        with pytest.raises(KeyboardInterrupt):
            daily.run(day, world_agents=AGENTS)
    conn = db.connect()
    stages = dict(conn.execute("SELECT step, status FROM stage_runs WHERE date = ?", (day,)))
    assert stages == {"ingest": "ok", "assimilate": "ok", "forecast": "ok", "publish": "failed"}
    forecast_at = conn.execute(
        "SELECT finished_at FROM stage_runs WHERE date = ? AND step = 'forecast'", (day,)
    ).fetchone()[0]
    before = counts(conn)

    s = daily.run(day, world_agents=AGENTS)
    assert s["ran"] == ["publish", "score", "learn"] and s["model_calls"] == 0
    assert counts(conn)["llm_calls"] == before["llm_calls"]
    assert counts(conn)["forecasts"] == before["forecasts"]
    assert ledger.verify_day(conn, day) == []
    again = conn.execute(
        "SELECT finished_at FROM stage_runs WHERE date = ? AND step = 'forecast'", (day,)
    ).fetchone()[0]
    assert again == forecast_at


def test_zero_budget_fails_closed_without_a_snapshot(monkeypatch):
    monkeypatch.setattr(settings, "NIGHTLY_BUDGET_USD", 0.0)
    day = DAYS[0]
    with pytest.raises(llm.BudgetExceeded):
        daily.run(day, world_agents=AGENTS)
    conn = db.connect()
    stages = dict(conn.execute("SELECT step, status FROM stage_runs WHERE date = ?", (day,)))
    assert stages == {"ingest": "failed"}
    assert not population.snapshot_path(day).exists()
    assert counts(conn)["llm_calls"] == 0
    assert daily.main(["--date", day]) == 1
