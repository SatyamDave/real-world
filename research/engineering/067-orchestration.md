# Daily pipeline orchestration: cron vs Dagster, Prefect, Temporal, Modal, GitHub Actions

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Prices and limits come from vendor pages opened today. The web search budget ran out mid-session, so I did not read any orchestrator's own reliability docs or independent outage reports, and the recommendation rests partly on reasoning, not measurement.

## Answer

Do not adopt an orchestrator for launch. The nightly job is a short chain of stages that mostly waits on the Anthropic Batch API. Run it as one idempotent Python entrypoint that records each stage's status in a Postgres table, started by a Modal cron. Use the same code for API-triggered forks via a Modal spawn. Keep GitHub Actions as the manual rerun and backup trigger. Dagster, Prefect and Temporal solve problems Real World does not have in the 22 days before the YC deadline.

## Findings

**The workload shape decides this.** The nightly update calls an LLM about 100,000 times. The Message Batches API takes up to 100,000 requests or 256 MB per batch, at 50% off. Most batches finish within 1 hour, and a batch expires if not done in 24 hours. Results stay downloadable for 29 days. Haiku 5.5 batch pricing is listed at $0.05 input and $0.25 output per million tokens (prompts up to 100k tokens). ([Anthropic batch docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)). So the pipeline is: ingest, build prompts, submit one batch, poll, apply results, forecast, hash, publish. Almost all wall time is waiting, and the compute is light. Nothing needs a distributed task graph. The one hard timing rule is that the hash must be published before outcomes exist, so a missed night is visible on the public track record.

