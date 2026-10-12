# Global synthetic populations and microdata alternatives to IPUMS

- Date: 2026-10-11
- Area: data
- Confidence: medium. GLOPOP-S, IPUMS, LSMS and WPP facts come from pages I opened. DHS, Eurostat and the WPP license page were blocked or silent, and the web search budget ran out, so those parts are flagged.

## Answer

Start from GLOPOP-S. It is a ready-made synthetic population of about 7.3 billion people, downloadable today under CC BY 4.0, one file per country. It gives age, sex, education, economic situation and urban/rural, which is enough to sample 100,000 agents across the world in a day. It has no beliefs or attitudes, so the survey layer (WVS, Gallup, Pew) must supply those. Use UN WPP to age the 2015 base forward and fix country totals. Keep IPUMS as the upgrade path, not the blocker.

## Findings

**GLOPOP-S is the fastest route to global coverage.**
- It is a synthetic population for the year 2015: 1,999,227,130 households and 7,335,881,094 individuals, built from the Luxembourg Income Study (LIS) and Demographic and Health Surveys (DHS), with Global Data Lab (GDL) data filling countries that have neither ([GitHub repo](https://github.com/VU-IVM/GLOPOP-S)).
- Fields: age, education, economic situation, gender, urban/rural, relationship to household head, household size, household type. Land ownership and dwelling traits exist only for some Global South countries (same repo; [paper abstract](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=GLOPOP-S&format=json&resultType=core&pageSize=3)).
- Published as Ton et al., Scientific Data 11:1096, October 2024. Method is synthetic reconstruction fitted to regional statistics at administrative level 1 (province or state), not to districts.
- Hosted on [Harvard Dataverse](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/KJC3RH), version 5 released 2026-01-13, license CC BY 4.0. Files are gzipped per country (for example `synthpop_AFGr101.dat.gz`, 3 MB). Individual country files run from a few KB to under 10 MB in the part of the listing I could read. There is also a 2.5 GB `GLOPOP_update.zip`. The page recommends using only version 5.
- The repo says the original LIS and DHS files are not published. Only the synthetic output is.
- The repo has 41 stars and 3 forks. It is an academic dataset with one maintainer group (VU Amsterdam IVM). Expect no support.
- I could not confirm an exact country count. The repo says "each country in the world". The Dataverse listing was too long to read in full, and the `Nr_individuals_data_availability.tab` file would answer it.

**What does not work in GLOPOP-S.**
- It is a 2015 snapshot. Eleven years of ageing, births and migration are missing.
- It is demographics only. No attitudes, no media use, no politics.
- Level-1 geography is coarse. A "region" can hold tens of millions of people.
- Countries without LIS or DHS microdata use a modelled fallback, so quality varies by country in ways the file does not mark row by row. Treat those rows as less certain.

**IPUMS International is better data, but gated.**
- 104 countries, 656 censuses and surveys, over 1 billion person records, free after registration ([IPUMS International](https://international.ipums.org/international/)). Census microdata are samples of the full census, typically 1% to 10%.
- Access is by extract request and the page does not state redistribution or commercial terms. I could not open the terms page (404). Read them before building a product on it.
- It is stale for many countries: most have a census every ten years and some samples are 15 or more years old.

**DHS** (not verified by me; the site returned 403 to every fetch). From prior knowledge, DHS is free for registered users after a project-description approval, covers roughly 90 low and middle income countries, and prohibits redistributing the raw files. That matches GLOPOP-S publishing only synthetic output. Verify before ingesting DHS directly.

**LSMS (World Bank).** The catalog lists 169 studies across 44 countries. Only 28 are classified Public. The rest need a direct-access request or sit in external repositories ([World Bank microdata catalog](https://microdata.worldbank.org/index.php/catalog/lsms)). It is household-consumption focused and 44 countries is not global. Skip for now.

**Eurostat EU-SILC.** Microdata go to recognised research entities, with age top-coded at 80 and region at NUTS 1 ([Eurostat](https://ec.europa.eu/eurostat/web/microdata/european-union-statistics-on-income-and-living-conditions)). A startup will probably not qualify, and the page lists no fee or process I could confirm. Not a fast path.

**LIS.** Access is through LISSY, a remote-execution system for registered researchers, non-commercial use only ([LIS data access](https://www.lisdatacenter.org/data-access/)). We cannot run a commercial product off it. GLOPOP-S already digested it, but note the upstream non-commercial restriction when judging the CC BY label on the derived file. That is a legal question for counsel, not an engineering one.

**UN World Population Prospects (WPP).** The 2024 edition is the 28th: 237 countries or areas, estimates from the 1950s, projections to 2100 ([UN DESA](https://www.un.org/development/desa/pd/content/world-population-prospects-2024)). I could not open the license page. I believe it is CC BY 3.0 IGO, but treat that as unconfirmed. Use it for national age-sex totals, fertility and migration, not individuals.

**Global Data Lab.** The old Area Database was split in March 2025 into Education and Work, Wealth, and Health/Gender/Demographics sets for low and middle income countries and their subnational regions. A free registration downloads the old v4.2 ([GDL](https://globaldatalab.org/areadata/)). Terms are not stated on the page. Useful for subnational wealth and education priors.

## What it means for Real World

- For the product: "100,000 agents across the whole world" is credible on day one. Be honest in the UI that demographics come from a 2015 base, and show per-country data quality (modelled vs survey-based).
- For the engineering: build one loader, `population/load_country(iso3)`, that reads a GLOPOP-S file, ages it to 2026 with WPP, and returns agent rows. Allocate 100,000 agents proportional to population with a floor (for example 100 per country) so small countries are not erased. At about 80,000 people per agent, the floor matters more than the proportional share. Attach beliefs in a separate step from WVS and other surveys, matched on age, sex, education and urban/rural. Keep demographics and attitudes in separate modules so a PM can change the country allocation without touching the survey matching.
- For the business: CC BY 4.0 needs attribution only. The unverified parts are the upstream LIS and DHS terms and IPUMS commercial terms. Resolve them before a paid API ships, and well before the YC application claims a data moat. The moat is the daily pipeline and track record, not the base population.

## Recommendations

1. Download GLOPOP-S v5 now. Pull the per-country `.dat.gz` files and `Nr_individuals_data_availability.tab`, and report the true country count and the list of modelled-fallback countries. Half a day for one engineer.
2. Write the WPP ageing step: take 2015 rows, move them to 2026 age structure by reweighting to WPP 2026 age-sex totals per country. Confirm the WPP license before shipping.
3. Fix the allocation rule (population-proportional with a per-country floor) and put it in one config file a PM can read and edit.
4. Keep the IPUMS International request open in parallel for 10 to 20 priority countries, and read its terms of use first. Use it to validate GLOPOP-S marginals, not to replace it.
5. Add a data-quality flag per country (survey-based, modelled, thin) and show it on the globe and in `POST /v1/simulate` output.
6. Ask counsel one question: can a commercial API ship agents derived from GLOPOP-S given upstream LIS non-commercial and DHS redistribution terms?
7. Do not pursue EU-SILC or LSMS before launch.

## Open questions

- How many countries does GLOPOP-S really cover, and which are modelled? Answer: read the availability table in the Dataverse files.
- Does the CC BY 4.0 label hold given LIS non-commercial terms? Answer: ask the authors (Ton, Aerts group at VU) and counsel.
- What are the DHS and IPUMS terms for commercial use? Answer: read both terms pages in a normal browser; my fetches were blocked or 404.
- How good are the 2015-to-2026 aged populations for fast-changing countries (conflict, migration)? Answer: compare against IPUMS or national census totals for five test countries.
- WPP license text. Answer: open the UN copyright page directly.

## Sources

- [GLOPOP-S GitHub repository (VU-IVM)](https://github.com/VU-IVM/GLOPOP-S), accessed 2026-10-11
- [GLOPOP-S on Harvard Dataverse, doi:10.7910/DVN/KJC3RH](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/KJC3RH), accessed 2026-10-11
- [Ton et al. 2024, Scientific Data 11:1096 (abstract via Europe PMC)](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=GLOPOP-S&format=json&resultType=core&pageSize=3), accessed 2026-10-11
- [IPUMS International](https://international.ipums.org/international/), accessed 2026-10-11
- [World Bank LSMS catalog](https://microdata.worldbank.org/index.php/catalog/lsms), accessed 2026-10-11
- [Eurostat EU-SILC microdata](https://ec.europa.eu/eurostat/web/microdata/european-union-statistics-on-income-and-living-conditions), accessed 2026-10-11
- [LIS data access](https://www.lisdatacenter.org/data-access/), accessed 2026-10-11
- [UN DESA World Population Prospects 2024](https://www.un.org/development/desa/pd/content/world-population-prospects-2024), accessed 2026-10-11
- [Global Data Lab area data](https://globaldatalab.org/areadata/), accessed 2026-10-11
