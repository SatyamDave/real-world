# 0001: Architecture of the base product

- Date: 2026-10-11
- Status: proposed
- Rests on: [SYNTHESIS.md](../SYNTHESIS.md), [lenses/cto.md](../lenses/cto.md), [lenses/cpo.md](../lenses/cpo.md), [lenses/red-team.md](../lenses/red-team.md), [engineering/061](../engineering/061-system-architecture.md), [062](../engineering/062-llm-cost-choices.md), [063](../engineering/063-typed-probabilities.md), [064](../engineering/064-agent-state-storage.md), [065](../engineering/065-belief-update-operators.md), [066](../engineering/066-ensembles.md), [067](../engineering/067-orchestration.md), [069](../engineering/069-api-design.md), [071](../engineering/071-web-app-stack.md), [072](../engineering/072-replay-and-caching.md), [074](../engineering/074-abuse-and-safety.md), [open-source/033](../open-source/033-agenttorch.md), [035](../open-source/035-classic-abm.md), [041](../open-source/041-globe-visualization.md), [044](../open-source/044-python-ts-monorepo-tooling.md), [045](../open-source/045-sdk-generation.md), [science/018](../science/018-failure-modes.md), [022](../science/022-data-assimilation-abm.md), [025](../science/025-news-exposure-diffusion.md), [028](../science/028-large-scale-llm-sims.md), [data/057](../data/057-global-synthetic-population.md), [058](../data/058-geodata.md), [060](../data/060-data-licensing-legal.md), [099](../data/099-country-coverage-tiers.md)

## Decision

The base product is one repository with six code folders: `engine/` (one Python package, `rw`), `api/` (FastAPI over the engine), `sdk/python/`, `sdk/typescript/`, `web/` (Vite + React) and `data/` (licence table, bundled sample data, fixtures). It runs on a laptop with no API keys: every model call goes through one function in `engine/rw/llm.py`, which uses a deterministic fake model unless `ANTHROPIC_API_KEY` is set, in which case it calls Claude Haiku 5.5 (`claude-haiku-5-5`). Agents are rows of numbers in a daily Parquet file. The model is called per segment (country x age band x education), never per agent. The daily cycle is six re-runnable steps (`ingest`, `assimilate`, `forecast`, `publish`, `score`, `learn`) behind one command. A fork is a simulation job that starts from a day's snapshot, applies an event for N days across K ensemble members, and returns a typed result. Forecasts are committed to an append-only, hash-chained ledger before they are scored. Local state is one SQLite file plus Parquet files under `var/`. Hosting (Postgres, R2, cron, a public receipts mirror) is a later decision, 0003, and changes storage paths, not module boundaries.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| A. One Python engine package + FastAPI + generated SDKs + Vite web app, SQLite and Parquet locally (chosen) | Every note converges on it; a PM can run it with `make setup && make dev`; no vendor account needed to see it work | SQLite is not the production database; a later decision moves the tables to Postgres |
| B. Adopt an agent framework (OASIS, AgentSociety, Concordia, Mesa) | Agent loop and memory come for free | Built for thousands of agents or fewer, wrong shape for segment-level calls; AgentTorch and FLAME GPU are AGPL, which reaches a hosted API ([031](../open-source/031-oasis.md)-[036](../open-source/036-ai-town-tinytroupe.md)) |
| C. One LLM call per agent per day | Matches the pitch of "100,000 LLM agents" | Costs 50-100x more and collapses variance; archetype engines beat it on error ([028](../science/028-large-scale-llm-sims.md), [018](../science/018-failure-modes.md)) |
| D. Orchestrator (Dagster, Temporal, Modal) from day one | Retries, lineage, scheduling | Six steps that mostly wait on one API; a stage table gives resume for free ([067](../engineering/067-orchestration.md)) |
| E. TypeScript everywhere (Workers + D1) | One language | numpy, DuckDB and the scoring math are Python-native; D1 is wrong for agent state ([061](../engineering/061-system-architecture.md), [064](../engineering/064-agent-state-storage.md)) |

