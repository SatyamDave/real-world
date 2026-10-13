# E009: LoRA-tuned opinion model vs its base model vs Jev on survey questions fielded after registration

- Registered: 2026-10-12
- Owner seat: CTO
- Rests on: [science/105-survey-finetuned-opinion-model](../../research/science/105-survey-finetuned-opinion-model.md), [science/029-human-behavior-models](../../research/science/029-human-behavior-models.md), [science/018-failure-modes](../../research/science/018-failure-modes.md), [data/060-data-licensing-legal](../../research/data/060-data-licensing-legal.md), [CTO lens](../../research/lenses/cto.md), [red team](../../research/lenses/red-team.md)
- Claim it earns or kills: decision [0010](../../research/decisions/0010-survey-finetuned-model.md), that an owned survey-finetuned model replaces Jev for `forecast_sim`. It earns no line in `gtm/messaging.md`; any public claim from it needs a messaging change first.

## Hypothesis

On survey questions fielded after 2026-10-12, a LoRA adapter on Qwen3.5-9B trained on licensed survey distributions predicts country-by-subgroup answer distributions closer to the observed ones than Jev (`jev-1.13.0`) does, by at least 0.01 in Jensen-Shannon distance.

## Primary metric

Mean paired difference in Jensen-Shannon distance (base 2, so in [0, 1]) between predicted and observed answer distributions, tuned model minus Jev, over all eligible question-by-country-by-subgroup cells. Negative favours the tuned model.

## Secondary metrics

- The same difference, tuned model minus the untuned base model, with the same prompt and readout.
- The same difference, base model minus Jev.
- Spread ratio: standard deviation of predicted subgroup shares over standard deviation of observed shares, within each question and country, per arm ([failure modes](../../research/science/018-failure-modes.md)).
- Sign agreement: share of subgroup pairs within a question and country whose ordering each arm gets right.
- Every metric split by coverage tier ([coverage tiers](../../research/data/099-country-coverage-tiers.md)), by region, and by whether the question's survey family was in the training set.

## Data

- Training set: only survey waves whose licensor has granted commercial model-training rights in writing, recorded in the data licence table before training starts, with fieldwork ending on or before 2026-10-12. No Jev output, engine forecast or other model output enters training in any form (TypeSafe MCA §2.3(b), [105](../../research/science/105-survey-finetuned-opinion-model.md)). Rows a licence restricts stay out of the repo; the repo stores a pointer, the licence and the computed metrics.
- Validation split, for choosing the learning rate only: 10% of training questions, drawn by question id with seed 9, all with fieldwork on or before 2026-10-12.
- Test set: every closed-option question whose fieldwork started after 2026-10-12, published with country-by-subgroup distributions by a source whose terms permit evaluation use, and frozen on the day the test set is assembled by committing its question ids and source links with their SHA-256. Both model weights and `jev-1.13.0` were published before 2026-10-12, so no arm can have seen the test answers. Cells with fewer than 100 reported respondents, or no reported base, are excluded before any model runs.

## Baseline

- Jev, pinned `jev-1.13.0`, asked a `choice` question with the survey's options, with the segment and country as `state`: the incumbent for `forecast_sim` under [decision 0007](../../research/decisions/0007-jev-and-open-model.md), and the arm the tuned model must replace.
- The untuned Qwen3.5-9B with the same prompt and readout: shows whether any gain comes from tuning rather than from the base model.

## Sample size and stopping rule

All eligible test cells, run once, after the adapter is frozen and its SHA-256 is committed. The run requires at least 300 cells from at least 30 questions across at least 10 countries; with fewer, it waits, and the shortfall is reported each month. These floors are our choice, set so a country-block bootstrap has enough blocks; no source fixes them. No interim looks at test data.

## Analysis plan

- Training: LoRA rank 8, alpha 32, dropout 0.05, forward KL to the human distribution per (segment, question), as in SubPOP ([105](../../research/science/105-survey-finetuned-opinion-model.md)). Learning rate chosen from {5e-5, 1e-4, 2e-4} by validation KL; nothing else is tuned.
- Readout for the tuned and base models: next-token probabilities over option letters, averaged over five option orders, renormalized. Jev returns its `probabilities` directly.
- Interval: 95% bootstrap over countries, 10,000 resamples, seed 9, since cells within a country are correlated.
- The tuned model wins if the whole interval for tuned minus Jev lies below -0.01.
- Every tier and region is reported separately; no pooled number is reported without the splits beside it.
- A cell where any arm fails to return a valid distribution after one retry is dropped for all arms and counted in the report.
- Model ids, adapter hash, prompts and option orders are logged for every call. Jev outputs are stored only to compute these metrics and are never readable by a training job.
- If a legal read of MCA §2.3(b) forbids calling Jev as a comparison arm, the primary metric cannot be computed: E009 is marked abandoned with that reason, and a new experiment is registered.

## Kill criterion

- If the interval for tuned minus Jev does not lie wholly below -0.01, the tuned model does not replace Jev for `forecast_sim`, decision 0010 stays proposed, and the result is published in `experiments/E009/results/` and `REGISTRY.md` the same week.
- If the interval for tuned minus base does not lie wholly below zero, we stop believing that survey fine-tuning helps on forward questions: the training program stops, and decision 0010 is withdrawn by a superseding record.

## Cost cap

$600 in total: $500 for training (about five runs at the estimated $102 per 300M-token run on Together, [105](../../research/science/105-survey-finetuned-opinion-model.md)) and $100 for inference across all arms. Each training job's price is computed from its token count before submission and refused above the remaining cap; inference spend is checked against the cost ledger before each batch, and the run stops if the ledger cannot be read.

## Command

`make experiment ID=E009`
