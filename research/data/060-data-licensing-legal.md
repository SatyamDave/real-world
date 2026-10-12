# Data licensing and legal for the Real World data stack

- Date: 2026-10-11
- Area: data
- Confidence: medium. The IPUMS, GDELT and Pew terms were read on their own pages. WVS, Polymarket, Kalshi, Gallup and Google Trends terms could not be read in full, and the web-search budget ran out mid-task. Nothing here is legal advice.

## Answer

The census microdata plan is the main legal problem. IPUMS International bars commercial use outright and bars redistribution to third parties, so a for-profit product cannot build its agents from it as planned. GDELT is the only source checked that is clearly open for commercial use with attribution. Real World should treat every survey source as "ask in writing, get a licence, or use only published aggregates", and should do that before launch on Oct 27, not after the YC application.

## Findings

**IPUMS International.** The terms page says commercial use is strictly prohibited and that redistribution of the data to third parties is prohibited. Each team member must be licensed individually. Users must cite IPUMS and the national statistical authority. Any attempt to identify persons or households is prohibited. Results that might reveal identity may not be published in any form. The page does not mention derivative works. ([IPUMS-I terms](https://international.ipums.org/international/terms.shtml))

**IPUMS USA** is looser on one point only: IPUMS says it will consider requests for free and commercial redistribution of sample data. Full Count data may not be redistributed at all. ([IPUMS USA terms](https://usa.ipums.org/usa/terms.shtml)) This is a request path, not a grant. The footer mentions commercial use and rules for derived tables, but I could not read those rules.

**World Values Survey.** Downloads need free registration and agreement to a "non-redistribution data use license". Data is free of charge. The page does not state whether commercial use is allowed, and the licence text was not shown. Citation uses DOIs, for example Wave 7 v4.0.0, 10.14281/18241.18. ([WVS documentation](https://www.worldvaluessurvey.org/WVSContents.jsp?CMSID=Documentation)) The archive contact is listed as wvsa.secretariat@gmail.com.

**Pew Research Center.** Section 13 of Pew's terms grants a royalty-free, nonexclusive, non-sublicensable, non-transferable, revocable, worldwide licence for survey datasets, except American Trends Panel data, which has its own terms. Data may be shared only as excerpts, not in full or substantially in full. You may not try to identify respondents or imply Pew endorses your conclusions, and you must carry the line that Pew bears no responsibility for your analyses. The terms do not clearly say "commercial use is allowed" for datasets. ([Pew terms](https://www.pewresearch.org/about/terms-and-conditions/))

**Afrobarometer.** Data is copyrighted. Publications must carry the required citation string and a copy of the work should be sent to Afrobarometer. Early access is for African students and similar users, and the page says nothing about commercial use or redistribution. ([Afrobarometer policy](http://www.afrobarometer.org/data/data-usage-and-access-policy/))

**Gallup.** The World Poll page sends partners to a contact form for custom research and links a "Public Datasets" page. No pricing or commercial terms are stated. ([Gallup World Poll](https://www.gallup.com/analytics/318875/global-research.aspx)) The Gallup terms-of-use URL I tried returned 404.

**GDELT.** The project says its datasets are available for unlimited and unrestricted use, academic, commercial or governmental, free. Redistribution and mirroring are allowed. The one condition is a citation to the GDELT Project with a link to gdeltproject.org. ([GDELT about](https://www.gdeltproject.org/about.html)) GDELT holds derived records: events, a knowledge graph, n-grams, and a 600-character context snippet per location mention, not full article text. ([GDELT data](https://www.gdeltproject.org/data.html)) The licence covers GDELT's data. It does not make the underlying publishers' articles free to copy, so fetching the linked articles and storing the text is a separate legal act.

**Prediction markets.** Polymarket's terms page showed only a banner that trading is blocked in the US on polymarket.com, and its API docs page said nothing about data licence or rate limits. ([Polymarket terms](https://polymarket.com/tos), [Gamma API docs](https://docs.polymarket.com/developers/gamma-markets-api/overview)) The Kalshi rulebook fetch failed with HTTP 429. Reading prices to score forecasts is a different act from reselling or republishing a price feed, and I could not confirm either side's position.

**Scraping law.** In hiQ v. LinkedIn the Ninth Circuit held in 2019 and again in 2022 that scraping public pages likely was not a CFAA violation. The Supreme Court had vacated the first ruling in June 2021 after Van Buren. In November 2022 the district court found hiQ breached LinkedIn's User Agreement, and the parties settled. ([hiQ v. LinkedIn](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn)) The lesson: scraping public data may not be a crime, but it can still be a breach of contract and cost the business.

**Copyright and training.** In Bartz v. Anthropic (June 23, 2025) the court held that training on lawfully obtained copies was fair use and that building a library from pirated copies was not. Anthropic settled for $1.5 billion in September 2025, about $3,000 per book. ([Bartz v. Anthropic](https://en.wikipedia.org/wiki/Bartz_v._Anthropic)) This is a US district-court ruling, so it is not binding elsewhere. In the EU, the DSM Directive's Article 4 allows text and data mining for any purpose unless the rightholder has opted out. A 2024 German decision and the AI Act's wording are cited as treating it as covering AI data collection. ([DSM Directive](https://en.wikipedia.org/wiki/Directive_on_Copyright_in_the_Digital_Single_Market)) I did not read the directive text itself, and I did not verify how a valid opt-out must be made.

## What it means for Real World

- For the product: The "agents sampled from IPUMS microdata" claim cannot be made for a commercial product under current terms. The public receipts page and fork feature publish agent traces. Any trace that exposes a real-looking individual record from a licensed file would breach the no-redistribution and no-identification terms.
- For the engineering: Build agents from synthetic populations fitted to published marginals, not from raw rows. Keep each source in its own folder with a `LICENSE_NOTES.md` and a machine-readable manifest of licence, citation string and whether raw rows may leave the build machine. Store raw licensed files outside the public repo and outside any container image that is shipped. Keep GDELT as URLs plus derived fields and do not cache article bodies in a public bucket.
- For the business: A YC reviewer will ask about data rights for a "census-grounded" claim. An honest answer, "we use free open sources now and are negotiating licences for the rest", is safer than a claim that fails on the first read of the IPUMS terms. Licence cost for Gallup, and any IPUMS commercial arrangement, are open budget lines.

## Recommendations

1. Email IPUMS International and IPUMS USA this week, asking in writing whether a commercial product may use microdata to fit a synthetic population, with no row-level output. Keep the reply in `docs/legal/`.
2. For launch, generate the population from published aggregates and open data, and label the method "calibrated to published marginals" until a written permission exists.
3. Send the same written question to the WVS secretariat, Pew, Afrobarometer and Gallup. Record whether commercial use is permitted, whether derived model outputs count as redistribution, and the exact citation string.
4. Add a `data/SOURCES.md` table: source, licence, commercial OK (yes, no, unknown), redistribution OK, citation text, who checked and when. Make `unknown` block use in the nightly job.
5. Render a "Data and attribution" footer on the web app and a `sources` field in every `/v1/simulate` response, carrying each citation string. GDELT needs a link to gdeltproject.org. Pew needs its disclaimer line.
6. Do not scrape sites whose terms forbid it. For news, use GDELT metadata, publisher RSS and licensed APIs. Do not store or republish article text.
7. Read the Polymarket and Kalshi API terms in full and keep price use to scoring and display of a derived comparison, not a mirrored feed, until a lawyer confirms.
8. Book one hour with a data-licensing lawyer before Oct 27 with this list in hand. Real money is spent on the question that matters most, the IPUMS one.

## Open questions

- Do WVS, Gallup and Pew permit commercial use of survey data? Answer by emailing each and reading the WVS licence text after login.
- Does an LLM agent whose prompt is conditioned on a microdata row count as a derivative work or as redistribution? No source here addresses it. Ask IPUMS and a lawyer.
- What do the Polymarket, Kalshi and Metaculus terms say about commercial use of their prices? The pages could not be read in full.
- Do publishers' terms of service and EU opt-outs block downloading articles linked from GDELT? Needs a per-publisher check.
- Are participant data from an opt-in daily panel and twins covered by GDPR special-category rules (political opinions)? I did not research it. It needs consent text and a lawyer.

## Sources

- [IPUMS International terms of use](https://international.ipums.org/international/terms.shtml), accessed 2026-10-11
- [IPUMS USA terms of use](https://usa.ipums.org/usa/terms.shtml), accessed 2026-10-11
- [WVS documentation and data use notice](https://www.worldvaluessurvey.org/WVSContents.jsp?CMSID=Documentation), accessed 2026-10-11
- [Pew Research Center terms and conditions](https://www.pewresearch.org/about/terms-and-conditions/), accessed 2026-10-11
- [Afrobarometer data usage and access policy](http://www.afrobarometer.org/data/data-usage-and-access-policy/), accessed 2026-10-11
- [Gallup World Poll](https://www.gallup.com/analytics/318875/global-research.aspx), accessed 2026-10-11
- [GDELT about page](https://www.gdeltproject.org/about.html), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [Polymarket terms of use](https://polymarket.com/tos), accessed 2026-10-11 (banner only)
- [Polymarket Gamma API docs](https://docs.polymarket.com/developers/gamma-markets-api/overview), accessed 2026-10-11 (no terms stated)
- [hiQ Labs v. LinkedIn, Wikipedia](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn), accessed 2026-10-11 (secondary)
- [Bartz v. Anthropic, Wikipedia](https://en.wikipedia.org/wiki/Bartz_v._Anthropic), accessed 2026-10-11 (secondary)
- [Directive on Copyright in the Digital Single Market, Wikipedia](https://en.wikipedia.org/wiki/Directive_on_Copyright_in_the_Digital_Single_Market), accessed 2026-10-11 (secondary)
