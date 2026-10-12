# Developer API launch playbooks 2024-2026: Browser Use, Exa, Firecrawl

- Date: 2026-10-11
- Area: product
- Confidence: medium. Pricing, funding and quickstart facts come from the companies' own pages opened today. Jev/TypeSafe and Cursor-adjacent tools could not be researched, and the web search budget ran out before any search ran, so the "playbook" synthesis rests on company pages only, not on outside analysis or founder interviews.

## Answer

All three companies shipped the same shape: an open or free artifact first, a one-page quickstart with typed SDKs, a free tier with no card, and then a steady stream of small named launches. None of them won on a launch day. Real World should ship a narrow `POST /v1/simulate` with a Python and TypeScript SDK, a free monthly allowance, a hosted MCP endpoint, and one public launch post per week after Oct 27. It should not build billing tiers, a team dashboard or a marketplace before the YC application.

## Findings

**Browser Use (browser agents).**
- Origin: a weekend experiment, a first prototype in four days, launched on Hacker News. The founders' own advice is to build it and launch it ([seed post](https://browser-use.com/posts/seed-round)).
- Seed round: $17M led by Felicis, with Y Combinator, Paul Graham and SV Angel, announced Mar 22 2025. At that point it had about 50,000 GitHub stars and 15,000 active developers ([seed post](https://browser-use.com/posts/seed-round), [posts index](https://browser-use.com/posts)).
- Today the repo is MIT licensed with about 118k stars ([GitHub](https://github.com/browser-use/browser-use)).
- The open library is free. The business is the cloud: browsers at $0.02/hour, residential proxy at $5/GB, agents at model cost plus 20%, and its own model "BU 2.0" at $0.60 input and $3.50 output per 1M tokens ([pricing](https://browser-use.com/pricing)).
- Free tier changed three times in view. The Apr 9 2026 post offered free remote browsers with 3 concurrent, and paid plans from $40/month ([free tier post](https://browser-use.com/posts/free-tier-announcement)). The pricing page now says no subscriptions, $1 in free credit, a $5 minimum top-up, and concurrency that grows with lifetime spend: 10 sessions at $0, 50 at $200, 250 at $1,000. The GitHub README says $15 in credit. Three different numbers on three pages.
- The stated free-tier reason: give free browsers to agents like Claude Code and OpenClaw to become "the default interaction layer between agents and the browser." Usage was said to double monthly.
- Content engine: benchmarks as marketing. Posts include an LLM benchmark (Feb 2026), a stealth benchmark of every cloud browser (Mar 2026), and a "benchmark behind the benchmark" (Aug 2026).
- Docs: Python SDK needs 3.10+, TypeScript SDK is `browser-use-sdk`, one env var `BROWSER_USE_API_KEY`, two paths (agent run, raw browser over CDP), plus an `llms.txt` index ([docs](https://docs.browser-use.com)).

**Exa (search API).**
- Timeline: announced Jan 25 2024; $17M Series A Jul 2024 (Lightspeed, Nvidia, YC); $85M Series B Sep 3 2025 led by Benchmark at $700M; $250M Series C May 20 2026 led by a16z at $2.2B ([blog](https://exa.ai/blog), [Series B](https://exa.ai/blog/announcing-series-b), [Series C](https://exa.ai/blog/announcing-series-c)).
- Day-one partners were developer tools. Cursor is a named customer in both rounds. Series C names Cognition, HubSpot, OpenRouter and Monday.com, and claims 400,000 developers and 5,000 businesses. Revenue is not disclosed.
- Free tier: $10 in credit that resets monthly (about 2,500 instant searches), no card, plus a one-time $10 onboarding bonus. Then pay as you go with no subscription: $4 per 1k instant searches, $7 per 1k for fast/auto, $12 to $15 per 1k for deep search, and per-run agent prices from $0.012 to $1.00 ([pricing](https://exa.ai/pricing)).
- Docs: five steps to a first call. Key from the dashboard, `EXA_API_KEY`, `pip install exa-py` or `npm install exa-js`, one call with `type: "auto"`. It also ships a hosted MCP server at `mcp.exa.ai/mcp`, an installable agent skill, and OpenAPI specs ([quickstart](https://exa.ai/docs/reference/getting-started)).
- Cadence: a benchmark or product post nearly every month in 2026 (WebCode evals for coding agents, ATLAS benchmark Oct 8, Exa Places Oct 5, Agent Ultra Sep 25).

**Firecrawl (web scraping API).**
- Open source under AGPL-3.0 with MIT SDKs, about 190k stars ([GitHub](https://github.com/firecrawl/firecrawl)).
- Free tier: 1,000 credits a month, no card, 2 concurrent browsers, 10 requests per minute on scrape/search. Paid: Hobby $16/month (5,000 credits), Standard $83 (100,000), Growth $333 (500,000), Scale $599 (1,000,000) billed yearly ([pricing](https://www.firecrawl.dev/pricing)).
- Distribution as launch strategy. 2026 posts show a Vercel Marketplace listing (May 26), Replit connector (Jul 23), n8n (Mar 26), official ChatGPT plugin (Oct 6), plus "Keyless", which lets you use the API with no account or key and 1,000 free credits a month (Jun 16) ([blog index](https://www.firecrawl.dev/blog)).
- Roughly 20 named launches between Mar and Oct 2026. $75M Series B led by Smash Capital on Sep 22 2026, tied to "Alexandria," a catalog of 100+ data providers ([Series B post](https://www.firecrawl.dev/blog/alexandria-series-b)).

**Not found.** Jev's domain (jev.ai) is a parked page, so I have nothing on Jev or TypeSafe. I did not research Cursor-adjacent tools. Firecrawl's 2024 launch story was not opened.

## What it means for Real World

- For the product: the common first-call shape is one request, one typed response, one env var. `POST /v1/simulate` should work from a copy-pasted snippet in under five minutes. Competitors sell tools; we sell a forecast with a receipt. The receipts page and hashed track record are our equivalent of their benchmarks.
- For the engineering: ship `real-world-py` and `real-world-js`, an OpenAPI file, an `llms.txt`, and a hosted MCP endpoint. Exa and Browser Use both treat agents as the reader of the docs. Cost matters: Browser Use charges model cost plus 20% and Exa meters per request. Our nightly update costs $15-60, and a 7-day ensemble run is far heavier than a search call, so the free allowance must be a hard cap, not a promise.
- For the business: all three raised after the open artifact had traction, not before. Stars and developer counts, not revenue, were the pitch (Browser Use: 50k stars at seed; Exa never disclosed revenue). For the YC application on Nov 2, 6 days after launch, we will have almost no usage. The fair claim is the track record starting date, plus early signups.

## Recommendations

1. Free tier: a small monthly credit, no card, hard-capped per key. Start with something like 20 single-world runs a month, and publish the number. Browser Use changed its terms three times in six months; do not promise what the cost model cannot hold.
2. Pay as you go only. No subscription tiers at launch. Exa and Browser Use both dropped or avoided them, and concurrency tiers by lifetime spend (Browser Use) are a cheap way to gate abuse.
3. Quickstart page with one `pip install` and one `npm install`, one env var `REAL_WORLD_API_KEY`, and a first call that returns typed segments. Add `llms.txt`, OpenAPI and an MCP endpoint on day one.
4. Open-source the SDKs and the receipts verifier under MIT. Consider keeping the agent population private. Firecrawl's AGPL core was open, but our moat is the daily pipeline, which is not code.
5. Plan one named launch per week for four weeks after Oct 27: receipts page, fork-and-inject, ensemble spread, first scored forecasts. Each is a short post with a demo link. Exa and Firecrawl both ran this cadence.
6. Publish a benchmark we can win: Brier score versus market price, with the method and hashes. This is our version of Browser Use's stealth benchmark.
7. Find three day-one integrators who already write about forecasting or market data and give them keys before launch. Exa's Cursor relationship is the pattern: one credible developer-tool name.

## Open questions

- What did Jev/TypeSafe actually launch? Search by founder name and YC batch, once search is available.
- Did the "Cursor-adjacent" tools (Cursor-based builders) use a different launch pattern, such as marketplace-first? Not researched.
- How did Firecrawl's 2024 open-source launch convert stars to paid users? Read their early posts and HN thread.
- Real conversion numbers from free to paid are not published by any of the three. Ask founders directly.
- What is our actual cost per simulate call? Measure before setting the free cap.

## Sources

- [Browser Use on GitHub](https://github.com/browser-use/browser-use), accessed 2026-10-11
- [Browser Use pricing](https://browser-use.com/pricing), accessed 2026-10-11
- [Browser Use posts index](https://browser-use.com/posts), accessed 2026-10-11
- [Browser Use seed round post](https://browser-use.com/posts/seed-round), accessed 2026-10-11
- [Browser Use free tier post](https://browser-use.com/posts/free-tier-announcement), accessed 2026-10-11
- [Browser Use docs quickstart](https://docs.browser-use.com), accessed 2026-10-11
- [Exa pricing](https://exa.ai/pricing), accessed 2026-10-11
- [Exa blog index](https://exa.ai/blog), accessed 2026-10-11
- [Exa Series B](https://exa.ai/blog/announcing-series-b), accessed 2026-10-11
- [Exa Series C](https://exa.ai/blog/announcing-series-c), accessed 2026-10-11
- [Exa API quickstart](https://exa.ai/docs/reference/getting-started), accessed 2026-10-11
- [Firecrawl on GitHub](https://github.com/firecrawl/firecrawl), accessed 2026-10-11
- [Firecrawl pricing](https://www.firecrawl.dev/pricing), accessed 2026-10-11
- [Firecrawl blog index](https://www.firecrawl.dev/blog), accessed 2026-10-11
- [Firecrawl Alexandria and Series B](https://www.firecrawl.dev/blog/alexandria-series-b), accessed 2026-10-11
