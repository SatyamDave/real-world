# Free and cheap daily market and price data

- Date: 2026-10-11
- Area: data
- Confidence: medium. FX and commodity sources were opened and confirmed. Equity-index and country fuel price sources are weak, and the web search budget ran out, so I could not run broader searches or check Stooq, EIA series lists or FRED rate limits.

## Answer

Real World can get daily FX for free and cleanly. It can get monthly commodity prices for free and cleanly. Daily equity indices and country-level fuel prices are the weak spots: the free options are either personal-use only or not daily. Use Frankfurter and FRED/EIA for the daily feed, the World Bank Pink Sheet and IMF files for monthly commodity context, and treat fuel prices by country as a paid or derived input.

## Findings

**FX: solved.**
- [Frankfurter](https://frankfurter.dev/) takes rates from 104 central banks and official sources, covers 223 currencies, goes back to 1948, updates daily, and has no quotas (only abuse rate limits). The page says the API is free for commercial use. It offers CSV and NDJSON output and can be self-hosted with Docker.
- The code is MIT-licensed, about 2.0k stars ([repo](https://github.com/lineofflight/frankfurter)). The rates themselves fall under each provider's terms, so check that per source before redistributing.
- The [ECB reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) are the primary source: 29 currencies against the euro, published around 16:00 CET on working days, as CSV, XML or RSS. The ECB says they are for information only. It suspended the rouble rate after 1 March 2022.
- Blunt point: 29 currencies is not "the whole world". Frankfurter's blend is the only free route to wide coverage. Some of its sources publish weekly or monthly and are left out of the blended daily feed.

**US rates, macro and commodities: FRED.**
- [FRED's API](https://fred.stlouisfed.org/docs/api/fred/overview.html) is free with a key. The [terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) require a visible notice ("This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis"). They bar apps that replace FRED's own experience. Many series are third-party copyright and need the owner's permission for anything beyond personal use.
- The Fed can change rate limits at any time. I did not find a published number, so I do not claim one.
- Practical read: fine for ingesting a handful of US series into our own state. Do not mirror FRED, and do not republish copyrighted series in our public API.

**US energy: EIA.**
- [EIA's open data API](https://www.eia.gov/opendata/documentation.php) is free with a registered key, puts the key in the URL, and suspends keys that exceed throttles. Data is free under EIA's reuse policy. It has over 2 million series.
- I could not confirm the exact daily Brent/WTI/Henry Hub route IDs from the pages I opened. Verify them before building.

**Monthly commodity context.**
- The [World Bank Pink Sheet](https://www.worldbank.org/en/research/commodity-markets) is monthly, as XLS and PDF. The latest release is 2 October 2026 and the next is 3 November 2026. World Bank datasets default to [CC BY 4.0](https://datacatalog.worldbank.org/public-licenses), which allows commercial use with attribution.
- The [IMF commodity prices](https://www.imf.org/en/Research/commodity-prices) page is also monthly (XLSX dated September 2026). It states no terms on that page.
- Neither is daily. They are good for slow-moving priors, not for the morning nudge.

**Equity indices: no clean free daily source.**
- [yfinance](https://github.com/ranaroussi/yfinance) is Apache-2.0 with about 25.5k stars, but it is unaffiliated with Yahoo and its README says the Yahoo API is "intended for personal use only." A public product with a public API should not depend on it.
- [Alpha Vantage](https://www.alphavantage.co/premium/) gives 25 requests a day free. Paid tiers run $49.99/month (75 requests/min) up to $249.99/month (1,200 requests/min). 25 requests a day covers about 25 symbols, which is a few indices per region at most.
- Stooq: I tried to open its CSV endpoint and it returned empty content. I could not verify its terms or whether it works without a browser. Do not plan around it until tested.

**Fuel prices by country: the real gap.**
- The World Bank "pump price for gasoline" indicator (EP.PMP.SGAS.CD) sits in [WDI Database Archives](https://api.worldbank.org/v2/indicator/EP.PMP.SGAS.CD?format=json), sourced from GIZ. A data query for 2016-2024 returned "indicator was not found". Treat it as dead.
- [GlobalPetrolPrices](https://www.globalpetrolprices.com/data_access/) covers 150+ countries, but its site content is CC BY-NC-ND 3.0. Data feeds and Excel are sold with no listed price and a two-week trial. Its fuel email is monthly. Scraping it is a licence problem.
- Workaround: use crude and refined spot prices (EIA daily) plus Pink Sheet monthly levels plus FX to estimate pump-price moves, and label the result as modeled, not observed.

## What it means for Real World

- For the product: the "a chip shortage doubles phone prices" kind of shock needs a baseline of prices. FX, oil and a few indices give a credible daily world state for a global sim. Country fuel and food prices will be modeled, so say so in the trace.
- For the engineering: keep a thin ingest per source that writes one dated row per series (source, series id, value, fetched_at, source_url). Store raw responses. Run it at a fixed UTC time before the assimilation step. Missing days carry forward and are flagged, not filled silently.
- For the business: the public hashed track record depends on repeatable inputs. Free feeds with unclear redistribution terms (Yahoo, copyrighted FRED series, GlobalPetrolPrices) are a risk to the public API. Pick sources whose terms allow storing and quoting values.

## Recommendations

1. Build the FX ingest on Frankfurter first (one HTTP call a day, CSV). Self-host it later if rate limits bite. Owner: engineering, half a day.
2. Add FRED and EIA with free keys for a short fixed list: US 10-year yield, USD index, WTI, Brent, Henry Hub, US gasoline. Show the FRED notice in the footer. Exclude any series whose notes say "Copyright".
3. Load the Pink Sheet and IMF monthly files into the same table schema as slow-moving priors. Credit the World Bank per CC BY 4.0.
4. For equity indices, pick 8 to 12 headline indices (one or two per region) and test two sources in a one-day spike: Stooq (confirm it works and its terms) and Alpha Vantage free. Do not use yfinance in anything public. Decide by day 3.
5. Do not chase country pump prices. Ship modeled fuel prices labeled as estimates. Ask GlobalPetrolPrices for a quote only if a customer needs observed values.
6. Write a one-page source register (source, terms link, can we store, can we redistribute, notice text) and keep it in the repo, so a PM and an engineer read the same facts.

## Open questions

- Does Stooq's CSV work server-side, and what are its terms? Test with a script from our server IP.
- What are FRED's numeric rate limits and EIA's exact throttles? Read the linked API key and limits pages.
- Which of Frankfurter's 104 sources allow redistribution? Check `/v2/providers` and each provider's terms.
- Are there daily country fuel price sources from government open data (EU Weekly Oil Bulletin, national regulators)? I did not search for them. This is the next thing to check.
- What does GlobalPetrolPrices charge? Email them.

## Sources

- [Frankfurter](https://frankfurter.dev/), accessed 2026-10-11
- [Frankfurter repo](https://github.com/lineofflight/frankfurter), accessed 2026-10-11
- [ECB euro reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html), accessed 2026-10-11
- [FRED API overview](https://fred.stlouisfed.org/docs/api/fred/overview.html), accessed 2026-10-11
- [FRED API terms of use](https://fred.stlouisfed.org/docs/api/terms_of_use.html), accessed 2026-10-11
- [EIA open data documentation](https://www.eia.gov/opendata/documentation.php), accessed 2026-10-11
- [World Bank commodity markets (Pink Sheet)](https://www.worldbank.org/en/research/commodity-markets), accessed 2026-10-11
- [World Bank data catalog licenses](https://datacatalog.worldbank.org/public-licenses), accessed 2026-10-11
- [World Bank pump price indicator metadata](https://api.worldbank.org/v2/indicator/EP.PMP.SGAS.CD?format=json), accessed 2026-10-11
- [IMF commodity prices](https://www.imf.org/en/Research/commodity-prices), accessed 2026-10-11
- [yfinance](https://github.com/ranaroussi/yfinance), accessed 2026-10-11
- [Alpha Vantage premium](https://www.alphavantage.co/premium/), accessed 2026-10-11
- [GlobalPetrolPrices data access](https://www.globalpetrolprices.com/data_access/), accessed 2026-10-11
