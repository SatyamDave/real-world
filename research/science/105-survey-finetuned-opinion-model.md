# A survey-finetuned opinion model: evidence, data rights, base model and cost

- Date: 2026-10-12
- Area: science
- Confidence: medium on the papers, the base-model licence and the prices; low on data rights. Pages were read through a fetch tool that returns a summary of the page, not its raw text, so quoted numbers should be spot-checked before they reach a paper. The ESS and ANES terms pages could not be opened, and no source tested a time-forward holdout.

## Answer

Fine-tuning an open model on survey answer distributions works: LoRA on Pew data cut Wasserstein distance to held-out subgroup distributions by 32-46% against the best baselines, and the gain held on a different survey family and on unseen subgroups ([SubPOP](https://arxiv.org/html/2502.16761v1)); a WVS fine-tune raised 1-JSD from 0.61-0.77 to about 0.81-0.83 ([Cao et al.](https://arxiv.org/html/2502.07068v1)). No paper we opened tests whether the gain survives a time-forward split, and none of seven survey sources grants commercial model training on its own terms page today: WVS and IPUMS International forbid commercial use, Pew, Afrobarometer and GSS are silent, ESS and ANES are unread. Real World should treat a proprietary opinion model as a licensing project first: get written training rights, then fine-tune Qwen3.5-9B (Apache-2.0) with LoRA for roughly $100 of managed compute per run (estimate below), and judge it against both its base model and Jev on survey questions fielded after registration. Jev outputs never enter a training set.

## Findings

### Evidence that survey fine-tuning helps

**SubPOP** (Suh, Jahanparast, Moon, Kang, Chang; ACL 2025 long, per the [arXiv abstract page](https://arxiv.org/abs/2502.16761); full text [HTML v1](https://arxiv.org/html/2502.16761v1)).
- Data: 3,362 questions, about 70K subpopulation-response pairs, 22 subpopulations. Training on Pew American Trends Panel waves (3,229 questions); evaluation on 133 questions from the 2022 GSS and on OpinionQA.
- Method: LoRA (rank 8, alpha 32, dropout 0.05) on base Llama-2-7B, Llama-2-13B, Mistral-7B and Llama-3-70B, with forward KL to the human answer distribution. Metric: Wasserstein distance (WD) over ordinal options.
- Results: fine-tuned WD 0.094-0.106 on OpinionQA against 0.138-0.173 for zero-shot prompting; 0.096-0.121 on the GSS set against 0.160-0.206. Human floors 0.031 and 0.033. Reported WD reduction against the best baselines: 32-46% (OpinionQA) and 39-42% (GSS).
- Generalization: unseen subgroups improved 43.1% on average (SD 6.7%) against 46.7% (SD 4.4%) for seen ones. A fine-tuned chat model did worse than the base model on the GSS set (0.148 against base results of 0.096-0.121).
- Scaling: gains continued with diminishing returns; the authors extrapolate WD about 0.07 for Mistral-7B with 25x more data.
- Limits stated by the authors: no time dynamics, no intersectional groups. The page gives no data collection dates or model cutoffs, so contamination is not addressed.

**Cao et al., global populations** (Cao, Liu, Arora, Augenstein, Röttger, Hershcovich; NAACL 2025; [HTML v1](https://arxiv.org/html/2502.07068v1)).
- WVS wave 7 (2017-2022), 65 countries, 259 questions, split by question and by country; unseen survey: Pew Global Attitudes via GlobalOpinionQA. LoRA rank 8, KL loss on first-token option probabilities.
- 1-JSD, zero-shot to fine-tuned: Llama3-8B-Instruct 0.613 to 0.823; Llama3-8B-Base 0.765 to 0.812; distilled Qwen 7B/14B/32B 0.650/0.712/0.691 to 0.801/0.826/0.822. On unseen Pew, Llama3 went from about 0.61 to 0.76-0.77.
- Against: the authors write that even their best models "struggle with the task, especially on unseen questions"; fine-tuned outputs vary less across countries than the human data; English prompts only.

**Evidence against or limiting.**
- Distribution shift: Huang, Li and Shao argue that conventional fine-tuning "mostly fits the training distribution" and propose a two-stage method that cuts the real data needed by 53-69% ([arXiv 2510.21977](https://arxiv.org/abs/2510.21977), abstract only).
- SimBench (Hu et al., [arXiv 2510.17516](https://arxiv.org/html/2510.17516v1)): 45 models on 20 datasets; best score 40.80 of 100 (Claude-3.7-Sonnet), best open-weight 34.52 (DeepSeek-R1). Instruction tuning hurts on high-entropy questions (r = -0.942 across entropy bins), and base models beat their instruct versions there. Models fine-tuned on psychology experiments (Centaur) score low, so fine-tuning on one kind of human data does not transfer to another. The authors say contamination "cannot be definitively ruled out".
- Dominguez-Olmedo, Hardt, Mendler-Dünner ([arXiv 2306.07951](https://arxiv.org/html/2306.07951)): after correcting ordering and labelling bias, 43 models' survey answers trend toward uniform; only 6 of 25 ACS questions sit closer to the census than to uniform, even for GPT-4. Apparent subgroup alignment tracks subgroup entropy.
- Meister, Guestrin, Hashimoto ([arXiv 2411.05403](https://arxiv.org/html/2411.05403v1)): without fine-tuning, verbalized distributions (TVD 0.226 for Opus) beat log-probabilities (0.550 for GPT-4) and a uniform baseline (0.363); personas stereotype groups.
- Background: Santurkar et al. found substantial misalignment with 60 US groups ([arXiv 2303.17548](https://arxiv.org/abs/2303.17548), abstract only); Argyle et al. introduced silicon sampling with backstories from US surveys ([arXiv 2209.06899](https://arxiv.org/abs/2209.06899), abstract only).
- Inference: every held-out split above is by question, survey family, country or subgroup, never by time. The forecast use case needs the time split, so it is unproven.

### Which survey sources permit training today

Read on each licensor's own page on 2026-10-12. None says that model training is allowed; none of the pages read mentions AI or model training at all.

| Source | Page | What it says | Verdict for a commercial fine-tune |
| --- | --- | --- | --- |
| WVS | [data use licence](https://www.worldvaluessurvey.org/AJDownloadLicense.jsp) | Data are available "provided ... that they are used for non-profit purposes", and the files are "not redistributed" | Forbidden without a written licence |
| IPUMS International | [terms](https://international.ipums.org/international/terms.shtml) | "Commercial use is strictly prohibited"; no redistribution | Forbidden |
| IPUMS (other collections) | [terms of use](https://www.ipums.org/about/terms-of-use) | No redistribution without permission; terms vary by collection; no AI clause | Unclear, needs written permission |
| Pew Research Center | [terms and conditions](https://www.pewresearch.org/about/terms-and-conditions/) | Dataset licence limits sharing to excerpts; American Trends Panel data have separate terms (unread); no AI clause found | Unclear, needs written permission |
| Afrobarometer | [data usage and access policy](https://www.afrobarometer.org/data/data-usage-and-access-policy/) | Data "are protected by copyright"; acknowledgement required; silent on commercial use and training | Unclear, needs written permission |
| GSS | [NORC terms](https://gss.norc.org/terms-and-conditions.html) | Site-wide notice only; the data-use document returned 404; no commercial or AI clause | Unclear, needs written permission |
| ANES | [data center](https://electionstudies.org/data-center/) returned 403 | Unread | Unread |
| ESS | conditions-of-use pages returned 404 | Unread | Unread |

This agrees with [data/060](../data/060-data-licensing-legal.md) on IPUMS and Pew, and updates [data/047](../data/047-world-values-survey.md), which could not read the WVS terms: the WVS download licence now read says non-profit use only.

### Why Jev outputs can never be training data

TypeSafe's Master Customer Agreement §2.3(b) bars using "the Services or any Output ... to perform model distillation, train a model to imitate the output of the Services, or develop (or to facilitate the development of) a similar or competing product or service" (fall_forward_labs `docs/adr/0011-typesafe-vendor-review.md`, a private repository, local copy opened 2026-10-12; facts read on [TypeSafe's MCA](https://typesafe.ai/legal/mca) by that ADR's author). So no Jev answer, probability or confidence, and no engine forecast that Jev produced, may be a training input or target. Inference: an owned opinion model that replaces Jev for `forecast_sim` may be read as "a similar or competing product", and benchmarking Jev in order to build it may be read as facilitating one; that needs a legal read before an experiment calls Jev as a comparison arm. The same open question is item 14 in [`company/decisions-needed.md`](../../company/decisions-needed.md) and recommendation 4 of [engineering/103](../engineering/103-jev-decision-model.md).

### Candidate base models

Licences read on the model's own Hugging Face page on 2026-10-12.

| Model | Size | Licence | Languages per the card | Note |
| --- | --- | --- | --- | --- |
| [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B) | 9B | Apache-2.0; the [LICENSE file](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/LICENSE) is the standard text with no added terms | "201 languages and dialects" | Recommended primary |
| [Gemma 4 31B](https://huggingface.co/google/gemma-4-31B) | 30.7B dense | Apache 2.0 on the card; LICENSE file not opened | Over 140 in pretraining | Fallback and scale-up; MMMLU 88.4 on the card |
| [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B) | 27B dense | Apache-2.0 | Not stated | Strong, coverage unknown |
| [Qwen3-30B-A3B](https://huggingface.co/Qwen/Qwen3-30B-A3B) | 30.5B total, 3.3B active | Apache-2.0 | "100+ languages and dialects" | MoE |
| [Mistral Small 3.2](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506) | 24B | Apache 2.0 | 24 languages | Instruct only on this card; already the text model in [0007](../decisions/0007-jev-and-open-model.md) |
| [gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b) | 21B total, 3.6B active | Apache 2.0 | No multilingual claim | Reasoning model, harmony format |
| [Llama 3.1 8B](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) | 8B | Llama 3.1 Community License | 8 languages | Naming, attribution and 700M MAU terms |
| [OLMo 3 7B](https://huggingface.co/allenai/Olmo-3-7B-Instruct) | 7B | Apache 2.0 | English only | Card says research and education use |

Kimi K2, GLM and the newest Llama cards were not read.

### Cost and time of a LoRA run

Published inputs, read 2026-10-12:
- [Together AI pricing](https://www.together.ai/pricing): supervised fine-tuning $0.34 per million training tokens for Qwen3.5 up to 9B, $1.05 for 27B-31B models including Gemma 4 31B; billed as tokens times epochs. The page also shows a second, unlabelled table about 10% higher and does not say which is LoRA.
- [Tinker models](https://tinker-docs.thinkingmachines.ai/tinker/models/) (LoRA only): $1.463 per million training tokens for Qwen3.5-9B, $4.103 for Qwen3.8-27B.
- [Lambda pricing](https://lambda.ai/pricing): H100 SXM $3.99 per GPU-hour on the 8-GPU instance.
- [NVIDIA NeMo 25.02 performance summary](https://docs.nvidia.com/nemo-framework/user-guide/25.02/performance/performance_summary.html): LoRA on Llama3-8B at 23,406 tokens per second per GPU (FP8, 8x H100, packed sequences of 4096).

Estimate, our arithmetic, not a published figure: 100M training tokens for 3 epochs is 300M tokens. Managed: $102 for Qwen3.5-9B on Together, $439 on Tinker, $315 for a 27B-31B model on Together. Self-managed 8B: 300M / 23,406 is about 3.6 GPU-hours, so about $14, or about $28 if a plain bf16 stack runs at half the NeMo speed; under an hour of wall clock on 8 GPUs. Hyperparameter sweeps, evaluation and failed runs multiply this; budget 3-5x. SubPOP's whole dataset is about 70K pairs, so a SubPOP-scale run is likely well under 100M tokens (inference, token count not measured). This is in line with [science/029](029-human-behavior-models.md), which estimated a SubPOP-scale LoRA at under $500.

## What it means for Real World

- For the product: an owned model could make the `forecast_sim` distributions ours, versioned and reproducible, instead of a pinned vendor's. It earns no public claim until a registered experiment shows it beats Jev on questions fielded after registration.
- For the engineering: training targets are human answer distributions only; inputs are question text, options and segment labels. The adapter is a versioned artifact that the 0008 loop can promote or roll back like the recalibration map.
- For the business: [science/029](029-human-behavior-models.md) warned that a model trained only on public surveys is reproducible by anyone; the defensible part is training data nobody else has, our daily-question answers, and written training licences that rivals would also need. Today no source grants those rights.

## Recommendations

1. Send written training-rights requests to WVS, Pew, Afrobarometer, GSS (NORC), ANES, ESS and IPUMS, naming the use: training a commercially used model that is not redistributed. Record each reply in the data licence table; a source enters a training set only with a written grant.
2. Use Qwen3.5-9B with LoRA as the first candidate, and the pretrained (non-instruct) checkpoint if one is published (not checked); SubPOP and SimBench both found instruct models worse on opinion distributions. Keep Gemma 4 31B as the scale-up after its LICENSE file is read.
3. Copy SubPOP's setup: LoRA rank 8, alpha 32, dropout 0.05, forward KL to the human distribution per (segment, question).
4. Evaluate on a time-forward split only: questions fielded after the registration date, scored against the base model and Jev with a paired metric and a country-block bootstrap.
5. Never store a Jev output in any table that a training job reads; get a legal read of MCA §2.3(b) before Jev is used as a comparison arm.

## Open questions

- Whether survey fine-tuning gains survive a time split: E009 measures it.
- ESS and ANES terms: open the pages in a browser or email ess@city.ac.uk and anes@electionstudies.org.
- Pew American Trends Panel terms: unread; ask Pew.
- Whether the "similar or competing product" clause in MCA §2.3(b) reaches an owned opinion model: legal read.
- Whether daily-question answers may be trained on: depends on item 11 in `company/decisions-needed.md` and the privacy terms the answers are collected under.

## Sources

- [Suh et al., SubPOP, arXiv 2502.16761](https://arxiv.org/abs/2502.16761) and [HTML v1](https://arxiv.org/html/2502.16761v1), accessed 2026-10-12
- [Cao et al., arXiv 2502.07068](https://arxiv.org/html/2502.07068v1), accessed 2026-10-12
- [Hu et al., SimBench, arXiv 2510.17516](https://arxiv.org/html/2510.17516v1), accessed 2026-10-12
- [Meister et al., arXiv 2411.05403](https://arxiv.org/html/2411.05403v1), accessed 2026-10-12
- [Dominguez-Olmedo et al., arXiv 2306.07951](https://arxiv.org/html/2306.07951), accessed 2026-10-12
- [Huang et al., arXiv 2510.21977](https://arxiv.org/abs/2510.21977), abstract, accessed 2026-10-12
- [Santurkar et al., arXiv 2303.17548](https://arxiv.org/abs/2303.17548), abstract, accessed 2026-10-12
- [Argyle et al., arXiv 2209.06899](https://arxiv.org/abs/2209.06899), abstract, accessed 2026-10-12
- [WVS data use licence](https://www.worldvaluessurvey.org/AJDownloadLicense.jsp), accessed 2026-10-12
- [IPUMS International terms](https://international.ipums.org/international/terms.shtml), accessed 2026-10-12
- [IPUMS terms of use](https://www.ipums.org/about/terms-of-use), accessed 2026-10-12
- [Pew terms and conditions](https://www.pewresearch.org/about/terms-and-conditions/), accessed 2026-10-12
- [Afrobarometer data usage and access policy](https://www.afrobarometer.org/data/data-usage-and-access-policy/), accessed 2026-10-12
- [GSS terms and conditions](https://gss.norc.org/terms-and-conditions.html), accessed 2026-10-12
- [Qwen3.5-9B card](https://huggingface.co/Qwen/Qwen3.5-9B) and [LICENSE](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/LICENSE), accessed 2026-10-12
- [Gemma 4 31B card](https://huggingface.co/google/gemma-4-31B), accessed 2026-10-12
- [Qwen3.8-27B card](https://huggingface.co/Qwen/Qwen3.8-27B), [Qwen3-30B-A3B card](https://huggingface.co/Qwen/Qwen3-30B-A3B), [Mistral Small 3.2 card](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506), [gpt-oss-20b card](https://huggingface.co/openai/gpt-oss-20b), [Llama 3.1 8B card](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct), [OLMo 3 7B card](https://huggingface.co/allenai/Olmo-3-7B-Instruct), accessed 2026-10-12
- [Together AI pricing](https://www.together.ai/pricing), [Tinker models](https://tinker-docs.thinkingmachines.ai/tinker/models/), [Lambda pricing](https://lambda.ai/pricing), [NeMo performance summary](https://docs.nvidia.com/nemo-framework/user-guide/25.02/performance/performance_summary.html), accessed 2026-10-12
- fall_forward_labs `docs/adr/0011-typesafe-vendor-review.md`, local copy opened 2026-10-12
