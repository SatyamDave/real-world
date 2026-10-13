# 0008: A self-improving loop that promotes a recalibration map only on fresh held-out evidence

- Date: 2026-10-12
- Status: proposed
- Rests on: [engineering/104-self-improving-loop](../engineering/104-self-improving-loop.md), [science/019-calibration-methods](../science/019-calibration-methods.md), [science/030-forecast-scoring](../science/030-forecast-scoring.md), [0002-benchmark-and-receipts](0002-benchmark-and-receipts.md), [CTO lens](../lenses/cto.md)

## Decision

After the daily cycle scores, a new `improve` step fits one candidate, a Platt map `p' = sigmoid(a * logit(p) + b)` over the raw `sim` probability, shrunk toward identity and with each question weighted equally, on resolved questions older than the holdout. The holdout is the most recent `IMPROVE_HOLDOUT_QUESTIONS` resolved questions that resolved after the incumbent took effect. The step promotes the candidate only if there are at least `IMPROVE_MIN_TRAIN_QUESTIONS` training questions and a full holdout, the mean paired Brier difference (candidate minus incumbent, per question-day) is at most minus `IMPROVE_MARGIN_BRIER`, and its day-block bootstrap interval under `data/protocol.json` lies wholly below zero; otherwise it changes nothing and records why in the step detail. A promotion appends a row to the append-only `engine_versions` table whose id is the SHA-256 of its canonical JSON (parent, params, evidence, before and after scores, effective date) and which takes effect the next day. The next publish adds one ledger leaf of the new kind `engine_config` carrying that row, and from that day each `sim` forecast leaf's probability is the mapped one and its `config_hash` covers the version id. `plain_llm` and `market` are never mapped. Past forecasts, leaves and scores never change. Rollback appends a row that re-pins an earlier version's params. If scoring did not finish or any number is not finite, the step keeps the incumbent. The allowlist of parameters this loop may ever tune is: the recalibration map, the assimilation operator's settings, prompt and state template variants per call site, and agent sample sizes; only the map is built now. Nothing is trained on model outputs as targets. This amends the base-build rule in `product/benchmark.md` that there is no calibration map: the `sim` row may carry a promoted map, the raw `sim` probability stays recorded in `forecasts`, each receipt names the engine config version through its `config_hash` and the `engine_config` leaf, and no map is promoted until E008 is supported.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| No loop; a person retunes settings after reading scores | No new code | Slow, and a person choosing after seeing results is the selection [104](../engineering/104-self-improving-loop.md) warns against |
| Platt map, fresh holdout, margin plus interval (chosen) | Two parameters; beats isotonic below a few hundred cases ([104](../engineering/104-self-improving-loop.md)); no model calls, so no spend | Fixes only a global lean and over- or underconfidence; fresh holdout delays the second promotion |
| Isotonic or per-topic maps now | Can fix shapes Platt cannot | Overfit below about 200-1000 cases ([104](../engineering/104-self-improving-loop.md)); we have tens |
| Search assimilation weights, prompts and sample sizes by replay | Can fix errors upstream of the map | Each candidate reruns the simulation over past days with model calls; needs a budgeted replay path that does not exist yet |
| Fine-tune a model on our forecasts and outcomes | Largest possible gain | Inputs include Jev outputs; MCA §2.3(b) bans distillation and the outcome-label question is open ([104](../engineering/104-self-improving-loop.md)) |

## Why this one

It is the smallest loop that can improve the published number without a person and without spend: one fitted family, chosen before the data, judged on questions the incumbent never saw, with a bar that a calibrated forecaster should rarely clear. The ledger already records protocol and question-set changes as leaves ([0002](0002-benchmark-and-receipts.md)); an `engine_config` leaf extends the same rule, so each forecast traces to the configuration that made it.

## What would make us revisit it

- E008 shows a false-promotion rate above 10% of seeds on a calibrated forecaster, or a promoted map that raises Brier on later questions: tighten the gate or switch the loop off.
- The MCA §2.3(b) review says a map fitted on Jev probabilities is not allowed: the loop runs only on non-Jev forecasters.
- A topic reaches the gate on its own: per-topic maps become the next candidate family.
- A budgeted replay path exists: assimilation, prompt and sample-size candidates join, each with its own registered experiment.
