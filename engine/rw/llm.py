"""The only module that talks to a model provider.

Two entry points, one per kind of call (decision 0007): decide() asks Jev typed questions and
returns its raw answers, probabilities and confidence included; complete_json() asks an
open-weight model behind an OpenAI-compatible API for JSON that matches a schema. Both memoize on
(provider, model, schema, prompt), refuse a call whose estimate would cross the budget, and write
one llm_calls row per provider call. Without a key both answer from FakeLLM.
"""

import hashlib
import json
import math
import os
import random
import sqlite3
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

from rw import db, settings

Schema = dict[str, Any]
# What the public API spends on: settings.FORK_DAILY_BUDGET_USD caps these, and the nightly run's
# budget leaves them out.
PUBLIC_PURPOSES = (
    "fork_signal",
    "screen",
    "why",
    "post_test",
    "post_baseline",
    "post_voice",
    "post_rewrite",
)


class BudgetExceeded(Exception):
    pass


@dataclass
class Budget:
    limit_usd: float
    spent_usd: float = 0.0


Questions = dict[str, dict[str, Any]]
Prices = tuple[float, float]


def cost_usd(in_tokens: int, out_tokens: int, prices: Prices = settings.TEXT_PRICES) -> float:
    return (in_tokens * prices[0] + out_tokens * prices[1]) / 1e6


def cost_text(usd: float, provider: str) -> str:
    """Dollars as a surface shows them. A fake-model run spends nothing; its dollars are what the
    real model would have cost, so they are labelled as an estimate (#34)."""
    if provider == "fake":
        return f"fake model, nothing spent (estimated ${usd:.4f} at {FAKE_PRICED_AT} prices)"
    return f"${usd:.4f}"


FAKE_PRICED_AT = f"{settings.JEV_MODEL} and {settings.TEXT_MODEL}"


def estimate_cost(prompt_chars: int, max_tokens: int) -> float:
    return cost_usd(math.ceil(prompt_chars / 4), max_tokens)


def estimate_decide_cost(request_chars: int) -> float:
    return cost_usd(math.ceil(request_chars / 4), 0, settings.JEV_PRICES)


def check_budget(budget: Budget, estimate: float) -> None:
    # Written so a NaN limit or spend refuses: a cap that cannot be computed counts as exceeded.
    if not (budget.limit_usd > 0 and budget.spent_usd + estimate <= budget.limit_usd):
        raise BudgetExceeded(
            f"estimate ${estimate:.6f} on top of ${budget.spent_usd:.6f} spent "
            f"exceeds the ${budget.limit_usd:.6f} limit"
        )


def validate(value: Any, schema: Schema, path: str = "$") -> None:
    """Check value against the JSON Schema subset FakeLLM fills; raise ValueError if it fails."""
    if "enum" in schema:
        if value not in schema["enum"]:
            raise ValueError(f"{path}: {value!r} not in enum")
        return
    kind = schema.get("type")
    if kind == "object":
        if not isinstance(value, dict):
            raise ValueError(f"{path}: expected object")
        props = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in value:
                raise ValueError(f"{path}: missing {key!r}")
        if schema.get("additionalProperties") is False:
            extra = set(value) - set(props)
            if extra:
                raise ValueError(f"{path}: unexpected {sorted(extra)}")
        for key, sub in props.items():
            if key in value:
                validate(value[key], sub, f"{path}.{key}")
    elif kind == "array":
        if not isinstance(value, list):
            raise ValueError(f"{path}: expected array")
        if len(value) < schema.get("minItems", 0) or len(value) > schema.get("maxItems", math.inf):
            raise ValueError(f"{path}: {len(value)} items outside bounds")
        for i, item in enumerate(value):
            validate(item, schema.get("items", {}), f"{path}[{i}]")
    elif kind in ("number", "integer"):
        if isinstance(value, bool) or not isinstance(value, int | float):
            raise ValueError(f"{path}: expected {kind}")
        if kind == "integer" and not isinstance(value, int):
            raise ValueError(f"{path}: expected integer")
        if not schema.get("minimum", -math.inf) <= value <= schema.get("maximum", math.inf):
            raise ValueError(f"{path}: {value} outside bounds")
    elif kind == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path}: expected string")
    elif kind == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path}: expected boolean")
    elif kind is not None:
        raise ValueError(f"{path}: unsupported schema type {kind!r}")