**GitHub Actions** (cron trigger):
- Shortest schedule interval is 5 minutes. Schedules run in UTC by default, and only on the default branch. ([events docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows))
- Runs can be delayed under load, especially at the top of the hour, and queued jobs can be dropped under very high load. Public repos get scheduled workflows disabled after 60 days of no repo activity. Same page.
- A job gets 6 hours. A workflow run is cancelled after 35 days. Free plan allows 20 concurrent jobs. ([limits](https://docs.github.com/en/actions/reference/limits))
- Fit: fine for a nightly cron with a batch-polling job under 6 hours. Poor for forks: you would call workflow_dispatch from the API, which gives no job queue, no result channel and 20-job concurrency on Free.

**Modal:**
- Starter plan is $0 plus compute, with $30 free monthly credits and 5 deployed cron jobs. Team is $250/month with $100 credits and unlimited cron jobs. CPU is $0.0000131 per core-second and memory $0.00000222 per GiB-second. ([pricing](https://modal.com/pricing))
- Schedules attach to a function with `modal.Cron` (standard cron syntax, optional timezone). Use Cron, not Period: Period restarts its interval on every deploy. Schedules cannot be paused, only removed and redeployed. ([cron guide](https://modal.com/docs/guide/cron))
- The cron docs say nothing about missed runs or retries. I could not confirm what happens if a run is skipped. The pricing page marks scheduled functions "Limited" on Starter without explaining the limit.
- Fit: the same code can serve the nightly cron and fork jobs, with scale-out on demand and no cluster to run. Cost for a light, mostly-waiting job should sit inside the $30 credit, but I did not compute it, and fork load is unknown.

**Cloudflare Workers Cron Triggers and Workflows:**
- Cron triggers run in UTC and changes can take up to 15 minutes to propagate. The page gives no delivery guarantee and no wall-time limit. ([docs](https://developers.cloudflare.com/workers/configuration/cron-triggers/))
- Workflows has durable steps and sleeps. CPU time per step defaults to 30 seconds on Paid (10 ms on Free), configurable to 5 minutes. Completed instance state is kept 3 days on Free, 30 days on Paid, and Paid allows 50,000 concurrent instances. ([limits](https://developers.cloudflare.com/workflows/reference/limits/))
- Fit: good for the thin API layer and for durable "wait for the batch" logic, but the simulation code is Python and heavy. Do not split the pipeline across two runtimes at launch.

**Dagster:**
- Apache-2.0, 16.3k GitHub stars. Dagster+ Solo is $10/month and Starter $100/month, plus $0.035 to $0.040 per credit, with Serverless compute billed at $0.010 per minute. Solo is limited to 1 user, 1 code location, 1 deployment. ([pricing](https://dagster.io/pricing), [repo](https://github.com/dagster-io/dagster))
- Strength: asset lineage and a good UI, which suit a multi-source assimilation pipeline later. Cost: concepts (assets, resources, code locations, sensors) and a long-running daemon plus webserver to host, or the paid cloud.

**Prefect:**
- Apache-2.0, 24.0k stars. Hobby tier is free: 2 users, 5 deployments, 1 workspace, 500 Serverless minutes a month, 7 days of run retention. Starter is $100/month flat. ([pricing](https://www.prefect.io/pricing), [repo](https://github.com/PrefectHQ/prefect))
- Lightest of the three to adopt: decorate Python functions, get retries and a run UI. The free tier's 7-day retention is too short for an audit trail, but Postgres holds that anyway.

**Temporal:**
- MIT, 23.6k stars. Cloud is pay-as-you-go from $50 per million actions (down to $25 with self-service volume discounts), $0.042 per GB-hour for active storage, and $150 free credit for 90 days. ([pricing](https://temporal.io/pricing), [repo](https://github.com/temporalio/temporal))
- Strength: durable execution that survives crashes mid-workflow. It is the right tool for long multi-step jobs with human waits. Cost: determinism rules for workflow code, a worker fleet, and the steepest learning curve here. I did not read the self-hosting requirements, so treat any "run it ourselves" estimate as unverified.

**What does not work:** GitHub Actions as the fork backend. Prefect Hobby or Modal Starter limits if the daily panel, assimilation and fork queues become separate scheduled jobs (5 cron jobs on Modal Starter, 5 deployments on Prefect Hobby). Any scheduler that cannot tell you "last night did not run" without someone looking.

## What it means for Real World

- For the product: the daily cycle is the moat, so a missed or late night shows on the public receipts page. Reliability of the trigger and of the hash publish matters more than DAG features. Forks need a visible job status (queued, running, done) because a 7-day ensemble run will take minutes, not milliseconds.
- For the engineering: the pipeline is six to eight stages with one slow external wait. A stage table in Postgres (run id, stage, status, started, finished, input hash) gives retries, resume and an audit trail in a form both a PM and an engineer can read with a SQL query. Every stage must be safe to rerun, since the batch id is stored and results can be re-fetched for 29 days.
- For the business: the orchestration bill is near zero at launch (Modal credits or Actions minutes). The real cost is the model bill ($15-60/night from the plan, and batch pricing may cut it), so spend the effort on cost tracking per run, not on tooling.

## Recommendations

1. Write `rw.daily` as one Python module with named stages and a `stage_runs` table in Postgres. Each stage checks "already done for this date" and skips. No framework. Owner: engineering.
2. Trigger it with `modal.Cron` at an off-peak minute (not :00), UTC, committed in the repo. Verify on the first three nights what Modal does if a run is missed, since its docs are silent.
3. Serve `POST /v1/simulate` by writing a `fork_jobs` row and spawning the same Modal function. The API returns a job id; the SDKs poll it. Cap concurrent forks to protect the model budget.
4. Add a dead-man's check: a GitHub Actions cron (off-peak minute) that fails and posts to Slack if today's published hash is missing by a set hour. It also holds a `workflow_dispatch` button for manual reruns.
5. Use the Batch API for the nightly agent update, and store the batch id in `stage_runs` so a crashed run resumes polling instead of resubmitting and paying twice.
6. Revisit Prefect (first choice) or Dagster only if you have more than about 10 scheduled pipelines or need lineage for outside contributors. Revisit Temporal only for opt-in twin interviews with long human waits.

## Open questions

- Does Modal Cron retry or skip a missed run, and what is the "Limited" scheduled-function allowance on Starter? Find out: read the Cron API reference and run a test deploy, or ask Modal support.
- What does one nightly run cost on Modal compute, excluding model spend? Find out: time a dry run with 1,000 agents and scale up.
- Does Batch API throughput hold at 100,000 requests under our rate limits, and how often does a batch hit the 24-hour expiry? Find out: submit a 10,000-request test batch this week and one full-size batch before launch.
- Where does Postgres live (Supabase, Neon, Fly)? This note assumes a managed Postgres and did not compare vendors.
- No independent reliability data was gathered for any option. Find out: search each project's public status page and issue tracker for cron or scheduler incidents.

## Sources

- [Anthropic Message Batches API docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing), accessed 2026-10-11
- [GitHub Actions: events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), accessed 2026-10-11
- [GitHub Actions limits](https://docs.github.com/en/actions/reference/limits), accessed 2026-10-11
- [Modal pricing](https://modal.com/pricing), accessed 2026-10-11
- [Modal cron guide](https://modal.com/docs/guide/cron), accessed 2026-10-11
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), accessed 2026-10-11
- [Cloudflare Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/), accessed 2026-10-11
- [Dagster pricing](https://dagster.io/pricing), accessed 2026-10-11
- [Dagster repo](https://github.com/dagster-io/dagster), accessed 2026-10-11
- [Prefect pricing](https://www.prefect.io/pricing), accessed 2026-10-11
- [Prefect repo](https://github.com/PrefectHQ/prefect), accessed 2026-10-11
- [Temporal pricing](https://temporal.io/pricing), accessed 2026-10-11
- [Temporal repo](https://github.com/temporalio/temporal), accessed 2026-10-11
