import csv
import json
import sqlite3
from pathlib import Path

import numpy as np
import pytest

from rw import daily, db, forecast, ledger, llm, population, settings

AGENTS = 2000
DAYS = daily.FIXTURE_DAYS
VECTOR = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "receipts_test_vector.json"
TSR = (Path(__file__).parent / "data" / "freetsa_2026-10-01.tsr").read_bytes()
OTS = (Path(__file__).parent / "data" / "ots_2026-10-01.bin").read_bytes()


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


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
        # Keyless: the summary names the fake model and prints dollars as an estimate (#33, #34).
        assert s["model"] == "fake" and s["usd"] > 0
        line = daily.format_summary(s)
        assert f"\n  Cost: fake model, nothing spent (estimated ${s['usd']:.4f} at " in line
        assert f"{llm.FAKE_PRICED_AT} prices)\n" in line and ", $" not in line
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


def test_nudges_are_capped_and_recorded(monkeypatch):
    monkeypatch.setattr(settings, "ASSIMILATION", "nudge")
    run_fixtures()
    conn = db.connect()
    rows = conn.execute("SELECT * FROM nudges").fetchall()
    polls = conn.execute("SELECT count(DISTINCT date || iso3 || topic) FROM observations")
    assert len(rows) == polls.fetchone()[0] > 0
    assert all(abs(r["applied"]) <= settings.NUDGE_CAP_LOGIT + 1e-12 for r in rows)


def test_poll_error_sd_is_twice_the_sampling_sd():
    assert daily.poll_error_sd(0.5, 1000) == pytest.approx(2 / (1000 * 0.25) ** 0.5)


def test_kalman_mode_records_polls_and_carries_offset_and_variance(monkeypatch):
    monkeypatch.setattr(settings, "ASSIMILATION", "kalman")
    run_fixtures()
    conn = db.connect()
    rows = conn.execute("SELECT * FROM nudges").fetchall()
    polls = conn.execute("SELECT count(DISTINCT date || iso3 || topic) FROM observations")
    assert len(rows) == polls.fetchone()[0] > 0
    assert any(abs(r["applied"]) > settings.NUDGE_CAP_LOGIT for r in rows)
    agents = population.read_snapshot(DAYS[-1])
    tps = population.topics()
    polled = {(r["iso3"], r["topic"]) for r in rows}
    prior = settings.KALMAN_PRIOR_SD_LOGIT**2
    for t in tps:
        for iso3 in set(agents["country"].tolist()):
            mask = agents["country"] == iso3
            c, p = agents[f"c_{t}"][mask], agents[f"p_{t}"][mask]
            assert np.ptp(c) == np.ptp(p) == 0
            if (iso3, t) in polled:
                assert c[0] != 0 and p[0] < prior
            else:
                assert c[0] == 0 and p[0] > prior


def test_unknown_assimilation_mode_fails_the_step(monkeypatch):
    monkeypatch.setattr(settings, "ASSIMILATION", "etkf")
    with pytest.raises(ValueError, match="ASSIMILATION"):
        daily.run(DAYS[0], world_agents=AGENTS)
    row = db.connect().execute("SELECT status FROM stage_runs WHERE step = 'assimilate'")
    assert row.fetchone()["status"] == "failed"
    assert not population.snapshot_path(DAYS[0]).exists()


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

    def killed(*args, **kwargs):
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
    assert s["ran"] == ["publish", "anchor", "score", "learn", "improve"] and s["model_calls"] == 0
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


def fake_post(monkeypatch, tsa: bytes | Exception = TSR, ots: bytes | Exception = OTS):
    sent = []

    def post(url, body, headers):
        sent.append(url)
        reply = tsa if url == settings.TSA_URL else ots
        if isinstance(reply, Exception):
            raise reply
        return reply

    monkeypatch.setattr(ledger, "_post", post)
    return sent


def stage(conn, day, step):
    row = conn.execute(
        "SELECT status, detail FROM stage_runs WHERE date = ? AND step = ?", (day, step)
    ).fetchone()
    return row["status"], json.loads(row["detail"])


def live_day(day):
    """A day whose ledger names no fixture question, on a fixture snapshot."""
    daily.run(day, ["ingest", "assimilate"], world_agents=AGENTS)
    entry = {"kind": "forecast", "date": day, "question_id": "us-cpi-oct", "probability": "0.6250"}
    ledger.commit_day(db.connect(), day, [entry], "a" * 64)


