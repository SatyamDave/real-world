# Who buys population simulation, and what they pay

- Date: 2026-10-11
- Area: market
- Confidence: medium. Buyer names and funding are well sourced. Prices and contract sizes are not public anywhere I could find, so every budget number below is inferred.

## Answer

Paying buyers exist today, but they are enterprises buying a faster, cheaper survey: consumer brands, financial services, healthcare, consultancies, ad agencies and publishers. They pay for test-a-message and test-a-product answers inside a market-research budget. Nobody has shown that anyone pays for a whole-world forecast with a public track record. Real World should pick one paid wedge from the market-research list, ship the forecast and receipts as the credibility engine, and not pitch "simulate the world" to buyers.

## Findings

**The money is in market research, and it is big.** ESOMAR counts the global insights industry at over $150B in 2024. Market research is $56B, research software $62B, reporting $35B. Software grew 11.5%, market research 4.8%. Synthetic respondents are a small slice of that, but they sell against an existing line item. [ResearchWorld on ESOMAR 2025](https://researchworld.com/articles/inside-the-153bn-insights-industry)

**Researchers say they will adopt.** Qualtrics surveyed 3,000+ market researchers in 14 countries. 71% agree most market research will use synthetic responses within three years. 87% of users were highly satisfied. This is a vendor survey and gives no budget figures. [Qualtrics](https://www.qualtrics.com/articles/news/ai-to-drive-massive-changes-to-market-research-in-2025-qualtrics-report-says/)

**Aaru is the closest comparable, and it is small.** Series A led by Redpoint in Dec 2025, reportedly over $50M, headline valuation $1B but blended lower. ARR was "still below $10 million" per one anonymous source. Named customers: Accenture, EY, Interpublic Group, political campaigns. Revenue is under $10M after about two years, so demand is real but early. [TechCrunch](https://techcrunch.com/?p=3073521)

**Aaru's distribution is through a consultancy.** EY US announced an alliance on 30 Sep 2026. First use is financial services: testing marketing messages, product and pricing offers, sales strategy and M&A impact. Claimed validation: it reproduced EY's 2025 Global Wealth Management study (3,600 investors, 30+ markets) that took six months of fieldwork, in one day. No pricing, no independent check. [EY press release](https://www.ey.com/en_gl/newsroom/2026/09/ey-announces-alliance-with-aaru-to-help-organizations-drive-growth-with-greater-confidence-through-behavioral-simulation)

**Simile has the most funding and the broadest buyer list.** $100M Series A (Feb 2026), then $200M+ Series B at $2B post-money (July 2026), led by Greenoaks. Named customers: CVS Health, Gallup, Wealthfront, Deloitte, Banco Itau, Suntory. Uses: product testing, market entry, customer experience, earnings-call prep, hard-to-survey patients. Revenue "fivefold" since launch, base undisclosed. No pricing. Itau and Suntory are the only non-US consumer names in this whole set. [Unite.AI](https://www.unite.ai/simile-raises-more-than-200-million-at-a-2-billion-valuation-to-scale-human-behavior-simulations/)

**Smaller vendors sell to marketing and comms teams.** Electric Twin raised $14M (Atomico); customers News UK and Lebara; model built from the client's own research archive. News UK launched Times ExplorAItion in April 2026 so advertisers can test campaigns on a model of its audience. [IT Brief](https://itbrief.co.uk/story/electric-twin-raises-usd-14m-to-scale-ai-audiences), [Advanced Television](https://www.advanced-television.com/?p=283701). Artificial Societies sells to strategic comms, investor relations, policy comms and consumer-goods teams; one earnings-call engagement took 48 hours. Evidenza is managed-service only, about 72 hours per study. [Societies comparison page](https://societies.ai/compare/electric-twin) (a competitor's page, so treat it as marketing).

**Pricing is the gap.** The only pricing hints: Electric Twin charges a licence fee for unlimited queries priced by audience size and seats. Artificial Societies quotes per engagement. Evidenza is project-based. I found no price list, no contract value and no budget survey for any of them. One unverified item claims $0.08 per simulation for Aaru; I would ignore it.

**Buyers also complain about quality.** Strat7's 2026 study (3,000 real respondents vs two synthetic vendors, reported July 2026): headlines within 2 to 3 points, but synthetic willingness-to-pay about 16% too high, price-order logic broken 68% of the time, tracking accuracy 47% ("no better than chance"). Strat7 calls it the wrong tool for tracking change. [Research Live](https://www.research-live.com/article/news/synthetic-data-survey-responses-significantly-different-to-humans-finds-study/id/5151157)

**Finance buys prediction-market data, not simulations.** Polymarket is hiring a data-licensing lead for tiers (real-time probabilities, order book, trade prints, archives) aimed at hedge funds, banks, prop shops and media, distributed through ICE. That shows funds pay for probability feeds. I found no evidence of any fund paying for LLM-agent simulation. [Polymarket job post](https://jobs.generalcatalyst.com/companies/polymarket/jobs/89762402-product-lead-data-licensing)

**Policy units pay little and slowly.** The one relevant public contract I found: UK Department for Transport, synthetic population forecasting model, Ove Arup, max GBP 200,000 over two years, no LLMs. A US Air Force synthetic-data purchase order was up to about $1.2M. Both are classical simulation, not LLM agents. [UK Contracts Finder](https://www.contractsfinder.service.gov.uk/Notice/114882d2-60ca-4e83-bccb-d2ac96458a23), [HigherGov](https://highergov.com/contract/FA864924P0990)

**Games and media:** no willingness-to-pay evidence found for population simulation. Publishers (News UK) buy it as an ad-sales product, not as editorial forecasting.

## What it means for Real World

- For the product: the wedge is "test this message, price or event against a population" with segments and ensemble spread. That is `POST /v1/simulate`. The daily forecast, hashes and Brier scores are proof, not the thing sold.
- For the engineering: buyers want answers in hours and per-segment output, so the API must return segments, spread and trace by default. Subgroups and tracking over time are where synthetic data is weakest per Strat7, so the ensemble and score-versus-market machinery has to expose that honestly.
- For the business: the competitors are funded at $50M to $300M and sell through Accenture and EY. We cannot beat them on enterprise sales in 22 days. What we have that none of them show publicly is non-US coverage and a hashed record that cannot be backfilled.

## Recommendations

1. Pick one primary buyer for launch: consumer brand and agency insights teams (largest budget, existing line item, named by every competitor). Write the landing page and the API example for that buyer.
2. Make the second buyer a finance/media "probabilities" user for the public daily forecast, since prediction-market data already has paying institutions. Offer the feed free at launch to build the record.
3. Do not target policy units or games for revenue before the YC application. Use them as credibility: cite open policy questions in public forks.
4. Ship one non-US reference simulation (for example a phone-price shock in Brazil, India and Japan) next to a US one. Itau and Suntory show non-US enterprise demand exists; none of the vendors shows it publicly.
5. Publish accuracy honestly, including subgroup error and tracking error. Strat7's findings are the objection every buyer will raise.
6. Run 10 customer calls this week with insights leads at brands and agencies, ask for the current cost per study and the survey they would replace. Put those numbers in the YC application, since no public price data exists.
7. Price as a seat-or-audience licence plus pay-per-simulation, mirroring Electric Twin's published structure. Treat all price points as hypotheses until calls confirm.

## Open questions

- What does a synthetic study actually cost? Find out by interviewing buyers and asking for a quote from two vendors as a mystery shopper.
- Does any buyer pay for forecasts rather than message tests? Ask in the calls; ask the finance contacts specifically.
- Do campaigns buy? Aaru lists political campaigns, but I found no price or contract. Ask campaign data vendors.
- Is demand outside the US and UK real beyond Itau and Suntory? Check Simile and Aaru case studies when they appear.
- Aaru's round size is reported inconsistently ($50M vs $80M); I did not resolve it.

## Sources

- [TechCrunch on Aaru](https://techcrunch.com/?p=3073521), accessed 2026-10-11
- [EY announces alliance with Aaru](https://www.ey.com/en_gl/newsroom/2026/09/ey-announces-alliance-with-aaru-to-help-organizations-drive-growth-with-greater-confidence-through-behavioral-simulation), accessed 2026-10-11
- [Unite.AI on Simile Series B](https://www.unite.ai/simile-raises-more-than-200-million-at-a-2-billion-valuation-to-scale-human-behavior-simulations/), accessed 2026-10-11
- [IT Brief on Electric Twin](https://itbrief.co.uk/story/electric-twin-raises-usd-14m-to-scale-ai-audiences), accessed 2026-10-11
- [Advanced Television on Times ExplorAItion](https://www.advanced-television.com/?p=283701), accessed 2026-10-11
- [Artificial Societies vs Electric Twin](https://societies.ai/compare/electric-twin), accessed 2026-10-11
- [Qualtrics 2025 Market Research Trends](https://www.qualtrics.com/articles/news/ai-to-drive-massive-changes-to-market-research-in-2025-qualtrics-report-says/), accessed 2026-10-11
- [Research Live on Strat7 study](https://www.research-live.com/article/news/synthetic-data-survey-responses-significantly-different-to-humans-finds-study/id/5151157), accessed 2026-10-11
- [ResearchWorld on ESOMAR Global Market Research 2025](https://researchworld.com/articles/inside-the-153bn-insights-industry), accessed 2026-10-11
- [Polymarket data licensing job post](https://jobs.generalcatalyst.com/companies/polymarket/jobs/89762402-product-lead-data-licensing), accessed 2026-10-11
- [UK DfT synthetic population forecasting notice](https://www.contractsfinder.service.gov.uk/Notice/114882d2-60ca-4e83-bccb-d2ac96458a23), accessed 2026-10-11 (via search result only, page not opened)
- [HigherGov USAF Midgard AI award](https://highergov.com/contract/FA864924P0990), accessed 2026-10-11 (via search result only, page not opened)
