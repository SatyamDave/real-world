import math

import pytest

from rw import db, llm, settings


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


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
    assert tuple(row)[:4] == ("fake", settings.TEXT_MODEL, "test", "segment USA|18-34|high")
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


def attrs(obj, *names):
    return tuple(getattr(obj, n) for n in names)


def test_providers_are_fake_without_a_key_and_routed_by_key(monkeypatch):
    assert llm.provider().name == llm.decider().name == "fake"
    monkeypatch.setenv("OPENROUTER_API_KEY", "or-key")
    assert attrs(llm.decider(), "name", "base_url", "model") == (
        "jev",
        "https://openrouter.ai/api",
        "typesafe/jev-1.13",
    )
    assert attrs(llm.provider(), "name", "base_url", "key") == (
        "openai_compatible",
        "https://openrouter.ai/api/v1",
        "or-key",
    )
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-key")
    jev = attrs(llm.decider(), "base_url", "model")
    assert jev == ("https://api.typesafe.ai", "jev-1.13.0")
    # A local server never receives the OpenRouter key.
    monkeypatch.setenv("RW_TEXT_BASE_URL", "http://localhost:11434/v1/")
    monkeypatch.setenv("RW_TEXT_MODEL", "mistral-small3.2")
    assert attrs(llm.provider(), "base_url", "key", "model") == (
        "http://localhost:11434/v1",
        None,
        "mistral-small3.2",
    )
    assert llm.model_name() == "jev-1.13.0"


QUESTIONS = {
    "answer": {
        "type": "choice",
        "instructions": "Yes or no?",
        "criteria": {"no": None, "yes": None},
    },
    "notice": {"type": "noul", "instructions": "Noticed?"},
    "move": {"type": "score", "instructions": "How much?", "criteria": ["less", "same", "more"]},
}
# Response shape from https://docs.typesafe.ai/api, read 2026-10-12.
JEV_RESPONSE = {
    "model": "jev-1.13.0",
    "answers": {
        "answer": {
            "type": "choice",
            "choice": "yes",
            "probabilities": {"no": 0.3, "yes": 0.7},
            "confidence": 0.8,
        },
        "notice": {"type": "noul", "noul": 0.9},
        "move": {
            "type": "score",
            "score": 1.6,
            "legend": {"0": "less", "1": "same", "2": "more"},
            "probabilities": {"0": 0.1, "1": 0.2, "2": 0.7},
            "confidence": 0.6,
        },
    },
    "usage": {"input_tokens": 1000, "output_tokens": 5},
}


def jev_with(monkeypatch, response):
    sent = []

    def post(url, key, body):
        sent.append((url, key, body))
        return response

    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-key")
    monkeypatch.setattr(llm, "_post", post)
    return sent


def test_jev_request_mapping_and_raw_answers_are_returned(monkeypatch):
    sent = jev_with(monkeypatch, JEV_RESPONSE)
    conn = db.connect()
    out = llm.decide("forecast_sim", "state text", QUESTIONS, llm.Budget(1.0), conn=conn)
    assert sent == [
        (
            "https://api.typesafe.ai/v1/systemone",
            "ts-key",
            {"model": "jev-1.13.0", "state": "state text", "questions": QUESTIONS},
        )
    ]
    assert out == JEV_RESPONSE["answers"]
    assert llm.level_value(out["move"], -1, 1) == pytest.approx(0.6)
    row = conn.execute("SELECT provider, model, in_tokens, cost_usd FROM llm_calls").fetchone()
    # Output tokens are free: the cost is the input tokens at Jev's input price.
    assert tuple(row) == ("jev", "jev-1.13.0", 1000, pytest.approx(1000 * 0.042 / 1e6))


@pytest.mark.parametrize(
    "response",
    [
        {**JEV_RESPONSE, "model": "jev-1.14.0"},
        {**JEV_RESPONSE, "answers": {**JEV_RESPONSE["answers"], "notice": {"type": "noul"}}},
        {
            **JEV_RESPONSE,
            "answers": {
                **JEV_RESPONSE["answers"],
                "answer": {**JEV_RESPONSE["answers"]["answer"], "probabilities": {"yes": 1.0}},
            },
        },
    ],
)
def test_jev_answer_from_another_version_or_off_shape_is_refused_and_recorded(
    monkeypatch, response
):
    jev_with(monkeypatch, response)
    conn = db.connect()
    with pytest.raises(ValueError):
        llm.decide("forecast_sim", "state", QUESTIONS, llm.Budget(1.0), conn=conn)
    assert conn.execute("SELECT output_json FROM llm_calls").fetchone()[0] is None


def test_jev_budget_refuses_before_the_call(monkeypatch):
    sent = jev_with(monkeypatch, JEV_RESPONSE)
    conn = db.connect()
    with pytest.raises(llm.BudgetExceeded):
        llm.decide("forecast_sim", "state", QUESTIONS, llm.Budget(1e-12), conn=conn)
    assert sent == [] and rows(conn) == 0


def test_fake_decide_answers_every_question_type_deterministically():
    conn = db.connect()
    first = llm.decide("t", "same", QUESTIONS, llm.Budget(1.0), conn=conn)
    llm.check_answers(first, QUESTIONS)
    assert llm.FakeLLM().decide("same", QUESTIONS) == llm.FakeLLM().decide("same", QUESTIONS)


def test_openai_compatible_request_mapping_and_response_parsing(monkeypatch):
    sent = []

    def post(url, key, body):
        sent.append((url, key, body))
        # Response shape from https://openrouter.ai/docs/api-reference/chat-completion.
        return {
            "choices": [{"message": {"role": "assistant", "content": '{"text": "hello"}'}}],
            "usage": {"prompt_tokens": 40, "completion_tokens": 6},
        }

    schema = {
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
        "additionalProperties": False,
    }
    monkeypatch.setenv("OPENROUTER_API_KEY", "or-key")
    monkeypatch.setattr(llm, "_post", post)
    conn = db.connect()
    assert llm.complete_json("why", "p", schema, llm.Budget(1.0), conn=conn) == {"text": "hello"}
    url, key, body = sent[0]
    assert (url, key) == ("https://openrouter.ai/api/v1/chat/completions", "or-key")
    assert body["model"] == settings.TEXT_MODEL
    assert body["messages"] == [{"role": "user", "content": "p"}]
    assert body["response_format"]["json_schema"]["schema"] == schema
    row = conn.execute("SELECT provider, model, cost_usd FROM llm_calls").fetchone()
    assert tuple(row) == ("openai_compatible", settings.TEXT_MODEL, llm.cost_usd(40, 6))


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
