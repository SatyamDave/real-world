# Official statistics APIs and daily/weekly signals

- Date: 2026-10-11
- Area: data
- Confidence: medium. Eight primary pages were opened and are cited. The OECD, ECB and GDELT-adjacent pages returned 403/503, the web search budget ran out, and several limits below are marked "unverified".

## Answer

Official statistics are slow. Almost nothing from the World Bank, IMF, OECD or UN moves daily. The only true daily official series are exchange rates and central-bank policy rates. Everything else (CPI, unemployment) is monthly or quarterly, with a published release date. Real World should use official statistics as a calendar-driven anchor layer, not a daily assimilation feed: pull a small set of free, keyless APIs, store each release with its publication date, and let news, polls and markets carry the daily signal.

## Findings

**What each API gives us (verified from the docs):**

- World Bank Indicators API: base `https://api.worldbank.org/v2`, no key needed. Version 1 is dead. The docs page states no rate limit and no update frequency. It covers annual and some quarterly data, so it is a priors source for agent demographics and economy, not a signal. The terms page I opened does not name a Creative Commons licence. Dataset terms live on a separate page I could not confirm. Treat the licence as "check before redistributing". [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation), [terms](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets)
- IMF: data is served through SDMX 2.1 and SDMX 3.0 APIs on the new data.imf.org portal. Exploring the Swagger docs needs a beta-portal sign-in. The page says nothing on rate limits. The older `dataservices.imf.org` JSON service is, from memory, being retired. I could not confirm this, so do not build on it. [IMF API page](https://data.imf.org/en/Resource-Pages/IMF-API)
- Eurostat: open, no auth on the Statistics API (JSON-stat 2.0) and SDMX 2.1/3.0 endpoints under `ec.europa.eu/eurostat/api/dissemination`. Small queries return in seconds, full datasets can take minutes. No rate limit stated. Eurostat is the best free source for euro-area CPI and unemployment. [Eurostat API guide](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started)
- UNdata: REST and SOAP SDMX at `data.un.org/ws/rest/`. XML, JSON and CSV. It only covers datamarts that have an SDMX structure, and the page says coverage grows "gradually". No limits stated. It is a legacy-feeling service; use it only for UN-specific tables. [UNdata API](https://data.un.org/Host.aspx?Content=API)
- BIS: SDMX REST API with JSON/XML/CSV, a release calendar exposed through the API, and a bulk-download page. BIS carries policy rates and effective exchange rates for many central banks. I could not read the base URL or update frequency. [BIS tools](https://data.bis.org/help/tools)
- OECD: has an SDMX API with a tight anonymous query cap (I recall about 20 queries per hour; unverified, the page returned 403). Plan to cache aggressively and fetch bulk files instead. [OECD API explainer](https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html) (not readable)
- ECB Data Portal: returned 503 when fetched. From memory it offers a keyless SDMX API with euro reference rates published once per working day around 16:00 CET. Unverified. [ECB API overview](https://data.ecb.europa.eu/help/api/overview) (not readable)

**National sources worth the effort (verified):**

- BLS (US): API v2 with a free registered key gives 500 queries per day, 50 series per query, 20 years per query. Without a key it is 25 queries, 25 series, 10 years. [BLS API FAQ](https://www.bls.gov/developers/api_faqs.htm)
- BLS CPI calendar: the next two releases are 10 November 2026 (October data) and 10 December 2026 (November data), both 08:30 ET. So there is no US CPI print inside our launch window. [BLS CPI schedule](https://www.bls.gov/schedule/news_release/cpi.htm)
- FRED: every request needs a 32-character `api_key`, one key per application and per user. The terms bar redistribution of third-party series. Series with "Copyright" in their notes need the owner's permission, and apps that replicate FRED's core experience are barred. No numeric rate limit is published on the pages I read; I recall 120 requests per minute, unverified. FRED is a convenient mirror of many national series but it is a licensing trap for a public API that re-serves data. [FRED key page](https://fred.stlouisfed.org/docs/api/api_key.html), [FRED terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html)
- Frankfurter (FX): free, no key, rates from 104 central banks and official sources, 223 currencies, updated daily, history back to 1948. It is open source, can be self-hosted with Docker, and is free for commercial use. The rates themselves fall under each provider's terms. Rate-limited only to prevent abuse. This is the cleanest daily official signal we found. [Frankfurter docs](https://frankfurter.dev/docs/)

**Cadence reality (mixed: verified above, general knowledge below):**

- Daily: FX reference rates, some central-bank policy rate decisions (event-driven, not daily).
- Monthly with a fixed calendar: CPI, unemployment, retail sales, industrial production, PMIs (PMIs are private surveys, not official).
- Quarterly or annual: GDP, World Bank indicators, census-type data.
- Release lag matters more than frequency. Unemployment for a given month usually lands 2 to 6 weeks later, and many countries are slower. Low-income countries often publish annually with multi-year lag or not at all.

## What it means for Real World

- For the product: the daily question and receipts page should treat official data as scheduled resolution events ("US CPI, 10 Nov"), not as a daily nudge. A calendar view of upcoming releases is a cheap, credible feature, and every forecast on a release date can be scored against the official number.
- For the engineering: one small ingest module per source, writing rows of (series, country, period, value, published_at, fetched_at, source_url). The `published_at` column is the anti-contamination guard: an agent update may only see values whose publication date is on or before the simulated day. Store raw responses so the hashed track record can be audited. Skip OECD and IMF-legacy at first; start with World Bank, Eurostat, BLS, Frankfurter and BIS.
- For the business: most free sources are fine for internal use, but redistribution terms differ. FRED third-party series and World Bank dataset terms are the two to check before the public API returns official data in responses. Expose our own derived outputs, with links back to the source, not raw copies.

## Recommendations

1. Build `ingest/official` with five adapters only: Frankfurter (daily FX), World Bank (annual priors), Eurostat (euro-area CPI, unemployment), BLS (US CPI, unemployment), BIS (policy and effective exchange rates). One day of work each at most, no framework.
2. Add the `published_at` rule from day one. Never join a value to a simulated day before its publication date.
3. Hard-code a release calendar file (BLS dates are public; Eurostat and BIS expose calendars) and show it in the web app as "upcoming resolutions".
4. Request a free BLS v2 key now. Do not depend on FRED for anything we re-serve.
5. Write a one-page licence table (source, licence, attribution text, redistribution allowed) before launch on 27 October. Ask for written confirmation from the World Bank if we serve their numbers.
6. For the 100,000-agent global sample, use World Bank and UN tables only for priors and sanity checks. Expect gaps in Africa and South Asia and mark those countries as low-data in outputs rather than filling them in silently.

## Open questions

- OECD anonymous limits, the ECB API terms and the IMF new-portal limits: not confirmed because pages blocked the fetch. Test with a few live calls from the ingest box.
- Whether the IMF legacy JSON service is actually shut down. Check by calling it once.
- World Bank dataset licence: read the "Terms of Use for Datasets" page directly in a browser.
- Which countries publish monthly CPI and unemployment at all. Build a coverage table by calling Eurostat, the World Bank and national offices for the 30 largest countries.
- Whether any official series beats news and markets as a daily signal. We expect FX only; test it once ingestion runs.

## Sources

- [World Bank Indicators API documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation), accessed 2026-10-11
- [World Bank terms of use](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets), accessed 2026-10-11
- [IMF API resource page](https://data.imf.org/en/Resource-Pages/IMF-API), accessed 2026-10-11
- [Eurostat API getting started](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started), accessed 2026-10-11
- [UNdata API](https://data.un.org/Host.aspx?Content=API), accessed 2026-10-11
- [BIS Data Portal tools](https://data.bis.org/help/tools), accessed 2026-10-11
- [BLS API FAQ](https://www.bls.gov/developers/api_faqs.htm), accessed 2026-10-11
- [BLS CPI release schedule](https://www.bls.gov/schedule/news_release/cpi.htm), accessed 2026-10-11
- [FRED API key page](https://fred.stlouisfed.org/docs/api/api_key.html), accessed 2026-10-11
- [FRED API terms of use](https://fred.stlouisfed.org/docs/api/terms_of_use.html), accessed 2026-10-11
- [Frankfurter docs](https://frankfurter.dev/docs/), accessed 2026-10-11