def _fill(schema: Schema, rng: random.Random) -> Any:
    if "enum" in schema:
        return rng.choice(schema["enum"])
    kind = schema.get("type")
    if kind == "object":
        return {k: _fill(sub, rng) for k, sub in schema.get("properties", {}).items()}
    if kind == "array":
        low = schema.get("minItems", 1)
        high = schema.get("maxItems", max(low, 3))
        return [_fill(schema.get("items", {}), rng) for _ in range(rng.randint(low, high))]
    if kind == "number":
        return rng.uniform(schema.get("minimum", 0.0), schema.get("maximum", 1.0))
    if kind == "integer":
        return rng.randint(schema.get("minimum", 0), schema.get("maximum", 100))
    if kind == "string":
        return f"fake-{rng.getrandbits(32):08x}"
    if kind == "boolean":
        return rng.random() < 0.5
    raise ValueError(f"FakeLLM cannot fill schema type {kind!r}")


def _fake_answer(q: dict[str, Any], rng: random.Random) -> dict[str, Any]:
    if q["type"] == "noul":
        return {"type": "noul", "noul": rng.random()}
    n = len(q["criteria"])
    keys = list(q["criteria"]) if q["type"] == "choice" else [str(i) for i in range(n)]
    weights = [rng.random() + 1e-9 for _ in keys]
    probs = {k: w / sum(weights) for k, w in zip(keys, weights, strict=True)}
    out: dict[str, Any] = {"type": q["type"], "probabilities": probs, "confidence": rng.random()}
    if q["type"] == "choice":
        out["choice"] = max(probs, key=probs.__getitem__)
    else:
        out["score"] = sum(int(k) * p for k, p in probs.items())
        out["legend"] = {str(i): d for i, d in enumerate(q["criteria"])}
    return out


def check_answers(answers: Any, questions: Questions) -> None:
    """Raise ValueError unless every question has an answer of its type with probabilities."""
    if not isinstance(answers, dict) or set(answers) != set(questions):
        raise ValueError("answers do not match the question ids")
    for qid, q in questions.items():
        a = answers[qid]
        if not isinstance(a, dict) or a.get("type") != q["type"]:
            raise ValueError(f"{qid}: expected a {q['type']} answer")
        if q["type"] == "noul":
            validate(a.get("noul"), {"type": "number", "minimum": 0, "maximum": 1}, qid)
            continue
        probs = a.get("probabilities")
        validate(a.get("confidence"), {"type": "number", "minimum": 0, "maximum": 1}, qid)
        n = len(q["criteria"])
        if not isinstance(probs, dict) or len(probs) != n:
            raise ValueError(f"{qid}: expected {n} probabilities")
        for p in probs.values():
            validate(p, {"type": "number", "minimum": 0, "maximum": 1}, qid)
        if abs(sum(probs.values()) - 1) > 1e-3:
            raise ValueError(f"{qid}: probabilities do not sum to 1")
        if q["type"] == "choice" and set(probs) != set(q["criteria"]):
            raise ValueError(f"{qid}: probabilities name other options")


def level_value(answer: dict[str, Any], low: float, high: float) -> float:
    """A score answer as the probability-weighted level, levels spread evenly over [low, high].
    Reads the probabilities, not `score`, so it holds whichever index the levels start at."""
    keys = sorted(answer["probabilities"], key=int)
    step = (high - low) / (len(keys) - 1)
    return sum(answer["probabilities"][k] * (low + i * step) for i, k in enumerate(keys))


