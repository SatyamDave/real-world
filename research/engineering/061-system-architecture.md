# System architecture for a daily-assimilated world simulation

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Vendor limits and prices come from the vendors' own pages. My web search budget ran out, so I did not research Temporal, Prefect or Airflow, and nothing here is load-tested.

## Answer

Build a nightly batch system, not a streaming one. One Python pipeline runs once a day from a cron trigger, calls the LLM through Anthropic's Batch API, and writes immutable daily snapshots (Parquet files in object storage) plus a small Postgres database for the things people query. The API and web app read precomputed results. Only "fork and simulate" needs live compute, and it should run on a small sampled population. Skip Kafka, Temporal, Airflow and a feature store until there is a reason.

## Findings

**The data feeds are batch already.** GDELT 2.0 events and the knowledge graph update every 15 minutes, with 65 live-translated languages in the event and GKG tables. GDELT 1.0 posts a daily file by 6 AM EST. Everything is also in BigQuery. The page says the database is "100% free and open" but I could not read the terms of use ([GDELT data](https://www.gdeltproject.org/data.html)). A once-a-day pull loses nothing the product promises. Nothing in the plan needs sub-day latency.

**The LLM call is the expensive step, and batch pricing fits it.** The Message Batches API charges 50% of standard prices. Haiku 5.5 batch is $0.05 per million input tokens and $0.25 per million output tokens for prompts up to 100,000 tokens ([Anthropic batch docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)). A batch holds at most 100,000 requests or 256 MB, so 100,000 agents is exactly one batch. Most batches finish within 1 hour, but a batch expires if it is not done in 24 hours, and results stay downloadable for 29 days. Prompt caching stacks with the batch discount, but cache hits are best effort (30% to 98% in Anthropic's words), and the docs suggest the 1-hour cache for shared context. My arithmetic: about 2,000 input and 300 output tokens per agent-step is roughly $0.00018, or about $17 for 100,000 agents. That matches the $15-60 per night figure in the plan.

**Fork runs cannot use the batch path interactively.** A user who clicks "run 7 days" will not wait up to 24 hours. Standard Haiku pricing is double the batch price (derived from "50%", I did not open the standard table), and rate limits apply. A 7-day fork with a 5-member ensemble is 35 agent-days of cost. At full population that is about $600. On 5,000 sampled agents it is about $30. So forks must run on a sample, with a cap per user.

**Cloudflare Workflows is not the compute layer.** Limits on the paid plan: CPU time per step 30 seconds by default (5 minutes max), 1 MiB maximum step result, 1 GB state per instance, 10,000 steps default, instance state kept 30 days ([Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)). The page contradicts itself on concurrent instances (50,000 in the table, 10,000 in the text). That is fine for orchestration, wrong for holding or crunching 100,000 agent states. Workers Paid is $5 per month with 10 million requests included ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)), so a thin read API there is nearly free.

**D1 is too small for agent state.** D1 caps a database at 10 GB, a row at 2 MB, and a query at 30 seconds ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)). Fine for forecasts and scores. Wrong for daily snapshots of 100,000 belief vectors that must be kept forever.

**Cheap durable storage exists.** R2 is $0.015 per GB-month with free egress and 1 million free Class A operations a month ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). Neon Postgres has a free plan (1 GB per project, scale to zero after 5 minutes) and Launch at $0.106 per CU-hour and $0.35 per GB-month ([Neon pricing](https://neon.com/pricing)). DuckDB is MIT-licensed, runs in-process with no server, and targets whole-table aggregations ([DuckDB](https://duckdb.org/why_duckdb.html)). The repo has 42.1k stars ([GitHub](https://github.com/duckdb/duckdb)).

**Dagster is the only orchestrator I read.** It is built around software-defined assets and offers a hosted Dagster+ and self-hosted open source. The page does not state a license and does not explain partitions ([Dagster docs](https://dagster.io/docs/getting-started/what-why-dagster)). It is a reasonable later choice. It is a day or two of setup we do not need yet.

## What it means for Real World

- For the product: "Today's world" is a dated, immutable snapshot. That makes the public hashed track record easy: hash the snapshot and forecast files before outcomes exist. Forks are a separate, capped, sampled product, and the UI must say so.
- For the engineering: A PM and an engineer can both read a pipeline that is a list of named steps run in order. Each step takes a date, reads files, writes files, and is safe to rerun. State is the snapshot folder plus Postgres. No hidden queues.
- For the business: Nightly cost stays near $20-60 for the world run. Fork cost is the real variable, so price it per run and cap it. Streaming would add cost and failure modes with no user-visible gain.

## Recommendations

1. Make the nightly run one Python module with steps `ingest`, `assimilate`, `forecast`, `publish`, `score`, `learn`. Each takes `--date`, writes to `snapshots/YYYY-MM-DD/`, and skips work already done. Trigger it by cron (GitHub Actions or one small VM). Use no orchestrator for the first 22 days.
2. Store agent state as Parquet in R2, keyed by date. Store forecasts, hashes, scores, forks and users in Postgres (Neon). Query snapshots with DuckDB. Do not put agent state in D1.
3. Send all nightly LLM calls through the Batch API in a single 100,000-request batch. Use identical cache blocks across requests and the 1-hour cache. Poll with a retry. If the batch is not done by a set hour, publish a clearly marked "stale" day rather than a silent gap.
4. Run forks on a sampled population (start at 5,000 agents), on the standard API, with a per-user cap. Queue them in Postgres and process them with one worker. Show estimated cost before running.
5. Put the API on a thin Python (FastAPI) or Worker service that only reads Postgres and R2. `POST /v1/simulate` creates a fork job and returns a job id. Write the typed output schema once and generate the Python and TS SDKs from it.
6. Publish forecast hashes by writing the hash to Postgres and to a public file in R2 at publish time. Never rewrite either.
7. Revisit Dagster or Temporal only when the nightly run has more than about 10 steps, needs fan-out across machines, or fails often enough that manual reruns cost real time.

## Open questions

- Real token counts per agent-step. Run 1,000 agents once and measure before trusting the $17 estimate.
- Whether Anthropic rate limits allow a 100,000-request batch on our account tier. Check with a 1,000-request test batch.
- The standard (non-batch) Haiku 5.5 price and rate limits for fork runs. Read the pricing page and confirm.
- GDELT terms of use. Read about.html before launch.
- Temporal, Prefect and Airflow were not researched. Search again if cron proves too weak.

## Sources

- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [Anthropic Message Batches API docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing), accessed 2026-10-11
- [Cloudflare Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/), accessed 2026-10-11
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/), accessed 2026-10-11
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), accessed 2026-10-11
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), accessed 2026-10-11
- [Neon pricing](https://neon.com/pricing), accessed 2026-10-11
- [Why DuckDB](https://duckdb.org/why_duckdb.html), accessed 2026-10-11
- [DuckDB on GitHub](https://github.com/duckdb/duckdb), accessed 2026-10-11
- [Dagster docs overview](https://dagster.io/docs/getting-started/what-why-dagster), accessed 2026-10-11
