# Regional barometers for non-Western grounding

- Date: 2026-10-11
- Area: data
- Confidence: medium. Coverage facts for Afrobarometer, Arab Barometer and Latinobarómetro come from their own pages. The Asian Barometer and Eurobarometer pages I could open said almost nothing about terms, and no license text was found for any of the five. WebSearch ran out of budget, so every claim rests on direct page fetches.

## Answer

Four of the five barometers are free to download and cover roughly 100 countries between them: Afrobarometer, Latinobarómetro, Arab Barometer and Eurobarometer. None publishes an open license such as CC-BY, and none says anything clear about commercial use or about feeding the data to an LLM. The Asian Barometer sits behind an application process whose terms I could not read. Real World should use these as calibration targets for non-Western agents, not as bulk training data, and should email all five before launch to get written permission.

## Findings

**Afrobarometer.** The countries page lists [45 countries](https://www.afrobarometer.org/countries/). Wikipedia puts round 1 at 12 countries (1999-2001), round 5 at 35, round 6 at 36 and round 7 at 34, with [rounds 8 and 9 running 2019-2023](https://en.wikipedia.org/wiki/Afrobarometer). Samples are 1,200, 1,600 or 2,400 per country. Merged datasets and codebooks per round, plus geocoded subnational files, are on the [data page](https://www.afrobarometer.org/data/), which calls them "free for you to use". The [usage policy](http://www.afrobarometer.org/data/data-usage-and-access-policy/) requires a fixed citation string and asks users to email their publications. It states no license and says nothing on commercial use or redistribution. Geocoded data is restricted: users must apply and personally commit to securing it. Early access is limited to African students and generally excludes researchers and faculty.

**Latinobarómetro.** About 20,000 interviews a year in [18 countries](https://www.latinobarometro.org/latContents.jsp), with a time series from 1995 and a 2026 report. The [site](https://www.latinobarometro.org/lat.jsp) offers an online analysis tool, per-wave aggregated data and a time series. Microdata files exist, but the pages I opened gave no terms of use and no formats. The contact is latinobarometro@latinobarometro.org. With 18 countries and about 1,100 interviews each, any country-level cut is thin.

**Arab Barometer.** Nine waves since 2006. Wave VIII (2023-24) covered eight countries, wave VII (2021-22) covered twelve, and [wave IX](https://www.arabbarometer.org/survey-data/data-downloads/) (Sep 2025 to May 2026) lists nine, including Syria, with no datasets posted yet. The site's own country counts conflict: 15 in the nav, 17 in another section. Downloads need a short form with name, email, country and a stated purpose, and "commercial use" is one of the listed options. The data is "publicly available at no charge". The [permissions policy](https://www.arabbarometer.org/policies/) covers reprinting of text and translation, and is silent on commercial use of data. Gulf coverage is patchy: Saudi Arabia appears only in 2010-11 and Qatar only in 2016-17.

**Asian Barometer.** The site's [data page](https://www.asianbarometer.org/) shows wave 6 releases for Japan, Malaysia and Singapore, plus data-application statistics. It gave no procedure or terms in what I could fetch. Two deeper URLs returned 404. From general knowledge, not verified here: access is by application, and the license is research-only. Treat that as unconfirmed.

**Eurobarometer.** The Standard series has run since 1974, with Flash and Special surveys alongside, and candidate-country series ([Wikipedia](https://en.wikipedia.org/wiki/Eurobarometer)). Microdata for re-use sits at GESIS, which blocked my fetch with a 403, so I have no access or license text. The European Commission publishes reports freely. It is the least useful of the five for non-Western grounding, because it is Western by design.

**Overlap with other sources.** The World Values Survey and Gallup World Poll already cover most of these countries. The barometers add depth on local politics, trust in institutions and daily economic life, not breadth. I did not compare question wording across the five. Harmonized cross-barometer data exists (the Global Barometer idea), but I did not verify what is public.

## What it means for Real World

- For the product: These are the cheapest way to show real coverage of Africa, Latin America and the Arab region, which directly answers the "Western flattening" risk. The receipts page can say which survey grounds each region's agents. Do not claim Asian coverage from this slice.
- For the engineering: Plan for SPSS/Stata files (the Arab Barometer lists SAV, DTA and CSV for early waves) and per-country weights. Build one loader per survey that maps to a shared item schema, and keep the raw files out of the repo. Sample sizes of 1,200 to 2,400 per country mean agents are drawn from marginals or small cells, so expect variance collapse in small segments. Check weights before using any subgroup.
- For the business: The risk is license ambiguity, not cost. "Free to download" is not "free to use in a paid API". Using survey results as calibration targets (aggregates) is much safer than shipping respondent-level rows through the API or showing them in agent traces. A written reply from each institution is cheap insurance before a YC application that names these sources.

## Recommendations

1. Email all five (Afrobarometer, Latinobarómetro, Arab Barometer, Asian Barometer, GESIS) this week. Ask two questions: may we use the data to calibrate a commercial simulation product, and may we publish aggregates derived from it. Keep the replies in the repo's docs.
2. Start with Afrobarometer rounds 8 and 9 and Arab Barometer wave VIII. They are the easiest to get and the most complementary to WVS. Add Latinobarómetro once the terms email is answered.
3. Use them as aggregate targets for the daily assimilation step, per country and per item. Do not expose respondent rows in the API, the trace view or the public repo.
4. Skip Eurobarometer for the launch build. Revisit only if a European forecast question needs it.
5. Record license status per source in a small table (source, access, permission, date asked) so engineers and the PM read the same status. Block any new source from the loader until the row is filled in.
6. Do not claim Asian coverage on launch day unless the Asian Barometer terms are resolved. Use WVS and national sources for Asia instead.

## Open questions

- What are the actual license terms for Latinobarómetro, Asian Barometer and GESIS Eurobarometer? Ask by email, or read the terms pages I could not open.
- Is the latest Afrobarometer round (9) fully public, and how many countries does it have? The data page and Wikipedia did not say.
- Do any of the five forbid use of their data in AI training or model evaluation? None of the pages I opened addressed it. Ask directly.
- Which items are comparable across barometers and WVS? Needs a codebook comparison; I did not do one.
- How are Afrobarometer sample weights defined for subnational cuts? Read the codebook before any region-level claim.

## Sources

- [Afrobarometer data](https://www.afrobarometer.org/data/), accessed 2026-10-11
- [Afrobarometer data usage and access policy](http://www.afrobarometer.org/data/data-usage-and-access-policy/), accessed 2026-10-11
- [Afrobarometer countries](https://www.afrobarometer.org/countries/), accessed 2026-10-11
- [Afrobarometer, Wikipedia](https://en.wikipedia.org/wiki/Afrobarometer), accessed 2026-10-11
- [Latinobarómetro home](https://www.latinobarometro.org/lat.jsp), accessed 2026-10-11
- [Latinobarómetro contents](https://www.latinobarometro.org/latContents.jsp), accessed 2026-10-11
- [Arab Barometer data downloads](https://www.arabbarometer.org/survey-data/data-downloads/), accessed 2026-10-11
- [Arab Barometer reprints, permissions and use policy](https://www.arabbarometer.org/policies/), accessed 2026-10-11
- [Arab Barometer home](https://www.arabbarometer.org/), accessed 2026-10-11
- [Asian Barometer home](https://www.asianbarometer.org/), accessed 2026-10-11
- [Eurobarometer, Wikipedia](https://en.wikipedia.org/wiki/Eurobarometer), accessed 2026-10-11
