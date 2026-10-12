# api/

The FastAPI app `rw_api`: HTTP, fork jobs, idempotency, server-sent events, the daily answers table and the committed OpenAPI file. `api/README.md` lists every endpoint.

## Specs and research

- Product: [simulate-api](../product/simulate-api.md), [daily-question](../product/daily-question.md), [receipts](../product/receipts.md), [benchmark](../product/benchmark.md)
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md), [0002-benchmark-and-receipts](../research/decisions/0002-benchmark-and-receipts.md)
- Research: [engineering/069](../research/engineering/069-api-design.md), [engineering/074](../research/engineering/074-abuse-and-safety.md), [product/077](../research/product/077-daily-question-mechanics.md), [engineering/070](../research/engineering/070-commit-reveal-timestamping.md)

## Boundaries

- Only `api/` speaks HTTP. It calls engine functions; simulation, forecasting, scoring and ledger logic stay in `engine/rw/`.
- `rw_api/schema.sql` owns `jobs`, `job_events`, `idempotency_keys` and `daily_answers`. The API never writes engine tables.
- Model calls go through `llm.complete_json` with a `Budget`; a cost that cannot be checked refuses.
- Every simulate result carries `simulated: true`; every agent account carries its simulated label.
- Numbers shown for a forecast (`sim`, `market`) come from committed ledger entries, never recomputed.
- `api/openapi.json` is the contract the SDKs are generated from. Change it only with `make openapi`, in the same PR as the code.

## Test

```
uv run pytest api/tests -q
make openapi && git diff --exit-code api/openapi.json
make check
```

Tests seed a temporary `RW_HOME` with `rw.daily` over the fixture days and run with `ANTHROPIC_API_KEY` unset.

## A reviewer rejects

- Engine logic in the API, or an engine table written from here.
- An endpoint accepted but not carried out, or a status code that does not say what happened.
- A model call with no budget, or a check that passes when it could not run.
- A contract change without a regenerated `openapi.json` and the matching `product/` spec change.
- A test that needs a network or an API key.
- A dependency beyond fastapi, uvicorn and httpx without a line saying why.
