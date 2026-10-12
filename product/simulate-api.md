# Simulate API

## What it does

`POST /v1/simulate` takes today's world (or a named snapshot), one event in plain words ("a chip shortage doubles phone prices worldwide"), a number of days and an ensemble size, and runs the fork. It answers at once with `202` and a job id; the caller polls `GET /v1/simulations/{id}` or reads a resumable event stream. The result is typed: for each topic, the share of people leaning yes before and after, with a p10-p90 band across ensemble members; the biggest segment shifts among segments of at least `top_shift_min_agents` (5% of the sample, the segment-size floor from [research/product/082](../research/product/082-icp-political.md)); the coverage tier of every country involved; a trace for a handful of agents; the cost; who answered the model calls (`provider`); and a content hash. Every result says `simulated: true`. With the fake model (no `ANTHROPIC_API_KEY`), `provider` is `fake`, `cost.actual_usd` is 0 and `cost.estimated_usd` is the pre-run estimate at Haiku prices; the web shows "Fake model, nothing spent". The cost is checked before any model call, and the request is refused if it would exceed `max_cost_usd`, the day's fork budget or the caller's daily fork count. The event is then screened against the [acceptable-use policy](acceptable-use.md); a refused event never starts a fork.

## Who it is for

Builders first: forecasting-bot authors, researchers and product teams who want a scored, typed population response inside their own code. The web app's fork button is the same endpoint. Insights teams see it later through a founder-led pilot.

## How we know it works

The contract is the Pydantic models in `engine/rw/simulate.py`, exported to `api/openapi.json`; this spec does not restate fields. Endpoints:

| Method and path | Purpose |
| --- | --- |
| `POST /v1/simulate` | Create a fork job. Headers: `Idempotency-Key` (required, at most 255 chars), `Real-World-Version` (optional, date; default and only value `2026-10-27`). Returns `202 {id, status, links}`; `402 {code, detail, estimate}` or `429 {code, detail}` when a spend check refuses (below); `422 {code, detail}` when the event breaks the [acceptable-use policy](acceptable-use.md); `503` when a spend, address or acceptable-use check could not run. |
| `POST /v1/simulate/estimate` | Same body, returns estimated cost, model calls and whether it fits the cap. No job. |
| `GET /v1/simulations/{id}` | Job status (`queued`, `running`, `succeeded`, `failed`) and the result when done. |
| `GET /v1/simulations/{id}/events` | Server-sent events with an `id:` per event; reconnecting with `Last-Event-ID` replays from there. Heartbeat every 15 s. |
| `GET /v1/world` | Today's snapshot id and date, per-country cells (tier, agent count, mean share per topic), the daily question id, prefilled fork events. |
| `GET /v1/agents/{id}` | One agent: traits, beliefs, tier, and "what moved this agent" (belief changes with the news cluster or nudge behind each). |
| `GET /v1/agents/{id}/why` | "In its own words": a short model-written account generated from the trace, labelled simulated. Cached. |

`GET /` redirects to the interactive docs at `/docs`, where each operation carries a one-line summary and every `SimulateRequest` field a description. `GET /llms.txt` lists the same operations in plain text.

Checks, all automated in `api/tests/`:

- Same `Idempotency-Key` and body returns the same job; same key with a different body returns `422`; same key while running returns `409` with the job id.
- A request whose estimate exceeds `max_cost_usd` returns `402` with the estimate, and no `llm_calls` row is written.
- Spend checks run in this order, before the estimate and the policy screen, and again under the database write lock when the job is inserted. Each refusal writes no job and no `llm_calls` row. The web shows "Not started: " followed by `detail`.

  | Status | `code` | `detail` | When |
  | --- | --- | --- | --- |
  | 503 | `client_unknown` | the caller's address could not be read | no peer address, or a trusted proxy sent no `X-Forwarded-For` |
  | 503 | `spend_unreadable` | today's fork spend could not be read: … | the count or the spend query failed |
  | 429 | `anon_daily_limit` | this address has started 20 forks today, the limit without an API key; try again after 00:00 UTC | `FORK_ANON_PER_DAY` forks started today from this address |
  | 402 | `fork_budget_spent` | today's fork budget is spent; try again after 00:00 UTC | today's public spend (forks, screens, agent accounts) plus the `max_cost_usd` of every unfinished fork plus this one's would pass `FORK_DAILY_BUDGET_USD` |
  | 402 | `over_max_cost` | the estimate $X exceeds the $0.5 cost cap | the estimate is over `max_cost_usd`; the body carries the estimate |

- Every caller is anonymous until there are API keys, so `max_cost_usd` is clamped to `FORK_MAX_COST_USD_DEFAULT` (also on `/estimate`), and the job stores the clamped value.
- `FORK_DAILY_BUDGET_USD` (10.0) is separate from `NIGHTLY_BUDGET_USD`: the nightly run's budget leaves out public spend, so forks never starve it. A fake-model call counts at the price it would have had, so the caps hold without a key.
- The address is the TCP peer. `X-Forwarded-For` is read only when the peer is listed in `RW_TRUSTED_PROXIES` (comma-separated), and then its last hop is used. Only a SHA-256 of the address is stored.
- `FORK_DAILY_BUDGET_USD` and `FORK_ANON_PER_DAY` are provisional until the free fork allowance is decided ([company/decisions-needed.md](../company/decisions-needed.md), item 7).
- Browsers on `localhost` or `127.0.0.1` on any port may call the API; other origins must be listed in `RW_ALLOWED_ORIGINS` (comma-separated, like `https://example.com`). A malformed entry stops the API at startup.
- An event that breaks a rule returns `422` with its `code` and writes no job; a rule-pass refusal writes no `llm_calls` row, and a classifier refusal writes only its one `screen` row. A screen that cannot run returns `503` and writes no job. Each rule and the election window have their own test in `engine/tests/test_policy.py`.
- An identical second request is served from the input-hash cache with zero model calls.
- The SSE stream resumes from `Last-Event-ID` without duplicates.
- `api/openapi.json` matches the running app; CI fails on drift.
- End to end on fixtures: a 7-day, 5-member, 200-agent fork finishes in under 10 seconds with the fake model.

## What it is not

- No accounts, API keys or per-user quotas in the base build; the day's fork budget, the per-address daily count and the clamped `max_cost_usd` are the guard. Keys come before the API is public.
- No webhooks, batch endpoint, cancel endpoint or WebSockets.
- No named private people and no persuasion testing on elections or candidates ([acceptable-use](acceptable-use.md), [research/engineering/074](../research/engineering/074-abuse-and-safety.md)). Length is enforced by the request schema (`422` validation error), not by the screen.
- The screen is not a moderation system: a fixed rule pass and one classification call on the event text, nothing per agent.
- Fork results are not scored: there is no real outcome for a counterfactual, and results say so.
- `seed` makes our engine's sampling repeatable; it does not make the model deterministic.

## Where the code lives

- `api/rw_api/` (HTTP, jobs, idempotency, SSE) over `engine/rw/simulate.py` (request and result types, estimate, run, cache) and `engine/rw/policy.py` (the acceptable-use screen).
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md).
- Research: [engineering/069](../research/engineering/069-api-design.md), [engineering/066](../research/engineering/066-ensembles.md), [engineering/072](../research/engineering/072-replay-and-caching.md), [engineering/074](../research/engineering/074-abuse-and-safety.md), [market/013](../research/market/013-api-pricing-benchmarks.md), [business/089](../research/business/089-unit-economics.md).
