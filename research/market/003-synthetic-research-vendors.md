# Synthetic respondent and market research vendors, 2025-2026

- Date: 2026-10-11
- Area: market
- Confidence: medium. Funding and pricing for four vendors come from opened pages. Ask Rally and Lakmoos rest on search snippets only. Every vendor accuracy number is self-reported.

## Answer

The synthetic research market is real but small and sells one thing: a fast, cheap answer to "what would this audience think of X" for brand and product teams. Every vendor asks buyers to trust its own accuracy claim. The independent tests (Pew, Strat7, Verasight) all show 12-15 point errors at the question level and bad subgroup behavior. Nobody sells a public, hashed, scored forecast of a changing world. Real World should not compete on respondent accuracy claims. It should compete on the one thing these vendors cannot show: a time-stamped track record scored against outcomes.

## Findings

**Artificial Societies (London).** Platform is Radiant: AI Focus Groups, AI Surveys, AI Interviews. Audiences are networks of connected personas built from real-world observations, optionally with a client's CRM or past research. The company says it is "trusted by F100 companies" but names none. No prices are listed ([Greenbook profile](https://greenbook.org/company/Artificial-Societies)). Funding: EUR 4.5M combined pre-seed and seed in Aug 2025, seed led by Point72 Ventures, pre-seed with Kindred and Y Combinator ([BeBeez](https://bebeez.eu/2025/08/29/british-ai-startup-artificial-societies-raises-e4-5-million-to-simulate-human-behaviour-at-scale/)). I could not open that page. The figure comes from the search snippet, and another outlet reports $5.35M, so the total is unresolved. It also published a validation framework: eleven tests, twenty human data sources, nine LLMs. Its own findings are that models answer too consistently, scales are compressed, trait relationships are distorted, and "strong performance in one domain does not establish fidelity in the others" ([arXiv 2609.30030](https://arxiv.org/abs/2609.30030)). That is the most honest document any vendor has put out, and it describes variance collapse directly.

