# API pricing benchmarks for a simulation API

- Date: 2026-10-11
- Area: market
- Confidence: medium. Exa, Firecrawl, Browser Use, Perplexity and OpenAI numbers come from their own pages. Jev's price comes from a third-party blog that cites TypeSafe's homepage, and I could not open TypeSafe's own page. Adoption causes are my reading, not stated by the vendors.

## Answer

Every comparable developer API prices by a unit of work the buyer can count (a search, a page, a step, a token), gives a free monthly allowance with no card, and charges pay-as-you-go with no minimum. None sells "an answer" at a flat price. Real World should sell a simulation by a countable unit (agent-days, with an ensemble multiplier), give every account a small free monthly allowance, and cap each call's cost before it runs.

## Findings

**Exa (search for agents).** Pay-as-you-go, no subscription and no minimum. Search is $4 per 1,000 requests (instant) or $7 (fast/auto). Deep search is $12-15 per 1,000. Contents are $1 per 1,000 pages. The base price includes 10 results, and each extra result costs $1 per 1,000. New agent endpoints are priced per request ($0.012 minimal up to $1.00 xhigh) or metered with a capped budget ($5 default for auto, $20 for ultra). The free tier is $10 of credit that resets monthly, about 2,500 instant searches, with no card. Enterprise gets custom rate limits, zero data retention and invoicing. The changelog shows prices were "simplified and lowered" on 2026-03-03 and `deep` got 20% cheaper on 2026-03-04. Source: [Exa pricing](https://exa.ai/docs/reference/pricing), [Exa changelog](https://exa.ai/docs/changelog/pricing-update).

**Firecrawl (web data).** Credit-based subscriptions. Free is 1,000 credits a month with 2 concurrent requests. Hobby is $16/month billed yearly ($19 monthly) for 5,000 credits. Standard is $83 for 100,000, Growth $333 for 500,000, Scale $599 for 1,000,000 (100 concurrent). A scrape or crawl page costs 1 credit, search costs 2 credits per 10 results, and extra output formats add 4 credits per page. A scrape that returns nothing is free, but a 403 or 404 page still costs 1 credit. Auto-recharge adds $5 blocks, with a spend cap you set. Unused credits do not roll over except on Scale (one month). The tiers show the pull: per-credit price drops about 4x from Hobby ($3.8 per 1,000) to Scale ($0.6 per 1,000), and concurrency is the real upgrade lever. Source: [Firecrawl pricing](https://www.firecrawl.dev/pricing).

**Browser Use (browser agents).** No subscriptions. Credits never expire, minimum top-up is $5, and the free credit is $1 once per person with no card. The agent costs the model's token price plus a 20% fee. Browser sessions cost $0.02 per hour and residential proxy $5 per GB. Concurrency is tied to lifetime spend: 10 sessions at $0, 50 at $200, 250 at $1,000, 1,000 at $25,000. The published benchmark lists cost per task from about $0.06 to $7.37 depending on the model, which shows how far a "task" price varies with the model underneath. An earlier docs version charged per step ($0.006 to $0.10 plus $0.01 per task) via a search snippet, and the live page no longer lists per-step prices, so this vendor has changed its unit at least once. Source: [Browser Use pricing](https://browser-use.com/pricing).

**Perplexity (search-grounded answers).** Sonar bills tokens plus a per-request fee: $5, $8 or $12 per 1,000 requests for low, medium or high search context on `sonar`, with tokens at $1 per million. `sonar-deep-research` has no request fee but five meters (input, output, citation, reasoning, and $5 per 1,000 searches). The newer Search API is $5 per 1,000 requests ($1 fast). The Agent API prices tools per call (web search $0.0025, fetch $0.0005) and passes model tokens through at list price. It also lists a Decisions API at $0.02 per million input tokens with free output. The request fee dominates short queries. Five meters on one product is the pattern to avoid. Third-party sources say Sonar chat completions are supported only until 2026-09-27 and new builds are pushed to the Agent API. I did not confirm that on Perplexity's page, which was truncated. Source: [Perplexity pricing](https://docs.perplexity.ai/guides/pricing.md).

**Jev / TypeSafe (typed decision model, the closest analogue).** $0.042 per million input tokens, output free, because it returns typed answers (yes/no probability, one option from a list, a scale position) rather than prose. One short call of about 300 tokens costs roughly $0.0000126. Rate limit is 80 requests per second. No free tier on the direct API, new signups paused for demand, and it is resold through Vercel AI Gateway, which gives each team $5 a month of credit. Price-per-token with free output only works because the model is tiny and does one forward pass. A simulation that runs 100,000 LLM calls cannot copy it. Source: [Flavio Copes on Jev pricing](https://flaviocopes.com/jev-pricing/) (third-party; check TypeSafe's own docs).

**OpenAI (the token baseline).** Per million tokens: gpt-6-sol $2 input, $10 output. gpt-6-luna $0.10 and $0.50. Batch is about half price. Cached input is 10% of standard. "Fast" is about double. Web search is $10 per 1,000 calls plus tokens. Source: [OpenAI pricing](https://developers.openai.com/api/docs/pricing). The same Perplexity table lists Claude Haiku 5.5 at $0.10 input and $0.50 output per million below 100k tokens.

**What drove adoption (inference from the above).**
1. A free monthly allowance with no card (Exa $10, Firecrawl 1,000 credits, Browser Use $1 once).
2. Prices a developer can compute before the call: a page is 1 credit, a search is $0.007.
3. No minimum spend, so a prototype costs cents.
4. Self-serve upgrade by usage (concurrency and rate limits), with a sales path only for zero data retention, custom limits and invoices.
5. Price cuts announced openly (Exa twice in March 2026).

## What it means for Real World

- For the product: the billable unit is the agent-day, not the "simulation". A `POST /v1/simulate` response should return the cost in agent-days, and the request should take a `max_cost` field that fails the call before it starts if the estimate exceeds it. Ensemble size is a visible multiplier, so a PM can explain the bill.
- For the engineering: a full-population run is expensive. At Haiku 5.5 list prices ($0.10 in, $0.50 out per million), 100,000 agents x 7 days x 5 ensemble members is 3.5M agent-steps. At an assumed 500 input and 100 output tokens per step, that is about $350 per run. That is my arithmetic, not a vendor number. Forks must therefore run on a sampled subset (for example 2,000 agents, about $7) and say so in the response. Batch pricing (about half) and cached prompts (about 90% off input) are the two levers, so persona prefixes should be cached.
- For the business: the nightly assimilation costs $15-60 and is the moat, so it is overhead, not a billable product. The track record page is free and public, which acts like the free tier does for the others. Paid usage covers forks and API calls. Do not copy Jev's token pricing, because the cost per call is orders of magnitude higher.

## Recommendations

1. Define one meter: agent-days (agents x simulated days x ensemble members). Publish a price per 1,000 agent-days and a worked example on the pricing page, as Browser Use does.
2. Free tier: a monthly credit allowance, no card, resetting on the 1st, sized to a few small forks (target under $1 of our cost per free account per month). Exa's $10 monthly reset is the model.
3. Pay-as-you-go with a $5 minimum top-up and credits that do not expire. Skip subscriptions until usage data exists. Firecrawl's plan ladder needs volume we do not have yet.
4. Add `max_cost` and an estimate endpoint before launch. Make the response report the actual agents sampled.
5. Tie concurrency and ensemble size caps to lifetime spend, as Browser Use does, which also limits abuse and our own variance in cost.
6. Keep the tier of pricing to one bill line per call. Perplexity's five meters on deep research is the counterexample.
7. Plan an enterprise path only for what vendors gate: custom rate limits, zero data retention, invoicing.

## Open questions

- Real cost per agent-step on Haiku 5.5 with our persona prompts. Find out by running 1,000 agents for one simulated day and reading the token usage.
- What buyers will pay for a forecast versus a simulation run. Find out by asking 10 YC-style prospects before the Nov 2 application.
- Whether TypeSafe's own pricing page matches the blog figure, and whether Jev signups reopen. Check docs.typesafe.ai.
- Perplexity's Sonar deprecation date, and whether Browser Use still offers a per-step price. Both need a direct read of the vendor docs.

## Sources

- [Exa pricing](https://exa.ai/docs/reference/pricing), accessed 2026-10-11
- [Exa pricing changelog](https://exa.ai/docs/changelog/pricing-update), accessed 2026-10-11
- [Firecrawl pricing](https://www.firecrawl.dev/pricing), accessed 2026-10-11
- [Browser Use pricing](https://browser-use.com/pricing), accessed 2026-10-11
- [Perplexity pricing (markdown docs)](https://docs.perplexity.ai/guides/pricing.md), accessed 2026-10-11
- [Jev pricing, Flavio Copes](https://flaviocopes.com/jev-pricing/), accessed 2026-10-11
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), accessed 2026-10-11
