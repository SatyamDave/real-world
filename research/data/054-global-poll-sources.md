# Global poll sources for post-cutoff backtests

- Date: 2026-10-11
- Area: data
- Confidence: medium. Primary pages were opened for Pew, Ipsos, Wikipedia, Gallup, Latinobarometro and Afrobarometer. The web search budget ran out, so YouGov and Morning Consult terms, licenses and prices are unverified.

## Answer

Free, fresh, subgroup-rich global polls are scarce. The best free post-cutoff set is Pew's spring 2026 Global Attitudes survey (36 countries plus the US). Pew publishes crosstab tables and toplines, but not a respondent file on the page we read. Ipsos monthly trackers and Wikipedia-style election poll tables give timeliness but almost no subgroups. Real World should build its backtest on a small, hand-curated set of about 8 to 10 sources, store only numbers and links, and use hashed forecasts from launch as the real track record.

## Findings

**Pew Global Attitudes (best free source).** The 17 Sep 2026 AI report used international fieldwork from 8 Feb to 13 May 2026, 36 countries, 42,151 respondents, plus two US waves (5,119 and 3,488 adults). It reports splits by age, gender, education, income, ideology and AI awareness. Linked materials are a topline PDF, report PDF, methodology page and an appendix of detailed tables. No standalone dataset was linked on that page. Pew's newest global pieces run through 1 Oct 2026, so results published after a model cutoff exist. Source: [Pew report](https://www.pewresearch.org/global/2026/09/17/globally-more-people-expect-ai-to-cause-job-loss-than-growth/), [Pew global index](https://www.pewresearch.org/global/). A different Pew dataset (religion restrictions) needs a free account and agreement to terms, so assume the same for any Pew file ([Pew dataset page](https://www.pewresearch.org/dataset/?topic=global-attitudes)).

