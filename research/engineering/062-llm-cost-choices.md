# LLM choice and cost for the agent loop

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Prices are read from vendor pages today and are solid. Open-weight throughput is my own estimate, because the web-search budget ran out before I could find a measured benchmark.

## Answer

Claude Haiku 5.5 costs $0.10 per million input tokens and $0.50 per million output tokens. That is about a tenth of Haiku 4.5. One answer per agent for 100,000 agents costs roughly $7 to $25 a night on the Batch API, below the $15-60 in the plan. Self-hosting open-weight models does not beat that at our scale before launch. Use Haiku 5.5 for the nightly loop and for forks, Sonnet 5.5 for "ask why", and run one open-weight bake-off (Qwen3.5) as a diversity check, not a cost play.

## Findings

**Haiku 5.5 prices** ([pricing](https://platform.claude.com/docs/en/about-claude/pricing)). Prompts up to 100k tokens: $0.10 in, $0.50 out, $0.125 five-minute cache write, $0.20 one-hour cache write, $0.01 cache read. Prompts over 100k tokens cost five times more ($0.50 in, $2.50 out), and a cache hit does not escape the higher tier. Batch API is 50% off: $0.05 in, $0.25 out. Model ID `claude-haiku-5-5`, 1M context, retirement not sooner than 2027-10-07 ([models overview](https://platform.claude.com/docs/en/about-claude/models/overview)).

**Other Claude tiers.** Sonnet 5.5 is $2 in, $10 out ($1 and $5 batch). Opus 5.5 is $4 and $20. Fable 5.1 is $10 and $50. Sonnet is about 20x Haiku per token. Opus and Fable have no place in a per-agent loop.

**Caching.** Minimum cacheable prompt on Haiku 5.5 is 512 tokens. Default lifetime is five minutes, refreshed on each hit. A one-hour lifetime costs 2x base to write ([prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)). Caching works inside batches but "on a best-effort basis", because batch requests run in any order. Anthropic advises the one-hour lifetime for batches with shared context ([batch docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)).

**Batch limits.** Most batches finish within an hour. They expire after 24 hours. Haiku 5.5 supports up to 300k output tokens per batch request with a beta header. I did not check the request-count and rate-limit ceilings for a 100k-request batch.

**Thinking.** Haiku 5.5 uses adaptive thinking at default effort `medium`. Thinking tokens bill as output. I could not confirm whether it can be turned off. For a 150-token typed answer this can dominate the bill, so measure it first.

**Open-weight prices, hosted** ([Together](https://www.together.ai/pricing), per million in/out): Qwen3.5 9B $0.17/$0.25. Qwen3 235B A22B 2507 $0.20/$0.60. Gemma 4 31B $0.39/$0.97. Llama 3.3 70B $1.04/$1.04. The small hosted Qwen costs more per answer than Haiku 5.5 on-demand. Hosted open weights are not cheaper at this tier.

**GPU rental.** Together H100 clusters $3.99/hr on-demand, $1.99 preemptible. RunPod H100 SXM $2.69/hr community, $3.49 secure. B200 $5.98 to $8.99/hr ([RunPod](https://www.runpod.io/pricing)). RunPod's page shows two conflicting price sets, so treat these as rough.

**Open-weight models.** Qwen3.5-9B is Apache-2.0, supports 201 languages and dialects, released February 2026 ([model card](https://huggingface.co/Qwen/Qwen3.5-9B)). Qwen3.6-35B-A3B is Apache-2.0, 35B total with 3B active, April 2026, needs vLLM 0.19 or newer ([model card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B)). Gemma 4 31B is tagged apache-2.0 on its card, covers 140+ languages in pre-training and 35+ out of the box ([model card](https://huggingface.co/google/gemma-4-31B)). Google's older terms page does not clearly cover Gemma 4, so read the Gemma 4 license before relying on it ([terms](https://ai.google.dev/gemma/terms)). I did not open the Llama license.

**No benchmark found.** vLLM's Qwen3.5 recipe gives a benchmark command and no results ([recipe](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3.5.html)). The Qwen repo has no tokens-per-second table ([repo](https://github.com/QwenLM/Qwen3.5)).

**Cost per answer (my arithmetic).** Assume 1,500 input and 150 output tokens, typed JSON output, no long thinking.

| Option | Per answer | Per 100k agents | Per 1M answers |
|---|---|---|---|
| Haiku 5.5 sync | $0.000225 | $22.50 | $225 |
| Haiku 5.5 batch | $0.000113 | $11.25 | $113 |
| Haiku 5.5 batch, 1,000 tokens cached, all hits | $0.000068 | $6.75 | $68 |
| Sonnet 5.5 batch | $0.00225 | $225 | $2,250 |
| Qwen3.5 9B hosted | $0.000293 | $29 | $293 |
| Self-hosted 9B on one H100, ~10 answers/s (estimate) | ~$0.000075 | ~$7.50 | ~$75 |

At 3,000 input and 300 output tokens (persona plus memory), double everything: $22 batch, $45 sync per 100k agents.

## What it means for Real World

- For the product: A fork is cheap enough to give away at small size. 2,000 agents x 7 days x 5 ensemble members is 70,000 answers, about $16 sync. A full 100k-agent, 7-day, 5-member run is 3.5M answers, about $390 batch. Forks need an agent cap and a per-user budget. "Ask why" on Sonnet 5.5 costs about 1 cent a click.
- For the engineering: Self-hosting saves little. Nightly 100k answers is about 3 GPU-hours, roughly $8. A reserved H100 running 24/7 costs about $64 a day, more than the whole nightly Haiku batch. GPUs only win if kept busy and if we need more than about 1M answers a night.
- For the business: The $15-60 nightly cost in the plan is an overestimate with batch and short prompts. The risk moves to ensembles and forks, which scale with users. Pinned model IDs, retired no sooner than October 2027, keep the hashed track record reproducible for a year.

## Recommendations

1. Nightly assimilation: Haiku 5.5 via Batch API, one-hour cache lifetime, shared question and context first, per-agent persona last. Start the batch at a fixed hour with slack for the 24-hour expiry. Rerun stragglers sync.
2. Interactive forks and ensembles: Haiku 5.5 sync with hard caps on agents, days and members, and a spend counter per fork. Fail closed when the counter is spent.
3. "Ask why" and spot audits: Sonnet 5.5. Judge a 1% sample of Haiku answers with it each night to catch drift.
4. Before building more, run a one-day measurement: 2,000 agents on Haiku 5.5, thinking at lowest effort, logging real input, output and cache-read tokens per answer. Replace every number above with it.
5. Run a bake-off of Qwen3.5-9B (hosted at first) against Haiku 5.5 on 2,000 agents across 20 countries, scored against survey marginals. The goal is to see whether a second model family reduces variance collapse and Western flattening. This is a hypothesis, not a finding.
6. Do not self-host before launch. Revisit when monthly Anthropic spend passes about $3,000 or when one run needs more than 1M answers.
7. Keep prompts under 100k tokens. Crossing the threshold raises price fivefold.

## Open questions

- Real tokens per answer and thinking overhead on Haiku 5.5. Answer by the measurement in recommendation 4.
- Real vLLM throughput for a 9B and a 35B-A3B model at 1,500 in / 150 out on one H100. Answer by a one-hour rented-GPU test.
- Batch ceilings (requests per batch, rate limits) for 100k requests. Answer from the rate-limits page or a test batch.
- Whether Haiku 5.5 lets us disable thinking. Answer from the thinking docs or one API call.
- Gemma 4 and Llama license terms for a commercial API with synthetic outputs. Read the licenses.

## Sources

- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), accessed 2026-10-11
- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview), accessed 2026-10-11
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), accessed 2026-10-11
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing), accessed 2026-10-11
- [Together AI pricing](https://www.together.ai/pricing), accessed 2026-10-11
- [RunPod pricing](https://www.runpod.io/pricing), accessed 2026-10-11
- [Qwen3.5-9B model card](https://huggingface.co/Qwen/Qwen3.5-9B), accessed 2026-10-11
- [Qwen3.6-35B-A3B model card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B), accessed 2026-10-11
- [Gemma 4 31B model card](https://huggingface.co/google/gemma-4-31B), accessed 2026-10-11
- [Gemma terms](https://ai.google.dev/gemma/terms), accessed 2026-10-11
- [vLLM Qwen3.5 recipe](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3.5.html), accessed 2026-10-11
- [QwenLM/Qwen3.5 repo](https://github.com/QwenLM/Qwen3.5), accessed 2026-10-11
