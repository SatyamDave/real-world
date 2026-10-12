# Simulate API

## What it does

`POST /v1/simulate` takes today's world (or a named snapshot), one event in plain words ("a chip shortage doubles phone prices worldwide"), a number of days and an ensemble size, and runs the fork. It answers at once with `202` and a job id; the caller polls `GET /v1/simulations/{id}` or reads a resumable event stream. The result is typed: for each topic, the share of people leaning yes before and after, with a p10-p90 band across ensemble members; the biggest segment shifts; the coverage tier of every country involved; a trace for a handful of agents; the cost; and a content hash. Every result says `simulated: true`. The cost is checked before any model call, and the request is refused if it would exceed `max_cost_usd` or the day's budget.

## Who it is for

Builders first: forecasting-bot authors, researchers and product teams who want a scored, typed population response inside their own code. The web app's fork button is the same endpoint. Insights teams see it later through a founder-led pilot.

## How we know it works

The contract is the Pydantic models in `engine/rw/simulate.py`, exported to `api/openapi.json`; this spec does not restate fields. Endpoints:

| Method and path | Purpose |
| --- | --- |
| `POST /v1/simulate` | Create a fork job. Headers: `Idempotency-Key` (required, at most 255 chars), `Real-World-Version` (optional, date; default and only value `2026-10-27`). Returns `202 {id, status, links}`. |
| `POST /v1/simulate/estimate` | Same body, returns estimated cost, model calls and whether it fits the cap. No job. |
| `GET /v1/simulations/{id}` | Job status (`queued`, `running`, `succeeded`, `failed`) and the result when done. |
| `GET /v1/simulations/{id}/events` | Server-sent events with an `id:` per event; reconnecting with `Last-Event-ID` replays from there. Heartbeat every 15 s. |
| `GET /v1/world` | Today's snapshot id and date, per-country cells (tier, agent count, mean share per topic), the daily question id, prefilled fork events. |
| `GET /v1/agents/{id}` | One agent: traits, beliefs, tier, and "what moved this agent" (belief changes with the news cluster or nudge behind each). |
| `GET /v1/agents/{id}/why` | "In its own words": a short model-written account generated from the trace, labelled simulated. Cached. |

`GET /` redirects to the interactive docs at `/docs`, where each operation carries a one-line summary.

Checks, all automated in `api/tests/`:

- Same `Idempotency-Key` and body returns the same job; same key with a different body returns `422`; same key while running returns `409` with the job id.
- A request whose estimate exceeds `max_cost_usd` returns `402` with the estimate, and no `llm_calls` row is written.
- An identical second request is served from the input-hash cache with zero model calls.
- The SSE stream resumes from `Last-Event-ID` without duplicates.
- `api/openapi.json` matches the running app; CI fails on drift.
- End to end on fixtures: a 7-day, 5-member, 200-agent fork finishes in under 10 seconds with the fake model.

## What it is not

- No accounts, API keys or per-user quotas in the base build; the spend cap and `max_cost_usd` are the guard. Keys come before the API is public.
- No webhooks, batch endpoint, cancel endpoint or WebSockets.
- No named people, no first-person public figures, no ranked message variants for voters ([research/engineering/074](../research/engineering/074-abuse-and-safety.md)). The base enforces length limits and the `simulated` label; the AUP check is its own slice.
- Fork results are not scored: there is no real outcome for a counterfactual, and results say so.
- `seed` makes our engine's sampling repeatable; it does not make the model deterministic.

## Where the code lives

- `api/rw_api/` (HTTP, jobs, idempotency, SSE) over `engine/rw/simulate.py` (request and result types, estimate, run, cache).
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md).
- Research: [engineering/069](../research/engineering/069-api-design.md), [engineering/066](../research/engineering/066-ensembles.md), [engineering/072](../research/engineering/072-replay-and-caching.md), [engineering/074](../research/engineering/074-abuse-and-safety.md), [market/013](../research/market/013-api-pricing-benchmarks.md), [business/089](../research/business/089-unit-economics.md).
