# Funding landscape 2026: synthetic people, simulation, AI forecasting, world models

- Date: 2026-10-11
- Area: market
- Confidence: medium. Round sizes and dates are well sourced. Valuations for Aaru, World Labs and Sooth rest on press reports, not company statements. I could not open Crunchbase or PitchBook.

## Answer

Money is flowing into "simulate people" (Simile at $2B), "forecast events" (Mantic, Sooth) and "world models" (AMI Labs, World Labs), but almost all of it pays for enterprise research or lab-scale compute. None of it pays for a public, open world simulator with a hashed track record. That gap is Real World's pitch. The YC story should be: the funded players sell private accuracy claims to corporations; we publish scored forecasts nobody can backfill.

## Findings

Synthetic people (the closest comps):

- Simile closed a Series B of more than $200M at a $2B post-money valuation on 2026-07-30. Greenoaks led. Index Ventures, Hanabi, Bain Capital Ventures, A*, Factory and CVS Health Ventures returned. Definition is new. Total raised is about $300M, including a $100M Series A (Index) less than six months earlier. Revenue is said to be up 5x since launch, with no absolute figure. The mission line is to simulate all eight billion people. About 50 staff. Performance claims are the company's own and unverified. [Dealroom](https://dealroom.co/news/142224-simile-raises-200m-series-b-at-2b-valuation-to-survey-ai-twins-of-consum/), [DRNO](https://mrweb.com/drno/news40146.htm)
- Simile's customers include CVS Health (400,000 "agentic twins" used on medication adherence), Deloitte and Wealthfront. Pricing scales with panel size. [AI Weekly](https://aiweekly.co/alerts/simile-raises-200m-led-by-greenoaks-at-2b-for-agentic-twin-simulations-of-real)
- Aaru raised a Series A led by Redpoint in Dec 2025. The "$1B headline" was multi-tier: some investors paid $1B, others less, so the blended value is under $1B. Round above $50M. ARR under $10M. Clients: Accenture, EY, Interpublic, political campaigns. Founded March 2024. All figures are from anonymous sources. [TechCrunch](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation)
- Listen Labs (AI-moderated customer interviews, not synthetic people) raised a $69M Series B at $500M in January 2026 (Ribbit, Sequoia). It then walked away from a signed $125M Series C at $1.5B (Menlo) amid reported Salesforce talks at about $2B. About $30M annualized revenue, roughly 3x Simile's. Salesforce may balk at a 67x multiple. Reported 2026-09-10. [Dealroom](https://dealroom.co/news/149923-listen-labs-walks-away-from-125m-round-amid-2b-salesforce-talks/)
- Small end of the market: Talp, undisclosed pre-seed at a $20M valuation, July 2026. [Seedtable](https://seedtable.com/companies/talp/funding-rounds/pre-seed-2026-07)

AI forecasting:

- Mantic (London, founded 2024 by Toby Shevlane and Ben Day) raised a $25M seed on 2026-09-18, led by Radical Ventures, with M12, Thinking Machines Lab and Balderton. Valuation undisclosed. Its credential: it beat every human and all but one bot in the summer 2026 Metaculus Cup. Customers unnamed. Hedge funds and traders are the target. [The Star / Reuters](https://www.thestar.com.my/tech/tech-news/2026/09/18/ai-startup-mantic-raises-25-million-for-superhuman-forecasting)
- Sooth Labs (Pittsburgh, ex-Meta and CMU) is raising about $50M, Felicis leading, at roughly $335M including the money. Backers include Yann LeCun and Jeff Dean. Bloomberg reported it as in progress on 2026-04-22. Later aggregators call it closed, with inconsistent stage labels. Targets finance, defense, insurance and real estate. [Bloomberg Government](https://news.bgov.com/california-brief/ai-pioneers-back-startup-building-models-to-predict-events)

World models (physical and spatial, not social, but they set the capital climate):

- AMI Labs (Yann LeCun, Paris): about $1.03B seed at $3.5B pre-money, 2026-03-10. Cathay Innovation, Greycroft, Hiro, HV Capital and Bezos Expeditions co-led. Nvidia, Samsung, Temasek, Toyota Ventures also in. No product at the raise. [Tech.eu](https://tech.eu/2026/03/10/yann-lecun-s-paris-based-ai-world-model-startup-raises-more-than-1bn/)
- World Labs (Fei-Fei Li): $1B on 2026-02-18 from AMD, Nvidia, Autodesk ($200M), Emerson, Fidelity, Sea. Valuation undisclosed. About $5B was reported in talks. [Reuters via Yahoo](https://finance.yahoo.com/news/ai-pioneer-fei-fei-lis-202957884.html)
- Runway ($315M at $5.3B) and a Lin Junyang lab (about $2B, Tencent) are also listed. The Lin round rests on a secondhand report. The stated thesis: LLMs commoditize, so next gains come from learned world state; investors are pricing founder pedigree, and nobody has shown revenue covering compute. [Capital & Compute](https://capitalandcompute.net/blog/world-model-funding-wave-2026/)

Prediction markets (our scoring benchmark, and a capital signal):

- Kalshi: $1B Series F at $22B (Coatue), May 2026 by one account (Fortune dates it March). In talks at about $40B. Annualized volume about $178B, revenue above $1.5B, roughly 90% from sports in 2025. A January 2026 Massachusetts ruling treated it as an unlicensed sportsbook; appeal pending. [Dealroom](https://dealroom.co/news/136134-kalshi-eyes-40b-valuation-nearly-triple-rival-polymarket-as-prediction-m/)
- Polymarket: reported $1B at $15B in April (ICE put in $600M), talks above $20B since. These figures come from a search summary that cited Reuters (Aug 4); I did not open the Reuters page. The Dealroom page above only confirms Polymarket was seeking about $15B.

What does not hold up: every synthetic-people number is self-reported (Simile's "85% to 99% accuracy", Aaru's election work). Aaru's headline valuation is a marketing figure. Simile's implied multiple is huge: if its revenue is about a third of Listen Labs' $30M, that is roughly $10M, so about 200x. These are priced on narrative.

## What it means for Real World

- For the product: the funded competitors sell private panels to enterprises. A public receipts page, with forecasts hashed before outcomes and scored by Brier against market price, is what none of them can offer. Keep it the headline surface, not the globe.
- For the engineering: Mantic's pitch is "graded against history and a live tournament." Copy the discipline. Enter Metaculus or similar cups and log results from day one. Do not claim accuracy numbers we cannot reproduce from our own hashed log.
- For the business: valuations in this niche are set by revenue growth and a lead investor's conviction, not by accuracy evidence. We have no revenue in 22 days. The YC application should lean on the track record and the open-fork demo, and name the comps honestly. Simile's $2B is a market-existence proof, not a number to anchor ours to.

## Recommendations

1. In the YC application, cite Simile ($2B, Jul 2026), Aaru, Mantic and Listen Labs as proof the category is funded. State plainly that all are closed and enterprise-priced, and that we are the public, scored alternative.
2. Do not use "world model" language for funding. AMI and World Labs raised on physical-AI pedigree. A social simulator will be compared to Simile and Aaru, not to them.
3. Treat Mantic as the nearest threat on "forecasting" and the benchmark for credibility. Plan a public, timestamped entry in a forecasting tournament before Oct 27.
4. Never quote Aaru's $1B or Sooth's $335M without "reported". Tag each figure in any deck with its source quality.
5. Price the first paid tier by simulation size (panel or ensemble size), since Simile does and CEO Park said larger panels cost more. Cheap to copy, familiar to buyers.
6. Pitch investors who funded this thesis once already: Index, Greenoaks, Redpoint, Radical, Felicis, A*, General Catalyst. A* backed both Simile and Aaru, which shows it takes the category seriously.

## Open questions

- Simile's and Aaru's actual revenue. Only relative (5x) and ceiling (<$10M ARR) figures exist. Try founder interviews, investor memos, or ask on Twitter.
- Whether Salesforce buys Listen Labs. A $2B exit would validate the category for buyers; a collapse would cool it. Watch Business Insider and Dealroom.
- Did World Labs, Sooth and Polymarket actually close at the reported valuations? Check company posts and SEC Form D filings.
- Any AI forecasting or simulation seed round under $5M that shows what a pre-revenue company like ours can raise. Crunchbase access is needed.
- A sidebar on the Yahoo page mentioned an "AMD acquiring World Labs for $8.2 billion" headline. I could not verify it. Check before citing World Labs as independent.

## Sources

- [Simile Series B, Dealroom](https://dealroom.co/news/142224-simile-raises-200m-series-b-at-2b-valuation-to-survey-ai-twins-of-consum/), accessed 2026-10-11
- [Simile funding, Daily Research News](https://mrweb.com/drno/news40146.htm), accessed 2026-10-11
- [Simile summary, AI Weekly](https://aiweekly.co/alerts/simile-raises-200m-led-by-greenoaks-at-2b-for-agentic-twin-simulations-of-real), accessed 2026-10-11 (search result only, not opened)
- [Aaru Series A, TechCrunch](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation), accessed 2026-10-11
- [Listen Labs walks from Series C, Dealroom](https://dealroom.co/news/149923-listen-labs-walks-away-from-125m-round-amid-2b-salesforce-talks/), accessed 2026-10-11
- [Talp pre-seed, Seedtable](https://seedtable.com/companies/talp/funding-rounds/pre-seed-2026-07), accessed 2026-10-11 (search result only)
- [Mantic seed, The Star (Reuters)](https://www.thestar.com.my/tech/tech-news/2026/09/18/ai-startup-mantic-raises-25-million-for-superhuman-forecasting), accessed 2026-10-11
- [Sooth Labs, Bloomberg Government](https://news.bgov.com/california-brief/ai-pioneers-back-startup-building-models-to-predict-events), accessed 2026-10-11 (paywalled, partial)
- [AMI Labs seed, Tech.eu](https://tech.eu/2026/03/10/yann-lecun-s-paris-based-ai-world-model-startup-raises-more-than-1bn/), accessed 2026-10-11
- [World Labs $1B, Reuters via Yahoo Finance](https://finance.yahoo.com/news/ai-pioneer-fei-fei-lis-202957884.html), accessed 2026-10-11
- [World-model funding wave, Capital & Compute](https://capitalandcompute.net/blog/world-model-funding-wave-2026/), accessed 2026-10-11
- [Kalshi and Polymarket valuations, Dealroom](https://dealroom.co/news/136134-kalshi-eyes-40b-valuation-nearly-triple-rival-polymarket-as-prediction-m/), accessed 2026-10-11
