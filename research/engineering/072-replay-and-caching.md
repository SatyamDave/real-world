# Replays, traces and caching

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Prices and limits come from vendor docs fetched today. Byte sizes and compression ratios are my estimates, not measurements. The web search budget ran out mid-task, so there is no survey of replay papers; the sources are primary docs only.

## Answer

Storing a 100k-agent day is cheap: roughly 25 to 200 MB compressed, under $1.10 a month of R2 after a year. The LLM calls are what cost money, and they cannot be re-run bit-for-bit, because the Anthropic Messages API documents no seed parameter. So "replay" must mean re-running our own engine on recorded model outputs, not re-calling the model. Cache forks by a hash of every input, and make an event reach only the agents it plausibly reaches so unchanged agents hit the cache.

## Findings

**The model cannot be replayed, only its recorded output can.**
- The Messages API request body lists `max_tokens`, `messages`, `model`, `system`, `thinking`, `tools` and others. I saw no `seed` in the part I could read (the last 39k characters of the page were not read, so temperature handling is unconfirmed). [Messages API](https://platform.claude.com/docs/en/api/messages/create)
- Prompt caching "has no effect on output token generation", so a cache hit does not make output repeatable either. A hit needs every segment up to the breakpoint to match exactly. [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Temporal solves the same problem for workflows by recording each activity result in an append-only event history and returning the record on replay. It also caps history: warning at 10,240 events, termination at 51,200. [Temporal events](https://docs.temporal.io/workflow-execution/event) That is the right pattern, and the cap says not to make one long history per agent.

**Provider-side caching and batch help, with limits.**
- Haiku 5.5 costs $0.10 per million input tokens and $0.50 per million output. Cache reads cost $0.01. 5-minute cache writes cost $0.125 and 1-hour writes $0.20. Prompts over 100k tokens are priced 5x higher. [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Minimum cacheable prompt on Haiku 5.5 is 512 tokens. The cache is isolated per workspace. Default TTL is 5 minutes. [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- The Batch API takes 50% off, so Haiku 5.5 is $0.05 in and $0.25 out. A batch holds at most 100,000 requests or 256 MB. Results are kept 29 days. It stacks with caching, but cache hits in a batch are "best-effort". Anthropic suggests the 1-hour TTL for batches. [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)

**Storage is a rounding error.**
- R2 standard storage is $0.015 per GB-month. Class A (write) operations are $4.50 per million, Class B (read) $0.36 per million. Egress is free from R2. Free tier: 10 GB, 1M writes, 10M reads a month. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- Parquet is columnar, Apache-2.0 licensed, and supports ZSTD among its codecs. Readers fetch only the columns they need. [Parquet format](https://parquet.apache.org/docs/file-format/), [codecs](https://parquet.apache.org/docs/file-format/data-pages/compression/)

**Trace schema standards are not settled.** OpenTelemetry moved its GenAI conventions to their own repo (Apache-2.0, 427 stars). I could not confirm what the agent-span attributes are from the pages I opened. [semantic-conventions-genai](https://github.com/open-telemetry/semantic-conventions-genai)

**My arithmetic (assumptions: 1,500 input tokens and 150 output tokens per agent decision, 4x zstd).**
- One nightly pass of 100k decisions: 100k x ($0.000150 + $0.000075) = $22.50 standard, about $11 in batch. That matches the $15-60 range in the plan.
- Decision log at about 1 KB per agent: 100 MB raw, about 25 MB compressed per day, about 9 GB a year, $0.14 a month.
- Full prompt and completion text at about 6.6 KB per call: 660 MB raw, roughly 150-200 MB compressed per day, 55-73 GB a year, about $1 a month.
- A 7-day fork over all 100k agents is 700k calls: about $157 standard. Not offerable per click. A 10-member ensemble on a 5k-agent sample is 350k calls: about $79 standard, about $39 in batch, about $47 and $24 with a 1,000-token shared prefix cached.

## What it means for Real World

- For the product: promise "replayable from the recorded trace", not "re-runnable". The receipts page can show any past day's decisions and let anyone verify the published hash. Clicking an agent ("why") reads its stored decision and prompt hash. It does not call the model again.
- For the engineering: three layers. (1) Run manifest: world snapshot id, event JSON, engine and prompt-template versions, model id, seeds, parent run. (2) Decision log: one Parquet file per day, sharded about 100 ways, one row per agent decision. (3) Raw text blobs, content-addressed. All non-LLM randomness comes from a counter-based PRNG seeded by hash(run_id, agent_id, day), so the engine is exactly repeatable. Do not write one R2 object per agent: 100k writes is $0.45 a day for no gain.
- For the business: the public hashed track record is cheap to keep forever. The real constraint on forks is LLM spend, so cap free forks by agent sample size and ensemble size, and charge for full-population runs.

## Recommendations

1. Define the run manifest and decision-log schema in one markdown file plus one Parquet schema. Use plain column names: `run_id, day, agent_id, prompt_hash, model, in_tokens, out_tokens, cost_usd, output_json, cache_hit`. Borrow OpenTelemetry token attribute names only if free; do not depend on it.
2. Fork cache key = SHA-256 of (parent snapshot id, canonicalized event JSON, horizon, ensemble size, seed, engine version, template version, model id). Store results at that key in R2. An identical fork returns the stored result with zero model calls.
3. Memoize at the agent-step level: key = prompt hash. A child fork reuses the parent's recorded output wherever the prompt is byte-identical. This only pays off if events enter a prompt for exposed agents alone. Build the exposure model for that reason, and measure the hit rate on the first test fork.
4. Put the shared world context first in every prompt and the persona last, so the Haiku 5.5 prefix cache works. Use the 1-hour TTL in batch runs. Log `cache_read_input_tokens` per call so the saving is measured, not assumed.
5. Copy batch results into R2 the day they finish. Anthropic deletes them at 29 days.
6. Hash the day's Parquet manifest (Merkle root over shard hashes) and publish it with the forecast hashes. Write the verification script now, since it is about 50 lines.
7. Cap the 7-day ensemble per free fork (for example 5k agents, 5 members) and show the dollar cost estimate before running.

## Open questions

- Does Haiku 5.5 accept `temperature`, and is there any seed or determinism flag? Read the unread tail of the Messages API reference and the model overview, then test: 20 identical calls, count distinct outputs.
- Real compression ratio and bytes per decision. Measure on one synthetic day of 100k rows before sizing anything.
- Real prefix-cache hit rate when 100k personas run through batch (best-effort caching). Run 1,000 calls and read the usage fields.
- Whether the model provider may retire or change a model id. If so, old traces stay valid as records, but new forks of old worlds will differ. Pin and record model ids in every manifest.
- OpenTelemetry agent-span attributes: not confirmed. Open the repo's model files if we want compatible export later.

## Sources

- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), accessed 2026-10-11
- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), accessed 2026-10-11
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing), accessed 2026-10-11
- [Messages API reference](https://platform.claude.com/docs/en/api/messages/create), accessed 2026-10-11
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), accessed 2026-10-11
- [Temporal event history](https://docs.temporal.io/workflow-execution/event), accessed 2026-10-11
- [Apache Parquet file format](https://parquet.apache.org/docs/file-format/), accessed 2026-10-11
- [Parquet compression codecs](https://parquet.apache.org/docs/file-format/data-pages/compression/), accessed 2026-10-11
- [OpenTelemetry semantic-conventions-genai](https://github.com/open-telemetry/semantic-conventions-genai), accessed 2026-10-11