class Provider(Protocol):
    name: str

    def complete(self, prompt: str, schema: Schema, max_tokens: int) -> tuple[str, int, int]:
        """Return (output text, input tokens, output tokens)."""
        ...


class Decider(Protocol):
    name: str
    model: str

    def decide(self, state: str, questions: Questions) -> tuple[dict[str, Any], int, int]:
        """Return (response body with model and answers, input tokens, output tokens)."""
        ...


class FakeLLM:
    name = "fake"
    model = settings.JEV_MODEL

    def complete(self, prompt: str, schema: Schema, max_tokens: int) -> tuple[str, int, int]:
        seed = int.from_bytes(hashlib.sha256(prompt.encode()).digest(), "big")
        text = json.dumps(_fill(schema, random.Random(seed)))
        return text, math.ceil(len(prompt) / 4), min(max_tokens, math.ceil(len(text) / 4))

    def decide(self, state: str, questions: Questions) -> tuple[dict[str, Any], int, int]:
        request = decide_request(state, questions)
        rng = random.Random(int.from_bytes(hashlib.sha256(request.encode()).digest(), "big"))
        answers = {qid: _fake_answer(q, rng) for qid, q in questions.items()}
        return {"model": settings.JEV_MODEL, "answers": answers}, math.ceil(len(request) / 4), 0


def _post(url: str, key: str | None, body: dict[str, Any]) -> dict[str, Any]:
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    req = urllib.request.Request(url, json.dumps(body).encode(), headers, method="POST")
    # ponytail: no retry on 429/529; the call raises and the step fails closed. Add backoff if
    # nightly runs start failing on rate limits.
    with urllib.request.urlopen(req, timeout=settings.LLM_TIMEOUT_S) as resp:
        return json.loads(resp.read())


class JevLLM:
    """TypeSafe's Jev at POST {base}/v1/systemone, pinned to one version (decision 0007)."""

    name = "jev"

    def __init__(self, base_url: str, key: str, model: str) -> None:
        self.base_url, self.key, self.model = base_url, key, model

    def decide(self, state: str, questions: Questions) -> tuple[dict[str, Any], int, int]:
        body = {"model": self.model, "state": state, "questions": questions}
        out = _post(f"{self.base_url}/v1/systemone", self.key, body)
        usage = out.get("usage") or {}
        return out, int(usage.get("input_tokens", 0)), int(usage.get("output_tokens", 0))


class OpenAICompatibleLLM:
    """An open-weight model behind POST {base}/chat/completions with a JSON schema answer."""

    name = "openai_compatible"

    def __init__(self, base_url: str, key: str | None, model: str) -> None:
        self.base_url, self.key, self.model = base_url, key, model

    def complete(self, prompt: str, schema: Schema, max_tokens: int) -> tuple[str, int, int]:
        body = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "answer", "strict": True, "schema": schema},
            },
            # OpenRouter routes only to hosts that honour response_format; others ignore it.
            "provider": {"require_parameters": True},
        }
        out = _post(f"{self.base_url}/chat/completions", self.key, body)
        usage = out.get("usage") or {}
        text = out["choices"][0]["message"].get("content") or ""
        return text, int(usage.get("prompt_tokens", 0)), int(usage.get("completion_tokens", 0))


def provider() -> Provider:
    """The model that writes JSON: OpenRouter with OPENROUTER_API_KEY, any OpenAI-compatible
    server (Ollama) at RW_TEXT_BASE_URL, else the fake."""
    base = os.environ.get("RW_TEXT_BASE_URL")
    model = os.environ.get("RW_TEXT_MODEL", settings.TEXT_MODEL)
    if base:
        return OpenAICompatibleLLM(base.rstrip("/"), os.environ.get("RW_TEXT_API_KEY"), model)
    if key := os.environ.get("OPENROUTER_API_KEY"):
        return OpenAICompatibleLLM(settings.OPENROUTER_BASE_URL, key, model)
    return FakeLLM()


