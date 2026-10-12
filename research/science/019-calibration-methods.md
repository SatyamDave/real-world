# Calibrating LLM-simulated opinion distributions to real data

- Date: 2026-10-11
- Area: science
- Confidence: medium. The core papers (SubPOP, Meister et al., rectification, calibration) were opened and agree with each other. Most are US-only or small-scale, and nobody has tested a 100-country nightly loop, so transfer to Real World is inference.

## Answer

Prompting alone does not give the right distribution. Raw logprobs are worse than a uniform guess, personas stereotype, and independent agents pile onto one default answer. What measurably works is a thin calibration layer fitted on real survey data (a few percent to tens of percent gain), fine-tuning on survey distributions (30-46% gain, US only), and rectification of aggregate estimates with a small real sample (bias from 24-86% down to under 5%). Real World should build the calibration layer and the rectification step first, treat fine-tuning as optional, and publish spread and variance metrics next to accuracy.

## Findings

**Raw model output is badly off.**
- Santurkar et al. built OpinionQA (1,498 questions, 60 US groups, Pew ATP). Models were far from the population, and steering toward a group helped only modestly. RLHF-tuned models gave very sharp, modal answers ([paper](https://arxiv.org/abs/2303.17548), [summary](https://proceedings.mlr.press/v202/santurkar23a.html)).
- Dominguez-Olmedo et al. (NeurIPS 2024) tested dozens of models on American Community Survey questions. After randomizing answer order, models drifted toward uniformly random answers regardless of size, and a classifier could tell them from census responses ([abstract](https://proceedings.neurips.cc/paper_files/paper/2024/hash/515c62809e0a29729d7eec26e2916fc0-Abstract.html)).
- Ozkan (2026) put 2,414 World Values Survey respondents (focus Turkey) into independent LLM agents. Entropy fell from 1.46 to 0.77, 85% of responses collapsed to one default, and the SD ratio was 0.4-0.56 ([arXiv 2607.18310](https://arxiv.org/abs/2607.18310)). A single preprint, but it is the closest to our design.

**How you read the distribution out matters more than the persona.** Meister, Guestrin and Hashimoto (NAACL 2025) compared elicitation methods using total variation (TV, lower is better), on OpinionQA plus NYT book opinions ([paper](https://arxiv.org/abs/2411.05403), [HTML](https://arxiv.org/html/2411.05403v1)).
- Verbalized JSON distribution: TV 0.226 (Opus), 0.229 (GPT-4), 0.254 (Haiku).
- Sampling 30 tokens: 0.278-0.328.
- Temperature-scaled logprobs: 0.273 (GPT-4) and 0.469 (Llama 3 70B).
- Raw logprobs: 0.455-0.550, worse than uniform (0.363).
- Temperature scaling cut expected calibration error from 0.28 to 0.07 on GPT-4 but only 0.13 to 0.11 on Llama.
- Humans guessing the distribution scored 0.250. The best models barely beat that.
- Few-shot steering (five similar questions with group distributions) beat persona prompts. Persona prompts stereotype: a simulated Democrat read "very unlikely to read" at 13% against 33% in the data.

**Calibration layer fitted on survey data works, with caveats.** Improving distributional alignment using supervision ([arXiv 2507.00439](https://arxiv.org/abs/2507.00439), [HTML](https://arxiv.org/html/2507.00439v4)) learns a regression from the LLM's answer distribution to the human one.
- 15 LLMs, three surveys (Wellcome Global Monitor 2018, OpinionQA, WVS), 92 questions.
- Alignment improved in 94.8% of settings, by 16.3% on average, and variance across settings fell about 1.6x.
- It needed only 1-10 full examples. Few-shot prompting was less consistent. Sociodemographic prompts did not help consistently.
- It helped poorly aligned groups (Central/South America, parts of Africa) and hurt some well-aligned ones (Aus/NZ, Northern Europe). It ignores correlations between answer choices.

**Fine-tuning on survey distributions gives the biggest measured gain, in the US.** SubPOP ([arXiv 2502.16761](https://arxiv.org/abs/2502.16761), [HTML](https://arxiv.org/html/2502.16761v1), [code](https://github.com/JosephJeesungSuh/subpop)):
- 3,362 questions, about 70K subgroup-response pairs from Pew ATP, evaluated on OpinionQA and GSS.
- LoRA (rank 8) on open base models (Llama-2-7B/13B, Mistral-7B, Llama-3-70B) with a forward-KL loss on the response distribution.
- Wasserstein distance on OpinionQA fell from 0.138-0.173 (zero-shot) to 0.094-0.106. The human floor is 0.031. Gain against the best baseline was 32-46%.
- Held-out groups improved 44.7% against 46.7% for seen groups. Training on 25% of the data kept 72-78% of the gain.
- Not tested: non-US populations, opinion change over time, intersectional groups. Pew files must be obtained from Pew. Code is BSD-3-Clause (49 stars). The processed dataset needs a terms-of-use agreement on Hugging Face.

**Rectification fixes aggregates, not agents.** Valid survey simulations with limited human data ([arXiv 2510.11408](https://arxiv.org/abs/2510.11408)):
- Plain LLM synthesis showed bias of 24-86%. Adding a prediction-powered rectification step with a small human sample cut bias below 5% and raised effective sample size by up to 14%.
- Their advice is to put most of the human sample into rectification, not fine-tuning. It guarantees validity for the corrected estimate only, not for each synthetic respondent.

**Global and cross-cultural results are weak.**
- Liu et al. (WVS): LLMs align with only a few countries and under-align with most. Prompting in the questionnaire's language steered better than other steering methods ([arXiv 2509.01418](https://arxiv.org/abs/2509.01418)).
- European Social Survey, 30 countries, 42 items: adding the country name to a three-variable backstory moved median per-item correlation from -0.03 to 0.52. Richer profiles added nothing consistent. Individual-level recovery was negligible, and averaging neighboring countries beat every model ([arXiv 2609.16395](https://arxiv.org/abs/2609.16395)).
- Cross-survey transfer on Taiwan data: zero-shot LLMs got 52% on unseen items, within 6 points of a random forest trained on the same population. Variance collapse also hit the supervised models ([arXiv 2607.03091](https://arxiv.org/abs/2607.03091)).

**Fixes for collapse are partial.** Verbalized Sampling raised fidelity 7-10 points but overshot into over-dispersion (SD ratio 1.26-1.37) ([arXiv 2607.18310](https://arxiv.org/abs/2607.18310)). Demographic fine-tuning matches marginals better than persona prompting, but persona prompting is slightly better on item-to-item correlations. Neither matches the real correlation structure ([arXiv 2601.15755](https://arxiv.org/abs/2601.15755)).

**Interview grounding is the strongest individual-level method.** Park et al. (1,052 people): interview-based agents reached 83% of participants' own two-week test-retest accuracy on GSS items, against 74% for demographics-only agents ([arXiv 2411.10109](https://arxiv.org/abs/2411.10109)). This supports the opt-in twin moat, but it is US data and costs two hours of interview per person.

**Not found.** I found no measured gain for activation steering on opinion distributions. A search turned up only unverified preprints and a survey that warns of limited usefulness and side effects. Treat it as research, not a plan.

## What it means for Real World

- For the product: do not promise that each agent is a faithful person. Promise calibrated aggregates with a visible spread and a public score. Show an "uncertainty/coverage" badge per country, because the evidence says many countries will be poorly served at first.
- For the engineering: the daily assimilation step is already a calibration loop, so make it explicit. Ask the model for a verbalized distribution per question and segment, correct it with a small fitted map, then use it to set agent answer probabilities. Agents should draw from that distribution, not be asked independently. Log SD ratio, entropy and TV per country every night. Fine-tuning is a later option: SubPOP's recipe uses open base models, and I did not confirm that a Haiku-class model can be fine-tuned for this.
- For the business: the numbers support a public, hashed track record as the moat, since calibration gains are small enough that honest scoring matters more than claims. Expect weak non-Western results and say so. This is also protection against the Aaru-style miss, since variance metrics get published before outcomes.

## Recommendations

1. Elicit verbalized distributions (JSON over options) with randomized option order, not logprobs. Raw logprobs are worse than uniform. Owner: engineering, one day.
2. Build a calibration map per model and per country from WVS, Wellcome Global Monitor and Pew data. Start with temperature scaling or a small regression, as in the supervision paper. Check per-group effects, because it can hurt well-aligned groups. Gate on held-out TV and Brier.
3. Do not run 100,000 independent persona calls and trust the histogram. Fix the segment-level distribution first (Ozkan's "distribution-first"), then assign it to agents. This is also cheaper against the $15-60 nightly budget.
4. Use rectification (prediction-powered inference) for every published aggregate, using the daily human panel as the correction set. Put most of the human budget there, as 2510.11408 recommends. Label per-agent traces as illustrative, since rectification does not validate them.
5. Add a metrics board: SD ratio, entropy, TV, ECE, per country, with alarms for SD ratio below 0.7 or above 1.3. These are my thresholds, not from a paper.
6. Defer fine-tuning. If wanted later, reproduce SubPOP with the BSD-3 code on one open 7B model for one non-US survey family, and check the gain before committing.
7. Test language-matched prompting per country, since the one global result says it beats other steering. Cheap to run in a day.
8. Park activation steering until it has an independent result.

## Open questions

- Do SubPOP-style gains hold outside the US? No evidence yet. Test: train on Pew, evaluate on WVS and Wellcome waves for 10 countries.
- Does calibration survive a model change? Haiku 5.5 will be replaced, so the map may need refitting. Test by refitting on the old and new model and comparing.
- Can a fitted map stop over-dispersion from Verbalized Sampling without losing spread? One preprint only. Replicate on our own data.
- How well does calibration on survey questions carry over to questions about events, such as the phone-price shock? No source tested it. This is where Brier versus market price will tell us.
- Contamination: WVS, Pew and GSS are likely in pretraining, so scores on them are optimistic. Ozkan ran a placebo memorization test. We should do the same.

## Sources

- [Whose Opinions Do Language Models Reflect? (OpinionQA)](https://arxiv.org/abs/2303.17548), accessed 2026-10-11
- [Questioning the Survey Responses of Large Language Models (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/hash/515c62809e0a29729d7eec26e2916fc0-Abstract.html), accessed 2026-10-11
- [Benchmarking Distributional Alignment of LLMs (Meister et al.)](https://arxiv.org/html/2411.05403v1), accessed 2026-10-11
- [Improving the Distributional Alignment of LLMs using Supervision](https://arxiv.org/html/2507.00439v4), accessed 2026-10-11
- [Language Model Fine-Tuning on Scaled Survey Data (SubPOP)](https://arxiv.org/html/2502.16761v1), accessed 2026-10-11
- [SubPOP GitHub repository](https://github.com/JosephJeesungSuh/subpop), accessed 2026-10-11
- [Valid Survey Simulations with Limited Human Data](https://arxiv.org/abs/2510.11408), accessed 2026-10-11
- [Distribution-First Population Simulation (Ozkan)](https://arxiv.org/abs/2607.18310), accessed 2026-10-11
- [On the Alignment of LLMs with Global Human Opinion](https://arxiv.org/abs/2509.01418), accessed 2026-10-11
- [Silicon sampling answers with country-level assumptions (ESS)](https://arxiv.org/abs/2609.16395), accessed 2026-10-11
- [Silicon Sampling via Cross-Survey Transfer](https://arxiv.org/abs/2607.03091), accessed 2026-10-11
- [Beyond Marginal Distributions](https://arxiv.org/abs/2601.15755), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
