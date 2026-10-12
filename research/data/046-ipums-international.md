# IPUMS International: access, terms, coverage, and fit for Real World

- Date: 2026-10-11
- Area: data
- Confidence: high on the terms and coverage (read from the primary IPUMS pages); medium on extract limits and API details (the pages do not state them); low on alternatives (not researched this pass, see Open questions)

## Answer

IPUMS International is the best harmonized global census source that exists: 104 countries, 656 samples, over 1 billion person records, free. It is also off limits to a company. The terms bar "any commercial or income-generating venture" and bar redistribution, and each person on a team needs their own license. Real World should not put IPUMS International in the production agent pipeline unless IPUMS gives written permission. Use it, if at all, for private calibration or to learn the variable schema, and build the shipped population from sources whose terms allow commercial use.

## Findings

**Coverage.** The [IPUMS International home page](https://international.ipums.org/international/) states 104 countries, 656 censuses and surveys, and over 1 billion person records. The [sample details table](https://international.ipums.org/international-action/sample_details) runs from Iceland 1703 to 2020 (Mexico, Puerto Rico, Mongolia, United States). Most modern census samples are 5 to 10 percent of the population. IPUMS never distributes a complete census, only samples.

**Coverage is uneven, and some of it is surveys, not censuses.** From the same table:
- China: 1982, 1990, 2000 only, 1 percent samples (10 to 11.8 million persons each). No 2010 or 2020.
- India: employment surveys 1983 to 2009, 0.04 to 0.09 percent, about 460K to 670K persons. Not a census.
- Nigeria: household surveys 2006-07 to 2010-11, 72K to 107K persons. Not a census.
- Brazil: 1960 to 2010, 10 to 25 percent. Latest is 2010.
- Indonesia: 1971 to 2010. Russia: 2002 and 2010. Egypt: 1986, 1996, 2006 plus 19th-century samples. Pakistan: latest 1998. Ethiopia: latest 2007. Bangladesh: latest 2011.
- Mexico is the freshest large country (2020).

So the three most populous markets after the US (China, India, Nigeria) are thin or stale. Many samples are 10 to 15 years old, and some are 25 years old.

**Recent releases are mostly variables, not new countries.** The [news page](https://international.ipums.org/international/news.shtml) lists March 2025: 6 new census samples (Honduras 2013, Kenya 2019, Malawi 2018, Mongolia 2010 and 2020, Mozambique 2017) and 91 quarterly Philippines labor force surveys. September 2025 added 21 variables and no samples. The cadence is roughly one release a year.

**Terms.** The [IPUMS terms of use](https://www.ipums.org/about/terms) for International say:
- Extracts are "intended solely for the use of the licensee." Redistribution to third parties is prohibited. Each team member must apply and be licensed individually.
- Use is limited to scholarly research and educational purposes. Commercial use is "strictly prohibited," including any "commercial or income-generating venture." Genealogy is also barred.
- No attempt to identify persons or households. Extracts must be kept secure, or destroyed if security cannot be guaranteed.
- Publishing results in scholarly papers and reports is allowed. Cite IPUMS International and the national statistical office that produced the data, and add publications to the IPUMS Bibliography. See [citation rules](https://international.ipums.org/international/citation.shtml).
- Penalties: license revocation, recall of all microdata acquired, possible civil action, and sanctions on the violator's institution.
- The terms do not mention AI or machine learning. They do not address derived datasets such as synthetic agents sampled from extracts. That silence is not permission. A synthetic population built row by row from extracts, served through a paid API, reads as a commercial venture built on the data.

For contrast, IPUMS USA has no commercial-use clause. It bars redistribution without permission and says IPUMS "will consider requests for free and commercial redistribution." So the commercial ban is specific to International (and PMA), not all of IPUMS.

**Access process.** Registration is through the [Register link](https://international.ipums.org/international/), and the [FAQ](https://international.ipums.org/international-action/faq) says project staff review each application individually and may ask follow-up questions. No turnaround time is published. Registration expires after one year and can be renewed. Browsing the catalog needs no account.

**Extracts.** You pick samples and variables in the web cart. The FAQ says there is a cap on extract size with no stated threshold, and you can email to ask for more. You get an email when the extract is ready, then download a gzipped file. Extract definitions are saved forever, but data files are deleted after 3 days. About a quarter of samples are weighted (PERWT for persons, HHWT for households). The same FAQ notes that some samples exclude regions and that some variables are withheld for confidentiality.

**API.** The [IPUMS developer docs](https://developer.ipums.org/docs/v2/apiprogram/apis/microdata/) list International among the microdata collections with partial API support. Custom sample sizes are not supported for International. Requests are POSTs to `api.ipums.org/extracts` with an API key from your account, and the [get-started page](https://developer.ipums.org/docs/v2/get-started/) states a limit of 100 requests per minute. I could not confirm the exact collection string for International from the docs I read. The Python client [ipumspy](https://github.com/ipums/ipumspy) is MPL-2.0 and had 15 stars on the day I looked.

**Restricted tier.** The [IPUMS International Research Data Enclave](https://international.ipums.org/international/irde.shtml) exists for confidential microdata. It requires a faculty or non-profit lead, a secure facility, and signed confidentiality agreements. Not usable for a startup.

## What it means for Real World

- For the product: The "census-grounded agents for 100+ countries" claim cannot rest on IPUMS International if we sell access. Coverage is also stale for China, India and Nigeria, which weakens the "whole world" story. Be honest on the landing page about which countries have fresh microdata and which are modeled from margins.
- For the engineering: Keep the agent sampler behind a source-agnostic interface: a table of person records with country, age, sex, education, occupation, household, region, and a weight. IPUMS variable names are a good schema template (they are harmonized and documented), and the schema itself is not the licensed data. Do not commit extracts to the repo. Do not ship them in a container image or R2 bucket that serves the public product. Extracts are single-licensee and must be secured.
- For the business: Using IPUMS International in an application to YC and in a paid API invites a license revocation and a recall of everything downloaded. A written permission from IPUMS is cheap to ask for and would be a strong asset. Without it, this is a legal risk we do not need in a 22-day sprint.

## Recommendations

1. Do not build the production population on IPUMS International. Treat it as research-only until IPUMS replies in writing.
2. Email ipums@umn.edu this week with a plain description (commercial forecasting product, synthetic agents, no row-level redistribution, aggregated outputs only) and ask for written commercial permission. Log the reply in the repo. Expect a no or a slow answer.
3. In parallel, spend one day on commercially usable sources for the first 10 to 15 countries: US ACS PUMS and other national statistical office public-use files, each checked for its own license. Pick countries by where we also have news, polls, and market data.
4. Define the agent record schema now, copying IPUMS variable names and codes where useful, so swapping sources later is a data change and not a code change.
5. If we do use IPUMS for private calibration, keep it on one licensed person's machine, delete extracts on schedule, never push it, and never publish agent-level rows derived from it.
6. State coverage per country on the receipts page (survey year, sample size, source). That is honest and defends against the "Western flattening" criticism.

## Open questions

- Does IPUMS grant commercial permission, and under what terms? Ask them in writing.
- What is the real approval time and extract size cap? Neither is published. Register and try a small extract to find out.
- What is the exact API collection string for International and which options work? Read the API reference or the ipumspy docs.
- Which non-IPUMS sources have commercial-friendly licenses and global reach (national statistical office microdata libraries, World Bank Microdata Library, survey programs)? I did not research alternatives in this pass because the web search budget ran out, so treat any list as unverified until a follow-up slice checks it.
- Is the 1% to 10% sample fraction large enough to seed 100,000 agents per country? For a single country, yes. For small countries and for subnational segments, it needs checking against the weights.

## Sources

- [IPUMS International home](https://international.ipums.org/international/), accessed 2026-10-11
- [IPUMS terms of use](https://www.ipums.org/about/terms), accessed 2026-10-11
- [IPUMS International sample details](https://international.ipums.org/international-action/sample_details), accessed 2026-10-11
- [IPUMS International FAQ](https://international.ipums.org/international-action/faq), accessed 2026-10-11
- [IPUMS International about](https://international.ipums.org/international/about.shtml), accessed 2026-10-11
- [Citing IPUMS International](https://international.ipums.org/international/citation.shtml), accessed 2026-10-11
- [IPUMS International news and releases](https://international.ipums.org/international/news.shtml), accessed 2026-10-11
- [IPUMS International Research Data Enclave](https://international.ipums.org/international/irde.shtml), accessed 2026-10-11
- [IPUMS API: microdata collections](https://developer.ipums.org/docs/v2/apiprogram/apis/microdata/), accessed 2026-10-11
- [IPUMS API: create microdata extracts](https://developer.ipums.org/docs/v2/workflows/create_extracts/microdata/), accessed 2026-10-11
- [IPUMS API: get started](https://developer.ipums.org/docs/v2/get-started/), accessed 2026-10-11
- [ipumspy on GitHub](https://github.com/ipums/ipumspy), accessed 2026-10-11
