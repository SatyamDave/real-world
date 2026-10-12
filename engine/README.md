# engine

The Python package `rw`: the simulation engine behind the daily cycle, forks and the receipts ledger. What it must do is specified in [product/world.md](../product/world.md), [product/benchmark.md](../product/benchmark.md) and [product/receipts.md](../product/receipts.md); how it is split into modules is in [decision 0001](../research/decisions/0001-architecture.md).

## Modules so far

| Module | What it does |
| --- | --- |
| `rw/settings.py` | Every tunable number (model, prices, budgets, caps, sizes) in one file. `rw_home()` is where local state lives: `var/`, or `$RW_HOME`. |
| `rw/db.py` | `connect()` opens `$RW_HOME/rw.sqlite` with foreign keys on and applies every `rw/sql/*.sql` in name order. `apply(conn, path)` applies another schema file. |
| `rw/llm.py` | The only way to call a model. `complete_json(purpose, prompt, schema, budget, max_tokens)` returns a dict that matches the JSON schema. |
| `rw/sources.py` | `require(source_id)` refuses any data source in `data/sources.csv` that is not cleared for commercial use, unless it is a fixture. |
| `rw/policy.py` | `screen(text, conn, today)` checks a fork event against [product/acceptable-use.md](../product/acceptable-use.md): a regex rule pass, then one `screen` classification through `complete_json` with its own `SCREEN_MAX_COST_USD` budget. Returns a `PolicyRefused(code, detail)` or `None`; a classifier that cannot run raises. A classifier refusal counts only when its quote appears in the event, so the fake model never refuses. |
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

## Daily cycle runbook

`rw/daily.py` is the only place the day's steps are composed. Each step records `(date, step, status, started_at, finished_at, detail)` in `stage_runs` and is skipped once it is `ok`, so rerunning a day is free and a crashed run resumes at the step that failed.

| Step | What it does |
| --- | --- |
| `ingest` | `news.ingest_day`: polls become observations, each news cluster becomes one signal call. |
| `assimilate` | Loads the previous day's snapshot (or samples a fresh `WORLD_AGENTS` world on the first day), applies the day's signals through `news.exposure` and `beliefs.update_beliefs`, nudges each country toward the day's polls with `beliefs.nudge`, writes `var/snapshots/<date>/agents.parquet` and records each nudge in `nudges`. No market price is read. |
| `forecast` | `forecast.forecast_day`: sim, plain-LLM and market forecasts for every open question. |
| `publish` | `ledger.commit_day` with a `protocol` entry when the protocol hash is new, a `question_set` entry when the question file hash is new, and one 0002-format `forecast` entry per forecast row, carrying `snapshot_sha256` and the `config_hash` of `settings.py`. |
| `score` | Records outcomes resolved on or before the date in `resolutions`, then scores every committed forecast entry on a resolved question into `scores`. |
| `learn` | Spread audit against the survey SD in `data/sample/attitudes.csv` into `audits`, one `country_status` row per country (experimental when any topic is outside `SPREAD_BAND`), and the five biggest sim misses in the step's `detail`. |

```
make daily DATE=2026-10-01                               # one day, every step not yet ok
uv run python -m rw.daily --date 2026-10-01 --step learn # one step
make daily-fixtures                                      # the five fixture days in order
```

Each day prints the steps that ran, model calls, dollars, forecasts committed, the day's root hash, questions scored and countries marked experimental.

- The nightly budget is `NIGHTLY_BUDGET_USD` minus `llm.spent_today()`. `BudgetExceeded`, or any other error, marks the step `failed` and stops the run; the CLI exits 1. Rerun the same command once the cause is fixed.
- To see what happened: `SELECT * FROM stage_runs WHERE date = '2026-10-01'` in `var/rw.sqlite`; `detail` holds the step's counts or its error.
- To check a day's receipts: `uv run python -m rw.ledger verify --date 2026-10-01`.

## Test

```
uv run pytest engine/tests -q
```

Tests run with the fake model and a temporary `RW_HOME`.
