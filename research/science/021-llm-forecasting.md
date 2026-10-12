# LLM forecasting: best scores and methods

- Date: 2026-10-11
- Area: science
- Confidence: medium. The numbers come from primary pages (arXiv, FRI, Metaculus), but several are secondary reposts, ForecastBench figures are from an early-2026 post, and backtest claims are often contaminated.

## Answer

Frontier LLMs with search now beat the public and sit close to superforecasters, but they have not clearly passed them. The best method is boring: a strong model, agentic retrieval, several samples, an average, a cap on extreme probabilities, and a nudge toward the market price. Real World should treat a plain "LLM plus news plus market price" forecaster as the baseline its swarm must beat, and should not claim parity with markets until its own hashed live record shows it.

## Findings

**Halawi et al. (2024, NeurIPS).** Retrieval plus fine-tuning plus ensembling on 5,516 binary questions from 5 platforms (Metaculus, Good Judgment Open, INFER, Polymarket, Manifold). Test set: 914 questions.
- Random 0.250. Best base GPT-4 zero-shot 0.208. Crowd 0.149. Full system 0.179 (accuracy 71.5% vs crowd 77.0%).
- Ablation: no retrieval and no fine-tuning 0.206; no fine-tuning 0.186. Retrieval did most of the work.
- It beats the crowd only when the crowd is unsure (predictions 0.3 to 0.7), and only slightly: 0.238 vs 0.240. It rarely outputs low probabilities, so it loses badly where the crowd is confident.
- Averaging its forecast with the crowd (crowd weighted 4x) gave 0.146 vs 0.149. A blend with the market is what actually wins.
- Source: [arXiv 2402.18563](https://arxiv.org/html/2402.18563v1).

**ForecastBench (Forecasting Research Institute).** About 1,000 auto-generated questions on events unknown at submission time, so no leakage. Difficulty-adjusted Brier, lower is better.
- Original: superforecasters 0.081, best LLM (GPT-4.5) 0.101.
- Later post: Claude 3.5 Sonnet (Oct 2024) 0.117, Grok 4.20 Preview (run Oct 2025) 0.102. Superforecasters lead by 0.017, implying about 0.085. About 0.015 gained in one year.
- Grok entry: 8 samples with web search, X search and a Python tool, averaged. Cassi entry (tied #2/#3): sub-question generation, Tavily retrieval, relevance filter, o3 plus GPT-5 ensemble, then an LLM "crowd adjustment" that revises forecasts far from market price. That step alone improved the ensemble by nearly 0.01 Brier.
- Parity forecast is shaky: November 2026 (95% CI Jan 2026 to Nov 2027), later revised to May 2027 on the Brier Index scale.
- FRI waits 50 days before adding a model. Sources: [FRI post](https://forecastingresearch.substack.com/p/llms-are-closing-the-gap-on-human), [ForecastBench paper](https://arxiv.org/abs/2409.19839).

**Metaculus FutureEval, Spring 2026** (Jan 7 to Apr 15). 173 bots, 297 scored questions, $50,000 bot prize pool.
- 10 Pros beat the top-10 bot team by 1.25 head-to-head points per question. One-sided p = 0.247, not significant. Q2 2025 was -20.03, a clear Pro win.
- Nine of the top 10 individual places still went to Pros.
- Bots scored -2.51 on binary, -5.02 on multiple choice, +3.47 on numeric questions.
- Top bot (GreeneiBot2): AskNews, Perplexity, GPT-5 search and link readers. Best open-source bot (nostreambot, 11th): median ensemble of frontier models plus Grok. Official baseline (GPT-5.1 high reasoning, AskNews, a roughly 30-line prompt, 5 samples averaged) ranked 18th of 173.
- Teams of 2 to 10 bots score about the same. Averaging all 173 is clearly worse. Perplexity Sonar Pro and AskNews are statistically tied. Seven of the top 10 makers were hobbyists.
- Source: [Metaculus write-up on LessWrong](https://www.lesswrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is).

**Prophet Arena (Kalshi markets, ICLR 2026).** 1,367 resolved events before 2025-10-11, 23 models.
- GPT-5 reasoning: Brier 0.184, ECE 0.042. Market baseline: Brier 0.187, ECE 0.069. Grok-4 0.189, Claude Sonnet 4 0.194, Llama-4-Scout 0.219.
- Even GPT-5 returns 0.943 per dollar, so it loses money trading. Markets absorb breaking news faster, so models lose near resolution.
- Models recall events badly, especially climate and politics, and extra sources make them more conservative than the market.
- Source: [arXiv 2510.17638](https://arxiv.org/html/2510.17638v2). The Lightning Rod claim that its 32B model beats GPT-5 is vendor self-report on a different question set; ignore it.

**Cross-study synthesis** ([AI Forecasting in 2026: what 11 analyses say](https://www.lesswrong.com/posts/a82q6yd8zKpYk56cF/ai-forecasting-in-2026-what-11-analyses-say)).
- Helps: frontier model choice, agentic iterative search (removing search made Brier 3.6x worse in one ablation), ensembling (86% of Fall 2025 winners), Platt scaling (about 0.016 Brier gain on binary), capping extreme predictions.
- Does not help or unproven: multi-persona aggregation, "Bayesian" prompts, prompts tuned to match the community prediction, small open-weight fine-tunes (prior-generation parity only).
- Parity claims from backtests are suspect. One paper's 0.0934 vs crowd 0.0952 depended on Platt scaling applied to the bot only, and an informal replication did not hold. Models cannot reliably "forget" outcomes they saw in training; one study found a 52% Brier gap.

## What it means for Real World

- For the product: The daily forecast must be scored against the market price, because that is the bar a plain LLM already nearly meets (0.184 vs 0.187). Show the LLM-only baseline next to the swarm on the receipts page. If the swarm cannot beat it, say so. Scenario forks ("a chip shortage doubles phone prices") have no resolved outcome, so none of these benchmarks validate them. Do not borrow forecast accuracy claims for forks.
- For the engineering: Build one baseline forecaster first: a frontier model, agentic search over the GDELT and news feed, 5 to 8 samples, trimmed mean, probabilities clipped to roughly 0.02 to 0.98, then a market-adjustment step. Store every sample and the retrieved context with the hash. Reuse the same question set and Brier code as ForecastBench so numbers are comparable. Use only forward, live questions; hindcasts are contaminated for any model whose training cutoff is after the event.
- For the business: "Superforecaster parity" is the claim everyone is chasing and no one has proven. A public hashed record that cannot be backfilled is rare, but at 22 days to the YC application the record will be short. Report n, the spread, and the market baseline honestly. A small honest record beats a large inflated one.

## Recommendations

1. Ship an LLM-only baseline forecaster (frontier model, agentic search, 5 to 8 samples, trimmed mean) by Oct 20, and score it daily from day one. Owner: engineering.
2. Add the market-price blend as a separate, logged step. Halawi's 4x crowd weight and Cassi's crowd adjustment both gained about 0.003 to 0.01 Brier. Tune the weight on live data, not backtests.
3. Clip extreme probabilities and run Platt scaling only after at least a few hundred resolved live questions; log both raw and calibrated values.
4. Publish three Brier numbers on the receipts page: market price, LLM-only baseline, swarm forecast, on the same questions with the count n. Add a difficulty adjustment later if question sets differ.
5. Submit the baseline to ForecastBench's tournament and the Metaculus FutureEval (next season) as an outside check. An external leaderboard rank is stronger YC evidence than self-reported scores.
6. Keep cheap ensembles small: 4 to 10 samples or bots, not hundreds. Aggregating many weak forecasters is worse than a few strong ones.
7. Do not fine-tune for the launch. Halawi's tuned model gained 0.003 to 0.007 Brier, and small open-weight tunes only match old frontier models.

## Open questions

- What is the live ForecastBench leaderboard now? The figures here are from an early-2026 post and the 50-day lag; fetch forecastbench.org directly.
- Cost per question for the baseline (search calls plus 5 to 8 samples) is not reported by any source. Measure it on 50 questions.
- Does a 100,000-agent swarm add any information beyond an LLM reading the same news? No paper tests this. Our own ablation on live questions is the only way to find out, and it is the claim the company stands on.
- Which question types suit Real World? Prophet Arena shows weak recall in politics and weather; numeric questions favored bots in FutureEval. Pick daily questions with that in mind.

## Sources

- [Approaching Human-Level Forecasting with Language Models (Halawi et al.)](https://arxiv.org/html/2402.18563v1), accessed 2026-10-11
- [ForecastBench: A Dynamic Benchmark of AI Forecasting Capabilities](https://arxiv.org/abs/2409.19839), accessed 2026-10-11
- [LLMs Are Closing the Gap on Human Superforecasters (FRI)](https://forecastingresearch.substack.com/p/llms-are-closing-the-gap-on-human), accessed 2026-10-11
- [FutureEval Spring 2026 results (Metaculus)](https://www.lesswrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is), accessed 2026-10-11
- [LLM-as-a-Prophet: Prophet Arena](https://arxiv.org/html/2510.17638v2), accessed 2026-10-11
- [AI Forecasting in 2026: what 11 analyses say](https://www.lesswrong.com/posts/a82q6yd8zKpYk56cF/ai-forecasting-in-2026-what-11-analyses-say), accessed 2026-10-11
- [Lightning Rod prediction markets page (vendor claim, not relied on)](https://www.lightningrod.ai/solutions/prediction-markets), accessed 2026-10-11
