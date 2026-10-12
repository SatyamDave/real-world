# AI forecasting companies and bots

- Date: 2026-10-11
- Area: market
- Confidence: medium. Benchmark numbers come from primary pages (Metaculus, FRI, FutureSearch, Hugging Face). Company claims about live performance are mostly self-reported, and two of them conflict.

## Answer

AI forecasters now roughly tie the best humans on single binary questions, but not clearly, and not yet on forward-looking tests with enough samples. Every company in this slice forecasts one question at a time with a search-and-reason agent. None simulates a population. Real World should not compete on question accuracy. It should copy their one real moat, a public, un-backfillable, independently scored track record, and submit to the same scoreboards they use.

## Findings

**Accuracy against humans (the independent evidence)**

- Metaculus FutureEval spring 2026 (Jan to May): 173 bots, 297 scored questions. A team of 10 Pro forecasters beat the top-10 bot team by only 1.25 head-to-head points per question (95% CI -4.87 to 2.37, one-sided p = 0.247, not significant). In Q2 2025 the gap was -20.03. Pros had 3 days per question, bots had a 1.5-hour window. Bots won on numeric questions (+3.47) and lost on binary (-2.51) and multiple choice (-5.02). 9 of the top 10 individual spots were Pros. Seven of the top 10 bot makers were hobbyists or students. [LessWrong](https://www.lesswrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is)
- Metaculus's review of 11 analyses says Pros beat bot teams in all four quarterly comparisons from Q3 2024 to Q2 2025. It also says backtested "superforecaster parity" claims often have leakage problems (date filters, porous knowledge cutoffs) and that the Phan et al. result did not replicate. [LessWrong](https://www.lesswrong.com/posts/a82q6yd8zKpYk56cF/ai-forecasting-in-2026-what-11-analyses-say)
- ForecastBench (Forecasting Research Institute, live questions only, no backfill): superforecasters 0.081 Brier, best LLM (GPT-4.5) 0.101 in Oct 2025. By Jan 2026 the gap was 0.017, with Grok 4.20 preview at 0.102. LLMs improve about 0.015 to 0.016 Brier per year. FRI's linear extrapolation puts parity at November 2026, with a 95% CI running to November 2027. The "market questions" best LLM largely copies market prices. [FRI Oct 2025](https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark), [FRI Jan 2026](https://forecastingresearch.substack.com/p/llms-are-closing-the-gap-on-human)
- Good Judgment (human superforecasters) says client work points to a slower timeline than FRI and argues for human plus AI hybrids. I could not open its site (403), so this comes via FRI's post and secondary coverage only.

**Companies**

- **FutureSearch.** Public forecasting and research agent platform, launched early 2026. Plans: Free ($20 credit), $20, $99 and $500 per month, with 15% to 30% usage discounts. Forecasts cost $2 to $5 per question at high effort and $0.25 to $3 at low effort. Enterprise is by quote. [Pricing](https://futuresearch.ai/pricing), [one-pager](https://futuresearch.ai/futuresearch-one-pager.html). Its own eval page reports BTF-3 (2,386 resolved questions replayed against a frozen web corpus) at 0.116 Brier for its system versus 0.120 for Claude Opus 5. That is a pastcasting result, which is the leakage-prone kind. It reports #2 of 284 in the Metaculus Summer 2026 bot tournament and #5 of 427 on ForecastBench. [evals](https://evals.futuresearch.ai/) The one-pager claims #1 of 166 in the same tournament and a 91% annualized Kalshi return. The two pages disagree, so cite neither without checking.
- **Mantic (London).** Founded 2024 by Toby Shevlane and Ben Day. Raised a $25M seed on 2026-09-18, led by Radical Ventures with M12, Thinking Machines Lab and Balderton. It specializes other labs' frontier models for forecasting. In the summer 2026 Metaculus Cup it beat every human and all bots but one ("laertes"). Customers are unnamed, with hedge funds and trading firms eager. [Reuters via The Star](https://www.thestar.com.my/tech/tech-news/2026/09/18/ai-startup-mantic-raises-25-million-for-superhuman-forecasting) Metaculus noted Mantic's proposed ensemble had not been deployed live at the time of its review.
- **Lightning Rod Labs.** Trains small forecasting models on outcomes. Foresight-32B is a Qwen3-32B fine-tune, Apache-2.0, on Hugging Face. Claims: #1 on Prophet Arena Sports in Feb 2026 and the only non-frontier model in the ForecastBench top 5 in Jan 2026. Training data comes from its own "Foresight Data" platform, which is not public. Business: a hosted dashboard and API plus custom data generation, no public pricing. [Model card](https://huggingface.co/LightningRodLabs/foresight-32B), [Future-as-Label paper](https://arxiv.org/pdf/2601.06336). Paper result: Qwen3-32B Brier improved 27% and calibration error halved versus its base. Metaculus treats this as backtested, not a broad forward win.
- **Metaculus.** Not a competitor but the referee. It runs the benchmark and a $50,000 bot prize pool, and sells Pro forecasting. Hobbyist bots routinely place top 5, and development time did not correlate with score (r = 0.08). [Metaculus](https://metaculus.substack.com/p/metaculus-futureeval-ai-forecasting-benchmark)
- **What wins in bot-making:** frontier model choice, scaffolding (+5 to 11 points per question, about nine months of base-model progress), reasoning-high versions (8 of 8 pairs better), and ensembling up to about 10 bots, after which it hurt. Search vendor brand did not matter. Platt scaling gave only about 0.016 Brier.

**Business models seen**

- Usage-priced SaaS with API (FutureSearch).
- Enterprise or fund-facing contracts under NDA (Mantic).
- Open weights plus paid data and API (Lightning Rod).
- Human panel subscriptions and consulting (Good Judgment).
- Prize pools for bots, paid by the benchmark owner (Metaculus).

## What it means for Real World

- For the product: These companies answer "what is P(X)". Real World answers "what happens to segments of people if X, and why". That is a different product, so do not pitch it as another forecaster. The daily question and receipts page should still look like theirs, because that is the format people already trust. Keep the receipts page showing Brier against market price, with a note that ForecastBench found LLMs largely copy market prices on those questions. If our agents just echo the market, the score is meaningless.
- For the engineering: Per-question cost is the benchmark we will be judged against. FutureSearch charges $2 to $5 per high-effort question. Our $15 to $60 nightly budget buys the equivalent of roughly 3 to 30 such forecasts. So the 100,000-agent run must either produce many forecasts from one world state or justify itself on something a single agent cannot do (segments, spread, second-order effects). Backtesting is the trap: Metaculus rejects backtested parity claims, so every accuracy claim must come from forward questions with timestamped hashes. Keep the ensemble to about 10 members. More did not help bots.
- For the business: The money in this slice is B2B forecasts to traders and funds (Mantic's seed, FutureSearch's quote-only enterprise tier). The public pricing ladder that exists is $20 to $500 per month. A public track record is how they got customers, and the scoreboards are free. Mantic raised $25M on a tournament result. That is a template for the YC story, but we cannot claim parity with it on a 22-day-old track record.

## Recommendations

1. Enter the Metaculus FutureEval bot tournament and ForecastBench with a plain baseline bot (frontier model plus search, about 10-run ensemble) before launch. Output: a public rank we did not self-grade. Owner: engineering.
2. Define the daily question so each one maps to a Metaculus, Polymarket or Kalshi question. Score Brier against the market price and against our own no-simulation LLM baseline, so the receipts show what the simulation adds. Owner: PM plus engineering.
3. Hash and timestamp forecasts at publish time, exactly as ForecastBench does (no backfill, no questions already resolved). State this on the receipts page in one sentence. Owner: engineering.
4. Do not claim "beats superforecasters" anywhere. Say "scored live against market price since <date>". Owner: PM.
5. Price the API against FutureSearch's $2 to $5 per forecast. Decide whether /v1/simulate is priced per run or per segment, and show cost in the response. Owner: PM.
6. Treat Foresight-32B (Apache-2.0) as a candidate cheap calibration head for scoring agent outputs, and test it on our questions before deciding. Owner: engineering, low priority.

## Open questions

- Are FutureSearch's Metaculus rank claims (#1 of 166 versus #2 of 284) both true for different tournaments? Check the Metaculus leaderboard directly.
- What are Mantic's and Lightning Rod's real prices and customers? Not published. Try a demo request or ask a customer.
- Good Judgment's current AI position is unverified because its site returned 403. Fetch via a browser or ask Warren Hatch's team.
- Does any company publish population or segment-level forecasts with scores? I found none. Check Aaru and Simile in the competitor slices.
- The Reuters story on Mantic disagrees with a newsletter that says rank 8. Confirm with the Metaculus Cup results page.

## Sources

- [FutureEval spring results: pros beat bots but the gap is nearly gone](https://www.lesswrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is), accessed 2026-10-11
- [AI forecasting in 2026: what 11 analyses say](https://www.lesswrong.com/posts/a82q6yd8zKpYk56cF/ai-forecasting-in-2026-what-11-analyses-say), accessed 2026-10-11
- [FRI: How well can LLMs predict the future? (ForecastBench)](https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark), accessed 2026-10-11
- [FRI: LLMs are closing the gap on human superforecasters](https://forecastingresearch.substack.com/p/llms-are-closing-the-gap-on-human), accessed 2026-10-11
- [FutureSearch pricing](https://futuresearch.ai/pricing), accessed 2026-10-11
- [FutureSearch one-pager](https://futuresearch.ai/futuresearch-one-pager.html), accessed 2026-10-11
- [FutureSearch evals](https://evals.futuresearch.ai/), accessed 2026-10-11
- [Mantic raises $25M (Reuters via The Star)](https://www.thestar.com.my/tech/tech-news/2026/09/18/ai-startup-mantic-raises-25-million-for-superhuman-forecasting), accessed 2026-10-11
- [Lightning Rod Foresight-32B model card](https://huggingface.co/LightningRodLabs/foresight-32B), accessed 2026-10-11
- [Future-as-Label (arXiv 2601.06336)](https://arxiv.org/pdf/2601.06336), from search result only, not opened
- [Metaculus FutureEval](https://metaculus.substack.com/p/metaculus-futureeval-ai-forecasting-benchmark), from search result only, not opened