## Why this one

It is the smallest system that can produce every surface on the launch list (receipts, daily question, fork card, `POST /v1/simulate`, SDKs, globe) and it puts the money and the risk where the research says they are: in a few thousand segment calls, a capped numeric update, and a ledger that cannot be rewritten.

### Stack

| Concern | Choice | Licence |
| --- | --- | --- |
| Python | 3.12, uv workspace, ruff (lint + format), pyright (types), pytest | MIT / MIT / MIT / MIT |
| Engine math and storage | numpy, pyarrow (reads and writes Parquet), stdlib `sqlite3`, `hashlib`, `secrets`. DuckDB comes when someone needs ad-hoc SQL over snapshots | BSD-3 / Apache-2.0 / PSF |
| Typed models | Pydantic v2 (engine types, API schemas, OpenAPI) | MIT |
| LLM | `anthropic` Python SDK, model `claude-haiku-5-5`, structured output via `output_config.format` (JSON Schema), `effort: "low"`, default temperature (Haiku 5.5 rejects other values) | MIT |
| API | FastAPI + uvicorn; SSE written by hand on `StreamingResponse` | MIT / BSD-3 |
| TypeScript | Node 22, pnpm workspace, Biome (lint + format), `tsc --noEmit`, Vitest | MIT |
| Web | Vite, React, react-globe.gl (three.js), Natural Earth 1:110m countries (public domain) | MIT / public domain |
| SDKs | `openapi-typescript` + `openapi-fetch` for TS; `datamodel-code-generator` for the Python SDK's Pydantic models, each wrapped in a client of about 100 lines | MIT |
| One command | root `Makefile`: `setup`, `dev`, `daily`, `test`, `lint`, `typecheck`, `check` | n/a |

No new dependency is added after the scaffold without a line in the PR saying why stdlib or an installed package does not cover it.

### Repo layout

```
real-world/
├── README.md                 what this is, how to run it, where things live
├── CONTRIBUTING.md
├── Makefile                  setup | dev | daily | test | lint | typecheck | check
├── pyproject.toml            uv workspace root (members: engine, api, sdk/python)
├── uv.lock  .python-version
├── package.json  pnpm-workspace.yaml  pnpm-lock.yaml  biome.json
├── .github/workflows/        pr-quality.yml (exists), ci.yml (make check)
├── research/                 notes and decisions (exists)
├── product/                  one spec per surface + glossary.md
├── data/
│   ├── README.md
│   ├── sources.csv           licence table; the loader refuses any row not cleared
│   ├── countries.csv         iso3, name, lat, lng, coverage rubric parts, tier
│   ├── topics.csv            the belief topics agents hold
│   ├── protocol.json         frozen scoring rules (hashed into every day record)
│   ├── sample/               small bundled population inputs (illustrative marginals)
│   └── fixtures/             news, polls, markets, questions, outcomes, prefilled events
├── engine/
│   ├── README.md             links product/world.md, product/benchmark.md, product/receipts.md
│   ├── pyproject.toml
│   ├── rw/
│   │   ├── settings.py       every tunable number, in one file a PM can read
│   │   ├── db.py             SQLite connection; applies rw/sql/*.sql
│   │   ├── sql/              one .sql file per module that owns tables
│   │   ├── llm.py            fake + Claude provider, cost ledger, spend caps
│   │   ├── sources.py        licence gate over data/sources.csv
│   │   ├── population.py     sample agents and segments, write a snapshot
│   │   ├── beliefs.py        update_beliefs, nudge_segments, spread_audit
│   │   ├── news.py           ingest fixture news, cluster, extract signals, exposure
│   │   ├── forecast.py       sim forecast (blind) and plain-LLM baseline
│   │   ├── ledger.py         canonical JSON, salted leaves, Merkle root, chain, verify
│   │   ├── score.py          Brier, log score, paired difference, bootstrap
│   │   ├── simulate.py       forks: request and result types, ensemble run, cache
│   │   └── daily.py          the six steps, stage table, CLI
│   └── tests/
├── api/
│   ├── README.md             links product/simulate-api.md, daily-question.md, receipts.md
│   ├── rw_api/               app.py, schema.sql
│   ├── openapi.json          committed; CI fails if it drifts from the code
│   └── tests/
├── sdk/
│   ├── python/               package `realworld`, generated models + client
│   └── typescript/           package `@real-world/sdk`, generated types + client
└── web/                      Vite + React app; README links product/web-app.md
```

