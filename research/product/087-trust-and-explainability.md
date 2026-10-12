# How users come to trust simulated answers

- Date: 2026-10-11
- Area: product
- Confidence: medium. The web search budget ran out mid-task, so this rests on 10 opened pages, not a broad survey. Metaculus, Wharton, Science and PubMed pages returned 403 or no text. Claims that rest on memory are marked as such.

## Answer

Trust in a simulation is earned by a public, unbackfillable record plus honest uncertainty. It is not earned by agent chat or by a plausible trace. The agent trace and the "ask why" interview are good for exploration, but the best evidence says model self-explanations are often not the real cause of the output, and that fluent explanations make people overconfident. Real World should lead with the receipts page and ensemble spread, label every agent explanation as a simulated narrative, and ship nothing that looks like certainty.

## Findings

**Track record is the one trust asset competitors cannot fake quickly.**
- Aaru's own site cites a validation study of 2,993 questions with "mean TVD of 7.62% and MAE of 3.53%" and a tracker of 71 judgments across 40,000 simulated investors, dated 2026-07-17. It does not define TVD or MAE on the page, and "industry-leading" is its own word. It makes no 2024 election claim there. [Aaru](https://www.aaru.com)
- Simile says it validates "weekly" against real humans with "over 7,000 evaluations", and tags each result with a predicted accuracy level (high, moderately high, medium). It gives no overall accuracy number. It does not describe any way to inspect agents. [Simile](https://www.simile.com/)
- So the market norm today is vendor-reported aggregate numbers, no pre-registered forecasts and no per-question public score. That is the gap a hashed daily record fills.
- The Brier score is the mean squared error of probabilities. 0 is perfect. A constant 50% forecast scores 0.25 on every binary question. Scoring against market price therefore needs a skill form: `1 - BS_ours / BS_market`, shown with the question count. [Brier score](https://en.wikipedia.org/wiki/Brier_score)
- The Good Judgment Project is the model for credibility: Brier-scored, won both IARPA ACE seasons, and was 35% to 72% more accurate than other teams. Even so, the article notes a 2018 review criticizing the lack of transparency on why the method worked. A good score does not explain itself. [Good Judgment Project](https://en.wikipedia.org/wiki/Good_Judgment_Project)

**Uncertainty displays are widely misread.**
- NHC's cone covers the "probable track of the center", built from circles sized so two-thirds of past 5-year forecast errors fall inside. The 2026 radii use 2021 to 2025 errors: at 48 hours, 62 nautical miles in the Atlantic. The 2/3 is a statement about past track error, not about where damage occurs. NHC's page does not discuss misreading. I know from memory that the cone is a well-documented misread (people read it as storm size or damage area), but I could not open a study this session. [NHC](https://www.nhc.noaa.gov/aboutcone.shtml)
- Lesson: if a plain-language band needs a footnote to be read correctly, state the footnote on the chart.

**Explanations raise trust faster than they raise accuracy.**
- Steyvers et al. (Nature Machine Intelligence) found people overrate how often an LLM is right (a "calibration gap"). Longer explanations raised confidence without improving accuracy. Rewriting explanations to match the model's internal confidence shrank the gap. [arXiv 2401.13835](https://arxiv.org/abs/2401.13835)
- Turpin et al.: chain-of-thought explanations "can systematically misrepresent the true reason" for a prediction. Biased prompts cut accuracy by up to 36% on 13 tasks and the explanations did not mention the bias. [arXiv 2305.04388](https://arxiv.org/abs/2305.04388)
- Chen et al. (Anthropic): reasoning traces reveal a used hint "in at least 1%" of cases and often below 20%. [arXiv 2505.05410](https://arxiv.org/abs/2505.05410)
- Implication: "click any agent to ask why" yields a story the model writes after the fact. It is not an audit of the cause.

**Interview-grounded agents are the best-evidenced trust story, within limits.**
- Park et al. (v3 dated 2026-06-28): agents from two-hour interviews of 1,052 Americans reached 83% of participants' own two-week test-retest consistency on held-out General Social Survey items. Survey-only agents reached 82%, combined 86%, demographics-only 74%. [arXiv 2411.10109](https://arxiv.org/abs/2411.10109)
- Simile quotes this as "85%". The abstract says 83% for interviews; the 85% figure is from v1 as I recall, not from the page I opened. Cite 83% and the version.
- The sample is US-only, so it does not transfer to a 100-country claim. The interview-grounded gain is 9 points over demographics alone, which is the honest case for the opt-in twin moat.

**Other patterns, from memory and not verified this session.** Metaculus shows a calibration curve and per-question scores publicly. Dietvorst et al. found people drop an algorithm after seeing it err, and that letting them adjust the output reduces that. I could not open either source. Treat both as leads.

## What it means for Real World

- For the product:
  - Receipts page is the home page for skeptics. One row per forecast: question, hash, committed-at time, our probability, market price, outcome, per-question Brier, running skill vs market with n.
  - Show ensemble spread as the headline, not a point estimate. Use a band plus the raw members on hover, and write the band's meaning in one sentence beside it.
  - Label "ask this agent why" as "simulated account, not the cause". Pair it with the real drivers: which beliefs changed, which news items moved them, which segment weights applied. These come from our own pipeline, not from model text.
  - Tag each forecast with a confidence class from historical misses in that topic and region, like Simile does. Show "no track record yet" where true.
  - Show Western-flattening risk explicitly: per-country coverage and sample size on every world-level claim.
- For the engineering:
  - Store the trace as structured data: input events, belief deltas, segment weights, ensemble seeds, model version. Generate narrative from it, not the reverse.
  - Hash each forecast with its full payload and publish before outcomes. Keep the scorer separate, append-only, and unable to edit past rows.
  - Compute skill vs market and calibration bins per topic. Do not report one pooled number.
  - Expose the same fields through the API (`ensemble`, `trace`, `confidence_class`) so the web app has no private data.
- For the business:
  - The pitch for YC is "we publish what we predicted before it happened." That claim is checkable and competitors' aggregate claims are not.
  - With 22 days, the record will be short at launch. Say so on the page. A small honest n beats a large unverifiable one.

## Recommendations

1. Build the receipts page first, before the globe. Fields as above, public, with hash and timestamp per row. Owner: engineer builds, PM writes the one-line definitions.
2. Report skill vs market price with n and a plain note that 0.25 is the coin-flip score. Show per-question rows, not only an average.
3. Make ensemble spread the default visual. Write one sentence on what the band covers next to every band.
4. Replace "ask why" with two panels: "what moved this agent" (from structured trace) and "agent's own words" (labeled as simulated). Never present the second as the cause.
5. Add a confidence class per forecast from past error by topic and region; display "no track record" when n is below a set threshold.
6. Cite Park et al. as 83% of test-retest on held-out GSS items, US-only, v3. Do not repeat the 85% figure.
7. Run a 5-person usability check on the band and the receipts page: ask what the band means and whether the forecast was right. Fix the wording until all five answer correctly.

## Open questions

- What do users actually conclude from an ensemble band in this product? Test with the usability check in recommendation 7.
- Is there a published study on cone-of-uncertainty misreading to cite? Search was cut off. Look for Broad et al. 2007 (Columbia CRED) and later Padilla work.
- Exact Dietvorst et al. findings and the Metaculus calibration display could not be opened. Re-fetch from a mirror that returns text.
- How do the Aaru TVD and MAE metrics compare with Brier on binary questions? The page does not define them. Ask them or find the validation study.
- Does the agent-interview feature raise or lower trust in a non-expert sample? Only an A/B test on our own users will tell.

## Sources

- [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals (Park et al.)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [What Large Language Models Know and What People Think They Know (Steyvers et al.)](https://arxiv.org/abs/2401.13835), accessed 2026-10-11
- [Language Models Don't Always Say What They Think (Turpin et al.)](https://arxiv.org/abs/2305.04388), accessed 2026-10-11
- [Reasoning Models Don't Always Say What They Think (Chen et al.)](https://arxiv.org/abs/2505.05410), accessed 2026-10-11
- [NHC: About the Cone of Uncertainty](https://www.nhc.noaa.gov/aboutcone.shtml), accessed 2026-10-11
- [Aaru](https://www.aaru.com), accessed 2026-10-11
- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Brier score, Wikipedia](https://en.wikipedia.org/wiki/Brier_score), accessed 2026-10-11
- [Good Judgment Project, Wikipedia](https://en.wikipedia.org/wiki/Good_Judgment_Project), accessed 2026-10-11
- [Metaculus, Wikipedia](https://en.wikipedia.org/wiki/Metaculus), accessed 2026-10-11 (little detail on scoring display)
