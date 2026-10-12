# Unit economics: API simulation, free fork, nightly update

- Date: 2026-10-11
- Area: business
- Confidence: medium. Token prices come from Anthropic, Google and OpenAI pricing pages. Token counts per agent call, retry rate and the proposed prices are my assumptions, not measured. Measure them on day one.

## Answer

At Haiku 5.5 prices ($0.10 in / $0.50 out per million tokens), one LLM call per agent per night costs about $7-28 for 100,000 agents. That fits the plan's $15-60 estimate, and the low end beats it. The real cost risk is not the nightly run. It is multiplication: ensembles (3-5 members), several samples per agent to avoid variance collapse, 7 simulated days, and free forks. A free fork must be a small, single-member, cached run. A paid simulation should be priced per agent-step, at roughly $1 per 1,000 steps, which gives a 70-85% gross margin on LLM cost alone.

## Findings

**Model prices (all per million tokens, USD).** From the [Anthropic pricing page](https://platform.claude.com/docs/en/about-claude/pricing):
- Haiku 5.5: $0.10 input, $0.50 output, $0.01 cache read, $0.125 cache write (5 minute). Batch is 50% off: $0.05 / $0.25.
- Above 100,000 prompt tokens, Haiku 5.5 jumps to $0.50 / $2.50. The count includes cache reads. Keep every prompt well under 100k.
- Haiku 4.5 is $1 / $5, ten times Haiku 5.5. Sonnet 5.5 is $2 / $10, twenty times. Opus 5.5 is $4 / $20.
- Models from 4.7 on use a tokenizer that makes about 30% more tokens for the same text. The page does not say how non-English text compares. Assume 1.3x to 2x for non-Latin scripts. That is my guess, not a sourced number.

**Cheaper competitors for the same job.** From [Google](https://ai.google.dev/gemini-api/docs/pricing): Gemini 2.5 Flash-Lite is $0.10 / $0.40, with $0.05 / $0.20 on batch. Gemini 3.1 and 3.5 Flash-Lite are $0.25 / $1.50 and $0.30 / $2.50. From [OpenAI](https://developers.openai.com/api/docs/pricing): gpt-5-nano is $0.05 / $0.40 ($0.005 cached), batch half. So Haiku 5.5 is at the floor of the market, not above it. Switching vendors saves at most 2x on input and about 20% on output.

**Nightly update model (my arithmetic, 100,000 agents, one call each).** 2,000 input tokens (persona, beliefs, news digest) and 150 output tokens.
- No caching, standard: $27.50. Batch: $13.75.
- 1,500 of the 2,000 tokens shared and cached (the news digest and instructions): $14.00 standard, $7.00 batch.
- Same, with tokens inflated 1.3x for non-English: $18.20 standard, $9.10 batch.
- Three samples per agent, to keep spread: $42 standard, $21 batch (no inflation); $55 standard at 1.3x.
- Caching only works on the shared prefix. The persona differs per agent, so it never caches. Put shared text first and persona last.

**Simulation cost per agent-step** (3,000 input, 1,500 cached, 200 output): $0.000265 standard, $0.00013 batch. A step is one agent, one simulated day, one ensemble member.
- 1,000 agents x 7 days x 5 members = 35,000 steps = $9.28 standard, $4.64 batch.
- 200 agents x 7 days x 3 members = 4,200 steps = $1.11 standard.
- 200 agents x 7 days x 1 member = 1,400 steps = $0.37.
- Full 100,000 agents x 7 days x 1 member = 700,000 steps = $185. Not viable for public forks.
- A "click an agent to ask why" answer: about $0.0009 on Haiku, $0.018 on Sonnet 5.5. Haiku is fine.

**Other costs are small.** [Cloudflare Workers](https://developers.cloudflare.com/workers/platform/pricing/) is $5/month with 10M requests included. [R2](https://developers.cloudflare.com/r2/pricing/) is $0.015/GB-month with free egress, so storing traces and hashed forecasts is a rounding error. [GDELT](https://www.gdeltproject.org/data.html) says it is "100% free and open" and refreshes every 15 minutes; I could not read its terms of use, so confirm them before launch. [Stripe](https://stripe.com/pricing) takes 2.9% + 30 cents, which is 8.9% of a $5 charge and 3.1% of $199. Avoid small one-off payments.

**Cost that is not in the plan's number.** The daily human panel and opt-in twins. [Park et al.](https://arxiv.org/abs/2411.10109) built agents from two-hour interviews with 1,052 people; the abstract gives no cost. Paying panelists will likely exceed the LLM bill. Treat it as a separate budget line.

**Proposed prices (mine, to be tested).**
- API: $1.00 per 1,000 agent-steps, billed in credits. The 35,000-step run above is $35 against $9.28 cost: 73% margin. If async runs use the batch API, cost is $4.64: 87% margin. Before Stripe fees.
- Pro at $49/month with 50,000 steps included. Full use costs about $13.25: 73% margin. Most users will not use it all.
- Free: signed-in users only, 3 forks per day, 200 agents, 7 days, 1 member (about $0.37 each).

**Sensitivity of the nightly run (cached, standard, $14 base).** Price x0.5: $7. x0.25: $3.50. x2: $28. x5: $70. The 5x case is real: it is what happens if prompts cross 100k tokens or you move to a $0.50-input model. A price drop helps little because the cost is already low. Output tokens carry five times the weight of input tokens, so cap output length.

## What it means for Real World

- For the product: Free forks must be small and honest about it. Show "200-agent sample, 1 run". Ensemble spread is the paid feature. Do not promise "100,000 agents" on a fork; that run costs $185.
- For the engineering: Count tokens per call and log cost per call from day one, in one table. Put the shared prefix first for caching. Cap output at 150-200 tokens. Only call the LLM for agents whose exposure changed, and reuse the previous state for the rest. Cache forks by a hash of (world snapshot, event text, parameters), so identical forks cost nothing. Keep prompts under 100k tokens.
- For the business: The nightly update is about $14-55 a day, under $20,000 a year. That is cheap enough to run daily and publish. Gross margin on paid simulation is healthy only if free usage is capped. One viral post with 10,000 uncapped 3-member forks is 10,000 x $1.11 = $11,100 in a day.

## Recommendations

1. Build a cost ledger: one row per LLM call (model, input, cached, output, cost in micro-dollars, purpose). Everything else in this note is a guess until it exists. Owner: engineering.
2. Run a 1,000-call pilot this week at real prompt sizes, in at least five languages and scripts, to replace the 2,000/150 token assumption and the tokenizer inflation guess.
3. Cap free forks: signed-in, 3 per day, 200 agents, 1 member, and cache by input hash. Ensemble and larger cohorts are paid.
4. Price the API per agent-step with credits. Start at $1 per 1,000 steps and revisit after the pilot. Use the batch API for anything not interactive and keep the saving as margin.
5. Run the nightly update through the batch API (50% off) with a shared-prefix prompt. Budget $25 a night as the ceiling and alert above $60.
6. Add a model adapter so Gemini 2.5 Flash-Lite or gpt-5-nano can replace Haiku. Do this only if the pilot shows a quality-equal result; the saving is under 2x.
7. Budget the human panel and twins separately. Get a per-respondent cost before the YC application.

## Open questions

- Real tokens per call and the share that can be cached. Find out with recommendation 2.
- Whether variance collapse forces 3+ samples per agent. That triples the nightly bill; test on a 1,000-agent slice against known survey results.
- Retry and malformed-output rate. I assumed none; 10-15% would add the same percentage to cost.
- GDELT terms of use, and whether Anthropic rate limits allow 100,000 calls in a night outside batch.
- Whether Haiku 5.5 prices are stable. Sonnet 5's introductory price was made permanent per the pricing page, but nothing guarantees Haiku's.
- Human panel cost per completed response.

## Sources

- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), accessed 2026-10-11
- [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), accessed 2026-10-11
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), accessed 2026-10-11
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), accessed 2026-10-11
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [GDELT 2.0 announcement](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/), accessed 2026-10-11
- [Stripe pricing](https://stripe.com/pricing), accessed 2026-10-11
- [Park et al., Generative Agent Simulations of 1,000 People](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
