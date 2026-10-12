# Search and attention signals: Google Trends, Wikipedia pageviews, and others

- Date: 2026-10-11
- Area: data
- Confidence: medium. The Wikimedia and Google pages were opened and quoted. The shared web-search budget ran out mid-task, so regional engines (Baidu, Yandex, Naver) and Google's alpha terms are unverified.

## Answer

Wikipedia pageviews are the one attention signal that is free, open (CC0), global, daily and reliable enough to build the nightly pipeline on today. Google Trends is better but gated: the official API is an invite-only alpha, and the workaround is a paid scraper. Use Wikipedia as the backbone, apply to the Trends alpha now, and buy Trends through a scraping vendor only for a small fixed watchlist.

## Findings

**Google Trends official API (alpha).**
- Announced in July 2025 as "Introducing the Google Trends API (alpha)" ([blog index](https://developers.google.com/search/blog/2025/07/trends-api)). I could not read the post body, only the product page.
- Access is by application form. Google prioritizes developers with a clear use case who can start soon and will give direct feedback ([API page](https://developers.google.com/search/apis/trends)).
- It gives a rolling window of the last 5 years. You can compare countries and sub-regions, aggregated by day, week, month or year.
- Values are consistently scaled, not renormalized to 0-100 per query. That matters: you can pull one new day without re-pulling history.
- The page states no quotas, no price and no terms. Treat commercial use and redistribution as unknown.

**Google Trends unofficial.**
- pytrends, the standard scraper, was archived by its owner on Apr 17, 2025, with about 3.7k stars. It calls itself "not an official or supported API" and the rate limit is "unknown." One user reported being blocked after 1,400 sequential requests ([GitHub](https://github.com/GeneralMills/pytrends)). Do not build on it.
- Paid wrappers exist. DataForSEO charges $0.0027 per task in standard queue (up to 45 minutes) or $0.011 live (about 32 seconds), with 5 keywords per task, about $540 or $2,200 per million keywords ([DataForSEO](https://dataforseo.com/apis/google-trends-api)). SerpApi runs $25/month for 1,000 searches up to $725/month for 100,000 ([SerpApi](https://serpapi.com/pricing)). SerpApi does not say whether Trends calls count as searches.
- Both resell scraped Google data, so the terms risk sits with Google, not the vendor. For a YC demo this is fine. For a long-term moat it is not.

**Wikipedia pageviews (Wikimedia Analytics API).**
- Endpoints: per-article, top pages, project aggregate, per-country, and per-country top pages. Data starts July 1, 2015 ([reference](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html)).
- A pageview is a request returning 200 or 304. Self-identified bots are labeled `spider`, heuristic-flagged traffic `automated`. Redirects are not credited to the target page ([concepts](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html)). So a spelling-variant redirect can hide real attention. Resolve redirects when choosing titles.
- License: API data is CC0 1.0, and bulk dumps are at dumps.wikimedia.org ([access policy](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html)). Cleaner than any other source in this slice.
- Every request needs a descriptive User-Agent with contact info, or it may be blocked without notice.
- Published limits for the REST API: unauthenticated under 5 requests per second at concurrency 3; authenticated up to 10 per second. On 429, wait for `Retry-After` ([robot policy](https://wikitech.wikimedia.org/wiki/Robot_policy)). The access policy page gives no pageviews-specific numbers, so assume those figures. At 5 req/s, 10,000 article-days per night is about 35 minutes, which is fine. The dumps are the better route for anything larger.
- The per-language-edition structure is a free multilingual signal. A topic's attention on `ja.wikipedia.org` versus `en.wikipedia.org` is a rough cultural-geography split. It is by language, not by country.

**GDELT** is not a search signal but it is the closest free attention proxy for news volume across 100+ languages. Its DOC, GEO and TV APIs are free and open ([GDELT data](https://www.gdeltproject.org/data.html)). That belongs to the news-ingest slice, not this one.

**What is weak or unverified.**
- Wikipedia is an encyclopedia-reader population: skewed young, educated, urban, and by language rather than nation. It undercounts China, where Wikipedia is blocked, and countries where WhatsApp, TikTok or local engines carry attention.
- Per-country Wikipedia data exists, but I could not read the country-data concept page. I recall privacy thresholds that drop low-count rows, which would hurt small countries. Verify before relying on it.
- Baidu Index, Yandex Wordstat and Naver DataLab cover the three biggest non-Google search markets. I could not open their docs (Naver was blocked to my fetch tool). From memory, they require accounts and are often Chinese-, Russian- or Korean-language only. Treat all three as unverified.
- Attention is not belief. A spike means people looked, not that they changed their minds. Search volume is a good calibration target for "what do agents talk about" and a poor one for "what do agents believe."

## What it means for Real World

- For the product: attention is the cheapest honest signal for the daily question ("what is the world looking at"). Show Wikipedia and Trends curves next to each simulated topic on the receipts page. It is also a scoreable forecast target: "Will page X exceed N views next week" resolves from CC0 data nobody can dispute.
- For the engineering: a single `attention` adapter returns `(topic, locale, date, value, source)`. Wikipedia is the default source. Trends plugs in behind the same interface. Store raw pulls in R2 or similar, dated, so the hashed track record can reference exact inputs. Use Wikipedia values to nudge only agent topic salience, never opinion direction. Redirect resolution and `spider`/`automated` filtering are required.
- For the business: Wikipedia is license-clean, so it can be named in the YC application and the API docs. Trends is not, so label it "optional, Google-sourced" and be ready to drop it. Paying for Trends scraping at $0.0027 per 5-keyword task is trivial at watchlist scale (200 keywords by 60 locales, about 2,400 tasks, about $6.50 per night) but carries terms risk.

## Recommendations

1. Build the Wikipedia adapter first. Use per-article daily views, `access=all-access`, `agent=user`, a descriptive User-Agent, and an authenticated OAuth account if throughput matters. Target: 500 curated topics across the top 20 language editions pulled nightly in under 30 minutes.
2. Submit the Google Trends API alpha application this week. Write a concrete use case: daily assimilation for a public forecasting benchmark. Ask for terms and quotas in writing.
3. Until access arrives, use DataForSEO standard-queue Trends for a watchlist of 100-200 keywords. Budget under $10 per night. Do not use pytrends.
4. Define 5-10 attention forecasts (pageview thresholds) as the first publicly scored question type. They resolve mechanically from CC0 data.
5. Record the source and pull timestamp for every attention value with the nightly hash, so the track record shows what was known when.
6. Defer Baidu, Yandex and Naver until after launch. Flag the China gap openly instead of hiding it.

## Open questions

- What do the Trends alpha terms say about commercial use, caching and redistribution? Answer by applying and asking directly.
- Does Wikimedia's per-country data have a privacy threshold that drops small countries? Read the Country data concept page and sample 10 countries.
- Do Baidu Index, Yandex Wordstat and Naver DataLab have usable programmatic access for a foreign company? Check each developer portal.
- Does a Wikipedia pageview spike lead or lag news volume in GDELT? Test on 2025-2026 events with both CC0 and open data.
- How does SerpApi count Google Trends calls against plan quotas? Ask support.

## Sources

- [Google Trends API (alpha) page](https://developers.google.com/search/apis/trends), accessed 2026-10-11
- [Introducing the Google Trends API (alpha), blog index only](https://developers.google.com/search/blog/2025/07/trends-api), accessed 2026-10-11
- [pytrends on GitHub](https://github.com/GeneralMills/pytrends), accessed 2026-10-11
- [DataForSEO Google Trends API](https://dataforseo.com/apis/google-trends-api), accessed 2026-10-11
- [SerpApi pricing](https://serpapi.com/pricing), accessed 2026-10-11
- [Wikimedia Analytics API pageviews reference](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html), accessed 2026-10-11
- [Wikimedia pageviews concepts](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html), accessed 2026-10-11
- [Wikimedia Analytics API access policy](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html), accessed 2026-10-11
- [Wikimedia robot policy](https://wikitech.wikimedia.org/wiki/Robot_policy), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
