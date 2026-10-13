# engine/

The Python package `rw`: settings, storage, the model gateway, the licence gate, and later population, beliefs, news, forecast, ledger, score, simulate and the daily cycle.

## Specs and research

- Product: the engine under both jobs of [decision 0012](../research/decisions/0012-will-it-land-and-call-it.md): [product/will-it-land.md](../product/will-it-land.md) (`rw/reaction.py`), [product/daily-question.md](../product/daily-question.md), [product/world.md](../product/world.md), [product/benchmark.md](../product/benchmark.md), [product/receipts.md](../product/receipts.md)
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md) (module table, agent state, fake model), [0002-benchmark-and-receipts](../research/decisions/0002-benchmark-and-receipts.md) (ledger and scoring rules)
- Build plan: [BUILD_PLAN.md](../research/decisions/BUILD_PLAN.md) names the files each slice may touch.

## Boundaries (from the 0001 module table)

- Each module owns its tables in `rw/sql/<module>.sql` (`CREATE TABLE IF NOT EXISTS`) and exposes plain functions.
- Only `llm.py` talks to a model provider. Every model call goes through `llm.decide` (Jev) or `llm.complete_json` (open model) with a `Budget`.
- Only `daily.py`, `simulate.py` and `reaction.py` compose other modules. Only `api/` speaks HTTP.
- Only `ledger.py` writes ledger tables, and those tables refuse UPDATE and DELETE.
- Every tunable number lives in `rw/settings.py`. Local state lives under `settings.rw_home()`.
- Every data source is read only after `sources.require(source_id)` passes.
- Beliefs change only through the operators in `beliefs.py`; the model never sets a step size.
- Market prices never enter assimilation or the `sim` forecast prompt.
- A keyless run reports `model: fake`, `provider: fake` and nothing spent, on every surface: fork results, ledger entries, the daily summary and experiment results. Its would-be dollars appear only labelled as an estimate at `llm.FAKE_PRICED_AT` prices [#18, #26, #27, #33, #34].
- CLI output (`rw.daily`, `rw.experiments`, `scripts/`) is literal status in the voice of `gtm/messaging.md`: one line per step, what happened and the number it produced, sentence case, no exclamation marks, glossary terms only (`scripts/check_glossary.py` scans `daily.py` and `experiments.py`).

## Test

```
uv run pytest engine/tests -q
make check
```

Tests run with every model key unset (the root `conftest.py` clears them) and `RW_HOME` pointed at a temporary directory.

## A reviewer rejects

- A model call outside `llm.decide` or `llm.complete_json`, or one with no budget.
- A budget or licence check that passes when it could not run (fail closed).
- A magic number that belongs in `settings.py`.
- A test that needs a network or an API key.
- A dependency beyond those the slice brief names.
- A comment that restates the code or records change history.
