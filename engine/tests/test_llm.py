import math

import pytest

from rw import db, llm


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


SCHEMA = {
    "type": "object",
    "properties": {
        "inflation_worry": {"type": "number", "minimum": -1, "maximum": 1},
        "salience": {"type": "number", "minimum": 0, "maximum": 1},
        "count": {"type": "integer", "minimum": 1, "maximum": 5},
        "stance": {"enum": ["up", "down", "flat"]},
        "reasons": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 3},
        "urgent": {"type": "boolean"},
    },
    "required": ["inflation_worry", "salience", "count", "stance", "reasons", "urgent"],
    "additionalProperties": False,
}


def rows(conn):
    return conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]


def test_fake_is_deterministic_per_prompt():
    fake = llm.FakeLLM()
    assert fake.complete("a", SCHEMA, 300) == fake.complete("a", SCHEMA, 300)
    assert fake.complete("a", SCHEMA, 300)[0] != fake.complete("b", SCHEMA, 300)[0]


def test_output_validates_and_one_row_is_written():
    conn = db.connect()
    out = llm.complete_json("test", "segment USA|18-34|high", SCHEMA, llm.Budget(1.0), conn=conn)
    llm.validate(out, SCHEMA)
    row = conn.execute(
        "SELECT provider, model, purpose, prompt, cost_usd FROM llm_calls"
    ).fetchone()
    assert tuple(row)[:4] == ("fake", "claude-haiku-5-5", "test", "segment USA|18-34|high")
    assert row["cost_usd"] > 0


def test_validate_rejects_out_of_schema_output():
    with pytest.raises(ValueError):
        llm.validate({"inflation_worry": 2}, SCHEMA)


def test_memo_returns_stored_answer_without_a_new_row():
    conn = db.connect()
    budget = llm.Budget(1.0)
    first = llm.complete_json("test", "same prompt", SCHEMA, budget, conn=conn)
    spent = budget.spent_usd
    conn.execute("UPDATE llm_calls SET output_json = ?", ('{"stored": true}',))
    second = llm.complete_json("test", "same prompt", SCHEMA, budget, conn=conn)
    assert second == {"stored": True} and first != second
    assert rows(conn) == 1
    assert budget.spent_usd == spent


def test_budget_exceeded_is_raised_before_any_row():
    conn = db.connect()
    estimate = llm.estimate_cost(len("p"), 300)
    with pytest.raises(llm.BudgetExceeded):
        llm.complete_json("test", "p", SCHEMA, llm.Budget(1.0, 1.0 - estimate / 2), conn=conn)
    assert rows(conn) == 0


@pytest.mark.parametrize(
    "budget", [llm.Budget(0.0), llm.Budget(math.nan), llm.Budget(1.0, math.nan)]
)
def test_zero_or_uncomputable_budget_always_refuses(budget):
    conn = db.connect()
    with pytest.raises(llm.BudgetExceeded):
        llm.complete_json("test", "p", SCHEMA, budget, max_tokens=0, conn=conn)
    assert rows(conn) == 0


def test_spent_today_sums_todays_calls():
    conn = db.connect()
    assert llm.spent_today(conn) == 0
    budget = llm.Budget(1.0)
    llm.complete_json("test", "one", SCHEMA, budget, conn=conn)
    llm.complete_json("test", "two", SCHEMA, budget, conn=conn)
    assert llm.spent_today(conn) == pytest.approx(budget.spent_usd)


def test_spent_today_keeps_public_spend_apart_from_the_nightly_run():
    conn = db.connect()
    nightly, public = llm.Budget(1.0), llm.Budget(1.0)
    llm.complete_json("signal", "news", SCHEMA, nightly, conn=conn)
    llm.complete_json("fork_signal", "fork", SCHEMA, public, conn=conn)
    assert llm.spent_today(conn) == pytest.approx(nightly.spent_usd)
    assert llm.spent_today(conn, public=True) == pytest.approx(public.spent_usd)


def test_claude_is_used_only_when_the_key_is_set(monkeypatch):
    assert isinstance(llm.provider(), llm.FakeLLM)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    assert isinstance(llm.provider(), llm.ClaudeLLM)


def test_off_schema_answer_is_recorded_but_never_returned_or_memoized(monkeypatch):
    class Broken:
        name = "fake"

        def complete(self, prompt, schema, max_tokens):
            return '{"inflation_worry": 7}', 10, 10

    monkeypatch.setattr(llm, "provider", Broken)
    conn = db.connect()
    for _ in range(2):
        with pytest.raises(ValueError):
            llm.complete_json("test", "p", SCHEMA, llm.Budget(1.0), conn=conn)
    stored = conn.execute("SELECT output_json, cost_usd FROM llm_calls").fetchall()
    assert [tuple(r) for r in stored] == [(None, llm.cost_usd(10, 10))] * 2
