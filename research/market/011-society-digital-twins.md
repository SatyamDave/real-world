# Digital twins of society: who funds them, what they built

- Date: 2026-10-11
- Area: market
- Confidence: medium. Funders and programme scope come from primary pages I opened. Phase 3 euro amounts, final Virtual Singapore cost and UK programme budget were not found.

## Answer

Government "digital twins" are almost all twins of physical systems: Earth's atmosphere, cities, buildings. None I found simulates a whole society's beliefs. The one government programme that did try to test social simulation (DARPA Ground Truth) was small and framed as a validity check, not a product. Real World is not competing with these. It can borrow their credibility language ("twin", "ground truth", "scored against reality") and their lessons about scope and funding cliffs.

## Findings

**EU Destination Earth (DestinE).**
- Run by ECMWF, ESA and EUMETSAT under DG CNECT. Phase 3 was confirmed on 1 Feb 2026 and runs June 2026 to June 2028. Phases 1 and 2 involved over 100 partner organisations. [ECMWF](https://www.ecmwf.int/en/about/media-centre/news/2026/third-phase-destination-earth-confirmed)
- What it models: two twins, a Climate Change Adaptation twin (multi-decadal, "what-if" scenarios) and a Weather-Induced Extremes twin, plus a Digital Twin Engine on EuroHPC supercomputers. Phase 3 adds AI models and AI-ready datasets for Europe's AI Factories. Same ECMWF page.
- Money: the Commission said in June 2024 that agreed Digital Europe funding was over EUR 315 million, with phases 1 and 2 each over EUR 150 million. Phase 3 funding then depended on the 2025-2027 work programme. [Commission, 10 Jun 2024](https://luxembourg.representation.ec.europa.eu/actualites-et-evenements/actualites/kommission-startet-system-destination-earth-finnland-zur-unterstutzung-der-anpassung-den-klimawandel-2024-06-10_en). No phase 3 figure appears in the ECMWF announcement.
- Promise: a full digital replica of Earth by 2030. The same release says it should help assess "socioeconomic and policy impacts" of disasters. That is the only social element, and it is downstream of physics.

**Virtual Singapore.**
- A S$73 million (US$53.4 million) R&D programme launched December 2014, led by the National Research Foundation, using Dassault Systemes' 3DEXPERIENCity platform. The Singapore Land Authority supplies 3D mapping data and owns and operates it. [Digital News Asia](https://digitalnewsasia.com/digital-economy/building-singapores-digital-twin)
- It is a 3D city model for planning and testing services. The article never mentions modelling people's behaviour. Sources I saw disagree on completion (2018 vs 2020), and I did not find the final cost.

**UK National Digital Twin programme.**
- Led by the Centre for Digital Built Britain (Cambridge plus the then BEIS) from 2018 to March 2022. It published the nine Gemini Principles in December 2018 (purpose, trust, function). The centre closed in September 2022. The programme budget and any successor were not found in what I read, and I did not open a CDBB page directly, so treat this as secondary. [CDBB](https://www.cdbb.cam.ac.uk/research/cambridge-living-laboratory-research-facility/west-cambridge-digital-twin-research-facility)

**Defence and intelligence social simulation (US).**
- DARPA SocialSim: simulate how information spreads online, for analysing adversary disinformation and disaster messaging. The page says the programme is complete and gives no budget, years or performers. [DARPA](https://www.darpa.mil/research/programs/computational-simulation-of-online-social-behavior)
- The public result is the USC ISI-led GitHub challenge: predict next month's activity for about 3 million users, 30 million actions and 6 million repositories from 30 months of history. The best broad method sampled each agent from a stationary distribution of its own past actions. Simulating a subsample of tens or hundreds of thousands of agents gave "inconsistent and often misleading" results, so the team simulated the full population. About 30% of the top-500 repositories change each month, which makes popularity rankings hard. [Blythe et al.](https://ar5iv.labs.arxiv.org/html/1908.05437)
- DARPA Ground Truth (Defense Sciences Office, announced 2017): simulated social worlds with hidden causal rules, so modelling teams could be scored on recovering the rules and predicting outcomes. Johns Hopkins APL's piece was up to 2.5 years and $3.7 million. Programme page marked complete, no longer maintained. [DARPA](https://www.darpa.mil/research/programs/ground-truth), [JHU APL](https://www.jhuapl.edu/news/news-releases/180516-hidden-ground-truth-social-phenomena)
- I did not find a funded US or EU programme for a live, whole-population belief simulation. A search for Army wargaming and synthetic-population programmes returned only a 2017 Hoover wargaming record, a NATO STO paper and a JASSS review. I did not open them.

**Where the money actually is: private "simulate people" startups.**
- Simile (Park, Bernstein, Liang): over $200 million Series B at $2 billion post-money, announced 30 July 2026, led by Greenoaks, after a $100 million Series A in February. Company-reported: revenue up fivefold, 50+ staff. Named customers include CVS Health (2.9 million consented responses), Gallup, Deloitte. Each output carries a confidence score from Total Variation Distance against real human data, and models are recalibrated weekly. It is positioned as pre-screening before real testing. [Unite.AI](https://www.unite.ai/simile-raises-more-than-200-million-at-a-2-billion-valuation-to-scale-human-behavior-simulations/)
- Aaru: Series A led by Redpoint, reported December 2025 at a "$1 billion headline" valuation. The valuation is multi-tier, so the blended figure is lower. The round is reported above $50 million, annual recurring revenue (ARR) is below $10 million, and customers include Accenture, EY, IPG and political campaigns. All from anonymous sources. [TechCrunch](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation)

## What it means for Real World

- For the product: nobody in government sells "a forkable world with an event dropped in." The closest public analogue is DestinE's "what-if" scenarios, and those are climate. Keep the receipts page and hashed forecasts front and centre. That is the thing government twins lack and Simile's confidence score only partly covers.
- For the engineering: SocialSim's finding matters directly. Small subsamples mislead, and a stationary per-agent baseline was hard to beat. With 100,000 agents we should ship a dumb statistical baseline next to the LLM ensemble and score both. Ground Truth's design is reusable: build a toy world with known causal rules, drop events in, and check that our assimilation recovers them. That is a cheap, honest test we can run before launch.
- For the business: public money funds physics and infrastructure, in 24-month phases with agencies as buyers. Social simulation money went to short, small research contracts that ended. Private capital is the real market: two competitors raised at $1-2 billion headline valuations on sub-$10 million-ish revenue. Do not plan on government revenue by November 2. Use DestinE and Virtual Singapore only as proof that "twin" is an accepted word for decision support.

## Recommendations

1. In the YC application, describe the market as "decision simulation," cite Simile and Aaru as proof of demand, and cite DestinE as proof that twin-style what-if tooling gets funded when it is scored against reality. Do not claim government customers.
2. Add a "Ground Truth" test to the repo: a small synthetic world with hidden rules, a fixed event set, and a pass/fail check that our nudge-and-forecast loop recovers the effect. Publish the result on the receipts page.
3. Add a non-LLM baseline (per-segment stationary or last-value model) to the daily scoring. Report Brier for the baseline, the ensemble and the market price.
4. Show a confidence score per output tied to a distance from real survey data, as Simile does, but computed from our own public receipts.
5. Pitch scenario forks to public-sector buyers (a city or ministry) only after a pilot has a named contact. Treat SAM.gov and EU tenders as a later channel.

## Open questions

- Phase 3 DestinE budget. Check the Digital Europe 2025-2027 work programme text.
- Final Virtual Singapore cost and whether any behaviour models were added later. Check NRF and Singapore Land Authority reports.
- Budgets and outcomes for SocialSim, and for any current DARPA, IARPA or Dstl social-simulation work. Check USAspending.gov and SAM.gov.
- UK National Digital Twin programme funding and successor. Check GOV.UK and CDBB closing reports.
- Whether Aaru's and Simile's revenue claims hold up. Only company announcements and anonymous sources exist so far.

## Sources

- [Third phase of Destination Earth confirmed (ECMWF)](https://www.ecmwf.int/en/about/media-centre/news/2026/third-phase-destination-earth-confirmed), accessed 2026-10-11
- [European Commission launches Destination Earth system, 10 June 2024](https://luxembourg.representation.ec.europa.eu/actualites-et-evenements/actualites/kommission-startet-system-destination-earth-finnland-zur-unterstutzung-der-anpassung-den-klimawandel-2024-06-10_en), accessed 2026-10-11
- [Building Singapore's digital twin (Digital News Asia)](https://digitalnewsasia.com/digital-economy/building-singapores-digital-twin), accessed 2026-10-11
- [DARPA SocialSim programme page](https://www.darpa.mil/research/programs/computational-simulation-of-online-social-behavior), accessed 2026-10-11
- [The DARPA SocialSim Challenge: GitHub (ar5iv)](https://ar5iv.labs.arxiv.org/html/1908.05437), accessed 2026-10-11
- [DARPA Ground Truth](https://www.darpa.mil/research/programs/ground-truth), accessed 2026-10-11
- [JHU APL Ground Truth release](https://www.jhuapl.edu/news/news-releases/180516-hidden-ground-truth-social-phenomena), accessed 2026-10-11
- [Simile Series B (Unite.AI)](https://www.unite.ai/simile-raises-more-than-200-million-at-a-2-billion-valuation-to-scale-human-behavior-simulations/), accessed 2026-10-11
- [Aaru Series A (TechCrunch)](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation), accessed 2026-10-11
- [CDBB West Cambridge digital twin page](https://www.cdbb.cam.ac.uk/research/cambridge-living-laboratory-research-facility/west-cambridge-digital-twin-research-facility), accessed 2026-10-11 (from search result, not opened)
