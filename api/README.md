# api

The FastAPI app `rw_api` over the `rw` engine. It is the only code that speaks HTTP ([decision 0001](../research/decisions/0001-architecture.md)). What each endpoint must do is specified in [product/simulate-api.md](../product/simulate-api.md), [product/daily-question.md](../product/daily-question.md), [product/receipts.md](../product/receipts.md) and [product/benchmark.md](../product/benchmark.md); the field-level contract is the committed [openapi.json](openapi.json).

## Run it

```
make dev        # seeds the fixture days into var/ if it is empty, then serves :8000 and the web app
make openapi    # rewrites api/openapi.json after a contract change
```

Open http://localhost:8000/docs, or http://localhost:8000/llms.txt for the same operations in plain text. Every endpoint works with `ANTHROPIC_API_KEY` unset; the engine's fake model answers.

## Endpoints

| Method and path | What it returns |
| --- | --- |
| `POST /v1/simulate` | `202 {id, status, links}` and runs `simulate.run` in the background. Needs `Idempotency-Key` (at most 255 characters); `Real-World-Version`, if sent, must be `2026-10-27`. `402`/`429 {code, detail}` when a spend check refuses: the clamped `max_cost_usd`, the day's fork budget or the per-address daily count (`503` when a check cannot run; codes in [simulate-api](../product/simulate-api.md)); `422 {code, detail}` when `policy.screen` refuses the event ([acceptable use](../product/acceptable-use.md)); `503` when the screen could not run. |
| `POST /v1/simulate/estimate` | Estimated cost, model calls and whether it fits the cap. No job. |
| `GET /v1/simulations/{id}` | Job status and, once done, the result (`simulated: true`) or the error. |
| `GET /v1/simulations/{id}/events` | Server-sent events, one `id:` each; `Last-Event-ID` resumes; a `: heartbeat` comment every 15 s; closes after `succeeded` or `failed`. |
| `GET /v1/world` | Latest snapshot date, per-country cells, today's daily question id, prefilled fork events. |
| `GET /v1/agents/{id}` | Traits, shares, tier, and per day per topic the logit change split into the news step (with the signal title), the poll nudge and the anchor pull toward `b0` plus the assimilated offset. |
| `GET /v1/agents/{id}/why` | A model-written account from that trace, labelled "Simulated account, not the cause". Cached by prompt. |
| `GET /v1/daily` | Today's question; with `?player_id=` after answering, the reveal: you, crowd, committed `sim` and `market`, outcome, Brier, streak and `week` (the seven days ending today, each with your answer and its Brier once resolved). |
| `POST /v1/daily/answers` | One answer per player per question (`409` on a repeat or after `closes_at`); returns the reveal. |
| `GET /v1/receipts`, `GET /v1/receipts/{date}` | Day records newest first with anchor status; one day with every entry, salt and leaf hash, its question (text, resolution source, resolves by), outcome and Brier once known, and its stored RFC 3161 and OpenTimestamps proofs. |
| `GET /v1/scores` | `score.summarize` over committed forecasts whose questions resolved. |
| `GET /healthz` | `{"ok": true}` |

## State

`rw_api/schema.sql` owns `jobs`, `job_events`, `idempotency_keys` and `daily_answers`, in the engine's SQLite file under `$RW_HOME`. An idempotency key is honoured for 24 hours. On startup, jobs left `queued` or `running` are marked `failed` with error `interrupted`.

## Research

[engineering/069](../research/engineering/069-api-design.md) (async jobs, idempotency, SSE, versioning), [engineering/074](../research/engineering/074-abuse-and-safety.md) (labels and limits), [product/077](../research/product/077-daily-question-mechanics.md) (daily question), [engineering/070](../research/engineering/070-commit-reveal-timestamping.md) (receipts).
