# Population synthesis: IPF, optimisation, Bayesian networks, deep models, and joining census to attitudes

- Date: 2026-10-11
- Area: science
- Confidence: medium. The method comparisons rest on a few papers, mostly transport and French census work, not global attitude data. The IPUMS licence finding is solid. I could not verify WVS, DHS or Gallup terms because the search budget ran out.

## Answer

For 100,000 agents by Oct 27, use IPF or raking to build the demographic skeleton, then attach attitudes by donor matching from survey respondents (statistical matching). Skip deep generative models. The big surprise is legal, not technical: IPUMS International, the planned census source, forbids commercial use and redistribution. Real World cannot build a paid API on it as the plan stands.

## Findings

**The four method families.**
- IPF (Deming and Stephan, 1940) rescales a seed table until it matches known marginals. It struggles with joint household and person attributes. IPU and hierarchical IPF fix that. Source: [Borysov et al. 2019](https://arxiv.org/abs/1808.06910), [Yameogo et al. 2021](https://jasss.soc.surrey.ac.uk/24/2/5.html).
- A French benchmark (Nantes, about 949,000 people, 307 zones) compared IPU, hierarchical IPF, entropy minimisation and generalised raking. Hierarchical IPF and entropy minimisation with truncate-replicate-sample integerisation won. Individual-level error was 0.88% to 0.94% of the population. Integerisation choice mattered more than the fitting method. Source: [Yameogo et al. 2021](https://jasss.soc.surrey.ac.uk/24/2/5.html).
- The same paper says combinatorial optimisation (simulated annealing, genetic search) is costly for large populations. It also says statistical learning cannot hit marginals exactly. Neither was benchmarked there, so treat that as the authors' view.
- Deep generative models learn the joint distribution from a survey sample. The VAE paper used a Danish trip diary. A Gibbs sampler and a Bayesian network beat the VAE in low dimensions but scaled badly as attributes grew. The VAE generates new agents instead of copying sample rows, which addresses sampling zeros. Source: [Borysov et al. 2019](https://arxiv.org/abs/1808.06910).
- A robustness study compared CTGAN and a VAE on Montreal travel surveys from 2008, 2013 and 2018. CTGAN had narrower bootstrap error intervals. Performance fell only slightly with smaller samples. Source: [arXiv 2211.13339](https://arxiv.org/abs/2211.13339).
- Most deep models are unconditional, so scenario control is hard. SemaPop (2026) conditions a GAN on LLM-written persona text. It is a preprint and I found no code. Source: [SemaPop](https://arxiv.org/abs/2602.11569).
- Every benchmark above is travel or French census data. I found no evidence that any method was validated on attitudes across many countries.

**Tools.**
- R `synthpop` 1.9-3, published 2026-09-10, GPL-2 or GPL-3. It makes shareable fakes of confidential microdata with trees or parametric models. It is a disclosure-control tool, not a census-plus-marginals tool. Source: [CRAN](https://cran.r-project.org/web/packages/synthpop/index.html).
- PopGen3 (IPU for travel demand): 0 stars, 44 commits, no licence shown on the repo page. Treat it as unlicensed. Source: [GitHub](https://github.com/chnfanyu/PopGen3). The Python `ipfn` package reportedly sits at 1.4.4 from 2021 under MIT, but I only saw that on a packaging mirror, not upstream. IPF is about 20 lines of numpy anyway.

**Statistical matching (joining census to attitudes).**
- Setup: file A has demographics X and file B has attitudes Y plus the same X. Donor methods (nearest neighbour, random-distance hot deck, predictive mean matching) copy Y from B-respondents to A-records with similar X. Source: [StatMatch manual](https://cran.r-universe.dev/StatMatch/doc/manual.html).
- The catch is the conditional independence assumption: given X, attitudes and anything else you care about are independent. Nothing in the data can test it. If it is wrong, the fused file is biased. Source: [Kim, Berg and Park](https://arxiv.org/pdf/1510.03782) and the search summary of the matching literature.
- StatMatch 1.4.3 (GPL-2 or later, D'Orazio) supports survey weights and includes Frechet bounds that show how wide the uncertainty is for variables never seen together. Source: [StatMatch manual](https://cran.r-universe.dev/StatMatch/doc/manual.html).

**Licences and data.**
- IPUMS International: 104 countries, 656 samples, over 1 billion person records. Source: [IPUMS International](https://international.ipums.org/international/).
- Its terms: "Commercial use is strictly prohibited." Redistribution to third parties is banned. Each team member needs an individual licence. Use is for scholarly research and education. Other uses need written approval from the national statistics authority. The page says nothing about derived or synthetic data, so that is an unanswered legal question, not a permission. Sources: [terms](https://international.ipums.org/international/terms.shtml), [ipums.org/about/terms](https://www.ipums.org/about/terms).
- Open alternatives I confirmed: WorldPop gridded population is CC BY 4.0 for the 1 km global mosaic, 2000-2020, and its catalog lists age and sex structure products (the page I opened did not give their resolution or licence). Source: [WorldPop hub](https://hub.worldpop.org/geodata/summary?id=24777), [catalog](https://www.worldpop.org/datacatalog/). I could not open UN World Population Prospects download terms.

**Why attitudes need real respondents, not prompts.**
- Giving an LLM only age, gender and education skews it toward Western answers, and the error grows with cultural distance from the US. Responses cluster in the Catholic European zone of the Inglehart-Welzel map. A May 2026 preprint proposes personas built from individual-level value positions. Source: [Abels et al.](https://arxiv.org/pdf/2605.16193) (I could not read the PDF body; the claims come from a search summary of the paper).
- A 2026 test on US WVS wave 7 found persona prompting gave no clear aggregate gain over plain prompts. Two small models, 31 items. Source: [arXiv 2602.18462](https://arxiv.org/html/2602.18462v1).
- Park et al.: agents grounded in two-hour interviews with 1,052 Americans reached 83% of the person's own two-week test-retest consistency on GSS items. Survey-only was 82%, combined 86%, demographics-only 74%. Source: [arXiv 2411.10109](https://arxiv.org/abs/2411.10109).

## What it means for Real World

- For the product: Agents should carry a real respondent's full attitude vector, not a one-line demographic prompt. That is the cheapest defence against variance collapse and Western flattening. Every agent needs a provenance field (donor survey, wave, matching distance) so "click any agent to ask why" can be answered honestly.
- For the engineering: Two stages. Stage 1: per-country raking of age, sex, urban/rural, education to published marginals, integerised by truncate-replicate-sample. Stage 2: nearest-neighbour donor matching on shared X within country, with a fallback to the nearest cultural-zone country, flagged in provenance. Allocate agents by stratified sample with weights, not proportional to population, or India and China take about a third of the 100,000 and small regions get a handful. Output the assumption (conditional independence) in the docs.
- For the business: The IPUMS finding blocks "census microdata from 100+ countries" as a launch claim for a commercial product. Using it internally to calibrate, then shipping only marginals-derived agents, is a legal grey zone nobody has ruled on. Get this decided before the YC application text says it.

## Recommendations

1. Do not ship IPUMS International microdata or agents derived from it. Email IPUMS for a written position on derived synthetic data this week. Until answered, build on open marginals only.
2. Build stage 1 on UN WPP and WorldPop marginals plus whatever national statistics offices publish openly. Write IPF plus truncate-replicate-sample in numpy. No new dependency.
3. Build stage 2 as donor matching from WVS, Pew and barometer respondents. Start with Gower or nearest-neighbour distance over 6 to 8 shared covariates. Port StatMatch logic or call it through R only if time allows.
4. Read the WVS, Pew, Gallup and Afrobarometer terms for commercial use and redistribution before ingesting anything. Record the result in the repo.
5. Report matching error with Frechet-style bounds or a simple sensitivity run, and show the country coverage tier (full donors, borrowed donors, demographics only) in the globe UI.
6. Defer deep generative models. Revisit CTGAN only if sampling zeros show up in the high-dimension checks. Add a holdout check: fit marginals, compare unseen cross-tabs.

## Open questions

- Is a synthetic agent derived from IPUMS International "data" under its terms? Ask IPUMS and the relevant statistics agencies in writing.
- WVS, DHS, Gallup World Poll and Pew terms for commercial use. I could not open them. Read each licence page.
- How much does the conditional independence assumption hurt for attitudes given only demographics? Test in one country with a fully joint file (for example US GSS) by hiding Y and matching it back.
- How many countries have usable open donor surveys? Count by region before promising 100+ countries.
- UN WPP and national bureaus' redistribution terms (not opened).

## Sources

- [Scalable Population Synthesis with Deep Generative Modeling (Borysov, Rich, Pereira)](https://arxiv.org/abs/1808.06910), accessed 2026-10-11
- [Robustness Analysis of Deep Learning Models for Population Synthesis](https://arxiv.org/abs/2211.13339), accessed 2026-10-11
- [Generating a Two-Layered Synthetic Population for French Municipalities, JASSS 24(2)](https://jasss.soc.surrey.ac.uk/24/2/5.html), accessed 2026-10-11
- [SemaPop](https://arxiv.org/abs/2602.11569), accessed 2026-10-11
- [IPUMS International home](https://international.ipums.org/international/), accessed 2026-10-11
- [IPUMS International terms of use](https://international.ipums.org/international/terms.shtml), accessed 2026-10-11
- [IPUMS terms, all collections](https://www.ipums.org/about/terms), accessed 2026-10-11
- [StatMatch manual (CRAN)](https://cran.r-universe.dev/StatMatch/doc/manual.html), accessed 2026-10-11
- [Statistical Matching using Fractional Imputation](https://arxiv.org/pdf/1510.03782), accessed 2026-10-11 (via search summary)
- [synthpop on CRAN](https://cran.r-project.org/web/packages/synthpop/index.html), accessed 2026-10-11
- [PopGen3 on GitHub](https://github.com/chnfanyu/PopGen3), accessed 2026-10-11
- [WorldPop 1 km global mosaic](https://hub.worldpop.org/geodata/summary?id=24777), accessed 2026-10-11
- [WorldPop data catalog](https://www.worldpop.org/datacatalog/), accessed 2026-10-11
- [Calibrated Value Personas (Abels et al.)](https://arxiv.org/pdf/2605.16193), accessed 2026-10-11 (PDF body unreadable; search summary only)
- [Assessing the Reliability of Persona-Conditioned LLMs as Synthetic Survey Respondents](https://arxiv.org/html/2602.18462v1), accessed 2026-10-11
- [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals (Park et al.)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
