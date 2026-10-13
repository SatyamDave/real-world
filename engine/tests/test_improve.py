import json
import sqlite3
from datetime import date, timedelta

import numpy as np
import pytest

from rw import daily, db, improve, ledger, settings

AGENTS = 2000
DAYS = daily.FIXTURE_DAYS
BASELINE = {"version": "", "effective_from": "", "params": improve.IDENTITY}


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
        monkeypatch.delenv(var, raising=False)


def stream(n_questions, slope=1.0, seed=0, start="2026-01-01"):
    """Raw sim rows for n questions, 5 forecast days each, one question resolving per day."""
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(n_questions):
        z = rng.normal(0, 1.5)
        outcome = int(rng.random() < 1 / (1 + np.exp(-z)))
        resolved = date.fromisoformat(start) + timedelta(days=i + 5)
        for d in range(5):
            raw = 1 / (1 + np.exp(-slope * (z + rng.normal(0, 0.3))))
            rows.append(
                {
                    "question_id": f"q{i:03d}",
                    "date": (resolved - timedelta(days=5 - d)).isoformat(),
                    "raw": float(raw),
                    "outcome": outcome,
                    "resolved_on": resolved.isoformat(),
                }
            )
    return rows


def test_does_nothing_below_min_n():
    n = settings.IMPROVE_MIN_TRAIN_QUESTIONS + settings.IMPROVE_HOLDOUT_QUESTIONS - 1
    out = improve.evaluate(stream(n, slope=3.0), BASELINE)
    assert not out["promote"] and out["reason"].startswith("insufficient_n")
    assert "candidate" not in out


def test_fixture_days_never_promote():
    for day in DAYS:
        s = daily.run(day, world_agents=AGENTS)
        assert "improve" in s["ran"]
    conn = db.connect()
    assert conn.execute("SELECT count(*) FROM engine_versions").fetchone()[0] == 0
    detail = json.loads(
        conn.execute(
            "SELECT detail FROM stage_runs WHERE date = ? AND step = 'improve'", (DAYS[-1],)
        ).fetchone()[0]
    )
    assert detail["reason"].startswith("insufficient_n") and detail["incumbent"] == "identity"


def test_worse_candidate_is_rejected(monkeypatch):
    monkeypatch.setattr(improve, "fit_platt", lambda *a: {"a": 2.5, "b": 0.8})
    out = improve.evaluate(stream(120), BASELINE)
    assert not out["promote"] and out["mean_diff"] > 0 and out["reason"].startswith("rejected")


def test_calibrated_forecaster_is_not_promoted():
    out = improve.evaluate(stream(120, slope=1.0, seed=3), BASELINE)
    assert not out["promote"] and out["reason"].startswith("rejected")


def test_better_candidate_is_promoted_with_its_hash():
    out = improve.evaluate(stream(120, slope=2.5, seed=1), BASELINE)
    assert out["promote"] and out["high"] < 0 and out["mean_diff"] <= -settings.IMPROVE_MARGIN_BRIER
    assert out["candidate"]["a"] < 1

    conn = db.connect()
    version = improve.promote(conn, "2026-06-01", out)
    row = conn.execute("SELECT * FROM engine_versions").fetchone()
    assert version == ledger.sha256_hex(row["record_json"].encode())
    record = json.loads(row["record_json"])
    assert record["effective_from"] == "2026-06-02" and record["parent"] == ""
    assert float(record["evidence"]["brier_after"]) < float(record["evidence"]["brier_before"])
    assert improve.active(conn, "2026-06-01")["version"] == ""
    assert improve.active(conn, "2026-06-02")["version"] == version
    [entry] = improve.unrecorded(conn, "2026-06-02")
    assert entry["kind"] == "engine_config" and entry["version"] == version
    ledger.canonical_json(entry)


def test_holdout_is_only_questions_resolved_after_the_incumbent():
    rows = stream(120, slope=2.5)
    incumbent = {**BASELINE, "version": "v", "effective_from": "2026-04-10"}
    out = improve.evaluate(rows, incumbent)
    fresh = {r["question_id"] for r in rows if r["resolved_on"] >= "2026-04-10"}
    assert len(fresh) < settings.IMPROVE_HOLDOUT_QUESTIONS
    assert not out["promote"] and out["reason"].startswith("insufficient_n")


