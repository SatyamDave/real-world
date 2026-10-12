# Foundation models of human behavior: Centaur, survey fine-tunes, and whether we train our own

- Date: 2026-10-11
- Area: science
- Confidence: medium. The Centaur and SubPOP numbers come from pages I opened; several 2026 silicon-sampling preprints I only read as abstracts, and the web search budget ran out before I could check non-US fine-tuning work (WVS).

## Answer

Centaur is a real result, but it models trial-by-trial choices in lab tasks, not attitudes or news reactions, so it is not a drop-in brain for our agents. The closer precedent is SubPOP-style fine-tuning on survey distributions, which beats prompting but has only been shown on US surveys. Do not train anything before launch. Log our own data from day one, so a small LoRA fine-tune becomes a cheap, testable option in 2027.

## Findings

**Centaur (Binz et al., Nature 2025).**
- Llama 3.1 70B plus a QLoRA adapter (rank 8, about 0.15% of parameters). One epoch took about five days on one A100 80GB. Longer training overfit. A smaller Minitaur uses Llama 3.1 8B. [Nature paper on PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12390832/)
- Training set Psych-101: 160 experiments, 60,092 participants, 10,681,650 choices, 253.6M tokens. Apache-2.0 on [Hugging Face](https://huggingface.co/datasets/marcelbinz/Psych-101). The adapter repo is Apache-2.0 on [GitHub](https://github.com/marcelbinz/Llama-3.1-Centaur-70B) (256 stars), but the weights on [Hugging Face](https://huggingface.co/marcelbinz/Llama-3.1-Centaur-70B) carry the Llama 3.1 Community License. Running it needs 80GB of GPU memory with the adapter, 160GB or more for the full model. No hosted inference provider serves it.
- Held-out participants, negative log-likelihood (lower is better): Centaur 0.44, base Llama 0.58, domain cognitive models 0.56. It beat the cognitive models in all but one experiment. It also held up on changed cover stories and a new reasoning domain (LSAT: 1.65 vs 1.92 for base Llama).
- The authors' own limits: strongly WEIRD sample, no age, personality or income in prompts, mostly learning and decision tasks, and it predicts artificial-agent choices badly (35% accuracy on economic games vs 64% on humans).
- Critique: Liu and Ding replaced task prompts with "Please choose option A". Centaur kept giving the trained "correct" answers, which they read as overfitting and weak instruction following. This is a short-form commentary, not a replication, and the authors say it does not refute the approach. [Neuroscience News summary](https://neurosciencenews.com/ai-llm-human-cognition-30097/). The PDF itself returned 403, so I did not read it.

**Survey fine-tuning (SubPOP, Suh et al.).**
- LoRA on Llama-2-7B/13B, Mistral-7B and Llama-3-70B. Loss is KL divergence to the human answer distribution for a (subpopulation, question) pair. [arXiv 2502.16761](https://arxiv.org/html/2502.16761v1)
- Data: 3,229 training questions from 53 Pew ATP waves, 133 eval questions from the 2022 GSS, about 70K subpopulation-response pairs, 22 subpopulations.
- Result: Wasserstein distance falls 32-46% on OpinionQA and 39-42% on GSS versus the strongest baselines. Zero and few-shot prompting barely beat uniform. Unseen age groups improved about 45%. Instruction-tuned base models did worse than raw base models (0.148 vs 0.121).
- Ceiling: the authors estimate about 25x more data to reach WD 0.07, against a human floor of 0.031. US surveys only, two survey families only, no time dynamics.

**Why prompting alone is not enough.**
- Park et al. conditioned agents on two-hour interviews with 1,052 Americans. Held-out GSS accuracy, normalized to test-retest: interview 83%, survey 82%, both 86%, demographics only 74%. Interview grounding also narrowed accuracy gaps across racial and ideological groups. [arXiv 2411.10109](https://arxiv.org/abs/2411.10109) This is the basis for our opt-in twins, and it is a US sample.
- A European Social Survey study (30 countries, 42 items) found that adding the country name lifted the median per-item correlation with country means from -0.03 to 0.52. Individual-level recovery was negligible in every condition. A plain average of neighbouring countries matched country levels better than any model condition. Author's verdict: no individual or distributional inference. This is a single-author September 2026 preprint. [arXiv 2609.16395](https://arxiv.org/abs/2609.16395)
- Silicon samples estimate means moderately and understate variance. [arXiv 2608.14079](https://arxiv.org/abs/2608.14079) (abstract only).
- Twin-2K-500 (Columbia): twins track relative heterogeneity but miss individual answers, and richer personas shift opinions toward progressive answers. The page gives no numbers or license. [DAP Lab](https://daplab.cs.columbia.edu/projects/digitaltwins/)

## What it means for Real World

- For the product: Say "calibrated distributions", never "predicts you". Country and segment ranking is defensible. Individual agent explanations ("click any agent, ask why") are narrative, not measured truth, and the UI should label them so. The ESS result is a warning for our "whole world" claim: much of the country signal may be the country name, not the 100,000 personas.
- For the engineering: Centaur does not fit. It is lab-task choice data, needs 80GB or more of GPU, and the Llama licence adds terms. Build the agent loop on hosted models plus an explicit calibration layer. Store every nightly run's prompts, per-segment answer distributions, and later poll truth in a clean table. That table is the future training set and costs nothing extra.
- For the business: A proprietary fine-tune is a plausible moat only if it learns from data nobody else has: our hashed daily forecasts scored against outcomes, and the human panel. Public survey fine-tunes (SubPOP-style) are reproducible by anyone in a week. Do not claim a "foundation model" in the YC application. Claim the track record.

## Recommendations

1. Do not train or host any model before Oct 27. Cost is small (SubPOP-scale LoRA on one A100 is days, by my estimate under $500), but there is no eval to prove it helps.
2. Build the held-out eval first: country-by-item splits from WVS and the ESS, with a "neighbouring-country average" baseline. If a persona agent does not beat that baseline on an item, say so on the receipts page.
3. Measure variance per item every night (agent spread vs survey spread). Flag collapsed items, as in the Singapore WVS finding. This guards the "variance collapse" risk directly.
4. Schema-log inputs and outputs for every agent call so a 2027 fine-tune dataset exists. Add a strict temporal split so no poll used for assimilation is ever in a training set scored against that same poll.
5. Use Park-style interview grounding only for opt-in twins and report that accuracy separately from the base population.
6. Revisit in Q1 2027: fine-tune a 7-8B open model with LoRA to emit answer distributions for (segment, question), following SubPOP, and compare it to the hosted-model baseline on cost and Brier score.

## Open questions

- Does SubPOP-style fine-tuning transfer to non-US populations? The SubPOP authors point to a concurrent WVS paper that I could not look up. Find it and check whether held-out countries improve.
- Does Centaur's learned decision structure help at all in opinion dynamics (belief updating after news)? No test exists that I found. We could run it ourselves on a small panel, but it is low priority.
- What is the real accuracy ceiling for Twin-2K-500 twins? Read the Marketing Science paper for the numbers.
- Do the Funhouse Mirrors and Western-flattening results hold for frontier models in 2026? I did not open those papers for this note.

## Sources

- [A foundation model to predict and capture human cognition (Nature 2025, PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12390832/), accessed 2026-10-11
- [Llama-3.1-Centaur-70B, Hugging Face](https://huggingface.co/marcelbinz/Llama-3.1-Centaur-70B), accessed 2026-10-11
- [Llama-3.1-Centaur-70B, GitHub](https://github.com/marcelbinz/Llama-3.1-Centaur-70B), accessed 2026-10-11
- [Psych-101 dataset, Hugging Face](https://huggingface.co/datasets/marcelbinz/Psych-101), accessed 2026-10-11
- [Neuroscience News on the Liu and Ding Centaur critique](https://neurosciencenews.com/ai-llm-human-cognition-30097/), accessed 2026-10-11
- [Language Model Fine-Tuning on Scaled Survey Data (SubPOP), arXiv 2502.16761](https://arxiv.org/html/2502.16761v1), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Silicon sampling answers with country-level assumptions, arXiv 2609.16395](https://arxiv.org/abs/2609.16395), accessed 2026-10-11
- [The conditional superiority of fast silicon sampling, arXiv 2608.14079](https://arxiv.org/abs/2608.14079), accessed 2026-10-11
- [Twin-2K-500 project page, Columbia DAP Lab](https://daplab.cs.columbia.edu/projects/digitaltwins/), accessed 2026-10-11