`var/` (gitignored) holds local state: `var/rw.sqlite`, `var/snapshots/YYYY-MM-DD/agents.parquet`, `var/receipts/YYYY-MM-DD.json`. `RW_HOME` overrides the location.

### Module boundaries

Each module owns its tables (in `engine/rw/sql/<module>.sql`) and exposes plain functions. Only `daily.py` and `simulate.py` compose other modules. Only `api/` speaks HTTP. Only `llm.py` talks to a model provider. Only `ledger.py` writes ledger tables, and its tables refuse UPDATE and DELETE by trigger.

| Module | Owns | Public functions (shape, not final names) |
| --- | --- | --- |
| `settings` | every tunable constant | constants only |
| `db` | connection, schema application | `connect(path=None)` |
| `llm` | `llm_calls` | `complete_json(purpose, prompt, schema, max_tokens) -> dict`, `estimate_cost(prompt_chars, max_tokens)`, `spent_today()`; raises `BudgetExceeded` before a call that would cross a cap |
| `sources` | none (reads `data/sources.csv`) | `require(source_id)` raises unless commercial use is `yes` or the row is `fixture` |
| `population` | none (writes Parquet) | `sample_population(n, seed) -> Agents`, `segment_key(agent)`, `write_snapshot(date, agents)`, `read_snapshot(date)` |
| `beliefs` | none (pure numpy) | `update_beliefs(B, b0, s, signal, exposed)`, `nudge_segments(B, segments, observed)`, `spread_audit(B, segments, survey_sd)` |
| `news` | `signals`, `observations` | `ingest_day(date)`, `extract_signal(text, countries) -> {topic: float}`, `exposure(agents, signal_row, rng)` |
| `forecast` | `forecasts` | `forecast_day(date, snapshot)`; the sim path never reads market prices |
| `ledger` | `ledger_leaves`, `ledger_days` | `commit_day(date, entries, meta)`, `verify_day(date)`, `export_day(date)` |
| `score` | `resolutions`, `scores` | `brier(p, o)`, `log_score(p, o)`, `paired_difference(rows)`, `score_day(date)` |
| `simulate` | `simulations` (result cache by input hash) | `estimate(req)`, `run(req, on_progress) -> SimulateResult` |
| `daily` | `stage_runs` | `run(date, steps)`; CLI `python -m rw.daily --date YYYY-MM-DD [--step ...]` |

### Agent state

One Parquet row per agent: `agent_id, country, age_band, sex, education, urban, segment, tier, lat, lng, s` (stubbornness 0-1), `offset` (persistent latent offset in logit), and for each topic in `data/topics.csv` the current belief `b_<topic>` and anchor `b0_<topic>`, both in logit. Beliefs move only through `update_beliefs` (bounded additive step scaled by `1 - s`, capped per day, pulled back toward `b0`) and `nudge_segments` (capped per-segment shift toward an observed poll marginal). The model never sets a step size. The research's 64-dimension vector is cut to the 8 topics we can observe; more topics are a data change, not a code change.

Fixed vocabularies, so modules built in parallel agree (all live in `data/`, written once by the scaffold):

