import hashlib
import math
import sqlite3

import pytest

from rw import db, score


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


PROTOCOL = score.load_protocol()


def forecast(
    question_id, date, forecaster, probability, outcome: int | None = 1, tier="A", region="Europe"
):
    return {
        "question_id": question_id,
        "date": date,
        "forecaster": forecaster,
        "probability": probability,
        "outcome": outcome,
        "tier": tier,
        "region": region,
    }


def questions(n, date="2026-10-01", sim=0.8, base=0.6):
    rows = []
    for i in range(n):
        rows.append(forecast(f"q{i}", date, "sim", sim))
        rows.append(forecast(f"q{i}", date, "market", base))
        rows.append(forecast(f"q{i}", date, "plain_llm", base))
    return rows


def test_protocol_matches_decision_0002():
    assert PROTOCOL == {
        "version": "2026-10-11",
        "question_types": ["binary"],
        "headline": "brier",
        "log_clip": [0.01, 0.99],
        "baselines": ["market", "plain_llm"],
        "coin_reference": 0.25,
        "bootstrap": {"block": "day", "resamples": 1000, "seed": 7, "interval": 0.95},
        "min_resolved_for_claims": 100,
        "breakdowns": ["tier", "region"],
    }
    assert score.protocol_hash() == hashlib.sha256(score.PROTOCOL_JSON.read_bytes()).hexdigest()


def test_brier_on_hand_values():
    assert score.brier(0.5, 1) == 0.25
    assert score.brier(0.5, 0) == 0.25
    assert score.brier(0.8, 1) == pytest.approx(0.04)
    assert score.brier(0.8, 0) == pytest.approx(0.64)
    assert score.brier(1.0, 1) == 0.0


def test_log_score_on_hand_values():
    assert score.log_score(0.8, 1, (0.01, 0.99)) == pytest.approx(math.log(0.8))
    assert score.log_score(0.8, 0, (0.01, 0.99)) == pytest.approx(math.log(0.2))


def test_log_score_clip_is_applied():
    assert score.log_score(0.0, 1, (0.01, 0.99)) == pytest.approx(math.log(0.01))
    assert score.log_score(1.0, 1, (0.01, 0.99)) == pytest.approx(math.log(0.99))
    assert score.log_score(1.0, 0, (0.01, 0.99)) == pytest.approx(math.log(0.01))


@pytest.mark.parametrize("p,o", [(1.2, 1), (-0.1, 0), (0.5, 2)])
def test_scores_refuse_values_outside_the_binary_domain(p, o):
    with pytest.raises(ValueError):
        score.brier(p, o)


def test_mean_diff_is_negative_when_sim_is_closer_to_outcomes():
    result = score.summarize(questions(10), PROTOCOL)
    for baseline in ("market", "plain_llm"):
        assert result[baseline]["mean_diff"] == pytest.approx(0.04 - 0.16)
        assert result[baseline]["mean_diff"] < 0


def test_pairing_matches_question_and_date_and_skips_unresolved():
    rows = [
        forecast("q1", "2026-10-01", "sim", 0.9),
        forecast("q1", "2026-10-02", "market", 0.1),
        forecast("q2", "2026-10-01", "sim", 0.9, outcome=None),
        forecast("q2", "2026-10-01", "market", 0.1, outcome=None),
        forecast("q3", "2026-10-01", "sim", "0.7000", outcome=0),
        forecast("q3", "2026-10-01", "market", "0.2000", outcome=0),
    ]
    pairs = score.paired_differences(rows, "market")
    assert [(p["question_id"], p["date"]) for p in pairs] == [("q3", "2026-10-01")]
    assert pairs[0]["diff"] == pytest.approx(0.49 - 0.04)


def test_duplicate_forecast_raises():
    rows = questions(1) + [forecast("q0", "2026-10-01", "sim", 0.1)]
    with pytest.raises(ValueError):
        score.paired_differences(rows, "market")


def test_bootstrap_is_repeatable_with_its_seed():
    by_day = {f"2026-10-{d:02d}": [0.01 * d, -0.02 * d, 0.03] for d in range(1, 11)}
    first = score.block_bootstrap(by_day, 1000, 7, 0.95)
    assert first == score.block_bootstrap(by_day, 1000, 7, 0.95)
    assert first != score.block_bootstrap(by_day, 1000, 8, 0.95)
    assert first[0] < first[1]


