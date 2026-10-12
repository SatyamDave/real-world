# Social media data access for daily mood signals

- Date: 2026-10-11
- Area: data
- Confidence: medium. X, YouTube, GDELT, Google Trends and Jetstream facts come from pages I opened. Reddit's commercial terms, Bluesky volume and Telegram limits could not be verified: the web search budget ran out and those pages returned 403 or empty text.

## Answer

Do not build the daily mood signal on social media APIs. The cheap, global, legal option is GDELT (free, 15-minute updates, 65 translated languages) plus Bluesky Jetstream (free, public, but a small and skewed sample) and a small YouTube comment sample. X is now cheap per call but capped and Western-skewed. Reddit is the one source with real attitude content, and its commercial terms are a gate we have not cleared.

## Findings

**X.** The docs now list pure pay-per-use pricing: $0.005 per post returned, $0.015 per post created, $0.20 per post created with a URL, credits bought upfront. Pay-per-use is capped at 3 million post reads per billing cycle, and the page points high-volume buyers to Enterprise. A resource requested twice in 24 hours is billed once. The page lists no Basic or Pro tier. It gives no rate limits and no archive or stream details. Sources: [X pricing](https://docs.x.com/x-api/getting-started/pricing), [About the X API](https://docs.x.com/x-api/getting-started/about-x-api). Arithmetic: 1 million posts a night is $5,000, so a month at the cap is $15,000. A 50,000-post nightly sample is $250 a night, about $7,500 a month. That is far above the $15-60 a night LLM budget.

**Reddit.** The archived API wiki says OAuth2 clients get up to 60 requests per minute and need a descriptive User-Agent that names a Reddit username. It says nothing on commercial use and states the API can change without warning ([reddit-archive wiki](https://github.com/reddit-archive/reddit/wiki/API)). The current Data API Terms and the Developer Platform help page both blocked my fetch, so I cannot confirm today's pricing or AI-use rules. My unverified recollection is that commercial use needs a separate agreement and approval. Treat Reddit as closed until someone reads the terms and emails Reddit.

**Bluesky.** Jetstream is the lightweight JSON firehose. Public instances: `wss://jetstream.us-west.bsky.network` and `wss://jetstream.us-east.bsky.network` (v2, recommended), plus two v1 hosts. You filter by `collections` (NSIDs, wildcards like `app.bsky.feed.*`), `dids` and `kinds`; one subscription takes up to 100 collections and 10,000 DIDs. Replay is v2 only. The repo is dual MIT and Apache-2.0. No cost, no key. The docs I opened give no bandwidth figures, so I cannot state post volume. Sources: [Jetstream docs](https://bsky.network/docs/jetstream/), [Jetstream repo](https://github.com/bluesky-social/jetstream).

**YouTube.** The Data API gives each project 10,000 units a day. `commentThreads.list`, `videos.list` and `comments.list` cost 1 unit each. `search.list` is limited to 100 calls a day. Quota resets at midnight Pacific. Free, but 10,000 comment pages a day is the ceiling, and quota increases go through a compliance audit I did not read. Source: [quota cost](https://developers.google.com/youtube/v3/determine_quota_cost).

**Telegram.** Anyone can get an `api_id` at my.telegram.org, one per phone number. Accounts that log in through unofficial clients are "automatically placed under observation", and spam or flooding gets a permanent ban. The page gives no rate limits and does not mention reading public channels. Reading channels through a user account is a ban risk and a terms grey area. Source: [Telegram API id](https://core.telegram.org/api/obtaining_api_id).

**GDELT.** "100% free and open." GDELT 2.0 events and the Global Knowledge Graph update every 15 minutes, cover 65 live-translated languages, and carry emotion scores. Its sources are news, not social media. Source: [GDELT data](https://www.gdeltproject.org/data.html).

**Google Trends.** An official API exists but is in alpha, by application only. It returns consistently scaled search interest by day, week, month or year, by country and sub-region, over a rolling 5-year window. Source: [Trends API alpha](https://developers.google.com/search/apis/trends).

## What it means for Real World

- For the product: social platforms skew young, urban, English-heavy and male. They will worsen the Western flattening risk. Label any social-derived signal as "online discourse", never as "what the population thinks". The daily question and human panel stay the real attitude anchor.
- For the engineering: build one adapter interface (`fetch(day, region) -> counts, tone, sample ids`) so sources can be swapped. Store aggregates (counts, tone, topic shares), not raw posts. That limits terms-of-service exposure and keeps the nightly job cheap. Use only the 15-minute GDELT feed and Jetstream as always-on streams.
- For the business: X at a useful volume costs more per month than the whole nightly LLM budget. Reddit may need a paid deal. Neither belongs in the Oct 27 launch. A hashed public track record only needs inputs we can name and re-fetch, and GDELT, Trends and Jetstream are the ones with open access.

## Recommendations

1. Make GDELT the primary daily signal for launch: pull the 15-minute files, aggregate tone and theme counts by country and language. Free.
2. Add a Jetstream consumer for `app.bsky.feed.post` only, run for a fixed daily window, keep per-topic counts and language tags. Measure real volume in the first week and write it down; I could not.
3. Apply for the Google Trends alpha today. Use the form with the forecasting use case. Fall back to nothing until accepted; do not scrape Trends.
4. Pull a YouTube comment sample for a fixed list of region-relevant videos, 2,000 to 5,000 units a day, well inside the free quota. Skip `search.list`.
5. Spend X money only as a test: one $50 credit, 10,000 posts across 5 daily questions, compared against GDELT tone for correlation. Decide on continuing from that result.
6. Assign one person to read Reddit's current Data API Terms and email for commercial and research terms. Do not collect Reddit data until the answer is in writing.
7. Skip Telegram for now. No clear terms for reading channels and a real account-ban risk.

## Open questions

- What does Reddit charge today and does it permit using data to drive a forecasting product? Read the terms and ask Reddit's data licensing contact.
- What is Jetstream's daily post volume and language mix? Run a 24-hour count.
- Does X's pay-per-use include recent search, and at what rate limit? The docs I opened were silent; test with a small credit.
- Does a YouTube quota extension audit allow comment sampling at scale? Read the audit guide.
- Mastodon, Threads, TikTok and Weibo were not researched. Region coverage for Asia, Africa and Latin America is the weakest part of this note.
- Searches were cut off by the per-turn search limit, so no third-party pricing commentary was gathered. Confirm X pricing on the Developer Console before budgeting.

## Sources

- [X API pricing](https://docs.x.com/x-api/getting-started/pricing), accessed 2026-10-11
- [About the X API](https://docs.x.com/x-api/getting-started/about-x-api), accessed 2026-10-11
- [Reddit API wiki (archived 2017)](https://github.com/reddit-archive/reddit/wiki/API), accessed 2026-10-11
- [Bluesky Jetstream docs](https://bsky.network/docs/jetstream/), accessed 2026-10-11
- [Bluesky Jetstream repo](https://github.com/bluesky-social/jetstream), accessed 2026-10-11
- [YouTube Data API quota cost](https://developers.google.com/youtube/v3/determine_quota_cost), accessed 2026-10-11
- [Telegram: obtaining api_id](https://core.telegram.org/api/obtaining_api_id), accessed 2026-10-11
- [GDELT data](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [Google Trends API alpha](https://developers.google.com/search/apis/trends), accessed 2026-10-11
