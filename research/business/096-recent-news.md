# Recent news (Jul-Oct 2026): synthetic populations, AI forecasting, simulation startups, models

- Date: 2026-10-11
- Area: business
- Confidence: medium. Primary pages were opened and quoted, but the web search budget ran out, so coverage is thin. No Aaru funding data, no Metaculus or Polymarket news, no new-model survey beyond Anthropic's price page.

## Answer

The money is real and the category is validated: Simile raised over $200M at $2B post-money on 30 Jul 2026. Simile sells to enterprises, models the US-centric consumer, and publishes error metrics, so Real World's open lane is the whole world, public scoring and a track record nobody can backfill. Recent papers back our known risks (variance collapse, non-Western flattening, contamination), and Haiku 5.5 pricing makes the nightly update cheaper than our $15-60 estimate.

## Findings

**Simile is the funded incumbent.** Its [Series B post](https://www.simile.com/blog/series-b) (30 Jul 2026) says "over $200 million" at "$2 billion post-money". Greenoaks and Index Ventures co-led. Hanabi, Bain Capital Ventures, A*, Factory, CVS Health Ventures and Definition took part. Claims, all company-stated: revenue up 5x in about five months since launch, a new foundation model of human behavior, "tens of millions" of simulations for Fortune 100 firms, and more than 50 staff. The [homepage](https://www.simile.com/) names CVS Health, Gallup, Itaú, Wealthfront, Suntory and Deloitte (logo only). Percy Liang co-authors its blog. Its roots are the Park et al. generative agents work: 1,000 interview-grounded people, 85% of human self-retest accuracy, and a fine-tune on 2.9M responses from 210 experiments (+26% on unseen studies).

**Simile's validation is distributional and admits limits.** Its [confidence post](https://www.simile.com/blog/confidence) scores answer distributions with Total Variation Distance (TVD). It trains a model that predicts per-question error. The confidence model is only moderate: AUROC about 0.74, Pearson r about 0.57, on roughly 8,600 held-out questions. The "decision-grade" threshold (TVD 0.16) comes from 14 internal staff raters. It is not an external benchmark. The [What-If Machine post](https://www.simile.com/blog/what-if-machine) says it trains on transactions, app usage, clickstreams and mobility. That is proprietary behavioral data we cannot match. The post gives no population size or validation numbers.

**Aaru sells the same thing as a service.** Its [site](https://aaru.com) lists product, marketing, segmentation, scenario and comms use cases, with EY and Breakwater case studies (Breakwater tracker: 71 judgments, 40,000 simulated investors, dated 17 Jul 2026). It claims mean TVD 7.62% and MAE 3.53% over 2,993 questions and calls this "industry-leading". That is a self-reported number with no outside check. I could not retrieve its funding or valuation.

**LLM personas still collapse and flatten.** Four new papers matter:
- [Ozkan, 17 Jul 2026](https://arxiv.org/abs/2607.18310): independent LLM agents on World Values Survey microdata (2,414 Turkish-first respondents) collapse onto the modal answer. Entropy fell from 1.46 to 0.77 and 85% hit the modal answer (TVD 0.44). Verbalized Sampling fixes under-dispersion but overshoots, with an SD-ratio of 1.26-1.37. Subgroup claims are contaminated by recall. Aggregate accuracy survives.
- [Powdthavee, 27 Sep 2026](https://arxiv.org/abs/2609.33055): six LLMs on WVS Wave 7 (93,901 respondents, 66 countries) "substantially understate" life-satisfaction spread. After rescaling, they still reproduce the income gradient.
- [Lee and Yue, 26 Sep 2026](https://arxiv.org/abs/2609.32638): open-weight models reach r of about 0.70-0.73 on cross-instrument correlations (139 pairs, 2,058-person panel). The newest Llama did worst on two of three metrics. Newer is not better for personas.
- [Zhao et al., 5 Oct 2026](https://arxiv.org/abs/2610.07062) (macro2mind): trained with GRPO on Polymarket price moves. It improves a downstream user simulator by 15.5 points on unseen users. No code link on the page, CC BY 4.0 paper only.

**AI forecasting still trails markets.** [Douven](https://arxiv.org/abs/2607.18269) (v2, 22 Jul 2026) aggregated 15 LLMs on 254 prediction-market questions. Learned aggregators beat any single model. The gap between frontier and small models fell from 35.8% to 8.9% once contamination was removed. LLMs stayed "substantially less accurate than the prediction market". The [ForecastBench home page](https://www.forecastbench.org/) lists a "Superforecaster-LLM tournament" on 25 Oct 2026, two days before our launch. Scores use a Brier Index (50% means uninformed). Models appear 50 days after submission. Human baselines date from July 2024. I could not get current scores because the tables render client-side.

**Model prices dropped.** The [Claude pricing page](https://claude.com/pricing) lists Haiku 5.5 at $0.10 input and $0.50 output per million tokens (prompts up to 100K), cache read $0.01, and 50% off for batch. Above 100K prompt tokens it is $0.50 and $2.50. Haiku 4.5 is now legacy at $1 and $5. Sonnet 5.5 is $2 and $10. Opus 5.5 is $4 and $20.

**Data sources are stable.** [GDELT](https://www.gdeltproject.org/) says it is "100% free and open", with streams updating every 15 minutes and BigQuery updated daily. Its [blog](https://blog.gdeltproject.org/) is active through 11 Oct 2026 and shows no access changes. [IPUMS International](https://international.ipums.org/international/) reports 104 countries, 656 censuses and surveys, and over 1 billion person records. The page references terms on redistributing "derived synthetic data" but does not print them.

## What it means for Real World

- For the product: Do not compete with Simile on enterprise decisions. Lead with what they do not offer: a world-scale forecast, a public daily scoreboard, and fork-and-drop-in-an-event. Show spread, not just means. The papers say a single confident number is the failure mode.
- For the engineering: Population-level distributions come first. Do not run 100,000 independent agents and average. Ozkan shows that collapses to the mode. Sample a response distribution per segment, then assign it to agents. Calibrate dispersion per country against WVS and report TVD. Use Simile's TVD framing as a shared metric so buyers can compare us to their numbers. Keep a post-cutoff-only holdout, since Douven shows contamination shrank a 35.8% gap to 8.9%.
- For the business: At Haiku 5.5 prices the nightly run is cheap. My arithmetic: 100,000 agents at about 2,000 input and 300 output tokens each is 200M input plus 30M output tokens, about $35 at list price and about $17 on batch, before caching. That sits inside the $15-60 range. The cost risk is now Sonnet-class calls for hard cases, not the nightly floor. The YC story is a track record, not scale: Simile is worth $2B on claims, and we can offer receipts.

## Recommendations

1. Publish a TVD-per-country validation table against WVS holdout waves on the receipts page before launch. Owner: engineering. Reuse Simile's metric definition and Ozkan's collapse measures (entropy, concentration, SD-ratio).
2. Build the nightly sampler distribution-first: one Haiku 5.5 call per segment-by-question cell, then draw agents from it. Track SD-ratio and keep it between 0.8 and 1.2 so we avoid both collapse and the overshoot Ozkan saw.
3. Score every forecast against market price and report the gap honestly. Douven shows LLM ensembles still lose to markets. Our claim should be "calibrated, beats naive baselines, tracks the market", not "beats the market".
4. Use model disagreement as an uncertainty signal. Run Haiku 5.5 plus one second-family model on a sample each night and expose the spread. Douven found disagreement was the simplest useful aggregator feature.
5. Submit to the ForecastBench tournament if the window is open (25 Oct event). It gives an external Brier Index before 27 Oct. Owner: PM, check eligibility this week.
6. Position copy as "the public world model, with receipts", and name Simile and Aaru only by what they publish (TVD, case studies), never by their valuations.
7. Run an IPUMS terms check before shipping any agent-level export. See open questions.

## Open questions

- Aaru funding, valuation and 2026 customers. Not retrieved. Search once the budget allows.
- Current ForecastBench and Metaculus bot-vs-pro numbers. Tables are client-side. Pull them from the ForecastBench GitHub data or the technical report.
- IPUMS redistribution terms for derived synthetic populations. Read the copyright page and ask IPUMS support before publishing agent-level data.
- Whether macro2mind releases code or weights. Check the arXiv listing and the authors' repo in two weeks.
- Prediction-market news (Polymarket, Kalshi data access and licensing) in the last 90 days. Not covered. It affects our daily Brier-vs-market scoring.
- New model releases beyond Anthropic. I only checked Anthropic pricing. Check open-weight options for the persona layer, given Lee and Yue's Llama result.

## Sources

- [Announcing Simile's Series B](https://www.simile.com/blog/series-b), accessed 2026-10-11
- [Building confidence in Simile](https://www.simile.com/blog/confidence), accessed 2026-10-11
- [Building the What-If Machine](https://www.simile.com/blog/what-if-machine), accessed 2026-10-11
- [Simile homepage](https://www.simile.com/), accessed 2026-10-11
- [Simile blog index](https://www.simile.com/blog), accessed 2026-10-11
- [Aaru](https://aaru.com), accessed 2026-10-11
- [Claude pricing](https://claude.com/pricing), accessed 2026-10-11
- [ForecastBench](https://www.forecastbench.org/), accessed 2026-10-11
- [ForecastBench leaderboards](https://www.forecastbench.org/leaderboards/), accessed 2026-10-11
- [ForecastBench docs](https://www.forecastbench.org/docs/), accessed 2026-10-11
- [Ozkan, Distribution-First Population Simulation, arXiv 2607.18310](https://arxiv.org/abs/2607.18310), accessed 2026-10-11
- [Powdthavee, LLMs and well-being inequality, arXiv 2609.33055](https://arxiv.org/abs/2609.33055), accessed 2026-10-11
- [Douven, Wisdom of LLM Crowds, arXiv 2607.18269](https://arxiv.org/abs/2607.18269), accessed 2026-10-11
- [Zhao et al., Learning to Simulate Individuals from Macro Social Signals, arXiv 2610.07062](https://arxiv.org/abs/2610.07062), accessed 2026-10-11
- [arXiv API listing: open-weight LLM survey populations (2609.32638)](http://export.arxiv.org/api/query?search_query=all:%22digital+twins%22+AND+all:%22LLM%22+AND+all:survey+AND+all:simulation&sortBy=submittedDate&sortOrder=descending&max_results=10), accessed 2026-10-11. Listing only, abstract page not opened.
- [GDELT Project](https://www.gdeltproject.org/), accessed 2026-10-11
- [GDELT blog](https://blog.gdeltproject.org/), accessed 2026-10-11
- [IPUMS International](https://international.ipums.org/international/), accessed 2026-10-11
