import json

import numpy as np
import pytest
from pydantic import ValidationError

from rw import db, llm, reaction, settings
from rw.reaction import BacktestRequest, PastMessage, PostTestRequest

MESSAGE = "We cut our prices in half for students this week."
IDEA = "A budgeting app for freelancers"
ICP = "Freelance designers who pay for tools monthly"
AGENTS = 54  # two simulated consumers per segment keeps the suite fast


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    monkeypatch.setenv("RW_AGENTS", str(AGENTS))


def req(**kw) -> PostTestRequest:
    return PostTestRequest(text=MESSAGE, idea=IDEA, icp=ICP, **kw)


def test_the_grid_is_27_consumer_segments_once_each():
    segs = reaction.segments()
    assert len(segs) == 27 and len(set(segs)) == 27
    assert reaction.label((1, 1, 1)) == "Pragmatist, value-focused, uses a competitor"
    assert reaction.label((2, 0, 2)) == "Skeptic, price-sensitive, power user"


@pytest.mark.parametrize("value", ["0", "26", "28", "10827", "abc", "-27"])
def test_an_agent_count_off_the_grid_or_over_the_cap_is_refused(monkeypatch, value):
    monkeypatch.setenv("RW_AGENTS", value)
    with pytest.raises(ValueError, match="RW_AGENTS"):
        settings.test_agents()
    conn = db.connect()
    with pytest.raises(ValueError, match="RW_AGENTS"):
        reaction.run(req(), conn, llm.Budget(1.0))
    assert conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0] == 0


