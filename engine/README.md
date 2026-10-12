# engine

The Python package `rw`: the simulation engine behind the daily cycle, forks and the receipts ledger. What it must do is specified in [product/world.md](../product/world.md), [product/benchmark.md](../product/benchmark.md) and [product/receipts.md](../product/receipts.md); how it is split into modules is in [decision 0001](../research/decisions/0001-architecture.md).

## Modules so far

| Module | What it does |
| --- | --- |
| `rw/settings.py` | Every tunable number (model, prices, budgets, caps, sizes) in one file. `rw_home()` is where local state lives: `var/`, or `$RW_HOME`. |
| `rw/db.py` | `connect()` opens `$RW_HOME/rw.sqlite` with foreign keys on and applies every `rw/sql/*.sql` in name order. `apply(conn, path)` applies another schema file. |
| `rw/llm.py` | The only way to call a model. `complete_json(purpose, prompt, schema, budget, max_tokens)` returns a dict that matches the JSON schema. |
| `rw/sources.py` | `require(source_id)` refuses any data source in `data/sources.csv` that is not cleared for commercial use, unless it is a fixture. |

## The model gateway

- Without `ANTHROPIC_API_KEY`, `FakeLLM` answers. It fills the schema from a random generator seeded by the SHA-256 of the prompt, so the same prompt always gets the same answer and tests never need a network.
- With the key set, `ClaudeLLM` calls `settings.MODEL` (Claude Haiku 5.5) with structured output and low effort.
- Every provider call writes one `llm_calls` row: prompt, output, tokens and cost. A call whose provider, model, schema and prompt match an earlier row returns the stored answer and writes nothing, which makes reruns free.
- A `Budget(limit_usd, spent_usd)` is checked before every provider call. If the spend plus the estimate (prompt characters / 4 input tokens, plus `max_tokens` output, at settings prices) would cross the limit, it raises `BudgetExceeded` and nothing is written. A zero, negative or NaN limit always refuses.
- `spent_today()` sums today's (UTC) recorded cost.

## Test

```
uv run pytest engine/tests -q
```

Tests run with the fake model and a temporary `RW_HOME`.
