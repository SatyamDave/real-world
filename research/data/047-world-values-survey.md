# World Values Survey, EVS and ISSP as agent-seeding data

- Date: 2026-10-11
- Area: data
- Confidence: medium on coverage and access, low on commercial-use licensing. The web search budget ran out before any search ran, and the license PDFs were not readable by fetch. Anything marked "unverified" is from memory.

## Answer

WVS, EVS and the joint WVS/EVS file are free to download without registration or payment, and the combined trend file covers 120 countries and about 667,000 respondents. That is enough to calibrate beliefs and values for most of the world. The commercial-use terms are in a PDF we could not read, and EVS and ISSP are served through GESIS, which has historically limited some data to academic use. Real World should build on WVS/EVS now and email the archive for a written commercial-use answer before launch.

## Findings

- The IVS trend page lists the WVS trend file 1981-2022 as v4.1, dated 30 June 2024. It has 108 countries or territories, 442,473 respondents, 306 surveys and 732 variables. The EVS trend file 1981-2017 is v3.0.0, with 49 countries, 224,434 respondents, 160 surveys and 635 variables. Combined (IVS) it is 120 countries and 666,907 respondents. The page is inconsistent with itself (intro says 115 countries and 452 surveys, table says 120 and 464). Formats are SPSS, Stata, R (.rds/.rdata) and SAS. [WVS/EVS trend page](https://www.worldvaluessurvey.org/WVSEVStrend.jsp)
- Access terms on that page: "Access to the data, similiar to the previous rounds, is free, with no registration or payments required." Users must cite the data. The full "IVS Conditions of use" is a linked PDF (IVS_ConditionsOfUse.pdf). The fetch tool could not read it, so commercial use, redistribution and derivative-data rules are unread. [same page](https://www.worldvaluessurvey.org/WVSEVStrend.jsp)
- The WVS site separates downloads into: WVS/EVS Trend 1981-2022, WVS/EVS Joint 2017, Wave 7 (2017-2022), waves 1-6, and regional surveys. [WVS wave 7 documentation page](https://www.worldvaluessurvey.org/WVSDocumentationWV7.jsp). The page content exposed no counts, version or terms for wave 7 itself.
- Wave 8 is "planned for 2023-2026" per Wikipedia. The WVS site has a "WVS wave 8" menu link but no status, dates or release plan we could read. Treat wave 8 as unavailable for the Oct 27 launch. [Wikipedia: World Values Survey](https://en.wikipedia.org/wiki/World_Values_Survey)
- Wikipedia gives the minimum national sample as 1,000 adults and says the archive is in Madrid. It states no license. [Wikipedia](https://en.wikipedia.org/wiki/World_Values_Survey)
- The EVS has run in 1981, 1990, 1999, 2008 and 2017, and a 2026 round is underway. Its data are stored at GESIS in Cologne and described as free of charge. There is a joint EVS/WVS 2017-2022 dataset. [EVS site](https://europeanvaluesstudy.eu/)
- ISSP is accessed through the GESIS catalogue. The page says you must "create a new user ID and password before downloading data files free of charge." It lists 35 modules from 1985 (Role of Government I) to 2019 (Social Inequality V). Modules for 2020-2022 are in development, and 2023 (National Identity & Citizenship) and 2024 (Digital Societies) are planned. The page gives no member count and no commercial-use statement. [ISSP data download](https://issp.org/data-download/)
- Unverified, from memory: EVS 2017 is GESIS study ZA7500 with about 34 countries and about 59,000 respondents. GESIS data are sorted into access categories, and the most open category is described as for academic research and teaching. If EVS 2017 or ISSP carry that wording, a company use is outside it. WVS has historically asked for non-commercial research use as well. These need a read of the actual terms.
- Unverified: wave 7 (2017-2022) covers roughly 60-70 societies. Check the codebook.

What does not work: all of this is cross-sectional, one interview per person, fielded every 5-9 years. Wave 7 fieldwork predates 2022. Coverage per country is uneven, and several large countries have thin or politically constrained samples. None of it has a household or occupation structure matching census microdata, so it cannot be the demographic backbone.

## What it means for Real World

- For the product: WVS/EVS gives the "values prior" for each agent, such as trust, religiosity, gender attitudes, political interest and views on authority. Show the vintage on every agent trace ("values from WVS wave 7, 2018 fieldwork") so the Western-flattening and staleness risks are visible to users.
- For the engineering: Use the trend file v4.1 in R or Stata format, convert once to Parquet, and key it by country, wave, weight and demographic cells (age band, sex, education, urban or rural). Join to IPUMS-sampled agents by cell, not by individual. Keep a `source` and `vintage` column on every variable. Do not mix in ISSP until WVS works end to end.
- For the business: A hashed public track record and a paid API make Real World a commercial user. If the terms bar commercial use or redistribution of derived data, the fix is a written permission, not a workaround. Get this resolved before the YC application, since a diligence question on data rights is likely.

## Recommendations

1. Email the WVSA archive director (jdiezmed@jdsurvey.net) and the secretariat (wvsa.secretariat@gmail.com) today. Ask in writing whether a company may use WVS and EVS data to calibrate a paid simulation API, publish aggregate outputs, and expose agent-level traits derived from it. Keep the reply in the repo.
2. Download the WVS/EVS trend file v4.1 (no registration) and read IVS_ConditionsOfUse.pdf in a browser. Record the exact commercial-use and redistribution clauses in `docs/data-licenses.md`.
3. Build one ingest script: trend file to Parquet, 20-30 core items (trust, religion, politics, gender, life satisfaction, security), weights kept, country list printed.
4. Defer wave 8, EVS 2026 and ISSP. Add a TODO that re-checks wave 8 release status after launch.
5. Check the GESIS terms for ZA7500 and ISSP modules before using either. Prefer the open WVS/EVS joint file.
6. Never store raw respondent rows in the public repo. Publish only aggregates and code, and cite with the DOIs on the trend page.

## Open questions

- Do the IVS conditions allow commercial use, and can derived agent-level traits be exposed through an API? Read the PDF and ask the archive.
- What are the real counts and release date for wave 7 and wave 8? Open the WVS data download pages in a browser, since the fetch tool saw only menus.
- Under what GESIS access category are EVS 2017 and the ISSP modules, and does it allow commercial use? Read the study pages at search.gesis.org (returned 403 to our fetch) or email GESIS.
- How many countries does ISSP cover, and is there a license beyond registration? Check the member-states page.
- How stale is wave 7 for fast-moving countries? Compare against Gallup and regional barometers in the sibling research slices.

## Sources

- [World Values Survey / European Values Study trend files page](https://www.worldvaluessurvey.org/WVSEVStrend.jsp), accessed 2026-10-11
- [WVS wave 7 documentation page](https://www.worldvaluessurvey.org/WVSDocumentationWV7.jsp), accessed 2026-10-11 (menus only)
- [WVS home](https://www.worldvaluessurvey.org/WVSContents.jsp), accessed 2026-10-11 (no wave 8 detail)
- [European Values Study](https://europeanvaluesstudy.eu/), accessed 2026-10-11
- [ISSP data download](https://issp.org/data-download/), accessed 2026-10-11
- [Wikipedia: World Values Survey](https://en.wikipedia.org/wiki/World_Values_Survey), accessed 2026-10-11