- Topics (`data/topics.csv`): `inflation_worry`, `economy_optimism`, `spending_intent`, `trust_government`, `climate_concern`, `tech_optimism`, `migration_openness`, `conflict_worry`.
- Countries in the base sample (`data/countries.csv`, 16): Tier A illustrative USA, GBR, DEU, FRA, JPN; Tier B BRA, MEX, IDN, ZAF, TUR, ISR; Tier C IND, NGA, KEN, EGY; Tier D CHN. Tiers are computed from the rubric columns, never typed in.
- Traits: `age_band` in `18-34`, `35-54`, `55+`; `education` in `low`, `mid`, `high`; `sex` in `f`, `m`; `urban` 0 or 1. Segment key: `ISO3|age_band|education` (144 segments).
- Fixture days: 2026-10-01 to 2026-10-05. Fixture question ids start with `fx-`; every fixture file says it is illustrative.

### Data flow: the daily cycle

```
data/fixtures/news/D.csv ─┐
data/fixtures/polls/D.csv ┼─ ingest ──> signals (one LLM call per news cluster), observations, market_prices
data/fixtures/markets.csv ┘                │
                                           v
snapshot D-1 (or a fresh sample) ── assimilate ──> exposure x signal -> update_beliefs
                                           │       nudge_segments toward polls (capped)
                                           v       write var/snapshots/D/agents.parquet
                                       forecast ──> sim: one call per segment x open question
                                           │            (verbalized distribution, shuffled options,
                                           │             no market price anywhere in the prompt)
                                           │        plain_llm: same news, no personas, 5 samples
                                           │        market: price at commit time (baseline only)
                                           v
                                       publish ──> ledger: salted leaves -> Merkle root,
                                           │        chained to D-1, includes question-set hash,
                                           │        protocol hash, snapshot SHA-256, config hash
                                           v
                                        score ──> resolve questions with outcomes -> Brier, log,
                                           │        paired difference vs market and vs plain_llm
                                           v
                                        learn ──> spread audit (SD ratio per country x topic),
                                                   biggest misses, country marked experimental
                                                   when outside 0.8-1.2
```

Every step records `(date, step, status, started_at, finished_at)` in `stage_runs` and skips when already done, so a crash resumes. Market prices never enter assimilation: the scored forecast is blind by construction ([red-team](../lenses/red-team.md), [market/005](../market/005-prediction-markets-landscape.md)).

### Data flow: a fork

```
POST /v1/simulate {world, event, days, members, agents, max_cost_usd, seed}
  -> Idempotency-Key check -> simulate.estimate(req) -> refuse if over max_cost or the day's budget (fail closed)
  -> input hash = sha256(snapshot id, canonical event, days, members, agents, seed, engine version, model)
     cached result? return it with zero model calls
  -> job row (queued) -> 202 {id, status, links}
  -> worker: read snapshot -> stratified subsample of `agents`
       event -> one LLM call per present segment: signed signal per topic (cached by prompt hash)
       for member in K: resample agents, add tier-scaled signal noise, draw exposure
         for day in N: update_beliefs; record segment means; emit SSE progress
  -> result: per-topic share with p10/p50/p90 across members, per-segment shifts, top 3 shifts,
     trace for 10 sampled agents, coverage tiers, cost, content hash, simulated: true
```

### What we borrow, and from where

| From | What | How |
| --- | --- | --- |
| AgentTorch (AGPL) | archetype calls with per-agent latent offsets | idea only, no code ([033](../open-source/033-agenttorch.md)) |
| OASIS (Apache-2.0) | activation sampling, a trace table per agent, interview pattern | idea only ([031](../open-source/031-oasis.md)) |
| AI Town (MIT) | ordered input log that makes a run replayable | idea: `job_events` and `llm_calls` are the log ([036](../open-source/036-ai-town-tinytroupe.md)) |
| ForecastBench, DARPA SocialSim | forward-only questions, fixed metrics, baselines on every question | protocol shape ([097](../science/097-benchmark-design.md), [098](../science/098-darpa-socialsim.md)) |
| RFC 6962 (Certificate Transparency) | leaf and node prefixes in the Merkle tree | the hashing rule in [0002](0002-benchmark-and-receipts.md) |
| GDELT GKG | column shape of the news fixture | the fixture mimics it so the real loader is a drop-in ([050](../data/050-gdelt.md)) |
| GLOPOP-S (CC BY 4.0) | demographic seed for the real world | later loader; the base uses illustrative marginals in its shape ([057](../data/057-global-synthetic-population.md)) |
| Natural Earth (public domain) | country shapes for the globe | static file in `web/public/` ([058](../data/058-geodata.md)) |
| DAPPER (MIT), scoringrules (Apache-2.0) | reference implementations | test oracles later, not runtime dependencies ([038](../open-source/038-data-assimilation-libs.md)) |

