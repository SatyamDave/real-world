"""The only module that talks to a model provider.

complete_json() memoizes on (provider, model, schema, prompt), refuses a call whose estimate would
cross the budget, and writes one llm_calls row per provider call.
"""

import hashlib
import json
import math
import os
import random
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

from rw import db, settings

Schema = dict[str, Any]


class BudgetExceeded(Exception):
    pass


@dataclass
class Budget:
    limit_usd: float
    spent_usd: float = 0.0


def cost_usd(in_tokens: int, out_tokens: int) -> float:
    return (
        in_tokens * settings.PRICE_INPUT_USD_PER_MTOK
        + out_tokens * settings.PRICE_OUTPUT_USD_PER_MTOK
    ) / 1e6


def estimate_cost(prompt_chars: int, max_tokens: int) -> float:
    return cost_usd(math.ceil(prompt_chars / 4), max_tokens)


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


class Provider(Protocol):
    name: str

    def complete(self, prompt: str, schema: Schema, max_tokens: int) -> tuple[str, int, int]:
        """Return (output text, input tokens, output tokens)."""
        ...


class FakeLLM:
    name = "fake"

    def complete(self, prompt: str, schema: Schema, max_tokens: int) -> tuple[str, int, int]:
        seed = int.from_bytes(hashlib.sha256(prompt.encode()).digest(), "big")
        text = json.dumps(_fill(schema, random.Random(seed)))
        return text, math.ceil(len(prompt) / 4), min(max_tokens, math.ceil(len(text) / 4))


class ClaudeLLM:
    name = "anthropic"

    def __init__(self) -> None:
        import anthropic

        self.client = anthropic.Anthropic()

    def complete(self, prompt: str, schema: Schema, max_tokens: int) -> tuple[str, int, int]:
        # Haiku 5.5 rejects a non-default temperature, so none is sent.
        response = self.client.messages.create(
            model=settings.MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            output_config={"format": {"type": "json_schema", "schema": schema}, "effort": "low"},
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        return text, response.usage.input_tokens, response.usage.output_tokens


def provider() -> Provider:
    return ClaudeLLM() if os.environ.get("ANTHROPIC_API_KEY") else FakeLLM()


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def complete_json(
    purpose: str,
    prompt: str,
    schema: Schema,
    budget: Budget,
    max_tokens: int = settings.LLM_MAX_OUTPUT_TOKENS,
    conn: sqlite3.Connection | None = None,
) -> dict[str, Any]:
    if conn is None:
        conn = db.connect()
    llm = provider()
    prompt_sha = _sha256(prompt)
    schema_sha = _sha256(json.dumps(schema, sort_keys=True, separators=(",", ":")))

    stored = conn.execute(
        "SELECT output_json FROM llm_calls WHERE provider = ? AND model = ? AND schema_sha256 = ?"
        " AND prompt_sha256 = ? AND output_json IS NOT NULL ORDER BY id LIMIT 1",
        (llm.name, settings.MODEL, schema_sha, prompt_sha),
    ).fetchone()
    if stored is not None:
        return json.loads(stored[0])

    check_budget(budget, estimate_cost(len(prompt), max_tokens))
    text, in_tokens, out_tokens = llm.complete(prompt, schema, max_tokens)
    cost = cost_usd(in_tokens, out_tokens)
    budget.spent_usd += cost

    try:
        output = json.loads(text)
        validate(output, schema)
    except ValueError:
        output = None

    with conn:
        conn.execute(
            "INSERT INTO llm_calls (at, provider, model, purpose, prompt_sha256, schema_sha256,"
            " prompt, output_json, in_tokens, out_tokens, cost_usd)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                datetime.now(UTC).isoformat(timespec="seconds"),
                llm.name,
                settings.MODEL,
                purpose,
                prompt_sha,
                schema_sha,
                prompt,
                None if output is None else json.dumps(output),
                in_tokens,
                out_tokens,
                cost,
            ),
        )
    if output is None:
        raise ValueError(f"{llm.name} returned output that does not match the schema for {purpose}")
    return output


def spent_today(conn: sqlite3.Connection | None = None) -> float:
    if conn is None:
        conn = db.connect()
    today = datetime.now(UTC).date().isoformat()
    row = conn.execute(
        "SELECT COALESCE(SUM(cost_usd), 0) FROM llm_calls WHERE substr(at, 1, 10) = ?", (today,)
    ).fetchone()
    return float(row[0])
