# Global data quality by country: coverage tiers and a confidence score

- Date: 2026-10-11
- Area: data
- Confidence: medium. Source-page facts are verified; the country tier assignments are my judgment from those facts plus background knowledge, not a measured index. The web-search budget ran out mid-task, so I used direct page fetches only and could not confirm WVS wave-7 counts or most survey license terms.

## Answer

Rich data for all four inputs (census microdata, attitude surveys, market prices, news) exists for roughly 20 to 30 countries, mostly high-income. Most of the world has a survey layer from Gallup or a regional barometer, a stale census, no prediction markets, and news that GDELT reads through translation. Real World should score every country on a five-part rubric, show the score on every agent, forecast, and receipt, and ship Tier A and B countries as the headline product. Tier C and D countries should be labelled "low confidence" at launch.

One finding changes the plan: IPUMS International bars commercial use and sharing, so it cannot be the production census source for a company. Check that before building on it.

## Findings

**Census microdata (the agent skeleton)**
- IPUMS International holds 104 countries, 656 censuses and surveys, over 1 billion person records, free of charge ([IPUMS International](https://international.ipums.org/international/)).
- Its terms say data may not be shared with third parties, each team member must be licensed individually, and commercial use is prohibited ([IPUMS terms](https://international.ipums.org/international/terms.shtml)). A hosted product that samples from it is very likely a violation. Get written permission or treat it as research-only.
- Census recency is uneven. In the UN 2020-round table, India's latest listed census is February 2011, Nigeria's is March 2006, Ethiopia's is 2007. DR Congo, Lebanon and Afghanistan list none. Only 6 of 34 Afghan provinces were enumerated by end-2014. India and Nigeria show 2026 expected dates ([UN census dates](https://unstats.un.org/unsd/demographic-social/census/censusdates/)). The three most populous countries outside China and the US therefore have 15-to-20-year-old microdata or none.

**Attitude surveys (the belief layer)**
- Gallup World Poll: more than 160 countries and areas since 2005. Typical sample is at least 1,000 adults; China and Russia get at least 2,000. Phone in the US, Canada, Western Europe, Japan and Australia; face-to-face elsewhere. Some unsafe areas are excluded ([Gallup methodology](https://www.gallup.com/178667/gallup-world-poll-work.aspx)). Respondent-level data is sold; only a few client datasets are public ([Gallup public datasets](https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx)). Expect a paid license.
- WVS: about 100 countries over seven waves, 1,000 minimum per country, wave 8 planned for 2023 to 2026 ([Wikipedia, WVS](https://en.wikipedia.org/wiki/World_Values_Survey)). Wave-7 country count is not confirmed from the official site (I recall about 64; unverified). WVS says it has terms on commercial use, redistribution and registration but the page does not state them ([WVS](https://www.worldvaluessurvey.org/WVSContents.jsp)).
- Pew Global Attitudes: 36 to 37 countries per recent survey ([Pew](https://www.pewresearch.org/global/)). Mostly phone or face-to-face; the US and Australia use online panels ([Pew methodology](https://www.pewresearch.org/methodology/international-survey-research/international-methodology/)).
- Afrobarometer: 30+ countries, 1,200 to 2,400 face-to-face interviews each, 41 national partners ([methods](https://www.afrobarometer.org/surveys-and-methods/), [about](https://www.afrobarometer.org/about/)). Free to use; the access policy page was not read, so commercial terms are unconfirmed.
- Arab Barometer: 17 countries ever, but only 8 in wave IX; Egypt, Algeria, Libya, Sudan and Kuwait dropped out of recent waves ([Arab Barometer](https://www.arabbarometer.org/about/)). That is a coverage hole in exactly the region where fieldwork is hardest.
- Latinobarómetro: 18 countries, about 20,000 interviews a year, so roughly 1,100 per country, since 1995 ([Latinobarómetro](https://www.latinobarometro.org/lat.jsp)).
- European Social Survey: 30+ countries, every two years, free for non-commercial use ([ESS](https://www.europeansocialsurvey.org/about-ess)). Asian Barometer is on its sixth wave with country-by-country releases ([Asian Barometer](https://www.asianbarometer.org/)).
- A sample of 1,000 per country cannot support sub-national or demographic cuts. Real World's segment outputs will be mostly prior, not data, outside the top tier.

**Market and news signals**
- Polymarket is blocked or banned in France, Brazil, Italy, Singapore, South Korea and others, and was blocked for US users from 2022 to December 2025. About 63% of trades are sports ([Wikipedia, Polymarket](https://en.wikipedia.org/wiki/Polymarket)). Market prices exist for elections, wars and macro in a few dozen countries; for the rest there is no price to beat.
- GDELT translates 65 languages into English, covering 98.4% of non-English volume, and updates every 15 minutes ([GDELT 2.0](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/)). Critiques from 2013 to 2014 flagged noisy CAMEO event coding and coverage-change artefacts ([Wikipedia, GDELT](https://en.wikipedia.org/wiki/GDELT_Project)). That evidence is old and I found no current accuracy study. Treat GDELT as volume and tone, not as a count of events.

## What it means for Real World

- For the product: Show a confidence tier on every agent, country forecast and receipt. "100,000 agents worldwide" is true only in the sense that each has a label. Publish the tier map on the receipts page; it is also honest marketing against Western flattening.
- For the engineering: Compute one `country_confidence` record per country from five inputs, stored as data with a date, and refreshed monthly. Gate behaviour on it: ensemble spread widens, belief nudging weakens and the forecast is flagged when the score is low. A missing input scores zero; a check that could not run is not a pass.
- For the business: The IPUMS license is a legal risk to the YC story. The data moat is the daily assimilation and hashed record, not census access, so buy or license commercial microdata (national statistical offices, DHS-type public surveys, WorldPop/GHSL-style synthetic grids) for Tier C and D rather than relying on research-only sources.

## Recommendations

1. Adopt this rubric, 0 to 100, five equally simple parts: **Population** (0-25: census within 10 years and microdata licensed for commercial use = 25; census 10 to 20 years old = 12; none or unlicensed = 0). **Attitudes** (0-25: two or more independent survey series within 3 years at n of at least 1,000 = 25; one series = 12; Gallup only or older than 5 years = 5). **Markets** (0-15: liquid prediction-market prices on that country's events = 15; thin = 5; none = 0). **News** (0-20: strong local-language press in a GDELT-translated language = 20; partial = 10; censored or not translated = 0). **Ground truth** (0-15: free, timely official outcomes such as elections, CPI, polls to score against = 15; slow or contested = 5). Tiers: A 75 and up, B 50 to 74, C 25 to 49, D below 25.
2. Launch with Tier A and B as the headline countries and mark the rest "prior-driven." Do not hide the label.
3. Fetch the IPUMS decision this week: email ipums@umn.edu for commercial terms, and in parallel find one licensed substitute for the top 10 countries by population.
4. Read the WVS, Gallup and Afrobarometer license pages and record, per source, commercial use yes/no/unknown in a small table in the repo. Block any source marked unknown from the production pipeline.
5. Scale ensemble spread by tier. Tier D forecasts should be wide by construction, which also guards against variance collapse.
6. Score Brier by tier on the public record, so the tier claim is itself falsifiable. If Tier C does no better than a constant guess, say so.

## Illustrative tier assignment (my judgment, to be replaced by computed scores)

- **Tier A:** US, UK, Germany, France, Japan, South Korea, Canada, Australia, Spain, Italy, Poland, Netherlands (ESS, Pew, Gallup phone, strong press, markets, fresh census).
- **Tier B:** Brazil, Mexico, Argentina, Chile, Colombia (Latinobarómetro, strong press; Brazil's Polymarket ban hurts markets), Turkey, Israel, Taiwan, South Africa, Indonesia.
- **Tier C:** India (2011 census, strong press and polls, little public microdata), Nigeria, Kenya, Egypt, Philippines, Pakistan, Vietnam.
- **Tier D:** China, Russia (surveys exist but unreliable under censorship), Iran, Saudi Arabia, DR Congo, Ethiopia, Afghanistan.

## Open questions

- What does IPUMS or a national statistics office charge for commercial use? Ask directly.
- Which WVS wave-7 countries, and what are WVS commercial terms? Read the official documentation PDF.
- How accurate is GDELT tone and volume today, by language? Run a small test against a hand-labelled week for five countries.
- Does Gallup World Poll microdata permit use as agent training or conditioning data? Ask Gallup sales before budgeting.
- Do the tiers above survive being computed? Score all 160+ countries once the five inputs are tabulated.

## Sources

- [IPUMS International](https://international.ipums.org/international/), accessed 2026-10-11
- [IPUMS International terms of use](https://international.ipums.org/international/terms.shtml), accessed 2026-10-11
- [UN Statistics Division census dates](https://unstats.un.org/unsd/demographic-social/census/censusdates/), accessed 2026-10-11
- [Gallup World Poll methodology](https://www.gallup.com/178667/gallup-world-poll-work.aspx), accessed 2026-10-11
- [Gallup World Poll public datasets](https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx), accessed 2026-10-11
- [World Values Survey](https://www.worldvaluessurvey.org/WVSContents.jsp), accessed 2026-10-11
- [Wikipedia, World Values Survey](https://en.wikipedia.org/wiki/World_Values_Survey), accessed 2026-10-11
- [Pew Research Center, global](https://www.pewresearch.org/global/), accessed 2026-10-11
- [Pew international methodology](https://www.pewresearch.org/methodology/international-survey-research/international-methodology/), accessed 2026-10-11
- [Afrobarometer surveys and methods](https://www.afrobarometer.org/surveys-and-methods/), accessed 2026-10-11
- [Afrobarometer about](https://www.afrobarometer.org/about/), accessed 2026-10-11
- [Arab Barometer](https://www.arabbarometer.org/about/), accessed 2026-10-11
- [Latinobarómetro](https://www.latinobarometro.org/lat.jsp), accessed 2026-10-11
- [European Social Survey](https://www.europeansocialsurvey.org/about-ess), accessed 2026-10-11
- [Asian Barometer](https://www.asianbarometer.org/), accessed 2026-10-11
- [GDELT 2.0 announcement](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/), accessed 2026-10-11
- [Wikipedia, GDELT Project](https://en.wikipedia.org/wiki/GDELT_Project), accessed 2026-10-11
- [Wikipedia, Polymarket](https://en.wikipedia.org/wiki/Polymarket), accessed 2026-10-11
