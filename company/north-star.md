# North-star metric

## The one metric

**Resolved pre-committed forecasts on the public record (n).**

Definition: the count of binary questions that were on a hashed, pre-committed question list, received a forecast inside a daily Merkle root before their outcome existed, and have since resolved and been scored on the receipts page. Source of truth: the ledger and the scorer. Current value: 0, since no forecast has been hashed yet (2026-10-11).

Why this one: every lens names the hashed, scored record as the only asset a competitor cannot buy later, and every comparative claim waits for n to reach about 100 ([CEO lens](../research/lenses/ceo.md), [VC lens](../research/lenses/vc.md), [moat theory](../research/business/092-moat-theory.md), [forecast scoring](../research/science/030-forecast-scoring.md)). It only grows if we publish every day and keep publishing misses, and it cannot be inflated without breaking the pre-committed list.

It is always shown next to its quality: the paired Brier differences in input 2. A large n with a losing score is still reported as such.

Targets from the [CEO lens](../research/lenses/ceo.md): at least 25 pre-registered forecasts by Oct 26, at least 12 resolved by Nov 7, and about 100 resolved before any comparative claim.

## Product metric beside it (proposed in [0012](../research/decisions/0012-will-it-land-and-call-it.md), aimed at consumer founders by [0016](../research/decisions/0016-icp-audiences.md))

**Consumer founders with three or more marked tests.** A founder who has sealed a message test and come back to mark three of them with what really happened has used the product, trusted it enough to return, and added to the record that proves the engine against the plain baseline and their gut. Source: the `post_tests` table. The share of founders who mark a sealed test within 14 days is its leading signal, and [E010](../experiments/E010/PREREG.md) reads the engine against the baseline at 100 marked tests. Current value: 0. Waiting on the founder in [decisions-needed](decisions-needed.md) item 12.

## The five input metrics

| # | Metric | Definition and source | Target | Why |
| --- | --- | --- | --- | --- |
| 1 | Unbroken days of hashed record | Consecutive days with a published, timestamped daily root; from the ledger | First hash by Oct 14, no missed day after | A missed day costs more than a smaller cohort ([CEO lens](../research/lenses/ceo.md), [CTO lens](../research/lenses/cto.md)) |
| 2 | Engine Brier minus plain-LLM Brier, and minus market Brier, with n and interval | Paired by question, day-block bootstrap; from the scorer, analysed in [E004](../experiments/E004/PREREG.md) | Interval entirely below zero at n = 100 | Decides whether the population simulation adds value ([red team](../research/lenses/red-team.md), [VC lens](../research/lenses/vc.md)) |
| 3 | Median simulated-to-survey SD ratio, Tier A and B countries | From the nightly spread audit, tested in [E002](../experiments/E002/PREREG.md) | 0.8 to 1.2 | Tells us whether the agents are a population or one voice repeated ([CEO lens](../research/lenses/ceo.md), [failure modes](../research/science/018-failure-modes.md)) |
| 4 | Day-7 return of daily-question players | Share of day-0 submitters who submit again on day 6, 7 or 8; from submission rows | Not set until a week of data exists | Tells us whether the panel moat exists ([CPO lens](../research/lenses/cpo.md), [daily question](../research/product/077-daily-question-mechanics.md)) |
| 5 | Marked message tests, and engine Brier minus baseline Brier on them | Tests marked Landed or Flopped, with n; from the `post_tests` table, analysed in [E010](../experiments/E010/PREREG.md) | 100 marked tests for E010; no target before first use | Zero marked tests means nobody trusts the result enough to check it ([0016](../research/decisions/0016-icp-audiences.md)) |

Current value of all five on 2026-10-11: not measured yet.

## Guardrails

Watched, not steered by. A breach stops work on whatever caused it.

- Nightly LLM spend: budget $25, alarm at $60, every cap fails closed ([CEO lens](../research/lenses/ceo.md), [CFO lens](../research/lenses/cfo.md)).
- Measured standard cost per 1,000 agent-steps: at or below $0.33 keeps the proposed price ([CFO lens](../research/lenses/cfo.md)).
- Data sources in the shipped pipeline with written commercial clearance, out of the total in use: 100% by Oct 27 ([red team](../research/lenses/red-team.md)).
- First-minute activation: share of new visitors who run a message test within 60 seconds; below 30% means the first screen is wrong ([CPO lens](../research/lenses/cpo.md)).
