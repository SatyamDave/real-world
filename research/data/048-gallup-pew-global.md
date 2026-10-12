# Gallup World Poll and Pew Global Attitudes: access, licensing and calibration use

- Date: 2026-10-11
- Area: data
- Confidence: medium. Terms and access paths come from primary Gallup and Pew pages I opened. No Gallup price is published, and my web search budget ran out, so the Pew country list, Gallup Global Emotions page and Pew topline format were not checked.

## Answer

Neither source gives us respondent-level data before the Oct 27 launch. Gallup World Poll microdata is sold or subscribed, with no public price. Pew global datasets are free with an account, but the license limits use to "excerpts". For the YC application and launch, calibrate and backtest against published toplines and country-level aggregates (Pew reports, World Happiness Report files, the nine Gallup partner datasets). Start a Gallup licensing conversation now. Do not plan on it.

## Findings

**Gallup World Poll**
- Annual since 2005. 140+ countries, said to represent over 95% of adults. 145+ languages. 100+ questions a year, in 12 topic areas such as economics, health, religion, law and safety, and government. [Gallup World Poll overview](https://www.gallup.com/analytics/318875/global-research.aspx)
- Design: typically at least 1,000 adults aged 15+ per country, at least 2,000 in China and Russia, and 500-1,000 in rare cases. Telephone where phone coverage is 80%+ (US, Canada, Western Europe, Japan, Australia). Face-to-face in most of the developing world. Weighted to national demographics. [How the World Poll works](https://www.gallup.com/178667/gallup-world-poll-work.aspx)
- Access path 1: Gallup Analytics, a "subscription-based" portal with World Poll data from 160+ countries and areas. No prices are published. You fill in a contact form. The page suggests checking whether your university already has access. [Gallup Analytics](https://www.gallup.com/analytics/318923/gallup-analytics.aspx)
- Access path 2: "respondent-level global datasets are available for purchase". No price or license text is shown. Same page.
- Access path 3: nine public datasets hosted by Gallup's clients. They include the Global Preferences Survey (76 countries), FAO Voices of the Hungry (77 countries, 2014 onward), World Risk Poll (2019, 2021), Wellcome Global Monitor (2018, 2020), World Bank Global Findex, and Prindex. Licensing sits on each partner's site. [World Poll public datasets](https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx)
- World Happiness Report publishes free country-level Figure 2.1 files: three-year life-evaluation averages from 2012, confidence intervals, and six explanatory factors, for the 2020-2026 editions. It states no license. Researchers get more data by request through their institution. [WHR data sharing](https://worldhappiness.report/data-sharing/)

**Pew Global Attitudes**
- Free datasets, but only with a free account. The page lists Spring 2025 (25 countries, fielded Jan 8 to Apr 26 2025), Spring 2024 (35 countries), Spring 2023 (23) and Spring 2022 (19). It also lists US-only American Trends Panel waves. Country lists and file formats were not shown. [Pew datasets](https://www.pewresearch.org/global/datasets/)
- Section 13 of Pew's terms says datasets are licensed non-exclusive, royalty-free and non-sublicensable. They may not be "reproduced, displayed, distributed... or published in full", only as excerpts. You may not try to identify respondents or link records to do so. Credit and a "Pew bears no responsibility for the analyses" disclaimer are required. Section 3 bans unauthorized scraping. The terms do not mention AI or machine learning. Commercial use is not prohibited outright. [Pew terms](https://www.pewresearch.org/about/terms-and-conditions/)
- Pew's coverage is thin next to Gallup's: 19-35 countries a year against 140+. Many countries are high or middle income.

## What it means for Real World

- For the product: the receipts page can cite country-level Gallup and Pew numbers as external anchors. That is safe if we show excerpts with attribution, not full tables. Do not claim "calibrated to Gallup World Poll" unless we hold a license that allows it.
- For the engineering: build one ingestion format for "published aggregates" (source, country, question, wave, value, interval, URL, retrieval date). Pew and WHR files both fit it. Keep raw Pew files out of the public repo and out of any public API, because the license bars publishing them in full. Store them privately and expose only derived calibration targets.
- For the business: the Pew excerpt limit and Gallup's closed licensing both bear on a commercial API. Before launch, ask Pew in writing whether using their data to calibrate a model counts as permitted use. A Gallup quote is a longer-term item; the sales path is a contact form with no price.

## Recommendations

1. Treat Gallup and Pew as calibration anchors, not agent inputs, for launch. Use IPUMS and WVS for the agent population (covered in other notes).
2. Pull the free World Happiness Report country files (life evaluation, 2012-2026) as the first Gallup-derived anchor. Check their reuse terms with Gallup and WHR before publishing derived charts.
3. Create a free Pew account and download Spring 2022-2025 global datasets into private storage. Record which countries each wave covers, then pick 5-10 questions (views of the US, of China, of democracy) as backtest targets.
4. Email Pew permissions to ask about model calibration and public display of derived numbers. Email Gallup for a World Poll quote and a startup or academic rate. Do this this week, since replies will take days.
5. Check whether a partner university has Gallup Analytics access, and whether our access would extend to us or only to its members.
6. Keep the Pew and Gallup ingest behind a "licensed, private" flag so nothing from them leaks into the public track-record repo by accident.

## Open questions

- Gallup respondent-level price, and whether the license allows use in a commercial model. Ask Gallup sales.
- Pew country lists and file formats per wave. Open the dataset pages after login.
- Exact reuse terms for WHR and the Gallup partner datasets. Read each host's terms.
- Whether Pew publishes toplines with exact question wording for every wave. Check recent report pages (my one attempt returned a 404).
- Gallup Global Emotions data: the page I fetched only linked to it, so what is downloadable is unknown.

## Sources

- [Gallup World Poll overview](https://www.gallup.com/analytics/318875/global-research.aspx), accessed 2026-10-11
- [How the Gallup World Poll works](https://www.gallup.com/178667/gallup-world-poll-work.aspx), accessed 2026-10-11
- [Gallup Analytics](https://www.gallup.com/analytics/318923/gallup-analytics.aspx), accessed 2026-10-11
- [Gallup World Poll public datasets](https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx), accessed 2026-10-11
- [World Happiness Report data sharing](https://worldhappiness.report/data-sharing/), accessed 2026-10-11
- [Pew Global Attitudes datasets](https://www.pewresearch.org/global/datasets/), accessed 2026-10-11
- [Pew Terms and Conditions](https://www.pewresearch.org/about/terms-and-conditions/), accessed 2026-10-11
