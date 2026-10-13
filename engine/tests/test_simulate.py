import json
import math
import time

import numpy as np
import pytest
from pydantic import ValidationError

from rw import db, llm, population, settings, simulate
from rw.simulate import SimulateRequest, SimulateResult

DAY = "2026-10-01"
PREFILLED = population.DATA / "fixtures" / "prefilled_events.json"
CHIPS = {"text": "A chip shortage doubles phone prices worldwide.", "countries": None}


@pytest.fixture(scope="module")
def world():
    return population.sample_population(2000, 11)


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch, world):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    population.write_snapshot(DAY, world)


@pytest.fixture
def conn():
    return db.connect()


def calls(conn):
    return conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]


def req(**kw):
    return SimulateRequest(**{"event": CHIPS, "days": 3, "members": 3, "agents": 100, **kw})


def width(result, topic):
    return result.outputs[topic].final.p90 - result.outputs[topic].final.p10


def test_each_prefilled_event_yields_a_valid_result(conn):
    events = json.loads(PREFILLED.read_text())["events"]
    assert len(events) == 3
    assert any(
        "chip shortage" in e["event"]["text"] and not e["event"]["countries"] for e in events
    )
    for e in events:
        result = simulate.run(conn, req(event=e["event"]))
        SimulateResult.model_validate_json(result.model_dump_json())
        assert result.simulated is True and result.disclosure == simulate.DISCLOSURE
        assert result.note == "Counterfactual: not scored"
        assert result.world_snapshot_id == DAY
        assert result.model == "fake"
        assert len(result.top_shifts) == 3
        assert result.top_shift_min_agents == math.ceil(
            settings.TOP_SHIFT_MIN_SHARE * result.agents_sampled
        )
        assert all(s.n_agents >= result.top_shift_min_agents for s in result.top_shifts)
        assert any(s.n_agents < result.top_shift_min_agents for s in result.segments)
        assert len(result.trace.agents) == 10
        if e["event"]["countries"]:
            assert [c.iso3 for c in result.coverage] == e["event"]["countries"]
        assert result.content_hash == simulate.content_hash(result)


def test_same_request_twice_is_identical_and_the_second_makes_no_model_call(conn):
    first = simulate.run(conn, req())
    made = calls(conn)
    assert made == simulate.estimate(req()).model_calls
    second = simulate.run(conn, req(world="today"))
    assert second == first
    assert calls(conn) == made


def test_a_stored_result_of_an_older_shape_is_run_again_and_replaced(conn):
    first = simulate.run(conn, req())
    stale = first.model_dump(mode="json")
    del stale["top_shift_min_agents"]
    key = simulate.input_hash(first.world_snapshot_id, req())
    with conn:
        conn.execute(
            "UPDATE simulations SET result_json = ? WHERE input_hash = ?", (json.dumps(stale), key)
        )
    again = simulate.run(conn, req())
    # Its model calls replay from llm_calls at no cost, so only the cost and the hash over it move.
    skip = {"cost", "content_hash"}
    assert again.model_dump(exclude=skip) == first.model_dump(exclude=skip)
    stored = conn.execute(
        "SELECT result_json FROM simulations WHERE input_hash = ?", (key,)
    ).fetchone()[0]
    assert "top_shift_min_agents" in stored


def test_seed_changes_the_result(conn):
    assert simulate.run(conn, req(seed=1)).content_hash != simulate.run(conn, req()).content_hash


def test_one_member_has_no_band(conn):
    result = simulate.run(conn, req(members=1))
    for out in result.outputs.values():
        assert out.final.p10 == out.final.p50 == out.final.p90
        assert all(d.p10 == d.p50 == d.p90 for d in out.by_day)


def test_more_members_never_narrow_the_band(conn):
    results = [simulate.run(conn, req(members=k)) for k in (1, 2, 5, 10, 20)]
    for topic in results[0].outputs:
        widths = [width(r, topic) for r in results]
        assert widths == sorted(widths), (topic, widths)


