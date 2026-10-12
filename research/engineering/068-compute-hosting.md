# Compute and hosting for Real World

- Date: 2026-10-11
- Area: engineering
- Confidence: medium-high. Prices come from vendor pricing pages opened today. Render's page did not load its price table, Runpod's page contradicts itself, and the workload sizes are my estimates, not measurements.

## Answer

The nightly job is a batch pipeline, not a server. Its cost is the LLM bill (about $17-35 per night on Haiku 5.5), and compute is a rounding error next to it. The simplest path is Modal for the nightly job, Neon for Postgres, Cloudflare R2 for snapshots and receipts, and a small Cloudflare or Fly app for the API and web. No GPUs. Do not run our own models in October.

## Findings

**The LLM bill dominates.** Haiku 5.5 costs $0.10 per million input tokens and $0.50 per million output tokens, or $0.05 and $0.25 through the Batch API (50% off). Prompts over 100k tokens cost 5x more. Haiku 4.5 is 10x pricier ($1/$5). A night for 100,000 agents at roughly 2,000 input and 300 output tokens each is 200M in and 30M out. That is $35 standard or about $17.50 batched, before caching. This matches the $15-60 range in the plan. [Anthropic pricing](https://platform.claude.com/docs/en/docs/about-claude/pricing)

**Modal** bills per second. CPU is $0.0000131 per physical core-second (about $0.047 per core-hour). Memory is $0.00000222 per GiB-second. Starter is $0 plus usage, includes $30 per month free credit, 100 containers and 10 GPU concurrency. Team is $250 per month with $100 credit. GPUs: L4 $0.000222/s (about $0.80/hr), L40S $0.000542/s ($1.95/hr), H100 $0.001097/s ($3.95/hr). Scheduled functions use `modal.Cron("0 6 * * *", timezone=...)`, need `modal deploy`, and cannot be paused (remove and redeploy). Function timeout is 5 minutes by default and 24 hours at most. [Modal pricing](https://modal.com/pricing), [Modal cron](https://modal.com/docs/guide/cron), [Modal timeouts](https://modal.com/docs/guide/timeouts)

My estimate for fan-out: 100 containers, 0.5 core and 2 GiB each, running 30 minutes is about $2.40 CPU plus $0.80 memory, so roughly $3 per night. The API calls are I/O-bound, so this is generous.

**Fly.io**: shared-cpu-1x with 1 GB is $6.70 per month, performance-1x with 2 GB is $33.00. Volumes are $0.15/GB-month. Outbound traffic is $0.02/GB in North America and Europe, $0.12/GB in Africa and India. Managed Postgres starts at $38 per month plus $0.28/GB storage. No GPU pricing is listed. Good for an always-on API. [Fly pricing](https://docs.fly.io/about/pricing)

**Cloudflare**: Workers Paid is $5 per month with 10M requests and 30M CPU-ms included. Cron Triggers and Queue consumers may use up to 15 minutes of CPU time. R2 is $0.015/GB-month, zero egress, with 10 GB free. Containers exist (25 GiB-hours included, then $0.0000025 per GiB-second) but I could not confirm GA status from the page. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Containers pricing](https://developers.cloudflare.com/containers/pricing/)

**Railway**: Hobby is $5 and Pro is $20 per workspace, each with matching credit. vCPU is about $20 per month, memory about $10 per GB, egress $0.05/GB. Easy, but the most expensive per unit of the group. [Railway pricing](https://railway.com/pricing)

**Render**: cron jobs bill per active second with a $1 monthly minimum per job and stop after 12 hours. I could not read its instance or Postgres price table (the page did not load it). [Render cron docs](https://render.com/docs/cronjobs)

**Postgres.** Neon Free gives 100 CU-hours and 1 GB per project. Launch is $0.106 per CU-hour (1 CU is about 4 GB RAM) and $0.35/GB-month, no monthly minimum, and compute that is suspended costs $0. Scale is $0.222 per CU-hour. Supabase Pro is $25 per month with 8 GB disk and a $10 compute credit; its Free tier pauses after a week of inactivity. [Neon pricing](https://neon.com/pricing), [Supabase pricing](https://supabase.com/pricing)

**GPU clouds.** Lambda H100 SXM is $3.99-$4.29 per GPU-hour, A100 40 GB $1.99. Runpod's page gives conflicting figures (H100 $3.49 or $3.99, L40S $1.09 secure, serverless H100 $4.79/hr). [Lambda](https://www.lambda.ai/pricing), [Runpod](https://www.runpod.io/pricing)

**Storage arithmetic that bites.** If each of 100,000 agents carries about 20 KB of state, that is 2 GB per day, or 730 GB per year. In Neon at $0.35/GB that is about $255 per month by year end. In R2 it is about $11. Keep only current agent state in Postgres. Put daily snapshots, traces and hashed forecast files in R2.

**What does not work.** Self-hosting an LLM on a rented H100 (about $95 per day at $3.95/hr) costs more than the whole nightly Haiku bill. Modal schedules cannot be paused. Fly and Railway give no cheap way to burst to 100 workers. Free tiers of Neon and Supabase will not hold a public product (Supabase pauses; Neon limits to 1 GB).

## What it means for Real World

- For the product: the 7-day ensemble fork ("drop in an event") multiplies the LLM bill, not compute. Cap runs per user and queue them. Use the Batch API for the nightly run and live calls only for forks.
- For the engineering: one Python repo, one `modal.Cron` job that fans out with `.map()`, writes snapshots to R2 and current state to Postgres. API and web are a separate small deployment. A PM can read the cron line and the budget table; an engineer can run the same function locally.
- For the business: infra is likely $100-250 per month before LLM spend, so the nightly LLM bill is the real burn. Budget $500-1,100 per month for the nightly update plus forks. Credits from Modal and Anthropic startup programs are worth asking for, but I did not verify either.

## Recommendations

1. Run the nightly cycle as one Modal app with a `modal.Cron` schedule, on the Starter plan first. Set a 2-hour timeout and alert if it does not finish by 08:00 UTC.
2. Use Neon Launch for Postgres, with scale-to-zero on. Store current agent state and forecast metadata only. Ask Neon about branching for forks (10 branches included on Launch; extra branches $1.50 each) before relying on it.
3. Put snapshots, traces, GDELT extracts and the hashed forecast files in R2. Publish hashes from a Cloudflare Worker so the log is visible outside our own Postgres.
4. Host the API and web app on Cloudflare Workers ($5) or one Fly shared-cpu machine. Pick whichever the team already knows. Do not add a second platform.
5. Use the Batch API for the nightly run. Measure real tokens per agent on 1,000 agents before scaling to 100,000. Hard-cap spend per night in code.
6. Skip GPUs, Kubernetes, AWS and Railway until a measured bottleneck exists.

## Open questions

- Real tokens per agent per night and cache hit rate. Find out by running 1,000 agents for one night.
- Whether Batch API turnaround (up to 24 hours per Anthropic's docs; not re-verified today) fits a morning publish window. Test with a real batch this week.
- Neon fork/branch limits at the scale of many user forks. Test with 50 branches.
- Render prices and Cloudflare Containers GA status. Not needed unless we leave the main path.
- Whether Modal or Anthropic startup credits apply. Ask both.

## Sources

- [Modal pricing](https://modal.com/pricing), accessed 2026-10-11
- [Modal scheduled functions](https://modal.com/docs/guide/cron), accessed 2026-10-11
- [Modal timeouts](https://modal.com/docs/guide/timeouts), accessed 2026-10-11
- [Fly.io pricing](https://docs.fly.io/about/pricing), accessed 2026-10-11
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), accessed 2026-10-11
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), accessed 2026-10-11
- [Cloudflare Containers pricing](https://developers.cloudflare.com/containers/pricing/), accessed 2026-10-11
- [Railway pricing](https://railway.com/pricing), accessed 2026-10-11
- [Render cron jobs](https://render.com/docs/cronjobs), accessed 2026-10-11
- [Neon pricing](https://neon.com/pricing), accessed 2026-10-11
- [Supabase pricing](https://supabase.com/pricing), accessed 2026-10-11
- [Lambda pricing](https://www.lambda.ai/pricing), accessed 2026-10-11
- [Runpod pricing](https://www.runpod.io/pricing), accessed 2026-10-11
- [Anthropic API pricing](https://platform.claude.com/docs/en/docs/about-claude/pricing), accessed 2026-10-11
