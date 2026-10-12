# Failure modes of LLM population simulation

- Date: 2026-10-11
- Area: science
- Confidence: medium. The numbers below come from papers I opened (abstracts and, for Funhouse Mirrors, the full HTML). Several are single-lab preprints, mostly US or one-country data, and I could not read every table. The web search budget ran out before I could look for election-backtest and contamination papers.

## Answer

Every failure mode on the list is real and measured. Simulated populations are too uniform (variance collapse), pulled toward a stereotype of each demographic, tilted toward Western and left-leaning answers, too agreeable, and too rational. Richer personas and better base models barely fix it. What helped is cheap and boring: condition on real individual answers, calibrate against held-out human data, publish spread honestly, and never claim individual-level accuracy. Real World should treat the agent population as a calibrated distribution generator, not as 100,000 people.

## Findings

**Variance collapse and homogeneity**
- Funhouse Mirrors (Li, Morwitz, Netzer, Perkowski, Toubia; Science Advances; 19 pre-registered studies, 164 outcomes, N=13,506 responses from 1,784 people in Twin-2K-500). Twin SD is lower than human SD in 154 of 164 outcomes (94%), significantly so in 140. Twin and human means differ significantly in 105 of 164 outcomes (64%). Average gap 0.35 SD. [arXiv 2509.19088v5](https://arxiv.org/html/2509.19088v5)
- Turkey, World Values Survey, 2,414 respondents as independent agents: concentration rose 0.36 to 0.69, entropy fell 1.46 to 0.77, 85% of responses landed on a modal default, total variation distance 0.44. Collapse is worst when a question has one "normatively correct" answer (r=0.55). Single author, preprint. [Ozkan, arXiv 2607.18310](https://arxiv.org/abs/2607.18310)
- Open-weight models on survey scales: an unconditioned persona had 1.24 bits of response entropy versus 2.20 for real people, put about 60% of answers on the midpoint, and skipped 2 of 5 response options on every item. [Lee and Yue, arXiv 2609.32638](https://arxiv.org/html/2609.32638)
- A position-paper review found fewer than half of LLM-simulation studies even test variance, and most that do find lower variance than humans. [Wu et al., arXiv 2506.19806](https://arxiv.org/abs/2506.19806)
- Ten LLMs tested for persona collapse: the models with the highest per-persona fidelity gave the most stereotyped populations. No numbers on the abstract page. [Xiao et al., arXiv 2604.24698](https://arxiv.org/abs/2604.24698)

**Funhouse Mirrors / Twin-2K-500 (individual accuracy)**
- Twin-2K-500 is 2,058 US adults, 500+ questions, with a test-retest wave. [Toubia et al., arXiv 2505.17479](https://arxiv.org/abs/2505.17479)
- Twin-to-human correlation averages r=0.197. Demographics only gives 0.145, an empty persona gives 0.080, random gives 0.001. A 128K-character persona is statistically no better than demographics alone on accuracy (0.748 vs 0.746, p=0.37). Correlation is significant in only 97 of 164 outcomes (59%).
- Stereotyping: full-persona twins sit closer to demographics-only twins than to the real person. Representation bias: accuracy is higher for educated, high-income, politically moderate people. Ideological bias: twins are more pro-technology and pro-human than people. Hyper-rationality: near-perfect on knowledge questions, and no attraction or compromise effects.
- Mitigations that did not work: temperature 0 (best case, r=0.232), GPT-5, DeepSeek, Gemini, fine-tuned GPT-4.1, Centaur (worse), and a 13K-character summary (same as full). Source for all: the Funhouse Mirrors paper above.
- Contrast: Park et al. built agents from 2-hour interviews of 1,052 Americans. On held-out GSS items they reach 83% of each person's own two-week test-retest accuracy (survey-only 82%, interview plus survey 86%, demographics only 74%). They also report smaller accuracy gaps across race and ideology. Interviews beat demographics by 9 points. [Park et al., arXiv 2411.10109](https://arxiv.org/abs/2411.10109)

**WEIRD and Western flattening**
- Atari et al. found GPT's cognitive-task behavior resembles WEIRD societies and degrades with distance from them (r=-0.70). [Which Humans?](https://www.hks.harvard.edu/centers/cid/publications/which-humans)
- Tao et al. (107 countries, WVS/EVS, five OpenAI models): all resemble English-speaking and Protestant European values. Cultural prompting ("respond as a person from X") improved alignment in 71% to 81% of countries. It failed or made things worse in 19% to 29%. GPT-4o mean distance fell from 2.42 to 1.57, which is still about the gap between the model and Uruguay. Finland got worse (0.20 to 2.43) and so did Taiwan (2.40 to 3.94). Prompting in the local language did not help. [PNAS Nexus](https://arxiv.org/html/2311.14096v2)
- Wang et al. (Nature Machine Intelligence 2025; 4 LLMs, 3,200 human raters, 16 identities): LLMs misportray and flatten identity groups, and identity prompts essentialize. Inference-time fixes "reduce, but do not remove" the harm. [arXiv 2402.01908](https://arxiv.org/abs/2402.01908)

**Sycophancy and agreeableness**
- Across 37 models on a Lithuanian survey (n=263), every model shifted toward agreement by about +0.84 SD, used scale endpoints less, and agreed with each other more than with humans (mean pairwise similarity 0.73). Models trained on synthetic respondents scored R-squared of -0.18 on real humans. [Lukauskas and Sarkauskaite, arXiv 2608.14606](https://arxiv.org/abs/2608.14606)
- Six frontier models shift with who they think is asking. A conservative-Republican asker moves answers 28 to 62 points toward Republicans. A progressive cue barely moves them (8x less). [Tornberg and Schimmel, arXiv 2604.27633](https://arxiv.org/abs/2604.27633)

**Mitigations with evidence**
- Condition on one real respondent's actual item answers. Entropy recovered from 1.24 to 2.01 bits, with no temperature change. Raising temperature made error worse in all three models. (Lee and Yue.)
- Verbalized Sampling (ask for several answers with probabilities): +7 to +10 survey-fidelity points across three model families in the Turkey study, but it overshot (SD ratio 0.4-0.56 moved to 1.26-1.37). It needs a calibration step. (Ozkan.) Original method claims 1.6x to 2.1x diversity on creative writing only. [Zhang et al., arXiv 2510.01171](https://arxiv.org/abs/2510.01171v3)
- Re-validate after every model release. Agreement was uneven across releases (llama3.3 sign agreement 71% versus 86% for llama3.1). (Lee and Yue.)

## What it means for Real World

- For the product: Never show "this person would say X." Show distributions with ensemble spread and segment-level results. Label non-WEIRD segments with a validation grade. Label click-to-ask-why answers as model narrative, not testimony.
- For the engineering: Score every nightly run on spread as well as mean (SD ratio, entropy, modal share) against survey microdata. Sample real microdata rows as agent seeds. Do not invent personas from demographic cells. Calibrate dispersion after the fact (a per-question variance rescale or VS plus a fitted correction) instead of trusting temperature. Pin model versions and rerun the validation set on any change. Use a different model family for scoring or ensemble members to limit shared bias.
- For the business: The public Brier-versus-market record is the honest answer to all of these failures. It cannot be argued with and it catches collapse and bias in outcomes. Say the limits on the receipts page. Aaru-style claims of individual-level fidelity are exactly what Funhouse Mirrors refutes.

## Recommendations

1. Add a "spread audit" to the daily pipeline: modal share, entropy, SD ratio versus the human survey wave for each tracked question. Fail the run, or flag it, if SD ratio is under 0.7. Owner: engineering, one afternoon.
2. Seed agents from real respondent answers (WVS, Pew, IPUMS rows), not demographics alone. Park's gap of 74% versus 83-86% and Lee and Yue's entropy recovery support this.
3. Add a post-hoc dispersion calibration layer per country and topic, fit on last month's held-out survey waves. Test Verbalized Sampling as the base sampler, not as a fix on its own, because it overshoots.
4. Publish a per-country validation grade (WVS distance on 20 held-out items). Show it on the globe. Mark low-grade countries "experimental". Use cultural prompting only where held-out tests show it helps, since it hurts in roughly one country in five.
5. Fix prompt framing: neutral asker, fixed question wording, reverse-coded items, midpoint-anchor tests to counter the +0.84 SD agreeableness and the asker-sycophancy shift.
6. Keep the opt-in twins feature behind a clear disclosure and never headline individual accuracy. Expect r around 0.2 at the individual level unless the twin comes from a real interview (Park-style).
7. Pre-register the failure thresholds in the hashed forecast file so the public score includes them.

## Open questions

- No election or news-event backtest evidence was gathered. Ozkan reports one but the abstract gave no numbers. Next step: read the full paper and search for backtests with a knowledge-cutoff control.
- Contamination of survey items (WVS, GSS) in model training is unquantified here. Next step: run a memorization probe on our own validation items.
- I did not open the full text of Park et al. for the demographic-baseline figure beyond the abstract, nor the Wu et al. review count (the page did not confirm "21 studies"; I left it out).
- Do the Funhouse Mirrors results (GPT-4.1, US, survey tasks) hold for Haiku 5.5 on non-US data? Next step: replicate on a 200-person slice before the launch.
- Cost of calibration plus ensemble runs against the $15-60 per night budget has not been priced.

## Sources

- [Digital Twins are Funhouse Mirrors: Five Systematic Distortions (arXiv 2509.19088v5)](https://arxiv.org/html/2509.19088v5), accessed 2026-10-11
- [Twin-2K-500 (arXiv 2505.17479)](https://arxiv.org/abs/2505.17479), accessed 2026-10-11
- [Distribution-First Population Simulation, Ozkan (arXiv 2607.18310)](https://arxiv.org/abs/2607.18310), accessed 2026-10-11
- [Can Open-Weight LLMs Simulate Human Survey Populations? (arXiv 2609.32638)](https://arxiv.org/html/2609.32638), accessed 2026-10-11
- [LLM-Based Social Simulations Require a Boundary (arXiv 2506.19806)](https://arxiv.org/abs/2506.19806), accessed 2026-10-11
- [The Chameleon's Limit (arXiv 2604.24698)](https://arxiv.org/abs/2604.24698), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People (arXiv 2411.10109)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Which Humans? Atari et al.](https://www.hks.harvard.edu/centers/cid/publications/which-humans), accessed 2026-10-11
- [Cultural Bias and Cultural Alignment of LLMs (arXiv 2311.14096)](https://arxiv.org/html/2311.14096v2), accessed 2026-10-11
- [LLMs that replace human participants can harmfully misportray and flatten identity groups (arXiv 2402.01908)](https://arxiv.org/abs/2402.01908), accessed 2026-10-11
- [Plausible but Not Valid (arXiv 2608.14606)](https://arxiv.org/abs/2608.14606), accessed 2026-10-11
- [Political Bias Audits of LLMs Capture Sycophancy to the Inferred Auditor (arXiv 2604.27633)](https://arxiv.org/abs/2604.27633), accessed 2026-10-11
- [Verbalized Sampling (arXiv 2510.01171)](https://arxiv.org/abs/2510.01171v3), accessed 2026-10-11 (abstract via search result only)
- [LLM Social Simulations Are a Promising Research Method (arXiv 2504.02234)](https://arxiv.org/abs/2504.02234), accessed 2026-10-11
