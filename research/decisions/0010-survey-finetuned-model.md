# 0010: Train an owned opinion model on licensed survey data for forecast_sim

- Date: 2026-10-12
- Status: proposed
- Rests on: [science/105-survey-finetuned-opinion-model](../science/105-survey-finetuned-opinion-model.md), [science/029-human-behavior-models](../science/029-human-behavior-models.md), [engineering/103-jev-decision-model](../engineering/103-jev-decision-model.md), [data/060-data-licensing-legal](../data/060-data-licensing-legal.md), [business/092-moat-theory](../business/092-moat-theory.md), [CTO lens](../lenses/cto.md)

## Decision

Real World trains its own opinion model: a LoRA adapter on Qwen3.5-9B (Apache-2.0), using the pretrained checkpoint if one is published, with SubPOP's setup (rank 8, alpha 32, dropout 0.05, forward KL to the human answer distribution for each segment and question). Its inputs are question text, answer options and segment labels; its targets are human answer distributions only, from two sources: survey waves whose licensor has granted commercial model-training rights in writing, recorded in the data licence table, and daily-question answers once the founder has decided they are ours to train on (`company/decisions-needed.md` item 11). No Jev answer, probability or confidence, no engine forecast and no other model output is ever an input or a target (TypeSafe MCA §2.3(b)). The model sits beside Jev, not in front of it: Jev stays the `forecast_sim` model until [E009](../../experiments/E009/PREREG.md) is supported, and only then does the owned model replace Jev for `forecast_sim`; the other Jev call sites in [0007](0007-jev-and-open-model.md) are unchanged. After that, the self-improving loop of decision 0008 (PR #76) retrains it on each new survey wave and on new daily-question answers. A retrained adapter is a challenger: it is promoted only if, on held-out survey questions fielded after the incumbent took effect, its mean paired Jensen-Shannon distance to the human distributions is lower than the incumbent's by at least E009's margin with a country-block bootstrap interval wholly below zero. A promotion appends an `engine_versions` row naming the adapter's SHA-256 and takes effect the next day through an `engine_config` ledger leaf, as 0008 specifies; past forecasts never change, and rollback appends a row that re-pins an earlier adapter. This adds the `forecast_sim` model adapter to 0008's allowlist of tunable parameters.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep Jev for `forecast_sim`, no owned model ([0007](0007-jev-and-open-model.md) as proposed) | Nothing to build; typed distributions today | A pinned vendor with no SLA under the scored forecasts; the forecaster cannot improve from our own data ([105](../science/105-survey-finetuned-opinion-model.md)) |
| Owned LoRA model on licensed surveys, beside Jev until E009 passes (chosen) | Fine-tuning beat prompting by 32-46% in WD on held-out surveys and subgroups ([105](../science/105-survey-finetuned-opinion-model.md)); versioned, reproducible, promotable by the 0008 gate | No source grants training rights today; no paper tested a time-forward split; public-survey fine-tunes are reproducible by rivals ([029](../science/029-human-behavior-models.md)) |
| Train on Jev outputs or engine forecasts | Plenty of data, already logged | Forbidden by MCA §2.3(b) ([105](../science/105-survey-finetuned-opinion-model.md)) |
| Train before launch on unlicensed public surveys | Fastest | WVS and IPUMS International forbid commercial use; the others are silent or unread ([105](../science/105-survey-finetuned-opinion-model.md), [060](../data/060-data-licensing-legal.md)) |
| Larger base, such as Gemma 4 31B, first | Possibly better on more languages | About 3x the training price; licence file unread ([105](../science/105-survey-finetuned-opinion-model.md)); kept as the scale-up if Qwen3.5-9B fails E009 |
| Wait until Q1 2027 as [029](../science/029-human-behavior-models.md) recommends | Matches the CEO and CTO lens cut on fine-tuning before Nov 2 | Licence replies and a forward held-out set take months; starting the asks after Gate 2 costs only email |

## Why this one

The evidence that survey fine-tuning beats prompting on held-out surveys and subgroups is direct and replicated across US and global data ([105](../science/105-survey-finetuned-opinion-model.md)). The two gaps, data rights and the time-forward split, are handled by rule rather than by hope: no source enters training without a written grant, and nothing replaces Jev until a pre-registered forward test against both Jev and the untuned base model passes. The moat note says public data is not defensible on its own ([092](../business/092-moat-theory.md)); daily-question answers and written training licences are what a rival cannot copy from a snapshot. Promotion through 0008's champion/challenger gate keeps every forecast traceable to the adapter that made it.

## What would make us revisit it

- E009's kill criterion triggers.
- No licensor grants training rights by 2027-01-31: the model can train only on daily-question answers, and this record is revisited.
- A legal read finds that MCA §2.3(b)'s "similar or competing product" clause reaches an owned opinion model or a Jev comparison arm.
- Decision 0008 is not accepted: promotion needs another gate, written in a new record.
- A newer open-weight base with a clean licence beats Qwen3.5-9B on E009's metric in a registered experiment.
