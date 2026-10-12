# E002: Variance-collapse correction

- Registered: 2026-10-11
- Owner seat: CTO
- Rests on: [failure modes](../../research/science/018-failure-modes.md), [calibration methods](../../research/science/019-calibration-methods.md), [silicon samples](../../research/science/016-silicon-samples.md), [ensembles](../../research/engineering/066-ensembles.md), [CEO lens](../../research/lenses/ceo.md), [CTO lens](../../research/lenses/cto.md)
- Claim it earns or kills: that our simulated population has the spread of a real population, not one voice repeated. Digital-twin SD sat below human SD in 94% of 164 outcomes in the evidence reviewed ([failure modes](../../research/science/018-failure-modes.md)).

## Hypothesis

A per-country dispersion calibration map, fitted on held-out survey items, moves the median ratio of simulated to survey standard deviation for Tier A and B countries into the band 0.8 to 1.2, from outside it, without making the answer distributions worse.

## Primary metric

Median, over Tier A and B country-by-item cells in the test split, of the ratio of simulated SD to survey SD, for the calibrated engine. Success requires the calibrated median inside [0.8, 1.2] and the uncalibrated median outside it. The band comes from the [CEO lens](../../research/lenses/ceo.md) and [CTO lens](../../research/lenses/cto.md).

## Secondary metrics

- Non-inferiority on distribution accuracy: mean paired Jensen-Shannon distance, calibrated minus uncalibrated, must have a 95% interval upper bound below 0.01. The margin is our choice; no source fixes it.
- Entropy, modal share and total-variation distance per country ([failure modes](../../research/science/018-failure-modes.md)).
- Coverage of the 50% and 90% intervals ([forecast scoring](../../research/science/030-forecast-scoring.md)).
- Number of countries where calibration makes distribution accuracy worse, since calibration can hurt well-aligned groups ([calibration methods](../../research/science/019-calibration-methods.md)).
- Share of cells below 0.7, the stricter flag threshold in [failure modes](../../research/science/018-failure-modes.md) and the [red team](../../research/lenses/red-team.md), reported so the founder can settle the threshold.

## Data

Fit split: published aggregates only (World Values Survey wave 7 aggregates and Pew Global Attitudes toplines), used internally until written terms arrive ([World Values Survey](../../research/data/047-world-values-survey.md), [Gallup and Pew](../../research/data/048-gallup-pew-global.md)). Test split: items from the Pew Spring 2026 survey whose fieldwork started after every model's training cutoff ([global poll sources](../../research/data/054-global-poll-sources.md)). Items are split by question, never by respondent, stratified by country. No survey row enters the repo.

## Baseline

The same engine without the calibration map: distribution-first, verbalized distributions per archetype with randomized option order ([calibration methods](../../research/science/019-calibration-methods.md), [CTO lens](../../research/lenses/cto.md)).

## Sample size and stopping rule

All Tier A and B country-by-item cells in the test split, run once. At least 8 countries and 20 items per country are required; with fewer, the run is postponed. These floors are our choice. No interim looks.

## Analysis plan

Medians with 95% intervals by bootstrap over countries (10,000 resamples). Report every country, not only the median. Calibration maps are fitted once on the fit split and frozen before the test split is scored.

## Kill criterion

If the calibrated median stays outside [0.8, 1.2] or non-inferiority fails, calibration is not shipped as the fix. Countries outside the band are labelled experimental with widened intervals, as the [CEO lens](../../research/lenses/ceo.md) requires, and no public copy claims the population's spread matches surveys.

## Cost cap

$60 of LLM spend, checked against the cost ledger before each batch; the run stops if the ledger cannot be read. Part of the $500 experiment budget in the [CFO lens](../../research/lenses/cfo.md).

## Command

`make experiment ID=E002`
