# Partnership options: pollsters, prediction markets, universities, data providers

- Date: 2026-10-11
- Area: business
- Confidence: medium. Primary pages were opened for IPUMS, GDELT, Kalshi, Polymarket, WVS, Pew, Gallup, YouGov, Simile and Aaru. The web search budget ran out mid-task, so Ipsos, Metaculus, Kalshi's developer agreement and Polymarket's terms were not read. Pricing is mostly "contact sales" and is unknown.

## Answer

In 22 days, the only partnerships that matter are the ones that need no signature: GDELT, Polymarket and Kalshi public market data, WVS and open survey files. Pollster deals (YouGov, Ipsos, Gallup) are real but slow, and they want revenue or a credible buyer, which Real World does not have yet. The biggest finding is a legal one: IPUMS International forbids commercial use and redistribution, so the census-microdata plan needs a licence or a different source before launch.

## Findings

**Data you can use today**
- GDELT is free for "unlimited and unrestricted use", commercial included. It allows redistribution and mirroring with a citation and a link to gdeltproject.org. GDELT 2.0 updates every 15 minutes and covers 65 live-translated languages. It is hosted on BigQuery and has DOC, GEO and TV JSON APIs. The page states no rate limits. [GDELT about](https://www.gdeltproject.org/about.html), [GDELT data](https://www.gdeltproject.org/data.html)
- WVS and the joint EVS/WVS 2017-2022 dataset (v5.0.0) are free with "no registration or payments required". The page asks for a citation and does not address commercial use. The commercial-use position is unverified, so ask the WVSA archive in writing. [WVS-EVS joint](https://www.worldvaluessurvey.org/WVSEVSjoint2017.jsp)
- Polymarket's Gamma API works without credentials in its docs example. Limits are per IP: 4,000 requests per 10 seconds on Gamma, 9,000 per 10 seconds on CLOB, and CLOB `/prices-history` allows 1,000 per 10 seconds. Reads are cheap. Trading is blocked in the US on polymarket.com. I did not read its data-use terms. [Polymarket docs](https://docs.polymarket.com/), [rate limits](https://docs.polymarket.com/api-reference/rate-limits)
- Kalshi's API is REST, WebSocket and FIX. The Basic tier gets 200 read tokens per second after account signup, and a default request costs 10 tokens, so about 20 reads per second. Higher tiers are earned by trading volume. Using the API means accepting the Developer Agreement, which I could not load (HTTP 429). Check its redistribution terms before showing Kalshi prices on a public receipts page. [Kalshi docs](https://docs.kalshi.com/welcome), [rate limits](https://docs.kalshi.com/getting_started/rate_limits)
- Gallup lists nine free public datasets, such as Global Findex, World Risk Poll and Wellcome Global Monitor. They carry no licence statement on the Gallup page, so each provider's terms apply. The core World Poll respondent files are sold separately and cannot be had without a contact-sales conversation. [Gallup public datasets](https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx)
- Pew datasets are royalty-free but limited to excerpts, not "substantially in full". The terms are silent on AI use, and American Trends Panel data has separate terms. [Pew terms](https://www.pewresearch.org/about/terms-and-conditions/)

**Data that blocks us**
- IPUMS International: "Commercial use is strictly prohibited." Redistribution to third parties is prohibited, each team member applies individually, and use is limited to research and education. Real World is a company running a public API, so it does not qualify as written. Agent personas derived from the microdata and served to customers are a grey area at best. [IPUMS terms](https://international.ipums.org/international/terms.shtml)

**Pollsters are competitors as well as suppliers**
- YouGov sells a Profiles API and a BrandIndex API, both with MCP servers, for use in AI systems. It also sells Parallax, AI "twins" validated by live panelists in about 30 minutes. So it already ships a product shaped like ours and lists Anthropic as a client logo. It publishes a "Public data licence" whose terms I did not read. [YouGov](https://yougov.com/)
- Simile raised a Series B of $200M at a $2B valuation. Gallup is a named partner, and Gallup is the only pollster the page names. The Gallup quote on the page is about methodological rigor. Gallup is thus tied to one of our competitors. [Simile](https://www.simile.com/)
- Aaru markets population simulation. Its public case studies are with EY and Breakwater, the latter at 40,000 simulated investors. It names no university or pollster data partner. [Aaru](https://www.aaru.com/)

**Universities**
- Nothing I opened shows a standard university data-sharing programme for companies. The two real academic links in the plan are Park et al. (interview-grounded agents) and IPUMS (non-commercial). Both require an individual relationship and a clear research framing. Ipsos KnowledgePanel and Metaculus pages returned 404 and 403, so nothing is claimed about them.

## What it means for Real World

- For the product: Build the first version on GDELT, WVS, Polymarket and Kalshi prices, and the free Gallup-hosted datasets. Do not name any pollster as a partner on the site until a signed letter exists.
- For the engineering: Keep one adapter per source with a licence field in its config, so a source can be dropped without code changes. Cache market prices daily and store only what the receipts page needs. Stay under 20 reads per second on Kalshi Basic.
- For the business: Pollsters want money, a named customer or co-branded research, and they fear being a mere input to a competitor. Prediction markets want volume and attention. A public track record scored against their prices is free marketing for them, which is our one real offer. Universities want citations and co-authorship.

## Recommendations

1. Ask IPUMS now, by email to ipums@umn.edu, whether a commercial or research-partnership licence exists. In parallel, plan the persona base on WVS plus open national files (for example public census tables) so launch does not depend on the answer.
2. Email the WVSA archive to confirm that commercial use of the joint EVS/WVS file is allowed. Keep the reply in the repo.
3. Read the Kalshi Developer Agreement and the Polymarket Terms of Use in a browser, and record the redistribution rules in `research/business/`. Do this before any public page shows market prices.
4. Pitch Polymarket and Kalshi on one line: a public, hash-committed Brier score against their closing prices. Ask for a higher rate tier or a historical data export, not money.
5. Use GDELT as the news layer and cite it as required. This is the lowest-risk partnership available.
6. Send a short research-collaboration note to Park et al. about opt-in twins. Offer a replication result, not a revenue share.
7. Do not approach YouGov, Ipsos or Gallup before Oct 27. Approach them after the first weeks of scored forecasts exist, with a pilot proposal. Treat YouGov as a competitor on twins.

## Open questions

- What the Kalshi Developer Agreement and Polymarket Terms of Use say about redistributing prices. Find out by reading both pages in a browser.
- Whether Ipsos, Metaculus or Gallup would license respondent data to a pre-revenue startup, and at what price. Find out by sending contact-form requests this week.
- Whether the YouGov "Public data licence" allows commercial reuse.
- Whether IPUMS-derived synthetic personas count as redistribution. Find out by asking IPUMS directly.

## Sources

- [GDELT about and terms](https://www.gdeltproject.org/about.html), accessed 2026-10-11
- [GDELT data and APIs](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [IPUMS International terms of use](https://international.ipums.org/international/terms.shtml), accessed 2026-10-11
- [Joint EVS/WVS 2017-2022 dataset](https://www.worldvaluessurvey.org/WVSEVSjoint2017.jsp), accessed 2026-10-11
- [Kalshi API docs](https://docs.kalshi.com/welcome), accessed 2026-10-11
- [Kalshi rate limits](https://docs.kalshi.com/getting_started/rate_limits), accessed 2026-10-11
- [Polymarket docs](https://docs.polymarket.com/), accessed 2026-10-11
- [Polymarket rate limits](https://docs.polymarket.com/api-reference/rate-limits), accessed 2026-10-11
- [Pew Research Center terms](https://www.pewresearch.org/about/terms-and-conditions/), accessed 2026-10-11
- [Gallup public datasets](https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx), accessed 2026-10-11
- [Gallup global research](https://www.gallup.com/analytics/318875/global-research.aspx), accessed 2026-10-11
- [YouGov](https://yougov.com/), accessed 2026-10-11
- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Aaru](https://www.aaru.com/), accessed 2026-10-11
