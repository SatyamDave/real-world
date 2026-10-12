# Getting per-agent probability distributions

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Anthropic API facts are read straight from the docs (high). The calibration literature is read from abstracts and two full papers, and it tests older models, not Haiku 5.5 (medium).

## Answer

The Anthropic API gives us no logprobs, no seed, and, on Haiku 5.5, no way to change temperature. So the logprob route is closed, and "sampling" means repeated calls at a fixed temperature of 1. The literature says that for chat-tuned models, a verbalized distribution beats both logprobs and sampled answers at matching human opinion distributions, with the caveat that verbalized confidence is overconfident per item. Real World should ask each agent for a typed, verbalized distribution, draw the agent's actual answer separately, and fix calibration at the population level against the public Brier score, not per agent.

## Findings

**What the Anthropic API supports (checked 2026-10-11).**
- The [Messages API reference](https://platform.claude.com/docs/en/api/messages) has no `logprobs`, `top_logprobs`, `seed` or `n` field in the part I could read. The page is 1.18M characters and I read the first 200k, so "absent" is strong but not proven for the tail.
- On models released after Opus 4.6, `temperature` must be 1, `top_p` must be 0.99, and `top_k` is rejected, per the same page. Haiku 5.5 (`claude-haiku-5-5`, released 2026-10-07) follows this rule: sending any other value, or both `temperature` and `top_p`, returns a 400 ([Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide)). The docs say to steer by prompting.
- Assistant prefill is also rejected on Haiku 5.5, so you cannot force the first token of an answer. Adaptive thinking is on by default and thinking tokens count against `max_tokens`. Lower `effort` to skip it.
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) (`output_config.format` with a JSON schema) work on Haiku 5.5. Numeric `minimum`/`maximum` and `multipleOf` are not supported, objects need `additionalProperties: false`, and enum casing may change. So "probabilities sum to 1" must be validated and renormalized in our code.
- Haiku 5.5 costs $0.10 input / $0.50 output per MTok up to 100k-token prompts, Batch API is 50% off, cache reads are $0.01/MTok ([model page](https://platform.claude.com/docs/en/models/haiku-5-5/overview)). The new tokenizer counts about 30% more tokens than Haiku 4.5 for the same text.

**What the literature says about the three methods.**
- Logprobs. [Meister et al. 2024](https://arxiv.org/html/2411.05403) compared logprobs, 30 sampled answers, and a verbalized JSON distribution for matching group opinion distributions. Total variation distance (lower is better): verbalized 0.226 (Claude 3 Opus), 0.229 (GPT-4), 0.254 (Claude 3 Haiku); sampled 0.278 (GPT-4), 0.325 (Opus); logprobs 0.455 to 0.550. A uniform guess scores 0.363, so logprobs from chat models were worse than uniform. The authors cite prior work that RLHF concentrates logprobs on a few answers, but they did not test it themselves. The abstract's headline: models describe a distribution better than they simulate one.
- Verbalized confidence. [Tian et al. 2023](https://arxiv.org/abs/2305.14975) found that for RLHF models (ChatGPT, GPT-4, Claude) stated confidences are often better calibrated than token probabilities, cutting expected calibration error by a relative 50% on TriviaQA, SciQ and TruthfulQA. [Xiong et al. 2023](https://arxiv.org/html/2306.13063) found the opposite failure: vanilla verbalized confidence clusters at 80 to 100% in multiples of 5. GPT-4's ECE was 0.18 and its failure-prediction AUROC only 62.7%. On GSM8K GPT-4 stated 100% on every answer at 93.6% accuracy. White-box token probabilities were only slightly better (AUROC about 0.52 to 0.61).
- Sampling. In Xiong et al., consistency over 5 samples lifted GPT-3.5 GSM8K AUROC from 54.8 to 92.7, with gains flattening by about 13 samples. Sampling is the most reliable way to get uncertainty on one item. It costs N calls, and we cannot vary temperature to widen it.
- Diversity prompts. [Verbalized Sampling](https://arxiv.org/abs/2510.01171) (ask for several candidates with probabilities) raised creative-writing diversity 1.6 to 2.1x with no stated accuracy loss. It targets mode collapse, our "variance collapse" risk, but it was not tested on survey marginals.
- Survey traps. [Dominguez-Olmedo et al.](https://arxiv.org/abs/2306.07951) tested 43 models on the American Community Survey: answers follow option order and labels ("A" is favored). After randomizing order, models drift toward uniform random answers. Their reading is that models "match" whichever subgroup is closest to uniform. [Santurkar et al.](https://arxiv.org/abs/2303.17548) and [Durmus et al.](https://arxiv.org/abs/2306.16388) show defaults lean toward some US, European and South American populations, and steering toward a country helps only partly and can produce stereotypes. Translating the question does not reliably help.
- [Sclar et al.](https://arxiv.org/abs/2310.11324) found up to 76 accuracy points of swing from meaning-preserving format changes on LLaMA-2-13B. Prompt format is a first-order variable.

Not in the sources: any calibration number for Claude 5.x models. Everything above is on GPT-3/4, Llama 2/3 and Claude 3. Treat the rankings as hypotheses to test on our own data.

## What it means for Real World

- For the product: "ask why" and "click an agent" show a stated probability plus the agent's drawn answer. Label stated probabilities as the agent's self-report, not a measured chance. The public receipts page scores aggregate forecasts, not individual agents.
- For the engineering: one call per agent per question returns a schema with `answer` (enum), `probs` (one number per option, in a fixed key order), and a short `reason`. Shuffle option order per agent and keep the mapping. Renormalize and reject malformed output. With temperature fixed at 1, the spread across 100,000 different personas is the sampling, and ensemble spread comes from different persona draws and prompt variants, not from a temperature knob.
- For the business: my rough arithmetic is about 1,200 input and 120 output tokens per agent, 100k agents, so about $12 input plus $6 output, about $18 per full pass on-demand and about $9 on Batch. That is under the $15-60 planning figure, before the tokenizer and thinking-token effects, which I did not measure. Measure real usage on 1,000 agents before quoting a number.

## Recommendations

1. Use verbalized distributions as the default per-agent output. Skip logprobs entirely: the API does not offer them, and the best evidence says they were worse than a uniform guess for chat models.
2. Define the typed output once: enum answer, per-option probabilities, reason, via `output_config.format`. Validate sum-to-1, clip, renormalize in code, since numeric constraints are unsupported.
3. Randomize option order and labels per agent, and log the permutation. Without this we cannot tell real opinion from position bias.
4. Build a 200-question calibration set from real surveys (WVS, Pew, Gallup), covering non-Western countries, and run it before launch. Compare total variation distance against a uniform baseline and against the real marginals, per country. Do this on Haiku 5.5 itself, since the literature does not cover it.
5. Calibrate at the aggregate: fit a post-hoc recalibration (isotonic or Platt) of simulated shares to observed shares, refit daily, and publish Brier against market price. Do not trust per-agent stated probabilities; the literature says they cluster at round, high values.
6. Treat sampled answers and the verbalized distribution as two columns and compare them nightly. A large gap between them is a variance-collapse alarm.
7. Run the nightly pass through the Batch API (50% off) with a cached shared prefix, and use `effort: low` to avoid paying for thinking tokens on a classification-shaped task. Check that low effort does not change the distributions.

## Open questions

- Do Claude 5.x models still show the Meister ranking (verbalized beats sampled beats logprobs)? Run the 200-question set to find out.
- Does the 400 on non-default `temperature` ever relax for Haiku 5.5? Watch the release notes; until then plan around it.
- Is there any logprob-like channel from another provider worth using for a cheap second opinion? Not researched here; open-weight models would expose logprobs, but the evidence above says they would not help.
- Why logprobs fail: the RLHF-concentration claim is cited, not tested, in the papers I read.
- Web search ran out of budget in this run, so I did not look for post-2024 papers on Claude-specific calibration. A follow-up search is needed.

## Sources

- [Anthropic Messages API reference](https://platform.claude.com/docs/en/api/messages), accessed 2026-10-11
- [Claude Haiku 5.5 overview and pricing](https://platform.claude.com/docs/en/models/haiku-5-5/overview), accessed 2026-10-11
- [Claude Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide), accessed 2026-10-11
- [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), accessed 2026-10-11
- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview), accessed 2026-10-11
- [Tian et al., Just Ask for Calibration (arXiv 2305.14975)](https://arxiv.org/abs/2305.14975), accessed 2026-10-11
- [Xiong et al., Can LLMs Express Their Uncertainty? (arXiv 2306.13063)](https://arxiv.org/html/2306.13063), accessed 2026-10-11
- [Meister et al., Benchmarking Distributional Alignment of LLMs (arXiv 2411.05403)](https://arxiv.org/html/2411.05403), accessed 2026-10-11
- [Dominguez-Olmedo et al., Questioning the Survey Responses of LLMs (arXiv 2306.07951)](https://arxiv.org/abs/2306.07951), accessed 2026-10-11
- [Santurkar et al., Whose Opinions Do Language Models Reflect? (arXiv 2303.17548)](https://arxiv.org/abs/2303.17548), accessed 2026-10-11
- [Durmus et al., GlobalOpinionQA (arXiv 2306.16388)](https://arxiv.org/abs/2306.16388), accessed 2026-10-11
- [Zhang et al., Verbalized Sampling (arXiv 2510.01171)](https://arxiv.org/abs/2510.01171), accessed 2026-10-11
- [Sclar et al., Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design (arXiv 2310.11324)](https://arxiv.org/abs/2310.11324), accessed 2026-10-11
- [Kadavath et al., Language Models (Mostly) Know What They Know (arXiv 2207.05221)](https://arxiv.org/abs/2207.05221), accessed 2026-10-11
