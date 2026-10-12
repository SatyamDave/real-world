# Generative agents and interview-grounded twins

- Date: 2026-10-11
- Area: science
- Confidence: medium. The Park 2024/2026 numbers were read in the paper itself. The Columbia mega-study was read via its abstract and PDF text. The web search quota ran out before I could look for non-US twin studies or other 2026 follow-ups.

## Answer

Interview-grounded twins work well for predicting one US person's survey answers, and the number is real: 83% of test-retest on held-out GSS items. But it was one US sample, English only, with GPT-4o and a $90 to $100 per person data cost, so it cannot be copied to 100,000 agents in 22 days. A large 2025-26 Columbia test (19 studies, 164 outcomes) found twins barely beat a generic base-model persona. Real World should treat the 100k agents as population samplers judged on distributions, and build a small opt-in twin tier whose accuracy we measure ourselves.

## Findings

**Park 2023 (the original).** 25 agents in a Sims-style town, built from a memory record, periodic reflection and planning. Removing any of observation, planning or reflection hurt believability. It showed emergent behavior (a Valentine's party). It did not test accuracy against real people. ([arXiv 2304.03442](https://arxiv.org/abs/2304.03442))

**Park et al. 2024, now retitled "LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals".** Read in full from the PDF. ([arXiv 2411.10109](https://arxiv.org/abs/2411.10109))
- 1,052 US adults, stratified on age, gender, race, region, education, party. Recruited through Bovitz. Paid $60 for phase one, $30 for phase two, plus a $0 to $10 game bonus.
- A voice AI interviewer ran the American Voices Project protocol, about two hours, 6,491 words per person on average.
- Agent design is simple: the whole transcript goes in the prompt, plus "expert reflections" (short notes written by a model as a psychologist, behavioral economist, political scientist and demographer). GPT-4o for everything. No fine-tuning.
- Metric: agent accuracy divided by the person's own accuracy repeating the survey two weeks later. On 150 GSS items: interview 0.83 (raw 65.67% over self-consistency 79.53%), survey 0.82, both 0.86, demographics-only 0.74, short self-written persona 0.71. Chance is 0.30 raw.
- Big Five normalized correlation: interview 0.80, demographics 0.61. Economic games: no agent type significantly beat demographics. The authors call games a boundary case.
- Five experiments: agent effect sizes correlated r = 0.91 to 0.99 with human effect sizes, but agents overstated them (for example 12.59 vs 8.03 on Ames & Fiske). Only five studies, so underpowered.
- Ablations: deleting 80% of the transcript still gave 0.79. A bullet summary gave 0.81. So most of the value is facts, not voice, and a short profile is nearly as good.
- Bias: gap between best and worst ideology group fell from 13.75% (demographics) to 8.60% (interview). Race gap fell from 3.39% to 2.22%. Reduced, not removed.
- Stated limits: English only, one model family, no check that agents reproduce correlations between attitudes across the sample.
- Repo [joonspk-research/genagents](https://github.com/joonspk-research/genagents): MIT, 617 stars, 161 forks, 13 commits, defaults to gpt-4o-mini. It holds a bank of 3,000-plus agents made from GSS demographics only. The 1,000 interview agents are not public. Aggregate access is promised, and individual-level access needs review by the authors.

**Twin-2K-500 (Columbia, May 2025).** 2,058 US people, 500 questions, four waves, 2.42 hours each. Test-retest accuracy 81.72%. Twin accuracy 71.72% with GPT-4.1-mini, 87.67% of test-retest. A persona summary scored 68.02%, so compression costs about 3.7 points. Gemini Flash 2.5 scored 69.40%. The dataset is CC-BY-4.0 on Hugging Face. ([arXiv 2505.17479](https://arxiv.org/abs/2505.17479))

**Funhouse Mirrors (Columbia, v1 Sep 2025, v5 Apr 2026).** 19 pre-registered studies, 164 outcomes, 13,506 people in total. Twins correlate with humans at average r = 0.20 and are only modestly better than the homogeneous base model. Best configuration (GPT-4.1, temperature 0) reached r = 0.232. GPT-5, DeepSeek, Gemini 3 Pro, a fine-tuned GPT-4.1 and Centaur did not rescue it. Demographics-only vs full persona: r rose from 0.105 to 0.555 in one illustration, but individual-level accuracy was virtually unchanged (0.892 for demographics-only, per the paper). The five distortions: insufficient individuation, stereotyping, representation bias, ideological bias, hyper-rationality. Honest caveat: its outcomes are novel questions far from the survey the twin was built from, which is a harder test than Park's. ([arXiv 2509.19088](https://arxiv.org/abs/2509.19088))

**Reading the two together.** Park tests the same instruments the agent was built to resemble and normalizes by a noisy ceiling. Columbia tests new topics and uses raw correlation. Both can be true: twins retrieve and extrapolate what the person said, and fail on things the person never revealed. Neither supports claims about 100k simulated people reacting to a new event.

**Non-US.** Persona prompting is worse on WVS for non-Western countries and collapses to a narrow answer range. A May 2026 preprint adds value-profile personas with calibration to restore diversity and reports the biggest gains for under-represented countries. I only read the abstract, which gives no numbers. ([arXiv 2605.16193](https://arxiv.org/abs/2605.16193))

**Market.** Simile (Park is CEO) raised $200M Series B on 2026-07-30, led by Greenoaks, with a $2B valuation per secondary outlets; the one page I could open does not state valuation or any accuracy figure. It says the money funds a "confidence model" that scores each simulation. ([Raising.fi](https://raising.fi/news/simile-series-b-july-2026)) ExploraTwin, a free non-profit twin platform on Twin-2K-500, appeared August 2026. ([arXiv 2608.20539](https://arxiv.org/abs/2608.20539))

## What it means for Real World

- For the product: "Click any agent to ask why" must not imply the agent is a real person. Show it as one sampled draw from a segment, with the segment's evidence. Twins are a separate opt-in tier with its own accuracy label.
- For the engineering: Build agent state as a short fact profile (about 13K characters worked in Columbia, a bullet summary worked in Park), not a long transcript or free-roaming memory loop. Use temperature 0 for twin queries and ensemble across personas, not across noise. Cache the profile prefix.
- For the business: Simile has the Park lineage and money. Our difference is the dated public record and global coverage, not twin fidelity. A $90-100 per-person interview budget means 100k real twins would cost about $9-10M in participant pay alone, so none of the 100k can be interview-grounded.

## Recommendations

1. Define agents as survey-microdata personas (census plus WVS/Gallup/Pew attributes), scored on distribution match per segment, never on individual-level accuracy.
2. Copy Park's metric: report accuracy as a fraction of test-retest, with raw correlation next to it. Publish both, since Columbia shows they diverge.
3. Use Twin-2K-500 (CC-BY) and the genagents MIT repo as a weekend benchmark: run our profile format against its 71.72% / 87.67% baseline before shipping any twin claim.
4. Store each agent as a compact fact profile plus 4 expert-style notes. Test summary vs full text once; Park and Columbia both say the loss is small.
5. Add a variance check to the nightly job: compare the spread of agent answers to the spread in the survey data per country. Funhouse Mirrors and the WVS work say collapse is the default, not a rare bug.
6. Ship opt-in twins as a later, small tier (tens, not thousands), using an interview or a 2-hour survey, with consent and deletion. Label it unvalidated until we have our own test-retest.
7. Do not claim twins predict responses to novel events. No paper shows it. Our hashed forecasts are the only evidence we will have.

## Open questions

- Does Park's 83% hold outside the US and in other languages? No paper found. Find out: run the Park protocol on a small WVS-country pilot, or ask the authors.
- Do twins predict reactions to new events rather than known survey items? Only our own forecast scoring can say.
- What is the real token cost per twin query? I estimate roughly 9K tokens of transcript per query (6,491 words) but did not price it. Find out by running 50 agents.
- Was there any 2026 follow-up by Park's group besides the retitle? Search quota ran out. Check citations of 2411.10109 on Google Scholar.
- Can we get access to the 1,052 interview agents for benchmarking? Email listed in the repo (joonspk@stanford.edu).

## Sources

- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People / LLM Agents Grounded in Self-Reports (PDF read)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [joonspk-research/genagents](https://github.com/joonspk-research/genagents), accessed 2026-10-11
- [Twin-2K-500](https://arxiv.org/abs/2505.17479), accessed 2026-10-11
- [Digital Twins as Funhouse Mirrors](https://arxiv.org/abs/2509.19088), accessed 2026-10-11
- [Improving Cross-Cultural Survey Simulation with Calibrated Value Personas](https://arxiv.org/abs/2605.16193), accessed 2026-10-11
- [ExploraTwin](https://arxiv.org/abs/2608.20539), accessed 2026-10-11
- [Simile Series B (Raising.fi)](https://raising.fi/news/simile-series-b-july-2026), accessed 2026-10-11