**Ipsos Global Advisor.** Online, monthly, 29 markets per the program page. The "What Worries the World" tracker says about 20,000 adults across 30 countries per wave; the September 2026 wave was published 24 Sep. Country-by-issue breakdowns are "available on request", and the page does not mention demographic breakdowns. This is a time series with a clean monthly cadence, not a subgroup source. Source: [Global Advisor](https://www.ipsos.com/en/global-advisor), [What Worries the World](https://www.ipsos.com/en/what-worries-world). Online samples in lower-income countries skew urban and educated. Ipsos is open about being online; we should treat it as such.

**Gallup World Poll.** 140+ countries, annual since 2005, 100+ questions, 145+ languages. The page gives no sample size or price. Access runs through the Gallup Analytics platform and public datasets; we could not confirm terms. Annual release means it is a lagging source for backtests. Source: [Gallup](https://www.gallup.com/analytics/318875/global-research.aspx).

**Regional barometers.** Afrobarometer says its data is free, with country files, merged multi-country files per round, and geocoded subnational files, under a usage policy we did not read. Latinobarometro covers 18 Latin American countries with about 20,000 interviews a year and lists data files, but download terms were not stated. Eurobarometer data back to 1974 sits on one EU site; we did not get wave dates or sample sizes. Source: [Afrobarometer](https://www.afrobarometer.org/data/), [Latinobarometro](https://www.latinobarometro.org/lat.jsp), [Eurobarometer at Parliament](https://www.europarl.europa.eu/at-your-service/en/be-heard/eurobarometer).

**National election polls via Wikipedia.** The German page shows INSA fieldwork on 5 to 9 Oct 2026 (n=1,207), so it is fresh to within days. Columns are pollster, fieldwork dates, sample size, an abstention column, party shares and lead. Pollsters include INSA, Forsa, Infratest dimap, YouGov, Ipsos and Allensbach; samples run about 1,000 to 3,100. National tables carry no demographic breakdowns. Text is CC BY-SA 4.0, so a scraped derived table may need share-alike; raw numbers are facts, but check with counsel before redistributing. Source: [Wikipedia Germany polling](https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_German_federal_election), [CC BY-SA 4.0 note](https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License).

**Morning Consult.** Its public site lists a Global Leader Approval Rating Tracker and Political Risk Ratings, but the page we opened gave no country list, frequency or price; pricing sits behind a "Products & Pricing" link. Treat as paid and unverified. Source: [Morning Consult](https://intel.morningconsult.com/mc-content/).

**Not reachable.** YouGov's tracker pages returned 404 or redirects, so we cannot state what is downloadable. Europe Elects served only a bot check. Politico Poll of Polls is blocked from our fetch tool. Do not assume any of these has an API.

**What does not work.** Subgroup data is the weak point. Most free sources publish toplines or country-level splits only. Crosstabs usually live in PDFs or HTML tables that must be parsed by hand. Few sources offer respondent-level files for fresh waves; those arrive months later, after the news we want to test against.

## What it means for Real World

- For the product: backtests will cover a few topics per country, not a full panel. Say so on the receipts page. Show which questions had subgroup truth and which only had toplines.
- For the engineering: build one small ingester per source that writes rows of (source, country, question, fieldwork start/end, n, subgroup, value, URL, retrieved_at). Parse Pew appendix tables and Ipsos PDFs; scrape Wikipedia tables for election polls. Keep the raw file and a content hash. Gate every row on fieldwork end date after the model cutoff, not publication date.
- For the business: the moat claim "cannot be backfilled" rests on our own hashed forecasts, not on these sources. Licenses for redistribution are unclear; keep third-party numbers internal for scoring and link out on the public page.

## Recommendations

1. Make Pew spring 2026 the first backtest set: download toplines and appendix tables for the AI wave, record age, gender, education and income splits for 36 countries. Owner: one engineer, 2 days.
2. Add Ipsos "What Worries the World" monthly series as the time-series test; email Ipsos for the per-country breakdown they offer on request.
3. Add 5 election-poll tables from Wikipedia (Germany first), scored on topline vote share only. Record the CC BY-SA obligation in a LICENSES note.
4. Email Gallup, Morning Consult and YouGov for academic or startup terms this week; budget a decision by 18 Oct, otherwise drop them for launch.
5. Read Afrobarometer, Latinobarometro and Eurobarometer usage terms; ingest only if redistribution is allowed. These cover the Western-flattening risk.
6. Define a "subgroup truth" flag per row so the scoring code never claims segment accuracy where only toplines exist.

## Open questions

- Does Pew release respondent-level files for spring 2026, and when? Check the Pew datasets page monthly or ask Pew.
- What are YouGov's and Morning Consult's data terms and prices? Contact sales.
- What redistribution terms apply to Ipsos, Gallup and the barometers? Read each usage policy and ask by email.
- How much of spring 2026 Pew fieldwork overlaps the model's training cutoff? Compare against the cutoff date; fieldwork ended 13 May 2026.

## Sources

- [Pew: Globally, More People Expect AI to Cause Job Loss Than Growth](https://www.pewresearch.org/global/2026/09/17/globally-more-people-expect-ai-to-cause-job-loss-than-growth/), accessed 2026-10-11
- [Pew global attitudes index](https://www.pewresearch.org/global/), accessed 2026-10-11
- [Pew datasets page](https://www.pewresearch.org/dataset/?topic=global-attitudes), accessed 2026-10-11
- [Ipsos Global Advisor](https://www.ipsos.com/en/global-advisor), accessed 2026-10-11
- [Ipsos What Worries the World](https://www.ipsos.com/en/what-worries-world), accessed 2026-10-11
- [Gallup World Poll](https://www.gallup.com/analytics/318875/global-research.aspx), accessed 2026-10-11
- [Afrobarometer data](https://www.afrobarometer.org/data/), accessed 2026-10-11
- [Latinobarometro](https://www.latinobarometro.org/lat.jsp), accessed 2026-10-11
- [European Parliament Eurobarometer](https://www.europarl.europa.eu/at-your-service/en/be-heard/eurobarometer), accessed 2026-10-11
- [Wikipedia: German federal election polling](https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_German_federal_election), accessed 2026-10-11
- [Wikipedia: CC BY-SA 4.0](https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License), accessed 2026-10-11
- [Morning Consult content hub](https://intel.morningconsult.com/mc-content/), accessed 2026-10-11
