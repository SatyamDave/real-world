# Team and advisors for Real World

- Date: 2026-10-11
- Area: business
- Confidence: medium. Names and affiliations come from pages I opened. The first-5-hires list is my judgment, not sourced: the search tool hit its budget before I could search hiring advice, and the YC library pages I fetched returned no content.

## Answer

Real World's hard problems are scoring and calibration, survey data, and the agent engine. Hire for those, not for a generic "AI team". For 22 days, do not hire anyone. Line up three or four advisors who give the public track record credibility: one forecasting-evaluation person, one survey-methods person, one agent-based-modelling person, and one for the global data. Then hire five roles after the YC application, in the order below.

## Findings

**The competitors are staffed by academics.**
- Simile was founded by Joon Sung Park (CEO), Michael Bernstein (Chief Data Officer) and Percy Liang (Chief Scientist). The site announces a $200M Series B at a $2B valuation, with no investors named. It lists no other team members. Customers named include Gallup, CVS Health and Deloitte. All numbers are self-reported. [Simile](https://www.simile.com/)
- The Park/Bernstein/Liang paper on 1,052 interview-grounded agents is the basis for our "opt-in twins". Interview-plus-survey agents reached 86% of two-week human test-retest consistency on held-out GSS items. Demographics-only agents reached 74%. Revision v3 is dated June 28, 2026. [arXiv 2411.10109](https://arxiv.org/abs/2411.10109)
- Aaru's site names no founders or team. It claims a 2,993-question validation with mean TVD 7.62% and MAE 3.53%, and lists EY and Breakwater as partners. Self-reported. [Aaru](https://www.aaru.com)

So the field leaders are the people who invented the method. We cannot outbid them for those people. We can offer them something they lack: a public, hashed, un-backfillable record.

**Forecasting and evaluation people.**
- Forecasting Research Institute (FRI). Philip Tetlock is President and Chief Scientist. Josh Rosenberg is CEO. Ezra Karger is Director of Research. Scientific advisors are Barb Mellers and David Budescu. Pavel Atanasov leads Project Improbable. Board members include Jennifer Lerner, Lyle Ungar and Eva Vivalt. [FRI team](https://forecastingresearch.org/team)
- FRI runs ForecastBench, a "dynamic, contamination-free benchmark" of LLM forecasting with human comparison groups. The site lists a superforecaster-LLM tournament on October 25, 2026, two days before our launch. [ForecastBench](https://www.forecastbench.org/)
- The Good Judgment Project was co-created by Tetlock, Mellers and Don Moore. It won both seasons of the IARPA forecasting tournament and scored forecasts with Brier scores. [Wikipedia: Superforecasting](https://en.wikipedia.org/wiki/Superforecasting)

**Survey and polling methods people.**
- Courtney Kennedy designed Pew's U.S. surveys and the American Trends Panel. She chaired the AAPOR committee that evaluated 2016 polling. Her Pew page now lists her as "Former Vice President", so she may have moved. Verify before approaching. [Pew staff page](https://www.pewresearch.org/staff/courtney-kennedy/)
- Andrew Gelman is a professor in Statistics and Political Science at Columbia. His page lists survey methods and campaign poll variability. It did not mention MRP or the Economist model, so I only cite what the page says. [Gelman](https://sites.stat.columbia.edu/gelman/)
- Lisa Argyle and co-authors introduced "silicon samples" and "algorithmic fidelity": GPT-3 conditioned on real survey backstories reproduced subgroup response patterns. [arXiv 2209.06899](https://arxiv.org/abs/2209.06899)

**Agent-based modelling people.**
- Doyne Farmer is Director of Complexity Economics at INET Oxford, Baillie Gifford Professor at Oxford, and External Professor at the Santa Fe Institute. He co-wrote the 2025 JEL review of agent-based modelling with Robert Axtell. His group published ASCENT, a tensor approach to population-scale agent-based simulation, in *Scientific Reports* in 2026. [INET Oxford](https://www.inet.ox.ac.uk/people/j-doyne-farmer)
- Other ABM names that appear in the literature: Joshua Epstein, Leigh Tesfatsion, Cars Hommes, Blake LeBaron, Domenico Delli Gatti. I did not verify their current affiliations. [Wikipedia: ACE](https://en.wikipedia.org/wiki/Agent-based_computational_economics)

**Data owners.**
- IPUMS International covers 104 countries, 656 censuses and surveys, over 1 billion person records. The page lists the University of Minnesota as a supporter and links a "Partner with IPUMS" page. No licensing terms on the page. [IPUMS International](https://international.ipums.org/international/)
- GDELT was created by Kalev Leetaru. The project says it lacks resources for one-on-one help. [GDELT](https://www.gdeltproject.org/about.html)

**What did not work.** Metaculus and Good Judgment's team pages returned 403. I could not confirm their staff or pricing. I found no source for hiring benchmarks or salaries.

## What it means for Real World

- For the product: the credibility feature is the receipts page. An advisor who scores forecasts for a living (FRI-type) is worth more than a polling name on the website.
- For the engineering: the first engineers must own the nightly pipeline and the scoring ledger. Both are boring and both are the moat. Population-scale agent engines are research-grade, so borrow rather than invent.
- For the business: the YC application needs a founder-market story. Name advisors who have agreed in writing. Do not name people who have not.

## Recommendations

1. **Advisors, ask this week (4 slots, 2 hours a month, small equity, typically in the low tenths of a percent; check current norms):**
   - Forecasting evaluation: someone at FRI (Karger or Atanasov) or a Good Judgment-affiliated scientist. Job: sign off on the Brier-vs-market scoring protocol and the hash-before-outcome rule.
   - Survey methods: a former Pew/AAPOR-type methodologist (Kennedy, if she is reachable) or a Gelman-school MRP statistician. Job: review the post-stratification and the Western-flattening risk.
   - Agent-based modelling: Farmer's group or an Epstein/Axtell-school researcher. Job: validation of the ensemble and variance collapse.
   - Global data: one IPUMS or regional-barometer insider. Job: access, licensing, per-country quality warnings.
   Ask by cold email with one concrete page, the track-record spec, and one concrete question.
2. **Hire 1: forecasting and evaluation scientist.** Owns scoring, calibration, contamination checks, the ledger. Hire first because it is the product claim.
3. **Hire 2: data and pipeline engineer.** Owns GDELT, polls, market feeds, nightly assimilation, cost control ($15-60 per night).
4. **Hire 3: simulation and agent engineer.** Owns sampling from census microdata, the ensemble, and the trace behind "click any agent to ask why".
5. **Hire 4: full-stack product engineer.** Owns the globe, forks, API, SDKs. Hire fourth, because a contractor can do the first version.
6. **Hire 5: survey-panel operations lead.** Owns the daily human panel and the opt-in twins consent flow. Needed because the panel is a moat only if it runs every day.
7. Founders hold the roles for product, fundraising and one of the above. Do not hire a salesperson until there are 3 paying API users.
8. Before the YC deadline of Nov 2, only list people who have replied yes. Put "advisors in conversation" in the narrative if needed, never names.

## Open questions

- Which of the named people are reachable and willing? Find out by emailing them; check for conflicts (Park, Bernstein and Liang are Simile's founders, so they are competitors, not advisors).
- Is Courtney Kennedy still at Pew, and is she free to advise? Check her current profile.
- What do first hires cost, and what equity do advisors get? I found no sourced benchmark. Check a recent compensation survey or ask YC alumni.
- Does IPUMS allow commercial derived products like ours? Read the terms and email the "Partner with IPUMS" contact.
- Can Metaculus or Good Judgment supply a paid human panel? Both sites returned 403; ask them directly.

## Sources

- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Aaru](https://www.aaru.com), accessed 2026-10-11
- [Forecasting Research Institute team](https://forecastingresearch.org/team), accessed 2026-10-11
- [ForecastBench](https://www.forecastbench.org/), accessed 2026-10-11
- [Wikipedia: Superforecasting](https://en.wikipedia.org/wiki/Superforecasting), accessed 2026-10-11
- [Pew: Courtney Kennedy](https://www.pewresearch.org/staff/courtney-kennedy/), accessed 2026-10-11
- [Andrew Gelman, Columbia](https://sites.stat.columbia.edu/gelman/), accessed 2026-10-11
- [Out of One, Many, arXiv 2209.06899](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [INET Oxford: J. Doyne Farmer](https://www.inet.ox.ac.uk/people/j-doyne-farmer), accessed 2026-10-11
- [Wikipedia: Agent-based computational economics](https://en.wikipedia.org/wiki/Agent-based_computational_economics), accessed 2026-10-11
- [IPUMS International](https://international.ipums.org/international/), accessed 2026-10-11
- [GDELT about](https://www.gdeltproject.org/about.html), accessed 2026-10-11
