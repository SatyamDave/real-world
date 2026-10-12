# ICP deep dive: policy units, think tanks, academics

- Date: 2026-10-11
- Area: product
- Confidence: low-medium. The credibility rules (US OMB, UK AQuA Book, AEA, the four papers) are from primary pages I opened. The web search budget ran out before I could look for named buyers, prices or sales cycles, so everything about who buys and how fast is inference, not evidence.

## Answer

Policy units, think tanks and academics will not buy a number. They will buy something they can audit, rerun and defend to a minister or a referee. Real World's hashed track record and typed trace already point that way, but these buyers will test replication of published studies first, and the research on synthetic respondents says that test is where simulations most often fail. Treat academics as the credibility channel and free users, treat government analysts as the paying ICP, and do not promise either group that a simulated agent stands in for a person.

## Findings

**What the evidence says about the core product claim.**
- Park et al. built agents from two-hour interviews with 1,052 Americans. On held-out General Social Survey items they reached 83% (interview), 82% (survey) and 86% (combined) of the participants' own two-week test-retest consistency, against 74% for demographics-only. The authors call the gain over either source alone "modest." This is US-only and 1,052 people. [arXiv 2411.10109](https://arxiv.org/abs/2411.10109)
- Bisbee et al. (Political Analysis, Oct 2024) found synthetic means land within one ANES standard deviation, but synthetic variance is far too low. A power analysis implied a sample about ten times smaller than the real one. 48% of synthetic regression coefficients differed significantly from ANES, and 32% of those flipped sign. The same prompt gave different results in April, June and July 2023 after a silent model update. Exact reruns were not possible. [Political Analysis](https://www.cambridge.org/core/journals/political-analysis/article/synthetic-replacements-for-human-survey-data-the-perils-of-large-language-models/B92267DC26195C7F36E63EA04A47D2FE)
- Wang, Morgenstern and Dickerson (accepted at Nature Machine Intelligence) ran 3,200 human participants across 16 identities on four LLMs. LLMs misportray and flatten identity groups, and identity prompts can essentialize them. Inference-time fixes reduced the harm but did not remove it. [arXiv 2402.01908](https://arxiv.org/abs/2402.01908)
- Argyle et al. introduced "algorithmic fidelity," the claim that conditioned GPT-3 reproduces subgroup response distributions. It is the paper reviewers will cite on both sides. [arXiv 2209.06899](https://arxiv.org/abs/2209.06899)

**What government buyers require.**
- UK: the AQuA Book (updated 30 July 2025) says "All analysis shall be assured," with an independent assurer separate from the analyst. It requires technical documentation, assumption and decision logs, an assurance statement, and Reproducible Analytical Pipeline practice. The 2025 edition adds black-box and AI models, which need stronger validation, ongoing performance checks and drift monitoring. [AQuA Book](https://www.gov.uk/government/publications/the-aqua-book-guidance-on-producing-quality-analysis-for-government)
- UK: the Magenta Book (HM Treasury, updated 15 May 2026) is the evaluation guidance. It says evaluation should be built into design from the start. It is advice, not a mandate. [Magenta Book](https://www.gov.uk/government/publications/the-magenta-book)
- US: OMB M-25-22 (3 April 2025) applies to AI contracts from solicitations issued 180 days later, and agencies must update acquisition procedures within 270 days. It tells agencies to scope IP and licences to avoid vendor lock-in, keep the components needed to operate and monitor the system available for as long as needed, limit what vendors retain of agency data, and require documentation that supports performance tracking. It encourages performance-based contracts. National security systems are excluded. [M-25-22 (PDF)](https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-22-Driving-Efficient-Acquisition-of-Artificial-Intelligence-in-Government.pdf)

**What academics require.**
- The AEA data and code policy asks for a replication package before acceptance: data or an availability statement, code, a README mapping outputs to exhibits, and an open licence. Restricted data needs five-year preservation and public code. "Upon request" is generally not accepted. [AEA policy](https://www.aeaweb.org/journals/data/data-code-policy)
- A simulation built on a hosted closed model that changes under the user fails this standard by default (Bisbee et al.).

**What I could not verify.** Named buyers, contract sizes, procurement timelines, and think-tank budgets. Several pages (Metaculus, CBO, Science, Nature) returned 403. I did not find evidence that any policy unit has bought a synthetic-population product.

## What it means for Real World

- For the product:
  - Lead with the receipts page and the trace, not the globe. A policy analyst needs: inputs, assumptions, ensemble spread, model version, and a one-click rerun.
  - Show spread honestly. Bisbee's variance collapse is exactly what a referee will check first.
  - Never present a single agent's answer as a person's view. Label agents as model draws.
  - "Replicate a published study" is the best demo for this ICP, and also the highest risk. Pick studies where the result is known to hold, report misses beside hits.
- For the engineering:
  - Pin and record model version, seed, prompt hash and data snapshot on every run. Silent model drift is the documented failure for reproducibility.
  - Export a run bundle (config, inputs, outputs, code version) that mirrors an AEA README and an AQuA assumption log. This is cheap and sells.
  - Report coverage per country and group. Flattening is documented, so a global claim needs per-region error.
- For the business:
  - Government analysts are the only group here with a budget, and they buy through assurance and procurement rules that favour documentation and exit rights. Offer data deletion, export, and no vendor retention of their data by default.
  - Academics and think tanks pay little and cite a lot. Give them a free tier and a citation format. Do not build enterprise features for them.
  - A 22-day sprint will not close a government contract. For the YC application, show design-partner conversations and the public track record, not signed procurement.

## Recommendations

1. Write a "Run bundle" spec (one page): model id and version, seed, prompt hash, data snapshot, code commit, ensemble size, outputs. Ship the export in the API by launch. Engineer and PM can both read it.
2. Publish a "Limits" page before launch quoting the four papers above: variance collapse, model drift, group flattening, US-heavy evidence. Add our own per-country error once we have one.
3. Run three replications of published studies with known outcomes and publish all results, including misses, as the first receipts entries. Pre-register the study list with a hash.
4. Add a one-page assurance pack template mapped to AQuA headings (assumptions log, verification vs validation, drift monitoring). Offer it to UK analysts.
5. Put data handling in the API terms in plain language: no retention of customer data beyond the run, deletion on request, export on exit (mirrors M-25-22 intent).
6. Book 10 interviews with policy analysts, think-tank modellers and academics before 27 Oct. Ask what they would need to see to cite or buy. Record answers in the repo.
7. Do not claim "replaces surveys." Claim "cheap first pass with stated error, then run the real poll."

## Open questions

- Who actually buys? Find out by interviews and by checking public contract notices (UK Contracts Finder, US SAM.gov) for simulation or synthetic-respondent purchases.
- What do policy units pay for adjacent tools (microsimulation, forecasting platforms)? Needs pricing pages and two or three analyst calls.
- Do referees accept simulated agents as a method? Check journal policies and recent reviews of LLM-as-respondent papers.
- Do non-US results hold up? The strongest numbers here are US-only. Needs our own validation against WVS and regional barometers.
- Would a UK or EU unit accept a US-hosted vendor? Needs a data-residency check with a real prospect.

## Sources

- [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals (Park et al.)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Synthetic Replacements for Human Survey Data? The Perils of Large Language Models (Bisbee et al.)](https://www.cambridge.org/core/journals/political-analysis/article/synthetic-replacements-for-human-survey-data-the-perils-of-large-language-models/B92267DC26195C7F36E63EA04A47D2FE), accessed 2026-10-11
- [Large language models that replace human participants can harmfully misportray and flatten identity groups (Wang et al.)](https://arxiv.org/abs/2402.01908), accessed 2026-10-11
- [Out of One, Many (Argyle et al.)](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [The AQuA Book, UK Government](https://www.gov.uk/government/publications/the-aqua-book-guidance-on-producing-quality-analysis-for-government), accessed 2026-10-11
- [The Magenta Book, HM Treasury](https://www.gov.uk/government/publications/the-magenta-book), accessed 2026-10-11
- [OMB M-25-22, Driving Efficient Acquisition of AI in Government](https://www.whitehouse.gov/wp-content/uploads/2025/02/M-25-22-Driving-Efficient-Acquisition-of-Artificial-Intelligence-in-Government.pdf), accessed 2026-10-11
- [AEA Data and Code Availability Policy](https://www.aeaweb.org/journals/data/data-code-policy), accessed 2026-10-11