def test_bootstrap_resamples_days_not_questions():
    rows = []
    for i in range(50):
        sim = 0.1 + 0.8 * (i % 7) / 6
        rows += [
            forecast(f"q{i}", "2026-10-01", "sim", sim),
            forecast(f"q{i}", "2026-10-01", "market", 0.5),
        ]
    summary = score.summarize(rows, PROTOCOL)["market"]
    assert summary["low"] == summary["high"]
    assert summary["low"] == pytest.approx(summary["mean_diff"])


def test_claim_flips_at_exactly_min_resolved():
    assert PROTOCOL["min_resolved_for_claims"] == 100
    below = score.summarize(questions(99), PROTOCOL)
    at = score.summarize(questions(100), PROTOCOL)
    for baseline in ("market", "plain_llm"):
        assert (below[baseline]["n"], below[baseline]["claim"]) == (99, "insufficient_n")
        assert (at[baseline]["n"], at[baseline]["claim"]) == (100, "reportable")


def test_claim_counts_questions_not_question_days():
    rows = questions(50, date="2026-10-01") + questions(50, date="2026-10-02")
    summary = score.summarize(rows, PROTOCOL)["market"]
    assert (summary["n"], summary["n_pairs"], summary["claim"]) == (50, 100, "insufficient_n")


def test_breakdowns_by_tier_and_region_each_have_their_own_n():
    rows = [
        forecast("q1", "2026-10-01", "sim", 0.9, tier="A", region="Europe"),
        forecast("q1", "2026-10-01", "market", 0.5, tier="A", region="Europe"),
        forecast("q2", "2026-10-01", "sim", 0.9, tier="C", region="Africa"),
        forecast("q2", "2026-10-01", "market", 0.5, tier="C", region="Africa"),
        forecast("q3", "2026-10-02", "sim", 0.2, tier="C", region="Africa"),
        forecast("q3", "2026-10-02", "market", 0.5, tier="C", region="Africa"),
    ]
    summary = score.summarize(rows, PROTOCOL)["market"]
    assert summary["n"] == 3
    assert {k: v["n"] for k, v in summary["by_tier"].items()} == {"A": 1, "C": 2}
    assert {k: v["n"] for k, v in summary["by_region"].items()} == {"Africa": 2, "Europe": 1}
    assert summary["by_tier"]["C"]["claim"] == "insufficient_n"


def test_baseline_with_no_pairs_reports_no_numbers():
    rows = [forecast("q1", "2026-10-01", "sim", 0.9), forecast("q1", "2026-10-01", "market", 0.5)]
    summary = score.summarize(rows, PROTOCOL)["plain_llm"]
    assert summary["n"] == 0
    assert summary["mean_diff"] is None and summary["low"] is None and summary["high"] is None
    assert summary["claim"] == "insufficient_n"


def test_unsupported_protocol_is_refused():
    with pytest.raises(ValueError):
        score.summarize(questions(1), {**PROTOCOL, "headline": "crps"})


def test_second_resolution_for_the_same_question_raises():
    conn = db.connect()
    score.record_resolution(conn, "q1", 1, "2026-10-05", "https://example.org/q1", "2026-10-06")
    with pytest.raises(sqlite3.IntegrityError):
        score.record_resolution(conn, "q1", 0, "2026-10-05", "https://example.org/q1", "2026-10-06")
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("UPDATE resolutions SET outcome = 0 WHERE question_id = 'q1'")
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("DELETE FROM resolutions")
    assert [tuple(r) for r in conn.execute("SELECT outcome FROM resolutions")] == [(1,)]


def test_write_scores_stores_brier_and_clipped_log_score():
    conn = db.connect()
    rows = [
        forecast("q1", "2026-10-01", "sim", 1.0, outcome=0),
        forecast("q2", "2026-10-01", "sim", 0.5, outcome=None),
    ]
    score.write_scores(conn, rows)
    score.write_scores(conn, rows)
    stored = conn.execute("SELECT question_id, brier, log_score FROM scores").fetchall()
    assert len(stored) == 1
    assert stored[0]["question_id"] == "q1"
    assert stored[0]["brier"] == 1.0
    assert stored[0]["log_score"] == pytest.approx(math.log(0.01))
