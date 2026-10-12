# Synthetic population tooling: synthpop, PopulationSim, GLOPOP-S, WorldPop

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Primary pages were opened for every claim below, but the web search budget ran out mid-task, so I did not look for other global synthetic populations, and I could not open the DHS terms page (403).

## Answer

A ready global synthetic population exists: GLOPOP-S, 7.3 billion people for 2015, 78 countries from real surveys plus 99 filled by borrowing from "similar" countries. The data is CC BY 4.0 and is the only sensible seed for a 100,000-agent world. It is thin (about eight attributes, no beliefs, no occupation, 2015 base year), so it gives us the demographic skeleton only. Attitudes must come from WVS/Gallup/Pew. Do not build on IPUMS International microdata: its terms ban commercial use and redistribution.

## Findings

**GLOPOP-S (use this).** Ton et al., Scientific Data 11, article 1096, October 2024. It claims to be the first global synthetic population: about 2.0 billion households and 7.3 billion individuals for 2015, matched to administrative-level-1 statistics. [Europe PMC record](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=GLOPOP-S&format=json&resultType=core), [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11458621/).
- Variables: age (8 groups), gender, education (5 levels), income or wealth quintile, urban/rural, household size, household type (8), relationship to head, household ID. DHS countries add farmland ownership and floor/wall/roof material. A flag says whether a record came from LIS, DHS or a model.
- Sources: Luxembourg Income Study for 33 countries (only aggregated tables, via remote execution), DHS for 45 countries. Together 78 countries, 81.4% of world population. 99 countries (15.7% of people) have no microdata and were filled from three look-alike countries chosen by HDI and proximity. About 1% of people (North Korea, Taiwan, Western Sahara and others) are missing.
- Accuracy: swapping in a neighbor country's survey roughly doubled median error for DHS countries and tripled it for LIS countries. Estimated marginals raised error about tenfold. The authors say data for those countries "should be handled with care". Validation was only possible where real survey data exists, so the 99 filled countries are unvalidated.
- Known limits: base year 2015, income not comparable across countries, the fitting method (IPU) cannot create household types absent from the sample.
- License: the Harvard Dataverse record states CC BY 4.0, files unrestricted, version 5.0 released 2026-01-13, with a note to use only version 5 ([Dataverse API record](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/KJC3RH)). The paper itself is CC BY-NC-ND. I read the dataset license as CC BY 4.0, but confirm it with the author, since the underlying DHS/LIS terms were not checkable.
- Format: gzipped binary files per country and subnational region (Global Data Lab codes), read with R or Python scripts. The main archive is about 2.5 GB. Code repo [VU-IVM/GLOPOP-S](https://github.com/VU-IVM/GLOPOP-S): 41 stars, no license stated on the page. Raw LIS/DHS extracts are not published.

**WorldPop (use for geography, not people).** Gridded population counts, for example the 2020 global mosaic at 30 arc-seconds (about 1 km), CC BY 4.0, except layers derived from OpenStreetMap or Microsoft footprints, which are ODbL ([hub record](https://hub.worldpop.org/geodata/summary?id=24777)). The catalog lists a "Global 2 (2015-2030)" population counts release and 33,230 population-count datasets ([data catalog](https://www.worldpop.org/datacatalog/)). It gives counts per cell, not individuals. Its site asks users not to use data to surveil or harm vulnerable people ([worldpop.org](https://www.worldpop.org/)). Useful for placing agents on the globe.

**synthpop (R) (not the right tool).** Version 1.9-3, published 2026-09-10, GPL-2 or GPL-3, maintained by Beata Nowok ([CRAN](https://cran.r-project.org/web/packages/synthpop/index.html)). It makes a synthetic copy of a confidential microdata file, variable by variable, with parametric models or CART, plus utility and disclosure checks. It needs a real microdata file as input and does not scale to a country from marginals. It solves "release a safe copy of survey X", not "build a world".

**PopulationSim and ActivitySim (not the right tool).** Both BSD-3-Clause, Python. PopulationSim 0.10.0 on PyPI, 2025-11-03, Python >=3.9 and <3.13; the repo has 70 stars, 287 commits ([GitHub](https://github.com/ActivitySim/populationsim), [PyPI](https://pypi.org/pypi/populationsim/json)). It needs a seed sample (usually US Census PUMS), control totals per geography, and uses entropy-based list balancing plus integer rounding ([docs](https://activitysim.github.io/populationsim/)). It is built for US transport planning zones. ActivitySim (252 stars, BSD-3-Clause) simulates daily travel schedules for a synthetic population ([GitHub](https://github.com/ActivitySim/activitysim)). Neither is a global tool, and we have no use for travel schedules.

**IPUMS International (trap).** The census microdata named in the plan is licensed to the individual researcher for scholarly research and teaching only. "Commercial use is strictly prohibited," and sharing with third parties is prohibited ([terms](https://international.ipums.org/international/terms.shtml)). A YC-backed company serving a public API cannot ship IPUMS-derived agents. Treat it as off limits until IPUMS grants written permission.

## What it means for Real World

- For the product: the globe can show real population shares per country and region on day one. Agents will carry demographics only. Their opinions and "why" traces must come from survey conditioning, so the trace should say which survey cell drove a belief.
- For the engineering: skip the heavy synthesis stack. Download GLOPOP-S v5 for a sample of countries, draw about 100,000 people weighted by population (or stratified so small countries are not erased), and attach beliefs from WVS and others by matching age, gender, education, urban/rural and country. Keep the sampler as one small Python script a PM can read.
- For the business: license risk is the main finding. GLOPOP-S is CC BY 4.0 (attribution required, commercial use allowed). IPUMS is not usable commercially. Any public claim of "census-grounded" should be worded to match what we really use.

## Recommendations

1. Download GLOPOP-S version 5 only and test-read three countries (for example India, Nigeria, Germany) with the repo's Python reader. Owner: engineer, one day.
2. Email the GLOPOP-S author (marijn.ton@vu.nl, listed in the repo) to confirm CC BY 4.0 covers commercial use given the DHS/LIS inputs and the paper's NC-ND license, and ask about a post-2015 update. Owner: founder, this week.
3. Build one `sample_agents.py` that samples about 100,000 people by country population share, with a floor per country so every region is represented. Store the country, region, source flag (LIS, DHS, modeled) on every agent.
4. Expose the source flag in the UI and API. Agents from the 99 filled countries must be labeled "borrowed demographics" and their accuracy not claimed.
5. Use WorldPop 1 km grids only to place agents on the globe. Respect ODbL on any OpenStreetMap-derived layers.
6. Do not use IPUMS International data in the product or in any shipped dataset. Use it, if at all, for private internal sanity checks, and get written permission before anything else.
7. Do not adopt synthpop, PopulationSim or ActivitySim for v1. Revisit PopulationSim only if we need exact household constraints for a few countries.

## Open questions

- Does the CC BY 4.0 label on Dataverse hold up against the DHS terms of use for derived data? I could not open the DHS page. Ask the author and read the DHS terms by hand.
- Are there other global synthetic populations (post-2015, or with beliefs attached)? I did not search for them, so this is unchecked. Run one more search round.
- How much do the eight GLOPOP-S attributes explain survey answers, compared with attributes we do not have (religion, occupation, ethnicity)? Test by predicting held-out WVS answers from each attribute set.
- Which of the 99 borrowed-from-neighbor countries matter most for the launch story, and can WVS or Gallup microdata fill them better?

## Sources

- [GLOPOP-S paper, PMC11458621](https://pmc.ncbi.nlm.nih.gov/articles/PMC11458621/), accessed 2026-10-11
- [GLOPOP-S metadata via Europe PMC](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=GLOPOP-S&format=json&resultType=core), accessed 2026-10-11
- [GLOPOP-S on Harvard Dataverse, doi 10.7910/DVN/KJC3RH](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/KJC3RH), accessed 2026-10-11
- [VU-IVM/GLOPOP-S repo](https://github.com/VU-IVM/GLOPOP-S), accessed 2026-10-11
- [WorldPop hub, 2020 global population distribution](https://hub.worldpop.org/geodata/summary?id=24777), accessed 2026-10-11
- [WorldPop data catalog](https://www.worldpop.org/datacatalog/), accessed 2026-10-11
- [WorldPop home](https://www.worldpop.org/), accessed 2026-10-11
- [synthpop on CRAN](https://cran.r-project.org/web/packages/synthpop/index.html), accessed 2026-10-11
- [PopulationSim on GitHub](https://github.com/ActivitySim/populationsim), accessed 2026-10-11
- [PopulationSim on PyPI](https://pypi.org/pypi/populationsim/json), accessed 2026-10-11
- [PopulationSim documentation](https://activitysim.github.io/populationsim/), accessed 2026-10-11
- [ActivitySim on GitHub](https://github.com/ActivitySim/activitysim), accessed 2026-10-11
- [IPUMS International terms of use](https://international.ipums.org/international/terms.shtml), accessed 2026-10-11
