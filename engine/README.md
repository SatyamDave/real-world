# engine

The Python package `rw`: the simulation engine behind the daily cycle, forks and the receipts ledger. What it must do is specified in [product/world.md](../product/world.md), [product/benchmark.md](../product/benchmark.md) and [product/receipts.md](../product/receipts.md); how it is split into modules is in [decision 0001](../research/decisions/0001-architecture.md).

## Modules so far

| Module | What it does |
| --- | --- |
| `rw/settings.py` | Every tunable number (model, prices, budgets, caps, sizes) in one file. `rw_home()` is where local state lives: `var/`, or `$RW_HOME`. |
| `rw/db.py` | `connect()` opens `$RW_HOME/rw.sqlite` with foreign keys on and applies every `rw/sql/*.sql` in name order. `apply(conn, path)` applies another schema file. |
| `rw/llm.py` | The only way to call a model. `complete_json(purpose, prompt, schema, budget, max_tokens)` returns a dict that matches the JSON schema. |
| `rw/sources.py` | `require(source_id)` refuses any data source in `data/sources.csv` that is not cleared for commercial use, unless it is a fixture. |
| `rw/beliefs.py` | The only operators that change agent beliefs: `update_beliefs`, `nudge`, `spread_audit`. Pure numpy, no model calls. |

## The model gateway

- Without `ANTHROPIC_API_KEY`, `FakeLLM` answers. It fills the schema from a random generator seeded by the SHA-256 of the prompt, so the same prompt always gets the same answer and tests never need a network.
- With the key set, `ClaudeLLM` calls `settings.MODEL` (Claude Haiku 5.5) with structured output and low effort.
- Every provider call writes one `llm_calls` row: prompt, output, tokens and cost. A call whose provider, model, schema and prompt match an earlier row returns the stored answer and writes nothing, which makes reruns free.
- A `Budget(limit_usd, spent_usd)` is checked before every provider call. If the spend plus the estimate (prompt characters / 4 input tokens, plus `max_tokens` output, at settings prices) would cross the limit, it raises `BudgetExceeded` and nothing is written. A zero, negative or NaN limit always refuses.
- `spent_today()` sums today's (UTC) recorded cost.

## Beliefs

Beliefs are logits in an `(n_agents, n_topics)` array `B`; `B0` is each agent's fixed anchor and `s` its stubbornness in [0, 1]. Each operator returns a new array.

| Operator or knob | What it does |
| --- | --- |
| `update_beliefs(B, B0, s, signal, exposed)` | One day: exposed agents move by `clip(signal * (1 - s), ±STEP_CAP_LOGIT)`, then every agent moves `ANCHOR_PULL * (B0 - B)` back toward its anchor. |
| `nudge(B, group_ids, targets, cap)` | For each `(group, topic) -> observed share`, shifts the whole group by `logit(share) - group mean logit`, capped at `cap`, and returns a `Nudge(group_id, topic_index, wanted, applied)` record per nudge. |
| `spread_audit(B, country_ids, survey_sd)` | For each `(country, topic) -> survey SD`, returns `AuditRow(country, topic_index, sim_sd, survey_sd, ratio, in_band)`; a collapsed country has ratio 0 and is out of band. |
| `STEP_CAP_LOGIT` (0.5) | Largest move one day of news can cause on one topic, so one headline cannot flip an agent. |
| `ANCHOR_PULL` (0.05) | Share of the gap to the anchor closed each day; with no news an agent's distance to its anchor shrinks by `(1 - 0.05)^7`, about 0.70, per week. |
| `NUDGE_CAP_LOGIT` (0.3) | Largest shift one poll can apply to a group's mean in one day. |
| `SPREAD_BAND` (0.8, 1.2) | Allowed range of simulated SD over survey SD; outside it the country is marked experimental. |

## Test

```
uv run pytest engine/tests -q
```

Tests run with the fake model and a temporary `RW_HOME`.
