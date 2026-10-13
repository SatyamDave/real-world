# E007: Jev forecasts are no worse calibrated than the Haiku baseline

- Registered: 2026-10-12
- Owner seat: CTO
- Rests on: [engineering/103-jev-decision-model](../../research/engineering/103-jev-decision-model.md), [decision 0007](../../research/decisions/0007-jev-and-open-model.md), [science/030-forecast-scoring](../../research/science/030-forecast-scoring.md)
- Claim it earns or kills: decision 0007's gate on the Jev path writing scored forecasts on real questions

## Hypothesis

On the same questions and days, the sim forecast from the Jev path has a mean Brier score no more than 0.01 above the sim forecast from the Claude Haiku 5.5 path.

## Primary metric

Mean paired Brier difference per resolved question, Jev sim minus Haiku sim, each question's Brier being the mean over the days both paths forecast it. Positive favours Haiku.

## Secondary metrics

- The same difference for the plain forecast.
- Expected calibration error of each path, 10 equal-width bins, over question-days.
- Model cost per run of each path, from `llm_calls`.
- Share of Jev calls refused (wrong version, off-shape, HTTP error).

## Data

The founder-approved question list in `data/questions/` (decisions-needed item 13), with the day's news ingested once and shared by both paths. Both paths forecast only before each question resolves, so no model can have seen the outcome. These forecasts are a shadow log in a separate `RW_HOME`; none enters the ledger or the scored record.

## Baseline

The Haiku path as it stands at commit `ea5b41f` (the last commit with the Anthropic provider), run with `ANTHROPIC_API_KEY`. It is the forecaster the Jev path replaces, so a skeptic asks whether the switch made forecasts worse.

## Sample size and stopping rule

The analysis runs once 20 questions forecast by both paths have resolved, or on 2026-11-30, whichever comes first. 20 is the most the October list can resolve before the end of November; it can detect only a large difference, which is why the margin is one-sided. No early stop.

## Analysis plan

95% interval for the primary difference by bootstrap over questions (10,000 resamples, seed 7). Pass if the interval's upper end is at or below 0.01. The margin is a judgment, not a measured number: 4% of the 0.25 Brier score of a constant 0.5 forecast. A question voided by its source is excluded. A day either path failed to forecast is dropped for both. Every question is reported with both Brier scores.

## Kill criterion

If the upper end exceeds 0.01, the Jev sim path does not write scored forecasts; we write a decision record choosing between the open model for forecasts and a calibration layer on Jev, and rerun this design on the choice.

## Cost cap

$5 for the Haiku path and $5 for the Jev path, each passed as the run's `Budget`; a run stops when the budget or `llm_calls` cannot be read.

## Command

`make experiment ID=E007`