def decider() -> Decider:
    """Jev direct with TYPESAFE_API_KEY, Jev through OpenRouter with OPENROUTER_API_KEY, else
    the fake."""
    if key := os.environ.get("TYPESAFE_API_KEY"):
        return JevLLM(settings.TYPESAFE_BASE_URL, key, settings.JEV_MODEL)
    if key := os.environ.get("OPENROUTER_API_KEY"):
        return JevLLM(settings.OPENROUTER_JEV_BASE_URL, key, settings.JEV_OPENROUTER_MODEL)
    return FakeLLM()


def provider_for(model: str) -> str:
    """The llm_calls provider that answered a recorded forecast model: decisions come from Jev."""
    return "fake" if model == "fake" else JevLLM.name


def model_name() -> str:
    """The model that answers this process's forecasts and signals, as results and the ledger
    record it."""
    jev = decider()
    return "fake" if jev.name == "fake" else jev.model


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def decide_request(state: str, questions: Questions) -> str:
    # Not sort_keys: the order of choice options is part of what the model sees.
    return json.dumps({"state": state, "questions": questions}, separators=(",", ":"))


def _memo(conn: sqlite3.Connection, names: tuple[str, str, str], prompt_sha: str, schema_sha: str):
    provider_name, model, _ = names
    stored = conn.execute(
        "SELECT output_json FROM llm_calls WHERE provider = ? AND model = ? AND schema_sha256 = ?"
        " AND prompt_sha256 = ? AND output_json IS NOT NULL ORDER BY id LIMIT 1",
        (provider_name, model, schema_sha, prompt_sha),
    ).fetchone()
    return None if stored is None else json.loads(stored[0])


def _insert(
    conn: sqlite3.Connection,
    names: tuple[str, str, str],
    prompt: str,
    schema_sha: str,
    output: Any,
    in_tokens: int,
    out_tokens: int,
    cost: float,
) -> None:
    provider_name, model, purpose = names
    conn.execute(
        "INSERT INTO llm_calls (at, provider, model, purpose, prompt_sha256, schema_sha256,"
        " prompt, output_json, in_tokens, out_tokens, cost_usd)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            datetime.now(UTC).isoformat(timespec="milliseconds"),
            provider_name,
            model,
            purpose,
            _sha256(prompt),
            schema_sha,
            prompt,
            None if output is None else json.dumps(output),
            in_tokens,
            out_tokens,
            cost,
        ),
    )


def _schema_error(names: tuple[str, str, str]) -> ValueError:
    return ValueError(f"{names[0]} returned output that does not match the schema for {names[2]}")


def _recorded(
    conn: sqlite3.Connection | None,
    names: tuple[str, str, str],
    prompt: str,
    schema_sha: str,
    budget: Budget,
    estimate: float,
    call: Any,
    prices: Prices,
    parse: Any,
) -> Any:
    """Memo, budget check, provider call and llm_calls row for one complete_json call."""
    if conn is None:
        conn = db.connect()
    stored = _memo(conn, names, _sha256(prompt), schema_sha)
    if stored is not None:
        return stored

    check_budget(budget, estimate)
    raw, in_tokens, out_tokens = call()
    cost = cost_usd(in_tokens, out_tokens, prices)
    budget.spent_usd += cost

    try:
        output = parse(raw)
    except (ValueError, KeyError, TypeError):
        output = None

    with conn:
        _insert(conn, names, prompt, schema_sha, output, in_tokens, out_tokens, cost)
    if output is None:
        raise _schema_error(names)
    return output


def decide(
    purpose: str,
    state: str,
    questions: Questions,
    budget: Budget,
    conn: sqlite3.Connection | None = None,
) -> dict[str, dict[str, Any]]:
    """Jev's answers by question id, as Jev returns them: a noul's probability, a choice's or
    score's probabilities and confidence. A response from another model version is refused."""
    return decide_many(purpose, [(state, questions)], budget, conn)[0]


