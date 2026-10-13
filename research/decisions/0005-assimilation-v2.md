# 0005: Assimilation v2, a per-segment Kalman update with an anchor offset

- Date: 2026-10-12
- Status: accepted
- Rests on: [engineering/102-assimilation-v2](../engineering/102-assimilation-v2.md), [science/022-data-assimilation-abm](../science/022-data-assimilation-abm.md), [open-source/038-data-assimilation-libs](../open-source/038-data-assimilation-libs.md), [engineering/065-belief-update-operators](../engineering/065-belief-update-operators.md), [CTO lens](../lenses/cto.md), [E003 results](../../experiments/E003/results/2026-10-12-none/RESULTS.md)

## Decision

The second assimilation operator is `beliefs.kalman_update`: for each (group, topic) cell it carries a variance P; each day P grows by the walk variance (`KALMAN_WALK_SD_LOGIT` squared) and the group mean is forecast unchanged; for each observed cell, P is first raised to the squared innovation minus the observation variance R when that is larger, the gain is K = P / (P + R), every agent in the group and the group's stored anchor offset C move by K times the innovation, and P becomes (1 - K) P. `b0` is never overwritten; the daily cycle passes `b0 + C` to `update_beliefs` as the anchor. A daily poll's R is (`POLL_ERROR_FACTOR` times its sampling SD in logit) squared. `settings.ASSIMILATION` selects `"nudge"` or `"kalman"`. The default becomes `"kalman"` only if E006's primary interval (day-30 RMSE, v2 minus persistence) lies wholly below zero; otherwise it stays `"nudge"`.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep capped nudging, retune cap and pull | No new code; the lenses chose it ([CTO lens](../lenses/cto.md)) | Below the cap it adopts each poll whole, so it can at best tie persistence; E003 lost by +0.235 ([102](../engineering/102-assimilation-v2.md)) |
| Persistence as the operator (set each polled segment to its poll) | Beat nudging in E003; trivial | Keeps all poll noise; still needs the anchor offset or the pull drags it back |
| Remove the anchor pull | Stops the correction decaying | The pull is what keeps individual quirks and limits news drift ([065](../engineering/065-belief-update-operators.md)); it also drives forks |
| Scalar Kalman per cell, anchor offset, innovation inflation (chosen) | Exact filter when cells are independent and each poll observes one group mean; gain reflects poll error and time since last poll; about 20 lines of numpy | Needs a walk SD and a prior SD we have not measured on real data |
| ETKF on segment aggregates ([038](../open-source/038-data-assimilation-libs.md), the paper's A1) | Handles coupled cells and parameters; the long-run design | Needs an ensemble; adds sampling noise where the scalar filter is exact; the lenses and `product/world.md` defer ensemble filters |

## Why this one

E003 shows nudging loses to persistence, the baseline the receipts page shows beside us. The note traces the loss to gain one under the cap, the cap after shocks, and the anchor pull toward a biased prior ([102](../engineering/102-assimilation-v2.md)). The Kalman filter is the minimum mean-square-error linear estimator when its noise variances are right, and persistence is its gain-one special case, so it is the smallest change that can do better. The anchor offset is the paper's own answer to the pull undoing increments, and it keeps `b0` and every agent's offset within its segment. It is not the ensemble filter the lenses deferred: there are no members, no sampled covariance and no new dependency. The default still waits for E006 on new seeds, so the switch rests on a registered result, not on development runs.

## What would make us revisit it

- E006's primary interval does not lie wholly below zero: v2 stays off by default and this record is superseded or v2 removed.
- Either E006 walk-misspecification arm loses to persistence with an interval wholly above zero: the gain depends on a number we have not measured, so the walk SD must be estimated from real poll series first.
- Observations start to cover several groups at once (national polls over segments) or market and search operators enter: cells couple and the ETKF in [038](../open-source/038-data-assimilation-libs.md) is the next step.
- A hindcast on real post-cutoff polls shows v2 losing to persistence.
