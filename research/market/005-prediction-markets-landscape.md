# Prediction markets in 2026: landscape, access, and how Real World gets scored against them

- Date: 2026-10-11
- Area: market
- Confidence: medium. Volume and API facts come from primary pages or one dashboard (The Block via Pew). Regulation facts come mostly from trade press, and several primary pages (Metaculus API, Polymarket terms) did not load.

## Answer

Prediction markets are now big and liquid enough to be the public benchmark for a forecasting company. Kalshi and Polymarket together did about $45-53B a month in June-July 2026. Their prices are free to read and easy to snapshot. Real World should score every published forecast against the market price on the same question, using Brier score, and treat the markets as a baseline, not a partner. Partnership is a later, optional step.

## Findings

**Volume.** Combined Kalshi and Polymarket volume (including Polymarket US) was $25.7B in May 2026, $47.7B in June, and $53.0B in July, per [Pew, using The Block data](https://www.pewresearch.org/?p=486284). It was about $8.5B in October 2025. June split: Kalshi $31.5B, Polymarket $10.26B, Polymarket US $3.04B ([The Block](https://www.theblock.co/post/406983/kalshi-polymarket-volume-45-billion)). June and July were inflated by the FIFA World Cup (June 11 to July 19), so do not extrapolate. Sources disagree on exact figures because of notional versus taker volume and whether Polymarket US is counted.

**Sports dominate, politics and macro are the minority.** The World Cup winner market alone drew over $832M on Kalshi. Macro, election and world-event questions are where a world simulation is relevant, and that share is much smaller than the headline.

**Kalshi.** US-regulated. Raised $300M+ at a $5B valuation (Sequoia, a16z) and said it was open to over 140 countries, but its member agreement lists 38 restricted jurisdictions, including the UK, France, Canada, Singapore and Poland ([TradingView/Cointelegraph](https://www.tradingview.com/news/cointelegraph:447497c7d094b:0-kalshi-raises-300m-to-expand-prediction-markets-to-140-countries/)). First formal international deal was Brazil's XP in March 2026, covering Brazilian inflation and rate contracts ([Bloomberg Government](https://news.bgov.com/crypto/kalshi-teams-up-with-brazils-xp-for-first-international-push)). Its API has REST, WebSocket and FIX, a demo environment, and token-bucket limits: Basic gets 200 read tokens per second, with a default request cost of 10 ([Kalshi rate limits](https://docs.kalshi.com/getting_started/rate_limits)). Use is bound by a Developer Agreement I could not read.

**Polymarket.** Global, on-chain, USDC. US users are barred from the main platform. It bought QCEX for $112M in 2025 and runs a CFTC-regulated Polymarket US (fully collateralized). It asked the CFTC on April 28, 2026 to let US users onto the main exchange, with no approval reported, and a new CFTC probe was reported in June 2026 ([The Defiant](https://thedefiant.io/news/regulation/polymarket-seeks-full-cftc-blessing-for-its-on-chain-exchange-report), secondary). Blocks keep spreading: France ordered ISP blocking on July 16, 2026, and Belgium, Spain (temporary), Ukraine and others have acted ([Fintelegram](https://fintelegram.com/?p=81773), secondary). The UK block is self-imposed. Docs show Gamma, CLOB and Data APIs with Python and TypeScript clients ([Polymarket docs](https://docs.polymarket.com/)). Read rate limits are only given as "Standard" in the [builder tiers page](https://docs.polymarket.com/programs/builders/tiers.md). I found no terms page on data reuse.

**Manifold.** Play money (mana), MIT-licensed code (521 stars, [GitHub](https://github.com/manifoldmarkets/manifold)). Public read API with no auth needed for markets, 500 requests per minute per IP, alpha status. Terms allow bots but require a data license for commercial AI training on API data ([Manifold API docs](https://docs.manifold.markets/api)). Good for long-tail and global-event questions, weak as a price benchmark because stakes are fake.

**Metaculus.** Not a market. A forecasting platform with a Community Prediction and a bot tournament series. In the spring 2026 FutureEval, 173 bots (111 outside Metaculus) and a 10-person Pro team forecast 99 shared questions; the bot team's head-to-head score against Pros was -1.25 (95% CI -4.87 to 2.37), not significant, versus -20.03 in Q2 2025. Pros still held nine of the top ten places. The prize pool for outside bot makers was $50,000 ([FutureEval write-up](https://www.greaterwrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is)). It does not compare to market prices. Its API page would not load, so access terms are unverified.

**Neutral benchmark.** ForecastBench draws market questions from Manifold, Metaculus, Polymarket and RAND. On July 16, 2026 FRI said several AI systems are statistically indistinguishable from superforecasters, and one beat the superforecaster median on market questions. FRI also says its superforecaster data dates from 2024, many intervals overlap, and it does not address leakage or market-price access ([FRI](https://forecastingresearch.substack.com/p/ai-models-have-likely-reached-parity)).

**What does not work.** Markets are thin outside sports and US politics. Kalshi and Polymarket cover few non-US questions, and access to both is legally patchy outside the US. Regulation moves monthly, so any dependency on one venue can vanish. LLM forecasters often get market prices as input, which makes "beating the market" meaningless unless the prices are hidden.

## What it means for Real World

- For the product: The daily question and receipts page should show our probability next to the market price and the resolved outcome. Pick questions that exist on a market so a baseline is guaranteed. Add non-market global questions (sourced from Metaculus and Manifold) clearly labelled as having no price baseline, because the global claim needs them.
- For the engineering: Build one read-only `market_snapshot` job per day that stores, for each matched question, the price at publish time from Kalshi, Polymarket and Manifold, with timestamps and the source URL. Hash it together with our forecast. The simulator must never see market prices when forecasting, but the assimilation step may use them, so keep two separate runs and label which one is scored.
- For the business: Scoring against markets is the credible track record YC will look for. Markets are also a possible customer and data partner, but none of the three venues' data terms are clear enough to rely on for a commercial redistribution.

## Recommendations

1. Make "Brier vs market price at publish time" the headline receipt metric. Owner: engineering, due before Oct 27.
2. Build the snapshot job against Kalshi (needs a free account and API key) and Polymarket Gamma (public) first, Manifold third. Store raw JSON and a SHA-256 in the same record as our hashed forecast.
3. Run a "blind" and an "assimilated" forecast per question. Score both. Publish the gap, since it shows what assimilation adds.
4. Submit a bot to the Metaculus bot tournament as free external validation, once someone confirms the API and account terms.
5. Have a lawyer or the PM read the Kalshi Developer Agreement and Polymarket terms before showing market prices publicly or in the API. Until then, show price and a link, and do not redistribute full price history.
6. Do not build trading or market-making. It is out of scope and a regulatory trap.
7. Add a ForecastBench submission after launch as a neutral cross-check.

## Open questions

- Do Kalshi or Polymarket terms allow displaying live prices and storing history in a public product? Read the agreements, then email both for a written answer.
- What are the actual Polymarket read-API rate limits? Test empirically and ask builder@polymarket.com.
- What are the Metaculus API limits and data-use terms? The page did not load; try signed in.
- How many non-US, non-sports questions exist on these markets at any time? Pull a one-day census of open markets by category and country.
- Will Polymarket's US approval or the new CFTC probe change global access before launch? Check the CFTC press releases weekly.

## Sources

- [Pew: prediction market volume doubled May to July](https://www.pewresearch.org/?p=486284), accessed 2026-10-11
- [The Block: Kalshi and Polymarket June volume](https://www.theblock.co/post/406983/kalshi-polymarket-volume-45-billion), accessed 2026-10-11
- [Kalshi API docs, rate limits](https://docs.kalshi.com/getting_started/rate_limits), accessed 2026-10-11
- [Kalshi API docs, index](https://docs.kalshi.com/), accessed 2026-10-11
- [Polymarket docs](https://docs.polymarket.com/), accessed 2026-10-11
- [Polymarket builder tiers](https://docs.polymarket.com/programs/builders/tiers.md), accessed 2026-10-11
- [Manifold API docs](https://docs.manifold.markets/api), accessed 2026-10-11
- [Manifold GitHub](https://github.com/manifoldmarkets/manifold), accessed 2026-10-11
- [FutureEval spring 2026 results (Metaculus, via GreaterWrong)](https://www.greaterwrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is), accessed 2026-10-11
- [FRI: AI models have likely reached parity on ForecastBench](https://forecastingresearch.substack.com/p/ai-models-have-likely-reached-parity), accessed 2026-10-11
- [Kalshi $300M raise, 140 countries (TradingView/Cointelegraph)](https://www.tradingview.com/news/cointelegraph:447497c7d094b:0-kalshi-raises-300m-to-expand-prediction-markets-to-140-countries/), accessed 2026-10-11
- [Bloomberg Government: Kalshi and XP Brazil](https://news.bgov.com/crypto/kalshi-teams-up-with-brazils-xp-for-first-international-push), search snippet only, accessed 2026-10-11
- [The Defiant: Polymarket seeks CFTC approval](https://thedefiant.io/news/regulation/polymarket-seeks-full-cftc-blessing-for-its-on-chain-exchange-report), search snippet only, accessed 2026-10-11
- [Fintelegram: France blocks Polymarket](https://fintelegram.com/?p=81773), search snippet only (page returned 403), accessed 2026-10-11