def decide_many(
    purpose: str,
    asks: list[tuple[str, Questions]],
    budget: Budget,
    conn: sqlite3.Connection | None = None,
    workers: int = 1,
) -> list[dict[str, dict[str, Any]]]:
    """decide for many (state, questions) pairs: memo hits are reused, the rest are checked
    against the budget together before any call, run on at most `workers` threads, and recorded
    in one transaction."""
    if conn is None:
        conn = db.connect()
    jev = decider()
    names = (jev.name, jev.model, purpose)
    requests = [decide_request(state, q) for state, q in asks]
    schemas = [_sha256(json.dumps(q, separators=(",", ":"))) for _, q in asks]
    out: list[Any] = [
        _memo(conn, names, _sha256(r), sha) for r, sha in zip(requests, schemas, strict=True)
    ]
    todo = [i for i, o in enumerate(out) if o is None]
    check_budget(budget, sum(estimate_decide_cost(len(requests[i])) for i in todo))

    def parse(i: int, body: dict[str, Any]) -> Any:
        try:
            if body.get("model") not in (settings.JEV_MODEL, jev.model):
                raise ValueError(f"answered by {body.get('model')!r}, pinned to {jev.model!r}")
            check_answers(body["answers"], asks[i][1])
            return body["answers"]
        except (ValueError, KeyError, TypeError):
            return None

    def call(i: int) -> Any:
        try:
            return jev.decide(*asks[i])
        except Exception as e:  # recorded below: calls that did answer were still paid for
            return e

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        raw = list(pool.map(call, todo))
    failed = next((r for r in raw if isinstance(r, Exception)), None)
    bad = False
    with conn:
        for i, r in zip(todo, raw, strict=True):
            if isinstance(r, Exception):
                continue
            body, in_tokens, out_tokens = r
            cost = cost_usd(in_tokens, out_tokens, settings.JEV_PRICES)
            budget.spent_usd += cost
            out[i] = parse(i, body)
            bad = bad or out[i] is None
            _insert(conn, names, requests[i], schemas[i], out[i], in_tokens, out_tokens, cost)
    if failed is not None:
        raise failed
    if bad:
        raise _schema_error(names)
    return out


def complete_json(
    purpose: str,
    prompt: str,
    schema: Schema,
    budget: Budget,
    max_tokens: int = settings.LLM_MAX_OUTPUT_TOKENS,
    conn: sqlite3.Connection | None = None,
) -> dict[str, Any]:
    llm = provider()
    model = llm.model if isinstance(llm, OpenAICompatibleLLM) else settings.TEXT_MODEL

    def parse(text: str) -> dict[str, Any]:
        output = json.loads(text)
        validate(output, schema)
        return output

    return _recorded(
        conn,
        (llm.name, model, purpose),
        prompt,
        _sha256(json.dumps(schema, sort_keys=True, separators=(",", ":"))),
        budget,
        estimate_cost(len(prompt), max_tokens),
        lambda: llm.complete(prompt, schema, max_tokens),
        settings.TEXT_PRICES,
        parse,
    )


def spent_today(conn: sqlite3.Connection | None = None, public: bool = False) -> float:
    """Today's recorded cost of PUBLIC_PURPOSES calls if public, else of every other call. A fake
    provider's calls count at the price they would have had, so caps hold without a key."""
    if conn is None:
        conn = db.connect()
    today = datetime.now(UTC).date().isoformat()
    marks = ", ".join("?" * len(PUBLIC_PURPOSES))
    row = conn.execute(
        "SELECT COALESCE(SUM(cost_usd), 0) FROM llm_calls WHERE substr(at, 1, 10) = ?"
        f" AND (purpose IN ({marks})) = ?",
        (today, *PUBLIC_PURPOSES, public),
    ).fetchone()
    return float(row[0])
