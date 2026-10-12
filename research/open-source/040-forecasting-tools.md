# Open-source forecasting bot tooling

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo, PyPI and paper facts were read directly. The web search budget ran out, so I could not find other tools or the live leaderboard numbers.

## Answer

Use the open pieces for plumbing and scoring, not for the product. ForecastBench gives us a free, contamination-free scoring harness and a submission path we can use the same week. Metaculus `forecasting-tools` gives us a bot scaffold, but it forecasts questions one at a time, so it does not fit a 100,000-agent world. Real World should enter ForecastBench and Metaculus' bot tournaments as cheap external proof, and keep its own hashed daily ledger as the core record.

## Findings

**Metaculus forecasting-tools.**
- MIT license. 83 stars, 41 forks, 257 commits, no GitHub releases ([repo](https://github.com/Metaculus/forecasting-tools)).
- PyPI version 0.3.4, released 2026-10-05. Python 3.11 to 3.14 ([PyPI](https://pypi.org/project/forecasting-tools/)).
- It is a framework for a Metaculus bot. It ships two bots: MainBot (most accurate in their testing, maybe pricier) and TemplateBot (cheaper, faster). You subclass TemplateBot and override the research or forecast step ([README](https://raw.githubusercontent.com/Metaculus/forecasting-tools/main/README.md)).
- Useful parts: `GeneralLlm` (a litellm wrapper with retries and structured output), `MonetaryCostManager` (spend cap), `MetaculusClient`, `QuestionDecomposer`, `QuestionOperationalizer`, `BotOptimizer`.
- The spend cap is soft. Cost is recorded after each call finishes, so a concurrent batch can overshoot the limit ([repo](https://github.com/Metaculus/forecasting-tools)). That matters for us, since we will run many calls in parallel.
- It needs `METACULUS_TOKEN` plus an Exa or Perplexity key for search.

**Metaculus bot template.**
- `metac-bot-template`: 67 stars, 367 forks. Fork it, add secrets, and GitHub Actions run the bot about every 20 minutes. It targets the AI tournament, MiniBench, and Metaculus Cup. The page showed no license ([repo](https://github.com/Metaculus/metac-bot-template)).
- To register you create a token and fill in a participation form. Free OpenRouter credits are available through a form.

**Metaculus tournament economics.**
- Each main season has about 300 to 500 questions. MiniBench rounds have about 60.
- Scoring is spot peer score, using only the last forecast before close.
- A bot costs from about $50 per season to over $1,000. Competitive bots average $1 to $1.50 per question.
- Model choice is called the biggest success differentiator. The Spring 2026 write-up is titled "Too close to call: Pros only narrowly retain their lead" ([Metaculus](https://www.metaculus.com/notebooks/38928/q2-ai-benchmark-results/)).
- The top Q4 2024 bot took 15 to 40 hours of work and won $9.5k.

**ForecastBench (Forecasting Research Institute).**
- MIT code, 89 stars ([repo](https://github.com/forecastingresearch/forecastbench)). Data is CC BY-SA 4.0, updated nightly ([datasets](https://github.com/forecastingresearch/forecastbench-datasets)). CC BY-SA means derived datasets must carry the same license.
- Paper: Karger, Bastani, Yueh-Han, Jacobs, Halawi, Zhang, Tetlock, ICLR 2025 ([arXiv](https://arxiv.org/abs/2409.19839)).
- Question bank in the paper: 6,435 questions. Market sources are Manifold, Metaculus, Polymarket and RFI. Dataset sources are ACLED, DBnomics, FRED, Wikipedia and Yahoo Finance.
- Questions come from templates over time series, for example "will protests in Niger rise 10%". Those are auto-resolved from the source data. Market questions resolve when the market does.
- A new round starts every two weeks. Each round has 500 LLM questions, 250 market and 250 dataset ([docs](https://www.forecastbench.org/docs/)). Resolution runs nightly at 00:00 UTC.
- Scoring is difficulty-adjusted Brier, turned into a Brier Index. Models appear on the leaderboard 50 days after submission ([leaderboards](https://www.forecastbench.org/leaderboards/)).
- In the paper, superforecasters scored Brier 0.096 against 0.121 for the public and 0.122 for the best LLM, Claude 3.5 Sonnet. The best LLMs had the market price frozen in as an input. Without it the best model scored 0.136. A coin flip scores 0.25. These numbers are from 2024 models and are stale.
- Submission is a JSON file uploaded to a GCP bucket by 23:59:59 UTC on the due date. You need at least 95% of questions answered or the gaps get 0.5. Up to 3 forecast sets per round. Anonymous submission is allowed ([how to submit](https://github.com/forecastingresearch/forecastbench/wiki/How-to-submit-to-ForecastBench)).
- A superforecaster-LLM tournament is listed for 2026-10-25, two days before our launch ([site](https://www.forecastbench.org/)).

**Market APIs as resolvers.**
- Manifold's API allows 500 requests per minute per IP. Bots are allowed. Commercial AI training on its data needs a license ([docs](https://docs.manifold.markets/api)).
- Polymarket's docs page I opened was only an overview. I did not confirm limits or terms.

**What does not work or is missing.**
- Nothing here is built for population simulation. Both toolkits assume one question in, one probability out.
- I found no general open auto-resolution helper. ForecastBench's resolution is tied to its fixed source list. Metaculus resolves by humans.
- Metaculus AIB pages returned 403 for some URLs, so I could not read all rules.

## What it means for Real World

- For the product: the "daily question" and "receipts" page can borrow ForecastBench's shape: fixed question templates, a nightly resolve, Brier against market price. External leaderboard rank is a credible trust signal for a YC reviewer.
- For the engineering: do not adopt `forecasting-tools` as a dependency for the simulator. Copy two ideas: a cost cap that is checked before each call, not after, and structured forecast output. Write our own thin resolver for the 5 to 10 sources we pick. Reuse ForecastBench's JSON schema for our own ledger so submitting is a copy step.
- For the business: ForecastBench and Metaculus give free, third-party scoring with no backfilling. That backs the "cannot be backfilled" moat claim. A bot entry costs roughly $50 to a few hundred dollars per season, far below the nightly world run.

## Recommendations

1. Register for ForecastBench this week. Submit the next biweekly round with a cheap baseline (a market-price-plus-adjustment model) to test the pipeline. Rounds are due every two weeks; the file is a simple JSON.
2. Make our own daily ledger match ForecastBench's fields (`id`, `source`, `forecast`, `resolution_date`, `reasoning`). One schema, one writer.
3. Score on both of their splits: dataset questions (auto-resolved from data) and market questions (Brier against market price). Report both. Never report a blended number alone.
4. Fork `metac-bot-template` as a throwaway. Point it at MiniBench (about 60 questions, about $1.50 per question) to get a public Metaculus rank before Oct 27. Budget under $150.
5. Build a resolver module with three sources first: Manifold (open API), FRED, and Wikipedia pageviews or counts. Add Polymarket only after reading its terms. Keep it in one file with one test per source.
6. Treat the superforecaster-LLM tournament on Oct 25 as a timing hook for launch week. Check the rules before relying on it.
7. Do not import the ForecastBench dataset into a product dataset without a license decision, given CC BY-SA.

## Open questions

- Current leaderboard standings for 2026 models, and the projected parity date. The tables did not render. Find out by loading the leaderboard in a browser or reading the datasets repo `leaderboards` folder.
- Does the ForecastBench tournament allow a system that runs a large agent simulation as its forecaster? Ask forecastbench@forecastingresearch.org.
- Polymarket API limits and commercial-use terms. Read its docs index (`docs.polymarket.com/llms.txt`).
- Whether Metaculus FutureEval rules allow forecasts built on simulated agents. I got a 403 on that page.
- Other tools (Halawi et al. retrieval-augmented system code, auto-resolution libraries). Not searched, because the search budget ran out. A follow-up search is needed.

## Sources

- [Metaculus/forecasting-tools](https://github.com/Metaculus/forecasting-tools), accessed 2026-10-11
- [forecasting-tools README](https://raw.githubusercontent.com/Metaculus/forecasting-tools/main/README.md), accessed 2026-10-11
- [forecasting-tools on PyPI](https://pypi.org/project/forecasting-tools/), accessed 2026-10-11
- [Metaculus/metac-bot-template](https://github.com/Metaculus/metac-bot-template), accessed 2026-10-11
- [Metaculus AI benchmark notebook](https://www.metaculus.com/notebooks/38928/q2-ai-benchmark-results/), accessed 2026-10-11
- [forecastingresearch/forecastbench](https://github.com/forecastingresearch/forecastbench), accessed 2026-10-11
- [forecastbench-datasets](https://github.com/forecastingresearch/forecastbench-datasets), accessed 2026-10-11
- [ForecastBench: How to submit](https://github.com/forecastingresearch/forecastbench/wiki/How-to-submit-to-ForecastBench), accessed 2026-10-11
- [ForecastBench docs](https://www.forecastbench.org/docs/), accessed 2026-10-11
- [ForecastBench leaderboards](https://www.forecastbench.org/leaderboards/), accessed 2026-10-11
- [ForecastBench home](https://www.forecastbench.org/), accessed 2026-10-11
- [ForecastBench paper, arXiv 2409.19839](https://arxiv.org/abs/2409.19839), accessed 2026-10-11
- [Manifold API docs](https://docs.manifold.markets/api), accessed 2026-10-11
- [Polymarket market data overview](https://docs.polymarket.com/developers/gamma-markets-api/overview), accessed 2026-10-11
