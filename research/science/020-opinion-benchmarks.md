# Benchmarks for simulated opinion

- Date: 2026-10-11
- Area: science
- Confidence: medium. Every number below comes from a paper or repo page I opened, but I read abstracts and HTML renderings, not full tables, and some dataset licenses are unconfirmed.

## Answer

No benchmark tests what Real World actually sells: a whole-world population that moves day by day. The existing ones test static, mostly US or survey-wave snapshots. We should report three of them as a one-time baseline (SimBench, GlobalOpinionQA, Twin-2K-500), always next to a dumb non-LLM baseline, and make our own forward-dated, hashed daily record the main score.

## Findings

**SimBench** (ICLR 2026) is the most useful. It unifies 20 datasets, including OpinionQA, GlobalOpinionQA, ESS, AfroBarometer, ISSP and LatinoBarometro, across 130+ countries, and scores 45 LLMs ([arXiv HTML](https://arxiv.org/html/2510.17516v1)). The score is 100 x (1 - TVD(human, model) / TVD(human, uniform)). Zero means no better than a uniform guess. The best model, Claude-3.7-Sonnet, scores 40.80. Next are Claude with reasoning (39.46), GPT-4.1 (34.55) and DeepSeek-R1 (34.52). Nine models score below zero. Extra reasoning does not help. Instruction tuning helps on consensus questions and hurts on contested ones. Conditioning on a demographic group makes simulation worse than the general-population baseline, most for religiosity (-9.91). Data is on Hugging Face (pitehu/SimBench); the repo has scoring scripts, 11 stars, CC BY-NC-SA 4.0, no leaderboard ([GitHub](https://github.com/pitehu/SimBench_release)). The authors say 17 of 20 source datasets are permissively licensed and only aggregated distributions are released. The non-commercial license on the framework matters to us.

**OpinionQA** (Santurkar et al. 2023): 1,498 US multiple-choice questions from Pew American Trends Panel, 60 demographic groups. It found a model-to-group gap comparable to the Democrat-Republican gap on climate, and that steering toward a group does not close it ([abstract](https://arxiv.org/abs/2303.17548)). Repo has 123 stars and no stated license; data comes from CodaLab ([GitHub](https://github.com/tatsu-lab/opinions_qa)). US only.

**GlobalOpinionQA** (Anthropic, 2023): 2,556 questions, 2,203 from Pew Global Attitudes and 353 from WVS wave 7, with per-country answer shares. Metric is 1 minus Jensen-Shannon distance, per country. Default model answers sit closest to the USA, Canada, Australia and parts of Europe and South America. Prompting "answer as a person from X" shifts answers, sometimes via stereotype. Translating the question into Russian, Chinese or Turkish did not move answers toward those speakers ([paper](https://arxiv.org/html/2306.16388v2)). License is CC BY-NC-SA 4.0 ([HF card](https://huggingface.co/datasets/Anthropic/llm_global_opinions)). Most questions cover only a few countries. It is the only one of these built for the whole world, and it is small and old.

**SubPOP** (ACL 2025): 3,362 questions and about 70K subpopulation-response pairs from Pew ATP and the General Social Survey. It is training data as much as a benchmark. Fine-tuned Llama-3-70B reaches Wasserstein distance 0.094 on OpinionQA, against 0.031 for the human sampling floor and 0.178 for uniform. That is roughly 3x the human floor after fine-tuning ([paper](https://arxiv.org/html/2502.16761v1)). Code is BSD-3-Clause, 49 stars; data is gated behind terms of use ([GitHub](https://github.com/JosephJeesungSuh/subpop)). US only.

**Twin-2K-500** (Columbia, Marketing Science 2025): 2,058 US adults, 500 questions across four waves, about 2.4 hours each. It tests individual-level twins. Human test-retest accuracy is 81.72%, random is 59.17%, the best GPT-4.1-mini text-persona twin gets 71.72% (87.7% of test-retest). Summary personas did worse (68.02%) and fine-tuning on 500 personas did not help (69.61%) ([paper](https://arxiv.org/html/2505.17479)). Data is CC BY 4.0 and open ([HF card](https://huggingface.co/datasets/krajavi3/Twin-2K-500)). US only, so it cannot test global twins.

**Park et al. 1,052-person agents:** interview-grounded agents reach 83-86% of test-retest on held-out GSS items; demographics-only agents reach 74% ([abstract](https://arxiv.org/abs/2411.10109)). The full agent bank is not public; access needs a review request ([GitHub](https://github.com/joonspk-research/genagents)). We cannot use it as a benchmark.

**WorldValuesBench:** over 20 million WVS-derived examples, Wasserstein-1 metric, a score under 0.2 counts as a match ([arXiv](https://arxiv.org/abs/2404.16308)). Large, but a 2026 critique says it only scores against humans, not against a simple predictor.

**The skeptical result.** "When Synthetic Users Fail" (arXiv 2607.26348, v2 October 2026) runs four models on GSS and WVS against non-LLM baselines fit on held-out human data. No LLM beats the strongest baseline at individual level. Models treat demographics as far more predictive than they are, and inflate between-segment gaps two to four times. Bigger models do not fix it. Code and data are public ([arXiv](https://arxiv.org/abs/2607.26348)). It is a preprint under review.

**What none of them measure:** change over time, reaction to news or shocks, calibration against prediction markets, or forecasts made before the outcome. All score static distributions already in the training window of current models, so contamination is likely and untested.

## What it means for Real World

- For the product: the "receipts" page should lead with forward-dated forecasts, not benchmark scores. Benchmarks go on a methods page as a one-time sanity check.
- For the engineering: build one eval harness that takes any of these datasets as (question, options, group, human distribution) rows and outputs SimBench score, Wasserstein-1 and JSD. Every score ships with a uniform baseline, a demographics-only baseline and a fitted non-LLM baseline. Without those, a number like 40 means nothing.
- For the business: say plainly that SOTA on SimBench is about 41 of 100, and that our edge is daily assimilation, not a better static simulator. Check that the non-commercial licenses (SimBench framework, GlobalOpinionQA) allow use in a commercial pipeline before we train or tune on them. Evaluating is safer than training.

## Recommendations

1. Report SimBench score (total and the ESS/ISSP/AfroBarometer/LatinoBarometro/GlobalOpinionQA slice) for our base agent, next to Claude-3.7-Sonnet's 40.80 and a uniform baseline. One engineer, two days.
2. Add a fitted non-LLM baseline (country x age x sex x education lookup table or logistic regression on WVS) and publish it beside every score. This answers the "When Synthetic Users Fail" critique before a reviewer asks.
3. Report the demographic-conditioning delta (conditioned minus unconditioned SimBench score) and the spread ratio (simulated variance over human variance) per country. These expose variance collapse and Western flattening, our two named risks.
4. Use Twin-2K-500 only for the opt-in twin feature, and report accuracy as a fraction of its 81.72% test-retest ceiling, with 59.17% as the floor. Label it US-only.
5. Hold out time: build a contamination check by scoring on survey waves released after the model's cutoff, and report that split separately.
6. Make the daily hashed forecast, scored by Brier against market price, the headline metric. No outside benchmark can replace it.
7. Skip OpinionQA and SubPOP as separate reports; SimBench already includes OpinionQA. Use SubPOP only if we decide to fine-tune, and check its gated terms first.

## Open questions

- Is the SimBench score computed with token probabilities or verbalized answers for our setup? The repo supports both. Run both on 100 questions and compare.
- Which SimBench datasets overlap our census-microdata and WVS inputs? If we sample agents from WVS, GlobalOpinionQA's WVS part is contaminated for us by construction. Check before reporting.
- Do the CC BY-NC-SA licenses block commercial use of scores or only of redistribution? Ask counsel or the SimBench authors.
- I did not read the Funhouse Mirrors paper or the Stanford survey-anchored agents work in full. Read both before we claim a variance-collapse fix.
- OpinionQA's data license and Pew's redistribution terms were not stated on the pages I opened.

## Sources

- [SimBench, arXiv abstract](https://arxiv.org/abs/2510.17516), accessed 2026-10-11
- [SimBench, arXiv HTML](https://arxiv.org/html/2510.17516v1), accessed 2026-10-11
- [SimBench_release repo](https://github.com/pitehu/SimBench_release), accessed 2026-10-11
- [OpinionQA paper](https://arxiv.org/abs/2303.17548), accessed 2026-10-11
- [opinions_qa repo](https://github.com/tatsu-lab/opinions_qa), accessed 2026-10-11
- [GlobalOpinionQA paper](https://arxiv.org/html/2306.16388v2), accessed 2026-10-11
- [llm_global_opinions dataset card](https://huggingface.co/datasets/Anthropic/llm_global_opinions), accessed 2026-10-11
- [SubPOP paper](https://arxiv.org/html/2502.16761v1), accessed 2026-10-11
- [SubPOP repo](https://github.com/JosephJeesungSuh/subpop), accessed 2026-10-11
- [Twin-2K-500 paper](https://arxiv.org/html/2505.17479), accessed 2026-10-11
- [Twin-2K-500 dataset card](https://huggingface.co/datasets/krajavi3/Twin-2K-500), accessed 2026-10-11
- [Park et al., 1,052-person agents](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [genagents repo](https://github.com/joonspk-research/genagents), accessed 2026-10-11
- [WorldValuesBench](https://arxiv.org/abs/2404.16308), accessed 2026-10-11
- [When Synthetic Users Fail](https://arxiv.org/abs/2607.26348), accessed 2026-10-11
