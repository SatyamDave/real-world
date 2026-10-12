# News ingestion open source: GDELT clients, trafilatura, news-please, newspaper4k

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Versions, licenses and the extraction benchmark come from primary pages I opened. The web search budget ran out before I could run searches, so GDELT rate limits and multilingual extraction quality outside the benchmark are not verified.

## Answer

Use GDELT's raw 15-minute files (GKG and Events) as the nightly signal, and trafilatura only when we need full article text. Skip gdeltPyR (GPL-3, stale) and skip news-please and newspaper4k as the extractor. Call the DOC 2.0 API with a thin client, but do not build anything that depends on it for history.

## Findings

**GDELT itself.**
- GDELT 2.0 updates Events, Mentions and GKG every 15 minutes, and the data is described as "100% free and open" ([GDELT data page](https://www.gdeltproject.org/data.html)).
- It machine-translates 65 languages into English. GDELT says those cover 98.4% of its non-English monitoring volume ([GDELT 2.0 announcement](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/)).
- GKG gives derived metadata: themes, people, organizations, locations, quotes, and GCAM emotion scores. The announcement does not say it ships full article text. In practice GDELT gives you URLs plus metadata, and you fetch the page yourself.
- The task brief says "100+ languages". The primary pages I opened only support 65 translated. Treat 100+ as unverified.

**DOC 2.0 API.**
- It is a full-text search API over news. Article-list mode returns 75 records by default and 250 at most ([DOC 2.0 announcement](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)).
- Search runs on the English translation. Custom time ranges only reach the last 3 months.
- No rate limit is documented on that page. Expect throttling anyway and design for retries.

**GDELT client libraries.**
- [gdeltdoc](https://github.com/alex9smith/gdelt-doc-api): MIT, 231 stars, v1.12.0 uploaded 2025-04-03 on [PyPI](https://pypi.org/pypi/gdeltdoc/json), Python 3.10+. It wraps only the DOC API: keyword, domain, country (FIPS), language (ISO 639), theme, tone filters, and timeline modes. No release in about 18 months. Its README repeats the 3-month limit.
- [gdeltPyR](https://github.com/linwoodc3/gdeltPyR) (PyPI name `gdelt`): GPL-3.0, 259 stars, last PyPI release 0.1.14 on 2023-11-27 ([PyPI](https://pypi.org/pypi/gdelt/json)). The README still references Python 2.7 and Travis CI. It does pull Events, Mentions and GKG, and warns about missing 15-minute intervals. It says one day of 2.0 data can be about 500 MB in memory. GPL-3 is a problem for a product with a hosted API and SDKs.
- I found no package called "gdelt-py". The brief's name most likely means gdeltPyR.

**Extractors.** The trafilatura project publishes its own benchmark (labeled 2026-10-02, 990 documents, Python 3.13) at [trafilatura evaluation](https://trafilatura.readthedocs.io/en/latest/evaluation.html). F-scores:

| Tool | F-score | Time vs baseline |
|---|---|---|
| trafilatura 2.3.0 (standard) | 0.926 | 2.9x |
| magic-html 0.1.8 | 0.889 | 3.5x |
| readability-lxml 0.9 | 0.853 | 3.0x |
| news-please 1.6.16 | 0.836 | 20.9x |
| newspaper4k 0.9.6 | 0.803 | 6.8x |

- Caveat: trafilatura's authors run this benchmark. The set is mostly German, with 20-30% English, French, other European languages, Chinese and Arabic. Nothing in it is Hindi, Swahili or Bengali. Treat the ranking as plausible, not proven for the whole world.
- [trafilatura](https://github.com/adbar/trafilatura): Apache-2.0 (GPL before v1.8.0), about 7.0k stars, v2.3.1 uploaded 2026-10-06, Python 3.10+ ([PyPI](https://pypi.org/pypi/trafilatura/json)). Core dependencies are small: lxml, courlan, htmldate, justext, charset_normalizer. It also does feed and sitemap discovery, metadata, and optional language detection. It is the only one of the three updated this week.
- [news-please](https://github.com/fhamborg/news-please): Apache-2.0, about 2.5k stars. It is a crawler plus extractor with Elasticsearch, PostgreSQL and Redis storage and a Common Crawl news mode. The README says the team lacks resources for feature requests. The benchmark shows it slowest at 20.9x baseline, though that figure includes non-extraction work.
- [newspaper4k](https://github.com/AndyTheFactory/newspaper4k): MIT, about 1.1-1.2k stars, v0.9.6 on 2026-07-19 ([PyPI](https://pypi.org/pypi/newspaper4k/json)). It forks newspaper3k, which has had no update since September 2020. It claims 80+ languages, needs optional extras for Chinese, Japanese, Thai, Hindi and others, and lists about 180 inherited issues still to verify.

**Bulk alternative.** [CC-NEWS](https://commoncrawl.org/blog/news-dataset-available) is a daily set of WARC files of news pages on S3 since 2016, built with StormCrawler. The post gives no license for the content. Useful for backfill and training, not for a 7am run.

## What it means for Real World

- For the product: GDELT gives breadth, not truth. It is machine-translated, and its source mix leans toward outlets that publish online in languages it can translate. Public copy should say the world model is assimilated from "a news sample", not "the world's news". That keeps the Western-flattening risk honest.
- For the engineering: the nightly job needs two stages. Stage 1 reads GKG/Events files and aggregates themes, tone and locations per country per day, with no scraping. Stage 2 fetches full text only for a capped set of URLs per country and runs trafilatura on them. Stage 1 alone is cheap and deterministic. Stage 2 is where cost, failures and legal questions live. Keep the two stages separate so a PM can see which numbers came from which.
- For the business: Apache-2.0 and MIT libraries are safe to ship in an SDK. gdeltPyR (GPL-3) is not. Republishing scraped article text is a separate legal question from reading it. Store derived features and URLs, not article bodies.

## Recommendations

1. Build stage 1 first: download the 15-minute GKG and Events files for the previous day, aggregate by country and theme, and save a dated snapshot. About 150 lines of Python with `requests` and `pandas`. No third-party GDELT library.
2. Add `gdeltdoc` only for the live "what is happening about X" lookup in the web app. Pin it at 1.12.0 and wrap it behind one function so we can drop it. Do not use it for backfill.
3. Use trafilatura 2.3.x for any full-text fetch. Use `bare_extraction` with metadata on, and store only the extracted fields we need (language, date, source, short summary), not the body.
4. Do not adopt news-please or newspaper4k. Revisit newspaper4k only if a language-specific need appears that trafilatura misses.
5. Build a small multilingual test set before launch. Sample 20 pages each from about 10 languages, including Hindi, Arabic, Swahili, Indonesian and Bengali. Score extraction by eye or against hand-cut text. This is a one-day task and it replaces the German-heavy benchmark with our own evidence.
6. Log per-country article counts every night. If a region falls under a floor, mark its beliefs as "not updated today" rather than guessing.

## Open questions

- What are the DOC API and raw file download rate limits today? Test by running our stage 1 job for a week and logging HTTP 429 and gaps.
- How good is GDELT's machine translation for low-resource languages, and does it drop or garble named places? Compare 50 translated URLs per language against the original text.
- Does GKG coverage differ sharply by region? Count distinct source domains per country per day from the last 30 days of files.
- Are the GDELT Terms of Use and publisher terms compatible with showing headlines and URLs on a public globe? Needs a lawyer or at least a careful read of the linked Terms.
- Is the 100+ language claim in the brief from a different GDELT page than the 65-language pages I opened?

## Sources

- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [GDELT 2.0: Our Global World in Realtime](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/), accessed 2026-10-11
- [GDELT DOC 2.0 API debuts](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/), accessed 2026-10-11
- [gdeltdoc on GitHub](https://github.com/alex9smith/gdelt-doc-api), accessed 2026-10-11
- [gdeltdoc on PyPI](https://pypi.org/pypi/gdeltdoc/json), accessed 2026-10-11
- [gdeltPyR on GitHub](https://github.com/linwoodc3/gdeltPyR), accessed 2026-10-11
- [gdelt (gdeltPyR) on PyPI](https://pypi.org/pypi/gdelt/json), accessed 2026-10-11
- [trafilatura on GitHub](https://github.com/adbar/trafilatura), accessed 2026-10-11
- [trafilatura on PyPI](https://pypi.org/pypi/trafilatura/json), accessed 2026-10-11
- [trafilatura evaluation](https://trafilatura.readthedocs.io/en/latest/evaluation.html), accessed 2026-10-11
- [news-please on GitHub](https://github.com/fhamborg/news-please), accessed 2026-10-11
- [newspaper4k on GitHub](https://github.com/AndyTheFactory/newspaper4k), accessed 2026-10-11
- [newspaper4k on PyPI](https://pypi.org/pypi/newspaper4k/json), accessed 2026-10-11
- [Common Crawl: CC-NEWS](https://commoncrawl.org/blog/news-dataset-available), accessed 2026-10-11
