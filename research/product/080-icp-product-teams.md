# ICP deep dive: startup and consumer product teams running pricing and concept tests

- Date: 2026-10-11
- Area: product
- Confidence: medium-low. Vendor pricing and the two main papers were read on their own pages. The shared web search budget ran out, so I could not find budget surveys, WTP replication numbers, or buyer interviews. Those gaps are listed below.

## Answer

Product teams already pay real money for slow, small, human-panel tests, so the pain is real. But a "whole-world, 100k-agent" simulation is the wrong thing to sell them first. They need a cheap, fast, calibrated answer to one narrow question ("which of these prices or concepts wins, and by how much") with a visible error bar and a track record. Real World should treat this ICP as a secondary wedge for the public track record, not the YC story, and ship one narrow typed endpoint for it only if it costs almost nothing to build.

## Findings

**What teams use today, and what it costs.**
- Conjointly (pricing and conjoint surveys): free tier caps advanced methods at 20 responses; Professional is $2,895 per team per year; Ultimate starts at $10,000 per year. Its AI features analyse real responses (text analytics $0.15 per complete). It lists no synthetic respondents. [Conjointly pricing](https://conjointly.com/pricing/)
- Wynter (B2B message and pricing-page tests): Pro $20,000 per year, Elite $40,000, Black $100,000. Pay-as-you-go costs about 50% more per test. Results in 12 to 48 hours from a verified panel of 86K. [Wynter pricing](https://www.wynter.com/pricing)
- User Interviews (recruiting): $49 per session pay-as-you-go, down to about $36 at volume, plus $45 for B2B targeting, plus participant incentives and a 3% fee if they pay out. [User Interviews pricing](https://www.userinterviews.com/pricing)
- Prolific (consumer survey panels): corporate platform fee usually 42.8%; minimum pay $8 per hour, recommended $12. [Prolific pricing](https://www.prolific.com/pricing)
- Qualtrics: no published prices; "Request Pricing" on every tier, priced by interactions. Enterprise buyers, not seed startups. [Qualtrics pricing](https://www.qualtrics.com/pricing/)

So a seed-stage team doing one pricing test pays roughly $3K a year for a tool plus panel cost, or low five figures for a managed B2B test. Waiting is the other cost: days to weeks. Speed and price are the opening for synthetic tools. Note I did not find published numbers for how much startups budget for research in total.

**Who sells simulation to them.**
- Simile: sells to large enterprises (CVS Health, Gallup, Suntory, Wealthfront named). Claims 85% of human self-retest accuracy in a 2024 study of 1,000 people, a confidence tag on each result, weekly validation against real humans, and a $200M Series B at $2B. These are the company's claims. [Simile](https://www.simile.com/)
- Aaru: sells to "businesses making high-stakes decisions" for product, price and message tests. Cites its own 2,993-question validation: mean TVD 7.62%, MAE 3.53%, no named comparison set. No public pricing. [Aaru](https://aaru.com)
- Both go to enterprise via "contact us." Neither publishes prices or a self-serve path. That leaves a gap for self-serve at startup price points, but a gap alone is not demand.

**What evidence of accuracy exists.**
- The best public result for purchase-intent concept tests: Maier et al. (PyMC Labs and Colgate-Palmolive authors) get LLM respondents to 90% of human test-retest reliability and KS similarity above 0.85, on 57 personal-care surveys with 9,300 human responses. The trick is to ask for free text and map it to a Likert distribution by embedding similarity, because direct numeric ratings give unrealistic distributions. Open code, 185 stars, license listed as both Apache-2.0 and MIT, so check before use. One category, one corporation's data. [arXiv 2510.08338](https://arxiv.org/abs/2510.08338), [pymc-labs repo](https://github.com/pymc-labs/semantic-similarity-rating)
- Anthis et al. (ICML 2025): LLM simulations "can already be used for pilot and exploratory studies," but results are limited and need iterative evaluation. [arXiv 2504.02234](https://arxiv.org/abs/2504.02234)
- Nielsen Norman Group (June 2024) is the skeptic buyers will quote: synthetic users flatter ideas ("a game-changer"), say they finished all 7 courses where real users finished 3, and "care about everything," so they cannot rank priorities. Their advice: hypotheses, never findings; avoid niche populations. [NN/g](https://www.nngroup.com/articles/synthetic-users/)
- Horton et al., "Homo Silicus": LLM runs of classic economics experiments give results "qualitatively similar" to the originals. Qualitative direction, not calibrated magnitudes. I could not retrieve a price or WTP result from the abstract. [arXiv 2301.07543](https://arxiv.org/abs/2301.07543)

**What this says about trust.** Every credible claim above shares three traits: a named human benchmark, a ceiling defined by human retest noise, and a stated domain. Claims without those (Aaru's TVD with no comparison set) are exactly what a skeptical PM will discount. A pricing test needs a magnitude (demand at $19 vs $29), and the evidence for magnitude is thinnest: the strong results are on rank order and distribution shape of Likert ratings, not on demand curves.

## What it means for Real World

- For the product: The product teams' question is a single decision with 2 to 5 options and a target segment. A 100k-agent world is mostly irrelevant to them. What they would use from our stack: segment-conditioned agents (country, income, age), an ensemble spread shown as an error bar, and a per-agent "why." Output must be a ranked list with an interval, plus a confidence flag, never a single number.
- For the engineering: Use the SSR method (free text to Likert via embeddings) for rating-style questions instead of asking models for numbers. Do not promise absolute demand or WTP. Keep a "concept test" output type in `POST /v1/simulate` that is a thin wrapper over what already exists; do not build a survey tool, conjoint designer, or panel manager.
- For the business: Competitors sell to enterprises on contact-us terms; Conjointly's $2,895 per year is the price anchor for a startup. A free or cheap self-serve test is plausible, but the revenue is small and the buyers are skeptical. The real prize is the public hashed track record, which this ICP cares about only if it covers consumer-product questions.

## Recommendations

1. Do not make product teams the lead ICP for the YC application. Frame them as the first paying user type of the API, and the track record as the proof.
2. Add a `concept_test` output type: options in, ranked options out with ensemble interval and a confidence flag. One endpoint, one page. A PM can read it; an engineer can extend it.
3. Implement SSR for any Likert-style question and report its human-retest ratio on our own check. Confirm the repo license before copying code.
4. Run one calibration study before launch: replicate 10 to 20 published pricing or concept experiments with known human results, and publish the miss rate, including where we flop. Anchor on the NN/g failure modes (flattery, everything matters, over-reported completion).
5. Add a "pilot only" label to every concept output until we beat a stated human baseline in at least two categories.
6. Interview 10 product managers at seed to Series B consumer startups in the next week. Ask what they spent on their last pricing test, how long it took, and what number would make them skip the human test. Do not build the self-serve flow before this.
7. Price at or below Conjointly's anchor. Draft: free tier of 20 simulations a month, paid tier under $300 a month. Revisit after the interviews.

## Open questions

- How much do seed-stage consumer teams actually spend per year on pricing and concept research? Not found. Ask in the interviews, or pull a Conjointly/Wynter customer count.
- Do LLM agents reproduce price elasticity, not just Likert shape? No published number found. Our calibration study (rec 4) would answer it.
- Has Aaru or Simile published a head-to-head against a human panel in pricing specifically? Check their papers; their sites only gave aggregate claims.
- Is the SSR repo license Apache-2.0 or MIT? Read the LICENSE file.
- Whether Qualtrics or other incumbents have launched synthetic panels: my fetch of the Qualtrics pricing page showed none; a launch-page URL guess returned 404. Search once the web budget is available.

## Sources

- [Conjointly pricing](https://conjointly.com/pricing/), accessed 2026-10-11
- [Wynter pricing](https://www.wynter.com/pricing), accessed 2026-10-11
- [User Interviews pricing](https://www.userinterviews.com/pricing), accessed 2026-10-11
- [Prolific pricing](https://www.prolific.com/pricing), accessed 2026-10-11
- [Qualtrics pricing](https://www.qualtrics.com/pricing/), accessed 2026-10-11
- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Aaru](https://aaru.com), accessed 2026-10-11
- [LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings, arXiv 2510.08338](https://arxiv.org/abs/2510.08338), accessed 2026-10-11
- [pymc-labs/semantic-similarity-rating](https://github.com/pymc-labs/semantic-similarity-rating), accessed 2026-10-11
- [LLM Social Simulations Are a Promising Research Method, arXiv 2504.02234](https://arxiv.org/abs/2504.02234), accessed 2026-10-11
- [Large Language Models as Simulated Economic Agents (Homo Silicus), arXiv 2301.07543](https://arxiv.org/abs/2301.07543), accessed 2026-10-11
- [Nielsen Norman Group, Synthetic Users](https://www.nngroup.com/articles/synthetic-users/), accessed 2026-10-11