def test_fixture_run_sends_nothing_to_timestamp_servers_and_exports_each_day(monkeypatch):
    sent = fake_post(monkeypatch)
    summaries = run_fixtures()
    conn = db.connect()
    for s in summaries:
        assert s["ran"].index("anchor") == s["ran"].index("publish") + 1
        assert stage(conn, s["date"], "anchor") == ("ok", {"skipped": daily.FIXTURE_ANCHOR})
        assert daily.format_summary(s).splitlines()[-1] == f"  Not anchored: {daily.FIXTURE_ANCHOR}"
        path = settings.rw_home() / "receipts" / f"{s['date']}.json"
        assert stage(conn, s["date"], "publish")[1]["receipt"] == str(path)
        receipt = json.loads(path.read_text())
        assert ledger.receipt_problems(receipt) == []
        assert receipt["day"]["root"] == s["root"]

    with conn:
        conn.execute("UPDATE stage_runs SET status = 'failed' WHERE step = 'anchor'")
    assert daily.run(DAYS[0], ["anchor"], questions="live")["ran"] == ["anchor"]
    assert sent == []


def test_a_live_day_anchors_under_default_flags_and_a_failure_never_stops_score_and_learn(
    monkeypatch,
):
    day = DAYS[0]
    live_day(day)
    sent = fake_post(monkeypatch, tsa=TimeoutError("timed out"), ots=OSError("unreachable"))
    s = daily.run(day, ["anchor", "score", "learn"], world_agents=AGENTS)
    conn = db.connect()
    assert s["ran"] == ["score", "learn"] and len(sent) == 2
    status, detail = stage(conn, day, "anchor")
    assert status == "failed" and "timed out" in detail["error"]
    assert s["anchor"].startswith("Not anchored: NotAnchored: ") and "timed out" in s["anchor"]
    assert ledger.anchor_status(conn, day) == ("not_anchored", None)

    sent = fake_post(monkeypatch, tsa=TimeoutError("timed out"))
    s = daily.run(day, ["anchor"], world_agents=AGENTS)
    assert s["ran"] == [] and len(sent) == 2
    assert s["anchor"] == "Anchor pending: OpenTimestamps proof awaits a Bitcoin block"
    assert stage(conn, day, "anchor")[0] == "failed"
    assert ledger.anchor_status(conn, day) == ("pending", None)


def test_anchor_step_marks_the_day_anchored_and_an_anchored_day_sends_nothing(monkeypatch):
    # The recorded token vouches for the test vector, whose question is a fixture one.
    monkeypatch.setattr(ledger, "is_fixture", lambda items: False)
    vector = json.loads(VECTOR.read_text())
    salts = iter(item["salt"] for item in vector["entries"])
    monkeypatch.setattr(ledger.secrets, "token_hex", lambda n: next(salts))
    day = vector["day"]["date"]
    conn = db.connect()
    entries = [item["entry"] for item in vector["entries"]]
    ledger.commit_day(conn, day, entries, vector["day"]["protocol_hash"])

    sent = fake_post(monkeypatch)
    s = daily.run(day, ["anchor"])
    assert s["ran"] == ["anchor"] and len(sent) == 2
    assert s["anchor"] == "Anchored 2026-10-12 17:19:19 UTC by freetsa.org"
    assert stage(conn, day, "anchor")[0] == "ok"

    with conn:
        conn.execute("UPDATE stage_runs SET status = 'failed' WHERE step = 'anchor'")
    sent = fake_post(monkeypatch)
    assert daily.run(day, ["anchor"])["ran"] == ["anchor"]
    assert sent == []


def test_a_stage_table_from_before_the_anchor_step_is_rebuilt_and_every_step_runs():
    settings.rw_home().mkdir(parents=True)
    old = sqlite3.connect(settings.rw_home() / "rw.sqlite")
    old.executescript(
        "CREATE TABLE stage_runs (date TEXT NOT NULL, step TEXT NOT NULL"
        " CHECK (step IN ('ingest', 'assimilate', 'forecast', 'publish', 'score', 'learn')),"
        " status TEXT NOT NULL CHECK (status IN ('running', 'ok', 'failed')),"
        " started_at TEXT NOT NULL, finished_at TEXT, detail TEXT, PRIMARY KEY (date, step));"
        "INSERT INTO stage_runs VALUES ('2026-09-30', 'learn', 'ok', 't0', 't1', '{}');"
    )
    old.close()
    s = daily.run(DAYS[0], world_agents=AGENTS)
    assert s["ran"] == list(daily.STEPS)
    conn = db.connect()
    assert stage(conn, "2026-09-30", "learn") == ("ok", {})
    sql = conn.execute("SELECT sql FROM sqlite_master WHERE name = 'stage_runs'").fetchone()[0]
    assert "CHECK (step" not in sql


def test_a_rerun_reads_steps_run_none_and_every_line_is_sentence_case():
    run_fixtures()
    again = daily.format_summary(daily.run(DAYS[0]))
    first, *rest = again.splitlines()
    assert first == f"{DAYS[0]}  Steps run: none"
    assert all(line.lstrip()[0].isupper() for line in rest), again


@pytest.mark.parametrize("text", ["2026-13-01", "20261001", "tomorrow", "2026-1-1"])
def test_an_invalid_date_prints_one_sentence_and_exits_2(capsys, text):
    assert daily.main(["--date", text]) == 2
    err = capsys.readouterr().err
    assert err == f"{text} is not a date; use YYYY-MM-DD\n"
