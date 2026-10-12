# E001: Engine vs a single frontier-model prompt on post-cutoff poll subgroup distributions

- Registered: 2026-10-11
- Owner seat: CTO
- Rests on: [silicon samples](../../research/science/016-silicon-samples.md), [opinion benchmarks](../../research/science/020-opinion-benchmarks.md), [failure modes](../../research/science/018-failure-modes.md), [global poll sources](../../research/data/054-global-poll-sources.md), [CEO lens](../../research/lenses/ceo.md), [VC lens](../../research/lenses/vc.md), [red team](../../research/lenses/red-team.md)
- Claim it earns or kills: whether the population simulation adds anything over one LLM call that describes the population. A 2026 preprint found that call beat persona panels on 9 of 9 pairs ([silicon samples](../../research/science/016-silicon-samples.md)).

## Hypothesis

The engine's simulated answer distributions for country-by-subgroup cells are closer to the observed post-cutoff poll distributions than those of a single frontier-model prompt asked to describe the same subgroup.

## Primary metric

Mean paired difference in Jensen-Shannon distance between predicted and observed answer distributions, engine minus baseline, over all eligible question-by-country-by-subgroup cells. Negative favours the engine.

## Secondary metrics

- The same difference against the non-LLM baseline below.
- Ratio of simulated to observed spread across subgroups within each question and country.
- Share of cells where the engine gets the ordering of subgroups right (sign agreement), as [silicon samples](../../research/science/016-silicon-samples.md) recommends.
- All metrics split by coverage tier ([coverage tiers](../../research/data/099-country-coverage-tiers.md)) and by region.

## Data

Pew Research Center Spring 2026 Global Attitudes survey crosstabs, the best free post-cutoff source with subgroups found ([global poll sources](../../research/data/054-global-poll-sources.md)). A question is eligible only if its fieldwork started after the published training cutoff of every model in the run. Pew licences excerpts only, so the repo stores links, question ids and computed metrics, not the crosstab tables ([Gallup and Pew](../../research/data/048-gallup-pew-global.md), [data licensing](../../research/data/060-data-licensing-legal.md)). Cells with fewer than 100 reported respondents, or no reported base, are excluded before any model is run.

## Baseline

One pinned frontier model, one prompt per cell asking for the answer distribution of that subgroup in that country, option order randomized, five samples averaged. This is the "describe the population" baseline the engine must beat ([silicon samples](../../research/science/016-silicon-samples.md), [LLM forecasting](../../research/science/021-llm-forecasting.md)). Non-LLM baseline: the national distribution from the most recent pre-cutoff wave of the same question, applied to every subgroup.

## Sample size and stopping rule

All eligible cells, run once. The run requires at least 200 cells across at least 10 countries; with fewer, it is postponed and the shortfall is reported. These floors are our choice, set so a country-block bootstrap has enough blocks; no source fixes them. No interim looks.

## Analysis plan

95% confidence interval for the primary metric by bootstrap over countries (10,000 resamples), since cells within a country are correlated. The engine wins if the whole interval is below zero. Report every tier and region separately; no pooled number is reported without the splits beside it. Model ids, prompts and option permutations are logged for every call.

## Kill criterion

If the interval is not entirely below zero, we stop claiming that the population layer improves subgroup accuracy, publish the result on the receipts page and in `experiments/E001/results/`, and rework the engine before scaling it. If the interval is entirely above zero, the agent layer is removed from public claims until a new registered experiment shows otherwise ([CEO lens](../../research/lenses/ceo.md), [red team](../../research/lenses/red-team.md)).

## Cost cap

$100 of LLM spend, checked against the cost ledger before each batch; the run stops if the ledger cannot be read. This comes out of the $500 the [CFO lens](../../research/lenses/cfo.md) budgets for pilots, bake-offs and A/B runs before Nov 2.

## Command

`make experiment ID=E001`
