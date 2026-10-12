# Commercial agent-based modeling: AnyLogic, Simudyne, Improbable Defence, HASH, BlueDot

- Date: 2026-10-11
- Area: market
- Confidence: medium. Vendor facts were read on primary pages. Prices and ABM-adoption reasons are thin: AnyLogic does not publish prices, and the "why ABM stalled" part rests partly on analysis, not a cited study.

## Answer

Commercial ABM is a small, quote-based, services-heavy niche. It sells a modeling toolkit to engineers who supply their own rules and data. It does not sell forecasts. Real World should position the opposite way: a calibrated, scored forecast and an API, not a toolkit. The ABM vendors' history is a warning about validation, sales cycle and services drag, and an opening for a product that publishes a track record.

## Findings

**AnyLogic is the survivor, and it is a general simulation tool.** It is proprietary Java software from The AnyLogic Company (formerly XJ Technologies). It supports agent-based, discrete-event and system-dynamics models in one tool. It grew out of a St. Petersburg Polytechnic research group (company 1998, first release 2000), and AnyLogic 8 (2017) added AnyLogic Cloud ([Wikipedia](https://en.wikipedia.org/wiki/AnyLogic)). Its customers use it mostly for logistics, factories, pedestrian and rail flows. Its own libraries are process modeling, pedestrians, rail, fluids, road traffic and material handling. Social or opinion simulation is not in that list. A search result repeats the company claim of use in "over 40% of Fortune 100" firms; I could not open the company's own page (HTTP 403), so treat that as unverified.

**AnyLogic pricing is not public.** There is a free Personal Learning Edition, plus University Researcher and Professional editions sold by quote. One aggregator cites about $18,990 per Professional seat. I could not confirm it ([CheckThat summary](https://checkthat.ai/brands/anylogic/pricing)). The licensing page was blocked (403). Treat the number as an order-of-magnitude hint for seat-based desktop ABM, nothing more.

**Simudyne sold ABM to banks and stayed small.** The 2019 Series A was $6M, led by Barclays with Graphene Ventures and Gauss Ventures, $10M raised in total. Barclays signed an enterprise licence for credit, market and operational risk, mainly "default contagion" ([UKTN](https://www.uktech.news/news/simudyne-closes-6m-funding-round-20190408), [Barclays](https://home.barclays/news/2019/7/insights--how-barclays-is-predicting-the-future-)). MITRE licensed Simudyne its agent-based financial-crisis model built with the U.S. Treasury ([ExecutiveBiz](https://executivebiz.com/2018/12/mitre-simudyne-partner-on-financial-modeling-tech-offering)). The Barclays page gives no scale or decision outcomes. Simudyne's current site names no customers or prices, lists London and Hong Kong offices and two products (Pulse, Echo), and shows partner logos for Google Cloud, AWS, Red Hat and NVIDIA ([simudyne.com](https://www.simudyne.com)). I found no news after 2019 in search. Seven years on, one named anchor customer and no visible follow-on funding says the market did not open up.

**Improbable Defence was sold at a loss-making stage.** In June 2023 Improbable spun out its defence unit to investors led by NOIA Capital, about 70 engineers and modellers plus UK MOD contracts, all on the Skyral synthetic-environment platform. Terms were undisclosed. Improbable said it was refocusing on the metaverse ([Improbable](https://www.improbable.io/news/improbable-sells-defence-business-to-group-of-investors-led-by-noia-capital)). Press at the time said it was the one unprofitable division ([UKTN](https://www.uktech.news/vr/improbable-defence-sale-20230606)). Skyral's site now lists defence, government and "business intelligence" products and names no customers ([skyral.com](https://www.skyral.com)). Lesson: defence simulation is real revenue, but it is bespoke, project-shaped work with about 70 people behind it.

**HASH abandoned the simulation product.** The 2020 pitch was an open-source ABM engine against AnyLogic, with a $2.5M seed ([Crunchbase News](https://news.crunchbase.com/startups/hash-unveils-new-simulation-tool-powered-by-2-5m-seed-round/)). The engine (hEngine, Rust) sits in `hashintel/labs` as `sim-engine`: 38 stars, 126 commits, "experimental" ([GitHub](https://github.com/hashintel/labs)). The main repo now describes a "self-building, open-source database" of knowledge graphs and "world models", about 1.7k stars ([GitHub](https://github.com/hashintel/hash)). Pivot from simulation to a graph database is the clearest negative signal in this group. Their own guide said simulations were not generally available and offered early access to organisations with more than $20,000 of budget ([search summary of hash.ai guide](https://hash.ai/guide/simulations)).

**BlueDot is the one that wins, and it is not mainly an ABM.** It sells infectious-disease intelligence to governments, hospitals and enterprises, combining ML and human experts. It says it alerted clients on 31 December 2019, about five days before the WHO (company claim, not independently verified). It raised a 2014 seed from Horizons Ventures and $3M from Canada's FedDev in 2021 ([BlueDot](https://bluedot.global/about/)). It sells a signal and an alert, not a simulation workbench. That is the commercial shape that worked.

**The open-source baseline is free.** Mesa (Python, Apache-2.0, 3.9k stars) is the default ABM library ([GitHub](https://github.com/projectmesa/mesa)). Anyone can build a toy in an afternoon, so paid tools must justify themselves on scale, support or data.

**The new LLM-agent entrant is priced like a research tool.** Aaru raised a Series A in December 2025, led by Redpoint, at a reported $1B headline valuation (blended lower), with ARR below $10M and customers Accenture, EY and Interpublic. All details come from unnamed sources ([TechCrunch](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation)). Demand exists, but it sits in market research and consulting budgets, not simulation-software budgets.

**Market size.** The page I opened sizes all simulation software at $15.46B in 2026, 55-60% held by Ansys, Dassault, Siemens, Altair and Autodesk, and never mentions agent-based ([Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/simulation-software-market)). ABM is too small to appear as a line. That is my inference; the report is silent.

**Why it never went mainstream** (my synthesis, partly sourced). Validity is the core problem. ABMs are too complex to understand fully, so modellers must re-implement, vary assumptions and test tractable cases ([JASSS, Galán et al.](https://www.jasss.org/12/1/1.html)). Many parameter sets fit the same history, so a fit proves little. Buyers cannot see a score, so the sale is a consulting project. Economists argued in 2009 that ABM was needed because DSGE and econometric models failed in crises ([Farmer and Foley, Nature](https://doi.org/10.1038/460685a); I saw only a summary, not the full text). Fifteen years later the mainstream still did not switch. The reason fits: nobody published out-of-sample accuracy.

## What it means for Real World

- For the product: sell a forecast, a delta and a trace, not a modeling tool. Users should never write agent rules. The fork-and-drop-an-event flow is the "toolkit" part, so keep it one box and one button.
- For the engineering: do not build a general ABM framework. The agents are LLM personas on census microdata, so Mesa-style scheduling is a thin loop. Spend effort on calibration and the hashed record. Skip AnyLogic-style GUIs, libraries and 3D.
- For the business: the track record is the moat that every vendor above lacked. The PM line is "accuracy you can audit". Expect the first money from consultancies and research teams (Aaru's buyers), not simulation-software budgets. Seat pricing near $19k per year is a plausible anchor, unverified. Beware the services trap: Simudyne and Improbable both drifted toward bespoke projects.

## Recommendations

1. Name the category "forecast API with a public score", never "agent-based modeling platform" in the YC application. Cite AnyLogic as a toolkit and Aaru as the closest rival.
2. Put the scorecard (Brier versus market, hashed before outcome) on the launch page above the globe. A buyer should see accuracy in ten seconds.
3. Cap custom work. No bespoke model builds for customers before launch; the only customization is the event text plus segment filters.
4. Keep the simulation core to one small module using plain Python, no ABM framework. Revisit Mesa only if we need spatial or network scheduling.
5. Write a one-page validation plan, in plain language, that states which claims we can score (daily questions) and which we cannot (counterfactual events). This keeps PM and engineers aligned on what "works" means.
6. Interview three ex-users of AnyLogic, Simudyne or HASH about why they stopped. Do it before pricing.

## Open questions

- Is Simudyne still trading at scale? Check Companies House filings and its LinkedIn headcount.
- Did the Improbable Defence sale close, and what is Skyral's revenue? Check the Companies House accounts of the new entity.
- What does AnyLogic Professional really cost? Ask sales for a quote with a student email; third-party figures are unverified.
- Is there a published review of how many ABM papers are validated against data, with numbers? I did not find one I could open.
- Does Aaru publish any scored forecasts? Check its site and its 2024 primary claim.

## Sources

- [AnyLogic (Wikipedia)](https://en.wikipedia.org/wiki/AnyLogic), accessed 2026-10-11
- [AnyLogic pricing summary (CheckThat)](https://checkthat.ai/brands/anylogic/pricing), accessed 2026-10-11 (unverified figures)
- [Simudyne closes $6M round (UKTN)](https://www.uktech.news/news/simudyne-closes-6m-funding-round-20190408), accessed 2026-10-11
- [How Barclays is predicting the future](https://home.barclays/news/2019/7/insights--how-barclays-is-predicting-the-future-), accessed 2026-10-11
- [MITRE and Simudyne partner (ExecutiveBiz)](https://executivebiz.com/2018/12/mitre-simudyne-partner-on-financial-modeling-tech-offering), accessed 2026-10-11 (search snippet only)
- [Simudyne](https://www.simudyne.com), accessed 2026-10-11
- [Improbable sells defence business](https://www.improbable.io/news/improbable-sells-defence-business-to-group-of-investors-led-by-noia-capital), accessed 2026-10-11
- [Improbable defence sale (UKTN)](https://www.uktech.news/vr/improbable-defence-sale-20230606), accessed 2026-10-11 (search snippet only)
- [Skyral](https://www.skyral.com), accessed 2026-10-11
- [hashintel/labs](https://github.com/hashintel/labs), accessed 2026-10-11
- [hashintel/hash](https://github.com/hashintel/hash), accessed 2026-10-11
- [HASH simulation seed round (Crunchbase News)](https://news.crunchbase.com/startups/hash-unveils-new-simulation-tool-powered-by-2-5m-seed-round/), accessed 2026-10-11 (search snippet only)
- [HASH simulation guide](https://hash.ai/guide/simulations), accessed 2026-10-11 (search summary only)
- [BlueDot about](https://bluedot.global/about/), accessed 2026-10-11
- [Mesa](https://github.com/projectmesa/mesa), accessed 2026-10-11
- [Aaru Series A (TechCrunch)](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation), accessed 2026-10-11
- [Simulation software market (Mordor Intelligence)](https://www.mordorintelligence.com/industry-reports/simulation-software-market), accessed 2026-10-11
- [Errors and artefacts in ABM (JASSS)](https://www.jasss.org/12/1/1.html), accessed 2026-10-11
- [The economy needs agent-based modelling (Nature)](https://doi.org/10.1038/460685a), accessed 2026-10-11 (summary only, paywalled)