**Synthetic Users.** Plans start at $12,500 per year. Cost is $2-60 per interview from a token pool, and a typical 10-question interview uses 1,250 tokens. It claims "85 - 92%" synthetic-organic parity, "21+" peer-reviewed papers, and under 2 minutes to a first insight. The page does not name the studies behind the parity figure ([pricing page](https://www.syntheticusers.com/pricing)). Older price lists were $18,000 (300 interviews) to $85,000 (2,000). Critics note the 85% looks like 68% raw accuracy divided by an 81% human test-retest baseline. That critique comes from a competitor, Great Question, and I did not open it.

**Electric Twin (London).** Raised $10M led by Atomico, with LocalGlobe, Mercuri and Marc Andreessen, for $14M total including a $4M pre-seed. Reported 12 Feb 2026 ([Research Live](https://www.research-live.com/article/news/electric-twin-raises-10m-in-funding-round/id/5146836)). It says its audiences are validated across tens of thousands of assessments in 150+ countries, a claim I could not trace to a source. Its study with LSE had 7,755 human respondents from seven sampling services, weighted on age, gender, education and voting history. Synthetic answers matched central tendencies and fell inside the human range "on most questions". Human platforms themselves differed by 10-20 points on vote estimates. Electric Twin funded the study and a co-author is a co-founder ([Research Live, 21 Jul 2026](https://www.research-live.com/article/news/synthetic-surveys-comparable-to-traditional-research-finds-study/id/5151287)). Topics were limited to UK finance, shopping, social media and Ukraine. The useful finding is that the human baseline is itself noisy.

**Qualtrics Edge Audiences.** Synthetic respondents sit beside Qualtrics' human panels in 200+ markets. Claims are 50% lower cost ("estimated") and 98% faster. "Predictive accuracy others can't match" has no data behind it. No prices, demo-request only, autonomous study agents "coming soon" ([Qualtrics](http://www.qualtrics.com/strategy/audiences/)). Edge launched March 2025, and ROI Rocket supplies B2B data. This is the incumbent, and it treats synthetic as a feature on a panel business.

**Evidenza.** B2B-only "impersonas" built from a description of the target buyer. Founders came from the LinkedIn B2B Institute. Accuracy claims are from client validity tests it ran ([Artificial Societies comparison page](https://societies.io/compare/evidenza), a competitor's page, so treat it as hearsay). I did not open a primary Evidenza page.

**Ask Rally (Irreality Labs).** Virtual focus groups with calibrated personas, concept, pricing and package testing, and digital twins made from interview transcripts. Founded 2024 by Mike Taylor and Rhys Fisher. Dealroom lists no external funding ([Dealroom](https://app.dealroom.co/companies/rally)). Snippet only. Taylor himself says it complements human research.

**Lakmoos (Czech).** Neuro-symbolic virtual surveys, interviews and focus groups. EUR 300k pre-seed in March 2024 led by Presto Ventures, no later round found ([Tech.eu](https://funding.tech.eu/companies/06D4FDF1-64DD-49F6-A7E2-A1DA7DB8E6FA)). Snippet only.

**Independent evidence (what does not work).**

- Pew (30 Sep 2026): LLM "digital twins" of real panelists answering three ATP waves. The best model was Claude Opus 4.6. Average absolute error was about 12 points (11.3, 14.7, 11.2 by wave). Republicans had 16.1 and Black adults 15.1. No subgroup was under 12. Examples: 97% of synthetic Hispanic adults said they would follow the World Cup versus 42% of real ones, and over 90% of synthetic Republicans viewed Israel favorably versus 58%. Pew has no plans to use AI-generated survey results ([Pew](https://www.pewresearch.org/data-labs/2026/09/30/how-well-synthetic-samples-replicate-public-opinion.md)).
- Strat7 (15 Jul 2026): 3,000 real respondents versus two synthetic vendors. Headlines were 2-3 points off, but willingness to pay ran 16% high. Purely synthetic price ordering was illogical 68% of the time. Synthetic tracked change between waves 47% of the time, a coin toss. Strat7 suggests capping synthetic at 10-20% of a sample ([Research Live](https://www.research-live.com/article/news/synthetic-data-survey-responses-significantly-different-to-humans-finds-study/id/5151157)).
- Verasight Report IV (Jan 2026): GPT-5.2 imputed answers for 2,000 US adults. Mean absolute error was 14.5 points over 305 options. Health care was worst at 23.4, politics best at 12.1. It never picked 31% of the multi-select options and regressed to the mean ([Verasight](https://www.verasight.io/reports/synthetic-omnibus-survey)).

## What it means for Real World

- For the product: These vendors all answer a static, one-shot question about a named audience. None runs a world that evolves day to day, none handles events, and none offers click-an-agent-and-ask-why for a whole population. The coin-toss result on tracking change is the exact thing Real World's daily assimilation is built to fix, so it is both the opening and the risk. Do not market agent-level realism. Market calibrated, scored aggregate forecasts, and say where the agents are weak.
- For the engineering: Plan for the failure modes the independent tests found. Errors are around 12-15 points per question. Subgroups get stereotyped and majorities look near-unanimous. Scales compress. Treat agent answers as priors to be corrected by assimilated data, never as outputs. Report ensemble spread and subgroup error with every forecast. Use Pew-style and Verasight-style replication (same agents, known survey waves, absolute error in points) as the first test suite, because they are public and reproducible. Western flattening will show up as the same failure outside the US, and none of these tests cover it.
- For the business: Synthetic vendors sell to insight teams at $12,500+ per year (Synthetic Users) or enterprise sales (Qualtrics, Artificial Societies). Funding is small: EUR 4.5M, $14M, EUR 300k. Simile at $2B is the outlier and it is not a research vendor. Buyers are being burned by overclaims, so a vendor that publishes misses will stand out. The LSE finding that human panels differ by 10-20 points means "matches humans" is a weak claim, and "beats the market price on Brier" is a strong one.

## Recommendations

1. Do not publish a "% accuracy" or "parity" number. Publish Brier versus market price and per-subgroup absolute error in points, with misses listed.
2. Build a replication harness in week one: replay Pew ATP waves 185/190/192 and Verasight-style imputation against our agents, and log mean absolute error. Target is below the 12-14.5 point baselines. Failing that, say so.
3. Add an "agents alone" baseline run next to the assimilated forecast every day. The gap is the proof that assimilation matters, and it answers the Strat7 "47% on change" critique.
4. Pitch against Qualtrics-style claims in one line: they sell speed and cost with no published error, we sell a hashed record that cannot be backfilled.
5. Read Artificial Societies' benchmark paper in full and reuse its eleven-test structure for our own validation page. Check its license before copying anything.
6. Price later. Public vendor pricing runs $12,500-$85,000 per year. For YC, traction means forecast count and score, not revenue.

## Open questions

- Artificial Societies customers and revenue: nothing public. Ask in founder and customer interviews.
- What Synthetic Users' /science page actually cites, and whether the "21+ papers" are independent. Fetch the page and read them.
- Current pricing for Ask Rally, Evidenza and Lakmoos. Open their sites directly. This note used snippets.
- Whether any vendor scores forecasts against outcomes over time. I found none, but did not search exhaustively.
- Any test outside the US and UK. All independent evidence here is Western.

## Sources

- [Artificial Societies, Greenbook profile](https://greenbook.org/company/Artificial-Societies), accessed 2026-10-11
- [Artificial Societies Benchmark, arXiv 2609.30030](https://arxiv.org/abs/2609.30030), accessed 2026-10-11
- [BeBeez, Artificial Societies raise](https://bebeez.eu/2025/08/29/british-ai-startup-artificial-societies-raises-e4-5-million-to-simulate-human-behaviour-at-scale/), search snippet only, accessed 2026-10-11
- [Synthetic Users pricing](https://www.syntheticusers.com/pricing), accessed 2026-10-11
- [Research Live, Electric Twin raises $10m](https://www.research-live.com/article/news/electric-twin-raises-10m-in-funding-round/id/5146836), accessed 2026-10-11
- [Research Live, LSE synthetic survey study](https://www.research-live.com/article/news/synthetic-surveys-comparable-to-traditional-research-finds-study/id/5151287), accessed 2026-10-11
- [Qualtrics Edge Audiences](http://www.qualtrics.com/strategy/audiences/), accessed 2026-10-11
- [Pew, how well synthetic samples replicate public opinion](https://www.pewresearch.org/data-labs/2026/09/30/how-well-synthetic-samples-replicate-public-opinion.md), accessed 2026-10-11
- [Research Live, Strat7 study](https://www.research-live.com/article/news/synthetic-data-survey-responses-significantly-different-to-humans-finds-study/id/5151157), accessed 2026-10-11
- [Verasight Synthetic Sampling Report IV](https://www.verasight.io/reports/synthetic-omnibus-survey), accessed 2026-10-11
- [Dealroom, Ask Rally](https://app.dealroom.co/companies/rally), search snippet only, accessed 2026-10-11
- [Tech.eu, Lakmoos](https://funding.tech.eu/companies/06D4FDF1-64DD-49F6-A7E2-A1DA7DB8E6FA), search snippet only, accessed 2026-10-11
- [Artificial Societies vs Evidenza](https://societies.io/compare/evidenza), competitor page, search snippet only, accessed 2026-10-11
