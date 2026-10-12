# Real World API

Simulations with receipts: a forecast and simulation API with a public score. AI simulates how the world reacts to the news; every forecast is sealed before the outcome and scored in public. Get a key with a dollar cap, expect every refusal as one sentence in `detail`, and read every output as AI-simulated.

The FastAPI app `rw_api` over the `rw` engine. It is the only code that speaks HTTP ([decision 0001](../research/decisions/0001-architecture.md)). What each endpoint must do is specified in [product/simulate-api.md](../product/simulate-api.md), [product/daily-question.md](../product/daily-question.md), [product/receipts.md](../product/receipts.md) and [product/benchmark.md](../product/benchmark.md); the field-level contract is the committed [openapi.json](openapi.json).

## Run it

```
make dev        # seeds the fixture days into var/ if it is empty, then serves :8000 and the web app
make openapi    # rewrites api/openapi.json after a contract change
```

Open http://localhost:8000/docs, or http://localhost:8000/llms.txt for the same operations in plain text. Every endpoint works with no model key set; the engine's fake model answers.

## Endpoints

| Method and path | What it returns |
| --- | --- |
| `POST /v1/simulate` | `202 {id, status, links}` and runs `simulate.run` in the background. Needs `Idempotency-Key` (at most 255 characters); `Real-World-Version`, if sent, must be `2026-10-27`. `Authorization: Bearer rw_...` is optional; `401 {code, detail}` for an unknown or revoked key. `402`/`429 {code, detail}` when a spend check refuses: `max_cost_usd` (clamped without a key), the key's cap, the day's fork budget or the per-address daily count (`503` when a check cannot run; codes in [simulate-api](../product/simulate-api.md)); `409 {code, detail}` when the key is running a fork or was used with another body; `422 {code, detail}` for an invalid request, a `Real-World-Version` that is not current, or an event `policy.screen` refuses ([acceptable use](../product/acceptable-use.md)); `503 {code, detail}` when the screen could not run. |
| `POST /v1/simulate/estimate` | Estimated cost, model calls and whether it fits the cap; takes the same optional key (`401` unknown or revoked, `503` when it cannot be checked). No fork is started. |
| `GET /v1/simulations/{job_id}` | A fork's status and, once done, the result (`simulated: true`) or the error. |
| `GET /v1/simulations/{job_id}/events` | Server-sent events, one `id:` each; `Last-Event-ID` resumes; a `: heartbeat` comment every 15 s; closes after `succeeded` or `failed`. |
| `GET /v1/world` | Latest snapshot date, per-country cells, today's daily question id, prefilled fork events. |
| `GET /v1/world/population` | The latest snapshot's population: per country its rubric, tier, segments with agent counts and per topic the published marginal, the simulated share with p10-p90 and the spread audit (null before `learn` has run); the settings and licence rows it rests on ([world page](../product/world-page.md)). |
| `GET /v1/agents/{agent_id}` | Traits, shares, tier, and per day per topic the logit change split into the news step (with the signal title), the poll nudge and the anchor pull toward `b0` plus the assimilated offset. |
| `GET /v1/agents/{agent_id}/why` | A model-written account from that trace, labelled "Simulated account, not the cause". Cached by prompt. |
| `GET /v1/daily` | Today's question; with `?player_id=` after answering, the reveal: you, crowd, committed `sim` and `market`, outcome, Brier, streak and `week` (the seven days ending today, each with your answer and its Brier once resolved). |
| `POST /v1/daily/answers` | One answer per visitor per question (`409 {code, detail}` on a repeat or after `closes_at`, `422` for a question that is not today's); returns the reveal. |
| `GET /v1/receipts`, `GET /v1/receipts/{day}`, `GET /v1/receipts/{day}/leaves/{leaf_hash}` | Day records newest first with anchor status; one day with every entry, salt and leaf hash, its question (text, resolution source, resolves by), outcome and Brier once known, and its stored RFC 3161 and OpenTimestamps proofs; one receipt with the sibling hashes that prove it into the day's root. |
| `GET /v1/status` | Live status: latest cycle date, state and finish time, ledger root and record hash, anchor status, model and provider in use, spend today against the nightly budget, engine version. |
| `GET /v1/cycle`, `GET /v1/cycle/{date}`, `GET /v1/cycle/{date}/replay` | One daily cycle as a run log: steps with model calls, tokens and dollars, news per topic, assimilation per country and topic, spread audit, day record; and the day's `sim` and `plain_llm` forecasts recomputed from stored model answers and diffed against the ledger. `404` when the day has not run or has no day record. |
| `GET /v1/questions/{question_id}` | One question with its hashes and outcome, and per day every committed forecast (`sim`, `plain_llm`, `market`) with spread, receipt, Brier and log score once resolved, the per-segment model answers behind the sim forecast, the plain LLM samples and the day's headlines. `404` for an id not on the list. |
| `GET /v1/scores` | Skill of the `sim` forecaster against each baseline over resolved questions. |
| `GET /v1/research` | Every pre-registered experiment with its registered and current hash, hypothesis, primary metric, kill criterion and committed runs, and the eight papers with links to their sources ([research](../product/research.md)). Read from the repository files; no stored state. |
| `GET /v1/scoreboard` | The public scoreboard: protocol and hash, resolved and open question counts, mean Brier and log score per forecaster with a day-block bootstrap interval from 10 resolved questions, skill against each baseline, reliability bins, every scored question-day newest first and the five worst `sim` forecasts. |
| `GET /healthz` | `{"ok": true}` |

Every error is a JSON object with a one-sentence `detail`. A refusal adds `code` (`409` closed or already done, `422` refused or invalid, `402` over a cost cap, `503` a check could not run, `401` bad key, `429` rate limit); `404` carries `detail` only.

## State

`rw_api/schema.sql` owns `jobs`, `job_events`, `idempotency_keys`, `fork_clients`, `api_keys`, `key_forks`, `key_screens` and `daily_answers`, in the engine's SQLite file under `$RW_HOME`. `uv run python -m rw_api.keys create --label <name> --cap-usd <n>` makes an API key and prints it once; `list` and `revoke --id <n>` manage them. An idempotency key is honoured for 24 hours. On startup, forks left `queued` or `running` are marked `failed` with a sentence saying the server restarted.

## Research

[engineering/069](../research/engineering/069-api-design.md) (async jobs, idempotency, SSE, versioning), [engineering/074](../research/engineering/074-abuse-and-safety.md) (labels and limits), [product/077](../research/product/077-daily-question-mechanics.md) (daily question), [engineering/070](../research/engineering/070-commit-reveal-timestamping.md) (receipts).