def test_the_cost_cap_holds_the_largest_test_and_a_default_backtest(monkeypatch):
    longest = PostTestRequest(text="x" * 500, idea="i" * 200, icp="c" * 300)
    monkeypatch.setenv("RW_AGENTS", str(settings.TEST_AGENTS_MAX))
    assert settings.test_agents() == settings.TEST_AGENTS_MAX
    assert reaction.estimate(longest, settings.TEST_AGENTS_MAX // 27) <= settings.TEST_MAX_COST_USD
    one = reaction._decide_estimate(reaction._about(longest), longest.text, 1080 // 27)
    assert settings.TEST_BACKTEST_MAX * one <= settings.TEST_MAX_COST_USD


def test_agents_aggregate_to_per_segment_means():
    def ans(intent, like, obj):
        return {
            "reaction": {
                "probabilities": {
                    "ignore it": 0,
                    "read it and move on": 1 - like,
                    "like it": like,
                    "share it": 0,
                }
            },
            "intent": {"noul": intent},
            "objection": {"probabilities": {o: float(o == obj) for o in reaction.OBJECTIONS}},
        }

    answers = [
        ans(0.2, 0.0, "price"),
        ans(0.6, 1.0, "trust"),
        ans(0.9, 0.5, "none"),
        ans(0.1, 0.5, "none"),
    ]
    shares, intent, obj = reaction.aggregate(answers, 2)
    assert intent.tolist() == pytest.approx([0.4, 0.5])
    assert shares[:, 2].tolist() == pytest.approx([0.5, 0.5])
    price, trust, none = (reaction.OBJECTIONS.index(o) for o in ("price", "trust", "none"))
    assert obj[0, price] == obj[0, trust] == 0.5 and obj[1, none] == 1.0


def test_a_message_test_reads_as_shares_over_27_segments():
    out = reaction.run(req(gut="lands"), db.connect(), llm.Budget(1.0))
    mix = out.mix
    assert abs(mix.ignore + mix.read + mix.like + mix.share - 1) < 1e-5
    assert abs(sum(o.share for o in out.objections) - 1) < 1e-5
    assert [o.share for o in out.objections] == sorted(
        (o.share for o in out.objections), reverse=True
    )
    assert len(out.segments) == 27 and out.agents == AGENTS
    assert out.model_calls == AGENTS + 1 + 3 and all(r.agents == 2 for r in out.segments)
    assert 0 <= out.intent <= 1 and 0 <= out.baseline_intent <= 1
    assert out.band[0] <= out.band[1] and out.intent_band[0] <= out.intent_band[1]
    assert out.best[0].intent >= out.worst[0].intent
    assert [v.simulated for v in out.voices] == ["Simulated customer"] * 2
    assert len(out.dimensions) == 3 and out.provider == "fake" and out.rewrite
    assert "not real customers" in out.calibration and out.disclosure.startswith("AI-simulated")


def test_the_state_names_the_ideal_customer_the_product_and_the_message():
    conn = db.connect()
    reaction.run(req(), conn, llm.Budget(1.0))
    asks = [
        json.loads(r["prompt"])
        for r in conn.execute("SELECT prompt FROM llm_calls WHERE purpose = 'post_test'")
    ]
    assert len(asks) == AGENTS
    for a in asks:
        assert a["state"].startswith(f"Ideal customer: {ICP}.\nProduct: {IDEA}.")
        assert "This person: " in a["state"] and f"Message from a company:\n{MESSAGE}" in a["state"]
        assert {q["type"] for q in a["questions"].values()} == {"choice", "noul"}
    [base] = conn.execute("SELECT prompt FROM llm_calls WHERE purpose = 'post_baseline'")
    assert "This person" not in json.loads(base["prompt"])["state"]


def test_a_request_without_an_icp_is_refused():
    with pytest.raises(ValidationError):
        PostTestRequest(text=MESSAGE, idea=IDEA)  # type: ignore[call-arg]


def test_a_test_over_its_cap_spends_nothing():
    conn = db.connect()
    with pytest.raises(llm.BudgetExceeded):
        reaction.run(req(), conn, llm.Budget(1e-9))
    assert conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0] == 0


def test_the_backtest_scores_engine_and_baseline_on_marked_messages():
    metric = {"name": "Signup rate", "unit": "%"}
    msgs = [
        PastMessage(text=MESSAGE, outcome="landed", metric={**metric, "value": 3.2}),  # type: ignore[arg-type]
        PastMessage(text="Nothing new today.", outcome="flopped"),
        PastMessage(text="Now with dark mode.", metric={**metric, "value": 1.1}),  # type: ignore[arg-type]
        PastMessage(text="Half price, today only.", metric={**metric, "value": 2.0}),  # type: ignore[arg-type]
    ]
    out = reaction.backtest(
        BacktestRequest(idea=IDEA, icp=ICP, messages=msgs), db.connect(), llm.Budget(1.0)
    )
    assert out.label == "Backtest: not on your record" and out.marked == 2
    for m in out.messages:
        if m.outcome is None:
            assert m.hit is None
        else:
            assert m.hit == ((m.intent >= 0.5) == (m.outcome == "landed"))
    assert out.hits == sum(bool(m.hit) for m in out.messages)
    assert sum(r.n for r in out.calibration if r.forecaster == "engine") == 2
    [rank] = out.rank
    assert rank.metric == "signup rate" and rank.n == 3


def test_a_past_message_needs_an_outcome_or_a_metric():
    with pytest.raises(ValidationError, match="what really happened"):
        PastMessage(text=MESSAGE)


def test_spearman_handles_ties_and_no_spread():
    assert reaction.spearman([1, 2, 3], [10, 20, 30]) == pytest.approx(1)
    assert reaction.spearman([1, 2, 3], [3, 2, 1]) == pytest.approx(-1)
    assert reaction.spearman([1, 1, 1], [1, 2, 3]) is None


def test_backtest_math_on_a_hand_checked_example(monkeypatch):
    # (engine intent, baseline intent) per message, in order.
    preds = iter([(0.8, 0.4), (0.3, 0.6), (0.6, 0.7), (0.5, 0.2)])

    def fake_ask(about, text, per, budget, conn):
        e, b = next(preds)
        return reaction._Asked(np.zeros((1, 4)), np.array([e]), np.zeros((1, 7)), b)

    monkeypatch.setattr(reaction, "_ask", fake_ask)
    signups = [{"name": "Signup rate", "unit": "%", "value": v} for v in (3.0, 1.0, 2.0)]
    msgs = [
        PastMessage(text="a", outcome="landed", metric=signups[0]),  # type: ignore[arg-type]
        PastMessage(text="b", outcome="flopped", metric=signups[1]),  # type: ignore[arg-type]
        PastMessage(text="c", outcome="landed"),
        PastMessage(text="d", metric=signups[2]),  # type: ignore[arg-type]
    ]
    out = reaction.backtest(
        BacktestRequest(idea=IDEA, icp=ICP, messages=msgs), db.connect(), llm.Budget(1.0)
    )
    # Engine: 0.8 L, 0.3 F, 0.6 L all on the right side; baseline: only 0.7 L.
    assert (out.marked, out.hits, out.baseline_hits) == (3, 3, 1)
    assert out.brier == pytest.approx((0.2**2 + 0.3**2 + 0.4**2) / 3, abs=1e-6)
    assert out.baseline_brier == pytest.approx((0.6**2 + 0.6**2 + 0.3**2) / 3, abs=1e-6)
    # A metric alone never becomes an outcome.
    assert out.messages[3].outcome is None and out.messages[3].hit is None
    cal = {(r.forecaster, r.bucket): (r.n, r.predicted, r.landed) for r in out.calibration}
    assert cal == {
        ("engine", "20-40%"): (1, 0.3, 0.0),
        ("engine", "60-80%"): (1, 0.6, 1.0),
        ("engine", "80-100%"): (1, 0.8, 1.0),
        ("baseline", "40-60%"): (1, 0.4, 1.0),
        ("baseline", "60-80%"): (2, 0.65, 0.5),
    }
    # Signup rate 3, 1, 2 against engine 0.8, 0.3, 0.5 and baseline 0.4, 0.6, 0.2.
    [rank] = out.rank
    assert (rank.metric, rank.n, rank.engine) == ("signup rate", 3, pytest.approx(1.0))
    assert rank.baseline == pytest.approx(-0.5)