### Fake model

`FakeLLM` returns JSON that matches the requested schema, generated from a random number generator seeded by `sha256(prompt)`. The same prompt always gives the same answer, different segments give different answers, and tests never need a network. Cost is estimated at Haiku 5.5 prices (so caps are exercised) and recorded as `provider = "fake"`. `ClaudeLLM` is used when `ANTHROPIC_API_KEY` is set; it records real token counts from `usage`. Both write one `llm_calls` row per call, including the prompt text, so tests can assert what a prompt did or did not contain. A call whose provider, model, schema and prompt match an earlier row returns the stored answer with no new call ([072](../engineering/072-replay-and-caching.md)); that is what makes a rerun of the daily cycle free. Spend caps are a `Budget(limit_usd, spent_usd)` passed into each call: the nightly cycle uses `NIGHTLY_BUDGET_USD` minus today's spend, a fork uses its `max_cost_usd`. The check runs before the call and raises `BudgetExceeded`; a cap that cannot be computed counts as exceeded.

### What we deliberately do not build yet

| Not built | Why | Add when |
| --- | --- | --- |
| Real GLOPOP-S, WVS, GDELT and market loaders | Licences unconfirmed; the base proves the loop on fixtures in the same shape | Licence row is cleared in `data/sources.csv` |
| OpenTimestamps, FreeTSA, public receipts git mirror | Needs network and a public repo; format is fixed now so they bolt on | Slice "receipts go live", before the first public hash (Oct 14) |
| Hosting: Postgres, R2, cron, dead-man alert | Decision 0003 picks one platform; boundaries do not change | Before the first nightly run off a laptop |
| Anthropic Batch API for the nightly run | Halves cost but adds a polling stage; sync calls are fine at sample size | After the 1,000-call cost measurement |
| Accounts, API keys, per-user quotas, free-fork allowance | Needs a decision on auth and the 3/day vs 3/month conflict | Before the API is public |
| Persistence and demographic-lookup baselines | Need a status-quo field and a question-to-attitude map per question | Once the question generator exists ([097](../science/097-benchmark-design.md)) |
| Calibration map, conformal bands, ETKF | Needs about 100 resolved questions | n >= 100, or a hindcast shows nudging overfits |
| Social graph, neighbour talk, opt-in twins, native-language prompts, fine-tuning | Cut by every lens | Post-launch, each behind its own decision |
| Acceptable-use classifier, election window mode | The AUP text comes first; the base stamps `simulated: true` and caps event length | Before Oct 20 |
| Deep tier of fully prompted agents | "Ask why" is generated from the structured trace on demand, one call per click | If click volume makes per-click calls costly |
| Webhooks, batch endpoints, MCP, teams, dashboards | Not on the launch list | A paying customer asks |
| Turborepo, an orchestrator, a message queue | Plain `pnpm -r`, a stage table and a jobs table cover it | CI over 5 minutes, more than 10 steps, or weekly failures |

## What would make us revisit it

- The 1,000-call measurement shows a nightly run over $25 at 100k agents: revisit segment granularity and move the forecast step to the Batch API.
- The plain-LLM baseline beats the sim forecast over 100 resolved questions: keep the ledger and API, cut the population engine to what the fork card needs.
- Spread audit leaves 0.8-1.2 for most Tier A/B countries: revisit the update operator before adding features.
- A second writer (fork workers on another machine) appears: move `var/` to Postgres and R2 under decision 0003.
