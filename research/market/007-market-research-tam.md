# Market research industry size and the budget lines synthetic research can take

- Date: 2026-10-11
- Area: market
- Confidence: medium. Industry size and the public-company numbers come from primary pages. Qualtrics, Kantar and Gallup revenue could not be verified, and the synthetic-share-of-budget figure does not exist in public data.

## Answer

The "insights industry" is about $153bn (ESOMAR, 2024), but only about $56bn of that is classic market research, and the slice synthetic research can realistically take today is the pre-testing and concept-screening part of fieldwork, not the whole pie. The incumbents are barely growing (Ipsos 0.6% organic in 2025, YouGov 1%), so they are buying or building synthetic features, and funded startups (Simile at $2bn) are pricing in a large shift. Real World should not pitch "the market research TAM". It should pitch forecasting-as-a-service for decision makers, and use market research as the first paying beachhead.

## Findings

**Industry size (ESOMAR, Global Market Research 2025, via Research World, 4 Nov 2025).**
- Total insights industry: US$153bn in 2024, over $150bn, projected past $160bn by end of 2025. Split: market research $56bn, research software $62bn, reporting $35bn.
- 2024 growth: market research +4.8%, research software +11.5%, reporting +8%. Software drives most growth. Market research's share of turnover fell about 3 points versus 2023.
- Inside the $56bn: about 62% full-service and fieldwork, about 31% subscription and software, about 7% consultancy. That puts full-service at roughly $35bn (my arithmetic, not an ESOMAR figure).
- ESOMAR methodology changed between editions (2023 edition: about $130bn for 2022, with data analytics as the largest sector). Do not chain these numbers into a growth rate. The full report is paid and I did not read it. The August 2025 ESOMAR forecast report ("2027 Outlook") press release gives no figures.
- [Research World](https://researchworld.com/articles/inside-the-153bn-insights-industry), [ESOMAR forecast release](https://www.einpresswire.com/article/837402321/new-esomar-report-offers-strategic-forecast-for-the-global-insights-industry)

**Incumbents are flat.**
- Ipsos 2025: revenue EUR 2,525m, +3.4% reported, +0.6% organic. Operating margin 12.3%. Citizens (public affairs) research fell 8% organic; US public affairs about -15%. Ipsos.Digital grew 27%. Guidance: 2-3% organic in 2026, 3-4% average over 2026-2028. [Ipsos release](https://www.ipsos.com/en-nl/2025-results-line-guidance-launch-horizons-strategic-plan), [Daily Research News](https://www.mrweb.com/drno/news39470.htm)
- YouGov FY25 (to 31 Jul 2025): revenue GBP 388.9m, +16% reported, +1% underlying (acquisition of CPS/Shopper). Research division GBP 176.9m, Data Products GBP 83.9m, Shopper GBP 128.1m. It is building an AI-persona add-on on technology from Yabble (bought Aug 2024), planned for H1 FY26. [YouGov results](https://shareprices.com/rns/results-for-the-year-ended-31-july-2025-74n0ilapwfcbfin/)
- Kantar: Media sold to H.I.G. for about $1bn (closed 1 Aug 2025); Bain Capital (60%) and WPP (40%) reportedly explored selling Worldpanel at $6.5bn or more. I found no full-year 2025 revenue. [Kantar H1 2025 deck](https://www.kantar.com/investor-relations/financial-announcement/-/media/095A12CF030B4EABBD81FB13664B3995.ashx), [Daily Research News](https://www.mrweb.com/drno/news37991.htm)
- Qualtrics (private since 2023) agreed to buy Press Ganey Forsta for $6.75bn in Oct 2025; combined revenue "nearly $3bn". Qualtrics' own revenue is not stated anywhere I could open. [CX Today](https://www.cxtoday.com/service-management-connectivity/qualtrics-to-snap-up-press-ganey-forsta-in-6-75bn-deal-consolidate-the-voc-market/)
- Gallup is private and publishes no financials. Aggregator figures ($189m) are unreliable. Its World Poll covers 140+ countries since 2005, which matters as a calibration source, not as a competitor revenue number. [Gallup World Poll](https://www.gallup.com/analytics/318875/world-poll.aspx)

**Synthetic research is already a product line, and buyers say they use it.**
- Qualtrics Edge Audiences launched 19 Mar 2025: AI synthetic respondents built from public data, Qualtrics experience data and predictive analytics. Vendor claims up to 70% lower survey cost. No accuracy numbers published. Credit-based pricing, sold through account executives, no public price list. [Qualtrics launch](https://www.qualtrics.com/news/qualtrics-introduces-new-market-intelligence-capabilities-for-the-next-generation-of-market-insights/), [support docs](https://www.qualtrics.com/support/survey-platform/distributions-module/synthetic-panels/)
- Qualtrics 2025 Market Research Trends (3,198 researchers, Oct 2024): 69% used synthetic responses in the last year; 71% agreed most research will be synthetic within three years. This is a vendor survey of its own users. Read it as sentiment, not spend. [Research Live](https://www.research-live.com/article/news/researchers-predict-synthetic-responses-will-dominate-in-coming-years/id/5131923)
- Simile: $100m Series A (Feb 2026, Index), $200m Series B at $2bn post-money (30 Jul 2026, Greenoaks). No disclosed revenue. [Runtimewire](https://runtimewire.com/article/simile-raises-200m-series-b-2b-valuation). Aaru reportedly raised a Series A at a $1bn "headline" valuation, from one secondhand report I could not trace to TechCrunch. [CoAI repost](https://getcoai.com/newsfeed/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation)

**What does not work.**
- Variance collapse is the most repeated failure. Bisbee et al. (Political Analysis, 2024, [doi:10.1017/pan.2024.5](https://doi.org/10.1017/pan.2024.5)) report that LLM samples match averages but show less variation, and regression coefficients can differ sharply or flip sign. I confirmed the authorship and section titles in the PDF; the finding summary comes from a search digest, so check the abstract before quoting it.
- A 2025 market-research study found both synthetic methods underestimate human variability and suggests use for early concept tests, not precise decisions (digest of arXiv results; I did not open the paper).

## What it means for Real World

- For the product: the buyer budget line is "concept and message pre-testing, hard-to-reach audiences, and scenario what-ifs", not tracking studies or political polling. Ensemble spread and receipts are the answer to the variance complaint, so ship them first.
- For the engineering: the product has to publish uncertainty that is wider, not narrower, than a single LLM would give. Score variance calibration, not only Brier, from day one.
- For the business: a bottoms-up number beats a top-down one. Even 1% of the $35bn full-service pool is $350m, but nobody buys 1% of a pool. Count named buyers and ACV instead. Public-affairs budgets are shrinking (Ipsos citizens -8%), so do not lead with government pollsters.

## Recommendations

1. Do not cite $153bn as TAM in the YC application. Cite it as context and state a bottoms-up serviceable market (named buyer types x ACV), labeled as an estimate.
2. Write one paragraph that separates the three ESOMAR sectors and says which one Real World targets: research software ($62bn, +11.5%) is the fastest-growing and the natural home for an API.
3. Position against Qualtrics Edge Audiences and Simile on evidence: public hashed track record, ensemble spread and per-segment calibration. Neither publishes accuracy.
4. Build the receipts page to show variance calibration next to Brier, since that is the documented failure of competitors.
5. Pick one beachhead customer type (insights teams at consumer brands, or agencies) and run five discovery calls before Oct 27. Ask what budget line the spend would come from.
6. Buy or request the ESOMAR Global Market Research 2025 chapter on regional split. Our global-not-US pitch needs the non-US share.

## Open questions

- Actual revenue of Qualtrics, Kantar, Gallup. Find out via Kantar's FY25 announcement on its IR page and by asking the Qualtrics account team for a price sheet.
- What share of research spend is synthetic today. No public number exists. Ask the GRIT team (Greenbook) for the 2025 synthetic usage cut, and ask Ipsos and YouGov investor relations.
- Simile and Aaru revenue. Not disclosed.
- Regional split of the $153bn. Needs the paid ESOMAR report.
- Whether the Aaru valuation report is accurate. Trace to the original TechCrunch piece.

## Sources

- [Inside the $153bn Insights Industry (Research World, ESOMAR GMR 2025)](https://researchworld.com/articles/inside-the-153bn-insights-industry), accessed 2026-10-11
- [ESOMAR forecast report release, Aug 2025](https://www.einpresswire.com/article/837402321/new-esomar-report-offers-strategic-forecast-for-the-global-insights-industry), accessed 2026-10-11
- [Ipsos 2025 results](https://www.ipsos.com/en-nl/2025-results-line-guidance-launch-horizons-strategic-plan), accessed 2026-10-11
- [Daily Research News on Ipsos results](https://www.mrweb.com/drno/news39470.htm), accessed 2026-10-11
- [YouGov FY25 results](https://shareprices.com/rns/results-for-the-year-ended-31-july-2025-74n0ilapwfcbfin/), accessed 2026-10-11
- [Kantar H1 2025 presentation](https://www.kantar.com/investor-relations/financial-announcement/-/media/095A12CF030B4EABBD81FB13664B3995.ashx), accessed 2026-10-11 (found via search, not opened)
- [Qualtrics Edge launch](https://www.qualtrics.com/news/qualtrics-introduces-new-market-intelligence-capabilities-for-the-next-generation-of-market-insights/), accessed 2026-10-11
- [Qualtrics synthetic panels docs](https://www.qualtrics.com/support/survey-platform/distributions-module/synthetic-panels/), accessed 2026-10-11 (found via search, not opened)
- [CX Today on Press Ganey Forsta deal](https://www.cxtoday.com/service-management-connectivity/qualtrics-to-snap-up-press-ganey-forsta-in-6-75bn-deal-consolidate-the-voc-market/), accessed 2026-10-11
- [Research Live on Qualtrics survey](https://www.research-live.com/article/news/researchers-predict-synthetic-responses-will-dominate-in-coming-years/id/5131923), accessed 2026-10-11
- [Runtimewire on Simile Series B](https://runtimewire.com/article/simile-raises-200m-series-b-2b-valuation), accessed 2026-10-11
- [Bisbee et al., Political Analysis 2024](https://doi.org/10.1017/pan.2024.5), accessed 2026-10-11 (PDF unreadable; partial)
- [Gallup World Poll](https://www.gallup.com/analytics/318875/world-poll.aspx), accessed 2026-10-11 (found via search, not opened)
