# GDELT 2.0 (Events, GKG, DOC API) as the daily news feed

- Date: 2026-10-11
- Area: data
- Confidence: medium. Update cadence, languages, license and the API rate limit are from primary pages and a live test. The BigQuery price is not confirmed (Google's pricing page returned no text to my fetcher), and the quality critiques are secondhand.

## Answer

GDELT is the right free, global, near-real-time news backbone for the morning assimilation job. Use the raw 15-minute files (GKG first, Events second), not the DOC API and not BigQuery for the nightly path. Treat GDELT as a noisy attention signal (what is being covered, where, in what tone), never as ground truth about what happened.

## Findings

**Cadence and shape.** GDELT 2.0 Events, Mentions and GKG update every 15 minutes, and the BigQuery copies update on the same cadence ([GDELT 2.0 launch post](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/); [data page](https://www.gdeltproject.org/data.html)). 2.0 data starts 19 February 2015. The 1.0 daily files are older and coarser. The live feed is working: the current `lastupdate.txt` points at a 2026-10-12 01:30 UTC batch ([lastupdate.txt](http://data.gdeltproject.org/gdeltv2/lastupdate.txt)). That one batch was a 39 KB Events zip, a 53 KB Mentions zip and a 2.4 MB GKG zip. One quiet-hour sample is not a daily estimate. gdeltPyR's maintainer reports roughly 500 MB for a day of 2.0 data held in memory ([gdeltPyR README](https://github.com/linwoodc3/gdeltPyR)).

**Languages.** 65 languages are machine-translated live into English, covering 98.4% of GDELT's non-English monitoring volume. Native-language emotion scoring exists for only 15 languages ([launch post](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/)). Web NGrams and the quotation graph cover 152 languages ([data page](https://www.gdeltproject.org/data.html)). Everything downstream of the Event and GKG tables is English text produced by machine translation. The codebook itself warns that machine translation is often less accurate than human translation ([Event codebook V2.0](http://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf)).

**What is in the tables.**
- Events use the CAMEO taxonomy, with a Goldstein score from -10 to +10, NumMentions/NumSources/NumArticles, and AvgTone ([Event codebook](http://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf)).
- The Mentions table gives one row per article mention, with a 10-100% extraction Confidence field. The codebook says low confidence means coreference or rewriting was needed to extract the event ([Event codebook](http://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf)).
- GKG 2.1 adds themes, entities, quotations, amounts and the GCAM block, which scores 2,300+ emotion and theme dimensions per article ([GKG codebook V2.1](http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf)). GKG is the richer signal for belief nudging.

**DOC 2.0 API.** It searches roughly the last 3 months of coverage; Python wrapper docs state "officially only" 3 months ([DOC API post](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/); [gdeltdoc, MIT, 231 stars](https://github.com/alex9smith/gdelt-doc-api)). ArtList returns 75 records by default and 250 at most. Timelines have 15-minute resolution under 72 hours. Queries are English keywords against translations. The GEO API is English-only with a 7-day window ([GEO API post](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/)).

**Rate limits, tested live.** The docs give no number. I hit the DOC API three times in a row on 2026-10-12 (UTC). Two calls returned HTTP 429 with the text "Please limit requests to one every 5 seconds". The third returned 200 after 16 s. Responses took 11-16 s each. A narrow query also returned `{}` while still carrying the rate-limit notice. The 429 message tells heavy users to switch to the Web NGrams dataset, and GDELT says the APIs are limited to protect their ElasticSearch clusters ([rate-limit post](https://blog.gdeltproject.org/ukraine-api-rate-limiting-web-ngrams-3-0/)). The API is a single-operator service with no SLA.

**BigQuery.** All live datasets are in BigQuery as `gdeltv2.events`, `gdeltv2.eventmentions` and `gdeltv2.gkg`. The 2015 GKG alone is over 2.5 TB ([data page](https://www.gdeltproject.org/data.html)). On-demand billing is per bytes scanned. The free tier is 1 TiB of queries per month ([BigQuery sandbox docs](https://docs.cloud.google.com/bigquery/docs/sandbox)). I could not load the current per-TiB price; my recollection is about $6.25/TiB, and that is unverified. A query that does not filter on a date or partition column scans the whole table, which can mean several TB, so use a dry run before every new query.

**License.** GDELT states its data is free for academic, commercial and governmental use, with unlimited and unrestricted use. You may mirror and redistribute it, but you must cite GDELT and link to gdeltproject.org ([GDELT about page](https://www.gdeltproject.org/about.html)). No formal license name (CC, ODC) is given. For a YC-stage product, that is fine, but a lawyer would want it written down.

**Quality problems.**
- Coverage reflects what online media publishes, so it skews toward big and Western outlets. GDELT itself says the media inventory is "a long way to go" and gives no accuracy or error rates ([launch post](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/)).
- Event coding is automated (actor, geography and action disambiguation by NLP), and the codebook says the deeper NLP "comes with a higher potential for error" ([Event codebook](http://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf)).
- Event counts rise with the volume of media, not only with real events. Jay Ulfelder and others criticized the original normalization on this ground. Foreign Policy questioned its tracking of Syria ([Wikipedia summary of critiques](https://en.wikipedia.org/wiki/GDELT_Project); I could not open the primary critiques, which were paywalled or private).
- gdeltPyR warns that 2.0 intervals can have gaps ([gdeltPyR README](https://github.com/linwoodc3/gdeltPyR)). GDELT does not offer 2.0 normalization files, so you must sum the 15-minute files yourself ([data page](https://www.gdeltproject.org/data.html)).
- Tone (AvgTone, V2Tone) is a dictionary-based score on translated text. It is weak for sarcasm, quotes and non-English idiom.

## What it means for Real World

- For the product: the daily question and "why did this agent move" traces can cite real GKG themes, quotes and article URLs, which makes the ingest visible. Do not claim GDELT measures what the world believes. It measures what outlets wrote. Show coverage counts per country next to any country-level result, so thin-coverage regions are labeled, not hidden.
- For the engineering: the nightly path should be file-based. Pull the 96 GKG zips (and Events and Mentions if needed) for the last 24 hours from `data.gdeltproject.org/gdeltv2/`, filter in-process, and store the filtered rows as Parquet. This costs nothing in query fees, has no rate limit that I observed, and is replayable. Use `masterfilelist.txt` for backfill (the host redirects http to https). Keep the DOC API only for ad-hoc "what is happening about X" lookups in the fork flow, behind a 5-second throttle, a cache and a graceful empty result.
- For the business: the data cost is about zero (storage and bandwidth only), which leaves the $15-60/night LLM bill as the real cost line. The real risk is dependency on one operator's goodwill and a free API, so the moat cannot be "we use GDELT". The moat is what we do with it and the hashed track record.

## Recommendations

1. Build the ingest as a plain script that fetches the 96 GKG files per UTC day, validates all slots are present, and writes one Parquet file per day. Alert if any slot is missing. Owner: engineering.
2. Add a second source family for every country with thin GDELT coverage (local polls, regional barometers) and show per-country document counts in the UI. A PM can own the coverage table.
3. Collapse before using: group by theme and country, weight by distinct sources (not mentions), and drop Mentions rows with Confidence under about 50 as a starting threshold. Tune it against a held-out week.
4. Treat tone as a feature to be validated: compare GKG tone with prediction-market moves for 30 days before letting it nudge beliefs.
5. Do a BigQuery dry run before any query, and only use BigQuery for one-off historical backfills, partition-filtered, after confirming the current price. Keep the nightly job off it.
6. Ask GDELT (the contact is in the 429 message) in writing to confirm commercial use and the attribution wording, and put the attribution on the receipts page.
7. Snapshot every day's raw GKG into our own storage, so a forecast hash can be replayed even if GDELT edits or drops data.

## Open questions

- What is the real per-day volume of 2.0 Events, Mentions and GKG (compressed and rows)? Download seven days of files and measure, including a spike day.
- What is the current BigQuery on-demand price and the partitioning of `gdeltv2.gkg`? Run a dry run in a billing-enabled project.
- How often do 15-minute slots go missing or arrive late? Run the ingest for two weeks and log it.
- How good is GDELT's translated tone and event coding in low-resource languages (Hausa, Amharic, Bengali, Urdu)? Hand-label a sample of 100 per language with native speakers.
- Is there a stable successor or policy change risk (funding, ownership, API shutdown)? I found no statement, and GDELT is run by one person.
- The web search budget was used up in this run, so I did no independent search for academic comparisons (GDELT vs ICEWS, Hammond and Weidmann 2014). That should be a follow-up.

## Sources

- [GDELT 2.0: Our Global World in Realtime](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/), accessed 2026-10-11
- [GDELT DOC 2.0 API debuts](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/), accessed 2026-10-11
- [GDELT GEO 2.0 API debuts](https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/), accessed 2026-10-11
- [Ukraine, API rate limiting, Web NGrams 3.0](https://blog.gdeltproject.org/ukraine-api-rate-limiting-web-ngrams-3-0/), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [GDELT about page (terms of use)](https://www.gdeltproject.org/about.html), accessed 2026-10-11
- [GDELT 2.0 Event Codebook (PDF)](http://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf), accessed 2026-10-11
- [GDELT GKG 2.1 Codebook (PDF)](http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf), accessed 2026-10-11
- [GDELT 2.0 lastupdate.txt](http://data.gdeltproject.org/gdeltv2/lastupdate.txt), accessed 2026-10-11
- [BigQuery sandbox free tier](https://docs.cloud.google.com/bigquery/docs/sandbox), accessed 2026-10-11
- [gdeltdoc (MIT)](https://github.com/alex9smith/gdelt-doc-api), accessed 2026-10-11
- [gdeltPyR (GPL-3.0)](https://github.com/linwoodc3/gdeltPyR), accessed 2026-10-11
- [GDELT Project on Wikipedia](https://en.wikipedia.org/wiki/GDELT_Project), accessed 2026-10-11 (secondary, for critiques)
- Live test of `api.gdeltproject.org/api/v2/doc/doc`, three requests, 2026-10-12 UTC