def test_promotion_applies_forward_only_and_past_leaves_stay():
    for day in DAYS[:3]:
        daily.run(day, world_agents=AGENTS)
    conn = db.connect()
    before = [tuple(r) for r in conn.execute("SELECT * FROM ledger_leaves ORDER BY leaf_hash")]
    scores = {tuple(r) for r in conn.execute("SELECT * FROM scores")}
    decision = {
        "candidate": {"a": 0.5, "b": 0.1},
        **{k: 0.0 for k in ("brier_before", "brier_after", "mean_diff", "low", "high")},
        "n_train": 60,
        "n_holdout": 30,
    }
    version = improve.promote(conn, DAYS[2], decision)
    for day in DAYS[3:]:
        daily.run(day, world_agents=AGENTS)

    after = conn.execute(
        "SELECT * FROM ledger_leaves WHERE date <= ? ORDER BY leaf_hash", (DAYS[2],)
    )
    assert [tuple(r) for r in after] == before
    assert scores <= {tuple(r) for r in conn.execute("SELECT * FROM scores")}
    for day in DAYS:
        assert ledger.verify_day(conn, day) == []

    configs = [
        e["entry"]
        for day in DAYS
        for e in ledger.entries(conn, day)
        if e["entry"]["kind"] == "engine_config"
    ]
    assert [(c["date"], c["version"]) for c in configs] == [(DAYS[3], version)]

    raw = {
        (r["question_id"], r["forecaster"]): r["probability"]
        for r in conn.execute("SELECT * FROM forecasts WHERE date = ?", (DAYS[3],))
    }
    for e in ledger.entries(conn, DAYS[3]):
        f = e["entry"]
        if f["kind"] != "forecast":
            continue
        p = raw[(f["question_id"], f["forecaster"])]
        mapped = improve.apply_map({"a": 0.5, "b": 0.1}, p) if f["forecaster"] == "sim" else p
        assert f["probability"] == ledger.prob_str(mapped)
        assert f["config_hash"] == daily.config_hash(version)


def test_evaluation_failure_keeps_the_incumbent(monkeypatch):
    def broken(*args):
        raise ValueError("scores unreadable")

    monkeypatch.setattr(improve, "evaluate", broken)
    s = daily.run(DAYS[0], world_agents=AGENTS)
    assert "improve" not in s["ran"]
    conn = db.connect()
    status = conn.execute(
        "SELECT status FROM stage_runs WHERE date = ? AND step = 'improve'", (DAYS[0],)
    ).fetchone()[0]
    assert status == "failed"
    assert conn.execute("SELECT count(*) FROM engine_versions").fetchone()[0] == 0


def test_unscored_day_keeps_the_incumbent():
    daily.run(DAYS[0], steps=["improve"], world_agents=AGENTS)
    conn = db.connect()
    detail = conn.execute(
        "SELECT status, detail FROM stage_runs WHERE date = ? AND step = 'improve'", (DAYS[0],)
    ).fetchone()
    assert detail["status"] == "failed" and "not scored" in detail["detail"]


def test_non_finite_fit_keeps_the_incumbent(monkeypatch):
    monkeypatch.setattr(improve, "fit_platt", lambda *a: {"a": float("nan"), "b": 0.0})
    out = improve.evaluate(stream(120, slope=2.5), BASELINE)
    assert not out["promote"] and out["reason"].startswith("not_finite")


def test_pin_rolls_back_and_versions_are_append_only():
    conn = db.connect()
    decision = {
        "candidate": {"a": 0.7, "b": 0.0},
        **{k: 0.0 for k in ("brier_before", "brier_after", "mean_diff", "low", "high")},
        "n_train": 60,
        "n_holdout": 30,
    }
    first = improve.promote(conn, "2026-06-01", decision)
    second = improve.promote(conn, "2026-07-01", {**decision, "candidate": {"a": 0.4, "b": 0.2}})
    back = improve.pin(conn, first, "2026-08-01")
    now = improve.active(conn, "2026-08-02")
    assert now["version"] == back and now["params"] == {"a": 0.7, "b": 0.0}
    assert json.loads(now["record_json"])["parent"] == second
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("UPDATE engine_versions SET parent = 'x'")
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("DELETE FROM engine_versions")
