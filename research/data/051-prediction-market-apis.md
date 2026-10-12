# Prediction market APIs: Kalshi, Polymarket, Manifold, Metaculus

- Date: 2026-10-11
- Area: data
- Confidence: medium. Endpoints and rate limits come straight from vendor docs. Commercial-use terms for Kalshi, Polymarket and Metaculus could not be read (blocked or empty pages), so the legal half is unverified.

## Answer

Kalshi, Polymarket and Manifold all expose free, keyless read endpoints for prices and history that are enough for a once-a-day assimilation job and a public Brier-vs-market scoreboard. Metaculus is the awkward one: its API needs a token, and we could not read its docs or terms. Before launch, get written permission or read the terms for display and redistribution, because the docs do not grant a commercial license on any of the three big sources. Manifold is the only one that says in plain words what is allowed and what needs a paid license.

## Findings

**Kalshi (regulated US exchange).**
- Production base URL is `https://external-api.kalshi.com/trade-api/v2`. The quick-start says no auth headers are needed for series, events, markets and orderbook reads ([Kalshi quick start](https://docs.kalshi.com/getting_started/quick_start_market_data)).
- Trading calls need an account, an API key, and an RSA-PSS SHA-256 signature on each request, sent in `KALSHI-ACCESS-KEY`, `-TIMESTAMP` and `-SIGNATURE` headers ([Kalshi API keys](https://docs.kalshi.com/getting_started/api_keys)). We do not need that for read-only work.
- History: `GET /series/{series_ticker}/markets/{ticker}/candlesticks` with `start_ts`, `end_ts` and `period_interval` of 1, 60 or 1440 minutes. It returns OHLC for yes bid, yes ask and trade price, plus volume and open interest as fixed-point strings. The spec lists no auth requirement ([Kalshi candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks)).
- Settled markets move to separate `/historical/...` endpoints after a cutoff you read from `GET /historical/cutoff`. Live endpoints stop returning them. Any backfill must query both ([Kalshi historical data](https://docs.kalshi.com/getting_started/historical_data)).
- Rate limits are per-second token budgets. Basic tier is 200 read tokens per second, and most requests cost 10 tokens, so about 20 reads per second. Higher tiers go up to 12,000 read tokens per second ([Kalshi rate limits](https://docs.kalshi.com/getting_started/rate_limits)). Daily reads of a few hundred markets fit easily.
- Terms: the docs say use of the API means agreeing to the Kalshi Developer Agreement. The agreement page returned HTTP 429 and was not read.

**Polymarket (crypto order book, Polygon).**
- Three read hosts: Gamma `gamma-api.polymarket.com` for events and market metadata, CLOB `clob.polymarket.com` for books and prices, Data `data-api.polymarket.com` for trades and activity ([Polymarket API intro](https://docs.polymarket.com/api-reference/introduction)).
- Price history exists in two forms. The CLOB `/prices-history` endpoint and a newer Data API `GET /v2/prices-history` that takes a `token_id`, an `interval`, `start`/`end` in epoch seconds or an `as_of` point-in-time read, and `bucket_seconds`. Explicit ranges span at most 15 days. Full-history ("max") comes back at 12-hour buckets by default. Finer buckets are retained only for a while: 1-minute at least 7 days, 5-minute at least 60 days, 30-minute at least 90 days ([Polymarket prices history](https://docs.polymarket.com/market-data/prices-order-books.md)). The docs do not say whether the v2 endpoint needs auth.
- Rate limits are IP-based, enforced by Cloudflare, and requests are delayed rather than rejected. Gamma `/markets` is 300 per 10 seconds, `/events` 500, CLOB `/prices-history` 1,000, Data v2 `/prices-history` 200 ([Polymarket rate limits](https://docs.polymarket.com/api-reference/rate-limits)).
- Geoblocking applies to order placement. The US, UK, France, Germany, Singapore and others are close-only. The page does not say read-only data is blocked ([Polymarket geoblock](https://docs.polymarket.com/api-reference/geoblock)).
- Terms: the Terms of Use page returned only a banner, so the data-use clause was not read ([Polymarket terms](https://polymarket.com/tos)). The API docs carry no license or attribution statement ([Polymarket market data overview](https://docs.polymarket.com/market-data/overview.md)).

**Manifold (play money).**
- Base URL `https://api.manifold.markets/v0`. Reads need no key. Limit is 500 requests per minute per IP, and using multiple IPs to get around it is prohibited. `GET /v0/markets` pages 1,000 at a time, `/v0/bets` returns up to 1,000 per page, `/v0/market-probs` takes up to 100 markets. The docs call the API alpha and say it may break ([Manifold API docs](https://docs.manifold.markets/api)).
- Terms are explicit. Bots and integrations are allowed. Scraping outside the API is not. Using API data to train AI/ML models commercially needs a paid data license. Non-commercial use is fine ([Manifold API docs](https://docs.manifold.markets/api)).
- Free bulk dumps of bets, markets and comments since December 2021 are non-commercial only and were last updated 2024-07-06. A commercial license adds AI/ML training rights. Price is unpublished, contact data@manifold.markets ([Manifold data](https://docs.manifold.markets/data)).

**Metaculus (forecasting platform, not a market).**
- The API docs (`metaculus.com/api/`) fetched as an empty page, the redoc schema and terms of use returned HTTP 403, and a web search was refused by budget. So we have no first-hand endpoint list, rate limits or license text.
- What we do know: the official `forecasting-tools` library (MIT) reads a `METACULUS_TOKEN` from the environment, so authenticated access is the normal path. It wraps question lookup by post id, tournament listing and prediction posting ([Metaculus forecasting-tools](https://github.com/Metaculus/forecasting-tools)). The README documents no rate limits and no raw paths.

**What does not work.**
- Kalshi and Polymarket price history is coarse and has retention limits. Polymarket's fine-grained data expires in weeks to months, so we must snapshot it ourselves every day. History we do not store now may not exist later.
- Manifold prices are play money. They are a crowd signal, not a market price to claim a Brier win against.
- A reasonable-looking read of the docs is not a license. None of Kalshi, Polymarket or Metaculus states in the pages we read that commercial display is allowed.

## What it means for Real World

- For the product: the daily question and the receipts page need a price to beat. Kalshi and Polymarket are the credible "market price" baselines. Show Manifold and Metaculus as secondary crowd readings, labeled as such. Store the market price at the moment we publish each forecast hash, next to the hash.
- For the engineering: one small fetcher per source behind a common `snapshot(market_id) -> {ts, yes_price, bid, ask, volume}` shape. Run it daily, and also at forecast-publish time. Write raw responses to storage untouched. Keyless reads mean no secrets on day one. Budget is trivial: a few hundred markets a day sits far under every limit above. Use the Kalshi `/historical` split and Polymarket's retention windows as reasons to store, not to re-query.
- For the business: the scoreboard's credibility rests on market prices we may not be licensed to redistribute. Display of a single price with a link back is low risk. Republishing a full price history through our API (`POST /v1/simulate` outputs, SDK data) is higher risk. Manifold's AI-training clause also bites if we ever use its data to tune agents. Fix this before the Oct 27 launch.

## Recommendations

1. Build the snapshot job first, for Kalshi and Polymarket, starting today. Every day of stored prices is history nobody can backfill later. Owner: engineer, about one day.
2. Pick the scoring baseline now: Kalshi last-trade or mid price at the moment of forecast hash, Polymarket as a cross-check. Write it down on the receipts page so a PM can explain it in one line.
3. Read the Kalshi Developer Agreement and the Polymarket Terms of Use in a browser this week, and email both and Metaculus for display and redistribution permission. A PM can own this.
4. In the public API, return our own forecast and the baseline price only as a number with a source link. Do not expose raw price series from third parties until licensing is clear.
5. Keep Manifold data out of any training or fine-tuning path. Use it only as a displayed signal. If we want its history for calibration, ask data@manifold.markets for a quote.
6. Treat Metaculus as optional for launch. Skip it unless a token and written terms are in hand by Oct 20.

## Open questions

- Do Kalshi and Polymarket terms allow commercial display, redistribution or derived-data use? Read the Kalshi Developer Agreement and the Polymarket Terms of Use directly, then ask each by email.
- Does Polymarket's `/v2/prices-history` or CLOB `/prices-history` require auth, and does CLOB history differ from v2 in retention? Test with a plain `curl` from our server.
- Does Kalshi require a signature for candlesticks in practice, despite the spec listing none? Test unauthenticated.
- What are Metaculus's endpoints, rate limits and data license? Open its API docs and terms in a logged-in browser, since our fetch was blocked.
- Is Polymarket read data blocked from US IPs where our servers run? Test from the deploy region.

## Sources

- [Kalshi API welcome](https://docs.kalshi.com/welcome), accessed 2026-10-11
- [Kalshi quick start, market data](https://docs.kalshi.com/getting_started/quick_start_market_data), accessed 2026-10-11
- [Kalshi API keys](https://docs.kalshi.com/getting_started/api_keys), accessed 2026-10-11
- [Kalshi rate limits](https://docs.kalshi.com/getting_started/rate_limits), accessed 2026-10-11
- [Kalshi get market candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks), accessed 2026-10-11
- [Kalshi historical data](https://docs.kalshi.com/getting_started/historical_data), accessed 2026-10-11
- [Polymarket API introduction](https://docs.polymarket.com/api-reference/introduction), accessed 2026-10-11
- [Polymarket rate limits](https://docs.polymarket.com/api-reference/rate-limits), accessed 2026-10-11
- [Polymarket prices and order books](https://docs.polymarket.com/market-data/prices-order-books.md), accessed 2026-10-11
- [Polymarket market data overview](https://docs.polymarket.com/market-data/overview.md), accessed 2026-10-11
- [Polymarket geoblock](https://docs.polymarket.com/api-reference/geoblock), accessed 2026-10-11
- [Polymarket terms (banner only, not read)](https://polymarket.com/tos), accessed 2026-10-11
- [Manifold API docs](https://docs.manifold.markets/api), accessed 2026-10-11
- [Manifold data](https://docs.manifold.markets/data), accessed 2026-10-11
- [Metaculus forecasting-tools (GitHub)](https://github.com/Metaculus/forecasting-tools), accessed 2026-10-11
