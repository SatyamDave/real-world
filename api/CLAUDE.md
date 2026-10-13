# api/

The FastAPI app `rw_api`: HTTP, fork jobs, idempotency, server-sent events, the daily answers table and the committed OpenAPI file. `api/README.md` lists every endpoint.

## Specs and research

- Product: [will-it-land](../product/will-it-land.md), [track-record](../product/track-record.md), [accounts](../product/accounts.md), [simulate-api](../product/simulate-api.md), [daily-question](../product/daily-question.md), [receipts](../product/receipts.md), [benchmark](../product/benchmark.md)
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md), [0002-benchmark-and-receipts](../research/decisions/0002-benchmark-and-receipts.md), [0011-consumer-product-and-api](../research/decisions/0011-consumer-product-and-api.md), [0012-will-it-land-and-call-it](../research/decisions/0012-will-it-land-and-call-it.md)
- Research: [engineering/069](../research/engineering/069-api-design.md), [engineering/074](../research/engineering/074-abuse-and-safety.md), [product/077](../research/product/077-daily-question-mechanics.md), [engineering/070](../research/engineering/070-commit-reveal-timestamping.md)

## Boundaries

- Only `api/` speaks HTTP. It calls engine functions; simulation, forecasting, scoring and ledger logic stay in `engine/rw/`.
- `rw_api/schema.sql` owns `jobs`, `job_events`, `idempotency_keys` and `daily_answers`; `rw_api/sql/accounts.sql` owns the account tables. The API never writes engine tables.
- Model calls go through `llm.decide` or `llm.complete_json` with a `Budget`; a cost that cannot be checked refuses.
- Every simulate result carries `simulated: true`; every agent account carries its simulated label.
- Numbers shown for a forecast (`sim`, `market`) come from committed ledger entries, never recomputed.
- Fixture questions (`fx-` ids, `FIXTURE:` text, `example.com` sources) are for local runs and tests. Nothing served to a person may show one: `web/src/liveCheck.ts` fails a production `vite build` against an API that serves one, and `make e2e` proves it against the fixture API [#31, #33, #35].
- `api/openapi.json` is the contract the SDKs are generated from. Change it only with `make openapi`, in the same PR as the code.
- One error shape on every route: a JSON object with a one-sentence `detail`, plus `code` and `estimate` when refused and `id` on a conflict; `api/tests/test_error_shape.py` asserts it, and the `RequestValidationError` handler keeps validation errors in it. Status codes mean one thing each: 404 not found, 409 closed or already done, 422 refused or invalid, 402 over a cost cap, 503 a check could not run.
- Fields, headers and query parameters are snake_case; ids keep their prefix (`fx-` fixtures). Summaries and `detail` sentences use the terms in `product/glossary.md`; `scripts/check_glossary.py` scans `app.py`, `openapi.json` and `README.md`.

## Test

```
uv run pytest api/tests -q
make openapi && git diff --exit-code api/openapi.json
make check
```

Tests seed a temporary `RW_HOME` with `rw.daily` over the fixture days and run with every model key unset (the root `conftest.py` clears them).

## A reviewer rejects

- Engine logic in the API, or an engine table written from here.
- An endpoint accepted but not carried out, or a status code that does not say what happened.
- A model call with no budget, or a check that passes when it could not run.
- A contract change without a regenerated `openapi.json` and the matching `product/` spec change.
- A test that needs a network or an API key.
- A dependency beyond fastapi, uvicorn and httpx without a line saying why.