def test_over_cap_request_refuses_before_any_model_call(conn):
    over = req(max_cost_usd=0.0001)
    assert not simulate.estimate(over).within_cap
    with pytest.raises(llm.BudgetExceeded):
        simulate.run(conn, over)
    assert calls(conn) == 0
    assert conn.execute("SELECT count(*) FROM simulations").fetchone()[0] == 0


def test_fake_model_reports_zero_spent_and_the_estimate_bounds_its_recorded_cost(conn):
    result = simulate.run(conn, req())
    assert result.provider == "fake" and result.cost.actual_usd == 0
    recorded = conn.execute(
        "SELECT SUM(cost_usd) FROM llm_calls WHERE purpose = 'fork_signal'"
    ).fetchone()[0]
    assert 0 < recorded <= result.cost.estimated_usd


def test_trace_deltas_sum_to_each_agents_belief_change(conn):
    result = simulate.run(conn, req(days=5))
    causes = set()
    for agent in result.trace.agents:
        for topic, start in agent.belief_start.items():
            moved = sum(s.delta for s in agent.steps if s.topic == topic)
            assert moved == pytest.approx(agent.belief_end[topic] - start, abs=1e-4)
        causes |= {s.cause for s in agent.steps}
    assert "event" in causes
    assert set(result.trace.segment_signals) >= {s.segment for s in result.segments}


def test_forks_pull_toward_the_assimilated_anchor(conn, world):
    shifted = dict(world)
    for t in population.topics():
        shifted[f"c_{t}"] = np.full(len(world["agent_id"]), 1.0)
        shifted[f"b_{t}"] = world[f"b0_{t}"] + 1.0
    population.write_snapshot(DAY, shifted)
    result = simulate.run(conn, req(days=5))
    assert result.trace.agents
    day_one = [s for a in result.trace.agents for s in a.steps if s.day == 1]
    assert day_one and all(s.cause != "anchor_pull" for s in day_one)


def test_topics_filter_the_outputs(conn):
    result = simulate.run(conn, req(topics=["tech_optimism", "inflation_worry"]))
    assert list(result.outputs) == ["inflation_worry", "tech_optimism"]
    assert {s.topic for s in result.segments} == {"inflation_worry", "tech_optimism"}


def test_progress_is_reported_per_member_and_day(conn):
    seen = []
    simulate.run(conn, req(members=2, days=2), lambda m, d: seen.append((m, d)))
    assert seen == [(0, 1), (0, 2), (1, 1), (1, 2)]


def test_low_tier_noise_is_wider():
    sd = simulate.TIER_NOISE_SD
    assert sd["A"] < sd["B"] < sd["C"] < sd["D"]


@pytest.mark.parametrize(
    "bad",
    [
        {"event": {"text": ""}},
        {"event": {"text": "x" * 501}},
        {"event": {"text": "x", "countries": ["XXX"]}},
        {"event": {"text": "x"}, "agents": 49},
        {"event": {"text": "x"}, "days": 15},
        {"event": {"text": "x"}, "members": 21},
        {"event": {"text": "x"}, "max_cost_usd": 5.01},
        {"event": {"text": "x"}, "topics": ["weather"]},
        {"event": {"text": "x"}, "world": "yesterday"},
    ],
)
def test_request_bounds(bad):
    with pytest.raises(ValidationError):
        SimulateRequest(**bad)


def test_missing_snapshot_is_refused(conn):
    with pytest.raises(ValueError, match="no world snapshot"):
        simulate.run(conn, req(world="2020-01-01"))


def test_default_fork_on_a_2000_agent_snapshot_is_fast(conn):
    started = time.perf_counter()
    result = simulate.run(conn, req(days=7, members=5, agents=200))
    assert time.perf_counter() - started < 5
    assert result.agents_sampled == 200 and len(result.outputs) == 8
    assert np.isfinite([o.final.p50 for o in result.outputs.values()]).all()
