# Silicon samples: when LLM survey respondents match real people, and when they fail

- Date: 2026-10-11
- Area: science
- Confidence: medium. The failure results are well sourced. I could not read the full text of Argyle et al., so I report none of its headline statistics. Two 2026 preprints were read from abstract pages only.

## Answer

LLM respondents can reproduce group averages and rank orderings for US-style questions. They fail on within-group variance, on regression coefficients, on stability over time, and outside the US and the West. Real World should treat the 100,000 agents as a sampled ensemble that is calibrated against real data every day. It should never present them as a free replacement for a survey. It should also keep a "just ask the model for the population distribution" baseline and require agents to beat it.

## Findings

**Argyle et al. (2022/2023) set the claim.** They conditioned GPT-3 on thousands of sociodemographic backstories from real US survey participants. They called the result "silicon samples" and said GPT-3 shows "algorithmic fidelity," meaning its bias is fine-grained and tracks demographics. The abstract is qualitative and names no statistics. The paper is in Political Analysis (DOI 10.1017/pan.2023.2). The model is GPT-3 only, and the data are US surveys only. See [arXiv 2209.06899](https://arxiv.org/abs/2209.06899).

**Bisbee et al. (Political Analysis, 2024) is the strongest rebuttal.** They had ChatGPT 3.5 Turbo play ANES 2016 and 2020 respondents on 11 feeling thermometers. They generated 3.6 million responses. See the [Cambridge page](https://www.cambridge.org/core/product/B92267DC26195C7F36E63EA04A47D2FE).
- Group means land within one standard deviation of ANES, and the rank order mostly holds.
- Variance collapses. The pooled standard deviation is 16.1 for ChatGPT against 31.4 for ANES.
- 48% of regression coefficients differ significantly from ANES. In 32% of those, the sign flips.
- Using the model's variance would suggest about 33 partisan respondents give 99% power. That is nearly ten times fewer than the real data imply.
- The same prompt gave different distributions in April, June and July 2023. Model updates shift the "population".

**Santurkar et al. (ICML 2023), OpinionQA.** It uses Pew American Trends Panel data (1,498 questions, 60 US groups). Models were misaligned with US groups by roughly the Democrat-Republican gap on climate. Steering by demographic did not fix it. Groups such as people 65 and over and widowed people were poorly reflected. See [PMLR](https://proceedings.mlr.press/v202/santurkar23a) and the [repo](https://github.com/tatsu-lab/opinions_qa).

**Outside the US it gets worse.** Durmus et al. (Anthropic, 2023) built GlobalOpinionQA from Pew Global Attitudes and WVS wave 7. By default the model sides with the USA and some European and South American countries. Country prompting shifts answers but can produce stereotypes. Translating the question does not make answers match speakers of that language. See [arXiv 2306.16388](https://arxiv.org/abs/2306.16388). Ryan, Held and Yang (ACL 2024) find that alignment tuning (RLHF, DPO) creates disparities in global opinion representation. See [arXiv 2402.15018](https://arxiv.org/abs/2402.15018). This is the "Western flattening" risk, now with evidence behind it.

**Mode collapse is mechanical.** Per [Jang, Lee and Kim (2026)](https://www.alphaxiv.org/abs/2607.25292), instruction-tuned models do not sample from distributions they can describe.
- The same persona gave the same answer on more than half of items.
- In one check, 57% of 100 persona-item cells returned the same answer in all 50 calls.
- On Llama-3.1-8B, mean total variation to targets is 0.19 for the base model and 0.34 for the instruct model.
- On GPT-4o against Pew, one "describe the population as JSON probabilities" call scores 0.22. Standard persona aggregation scores 0.46.
- Varying the prompt wording with persona fixed (their "PPA") cuts 0.46 to 0.36 at equal cost.

**A simple baseline often wins.** Doudkin (2026) tested six multiselect batteries from four survey organisations in three countries. See [arXiv 2609.07305](https://arxiv.org/abs/2609.07305).
- A no-persona query for population prevalence averaged 6.27 MAE. Committed persona panels averaged 12.39. The baseline won all nine pairs.
- On three unpublished demographic cells, neither method beat reciting the national distribution.
- Committed answers left 66 of 128 option slots empty, so rare options vanish.
- The author's conclusion: matching published marginals reflects the elicitation format. It does not show respondents are being simulated.

**Where it works.** Individual-level prediction from real prior answers.
- [Park et al. (2024)](https://arxiv.org/abs/2411.10109) built agents for 1,052 Americans from two-hour interviews. On held-out GSS items, interview agents reach 83% of the participants' own two-week test-retest consistency. Survey-only agents reach 82%, combined 86%, demographics-only 74%. Accuracy gaps across racial and ideological groups shrink. The interview signal adds only about 9 points over demographics alone, and the data are US-only.
- The [genagents repo](https://github.com/joonspk-research/genagents) is MIT licensed, with 617 stars. The 1,000-person bank is not public. Access needs a restricted request to the author. A public bank of over 3,000 GSS-based agents is included.
- [Silicon Sampling via Cross-Survey Transfer (2026)](https://arxiv.org/abs/2607.03091) uses Taiwan's TEDS 2024 and three open-weight models (27B to 120B). Given a person's other answers, zero-shot accuracy on unseen items is 52%. That is within 6 points of a supervised random forest. Predictability runs from 67% (partisan attitudes) down to 23% (sovereignty). The authors say variance collapse also hits supervised models. Note the baseline is a random forest, not a low bar to clear in production, and it is one country.

## What it means for Real World

- For the product: Ask "why" on an agent must be shown as model-generated narrative, not testimony. Show ensemble spread and say which questions have real anchors. For the 100+ countries, label each country's agents by evidence tier (microdata plus local survey, or only a language-model prior).
- For the engineering: Each daily question needs three scores against ground truth: the agents, a no-persona "describe the population" call, and the raw national distribution. Report variance and subgroup coefficients, not only means. Sample at temperature with prompt perturbation, or elicit probability vectors, since instruct models collapse to one answer. Pin model versions and re-baseline on any change, since Bisbee saw drift within three months.
- For the business: The public hashed Brier track record is the right answer to this literature, because it is out-of-sample and cannot be backfilled. Do not claim "algorithmic fidelity". Claim calibrated forecasts, and publish the cases where the cheap baseline beat us.

## Recommendations

1. Build a baseline harness before launch: agent ensemble vs describe-the-population call vs national marginal vs market price, scored per question and per country. Owner: engineering. This is the core eval.
2. Use probability-vector elicitation or perturbed prompts for population-level questions. Do not rely on one persona call per agent.
3. Track within-group standard deviation and subgroup regression sign agreement as standing health metrics. Alert when the ratio to the real survey falls below a threshold. Pick the threshold from the first two weeks of data.
4. Tier countries by anchor quality. Start with places that have recent microdata plus local surveys (WVS, Pew Global, regional barometers). Mark the rest as prior-only in the UI and in `/v1/simulate` output.
5. Pin model IDs and log them with every forecast hash. Run a fixed canary set of questions weekly to detect provider drift.
6. For opt-in twins, copy the Park protocol (interview plus survey, test-retest as the ceiling). Keep claims to "about 85% of retest consistency, US sample" until we have our own numbers.

## Open questions

- Argyle's actual statistics (tetrachoric correlations, vote-choice match). Read the supplement behind the Cambridge page.
- How much worse is non-Western performance on a recent frontier model such as Haiku 5.5? The cross-country papers I read used 2023-era models. Run GlobalOpinionQA and WVS holdouts ourselves.
- Does assimilating daily news and polls fix variance collapse, or only the mean? Test with an ablation in week one.
- The two 2026 preprints (2607.03091, 2609.07305) were read from abstract pages. Their full text was not machine-readable here. Confirm numbers before quoting externally.

## Sources

- [Out of One, Many (Argyle et al.)](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [Out of One, Many, Cambridge/Political Analysis](https://www.cambridge.org/core/journals/political-analysis/article/out-of-one-many-using-language-models-to-simulate-human-samples/035D7C8A55B237942FB6DBAD7CAA4E49), accessed 2026-10-11
- [Synthetic Replacements for Human Survey Data? (Bisbee et al.)](https://www.cambridge.org/core/product/B92267DC26195C7F36E63EA04A47D2FE), accessed 2026-10-11
- [Whose Opinions Do Language Models Reflect? (Santurkar et al.)](https://proceedings.mlr.press/v202/santurkar23a), accessed 2026-10-11
- [GlobalOpinionQA (Durmus et al.)](https://arxiv.org/abs/2306.16388), accessed 2026-10-11
- [Unintended Impacts of LLM Alignment on Global Representation](https://arxiv.org/abs/2402.15018), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People (Park et al.)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [genagents repo, MIT](https://github.com/joonspk-research/genagents), accessed 2026-10-11
- [Instruction-Tuned Language Models Cannot Sample from Distributions They Can Describe](https://www.alphaxiv.org/abs/2607.25292), accessed 2026-10-11
- [Marginal Fidelity Does Not Establish User Simulation (Doudkin)](https://arxiv.org/abs/2609.07305), accessed 2026-10-11
- [Silicon Sampling via Cross-Survey Transfer](https://arxiv.org/abs/2607.03091), accessed 2026-10-11
