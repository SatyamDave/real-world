# E010: The ICP engine beats a plain-prompt baseline and the founder's gut on marked message tests

- Registered: 2026-10-13
- Owner seat: CTO
- Rests on: [decision 0016](../../research/decisions/0016-icp-audiences.md), [science/016-silicon-samples](../../research/science/016-silicon-samples.md), [science/018-failure-modes](../../research/science/018-failure-modes.md), [science/030-forecast-scoring](../../research/science/030-forecast-scoring.md), [decision 0015](../../research/decisions/0015-founders-and-companies.md)
- Claim it earns or kills: decision 0016's choice of a 27-segment ICP simulation, asked by many simulated consumers per segment, over a single prompt, and the `gtm/messaging.md` line "See how the AI does against your gut". It earns no new line in `gtm/messaging.md`; any public claim from it needs a messaging change first.

## Hypothesis

On sealed message tests that founders mark Landed or Flopped after this registration, the engine's `intent` has a lower mean Brier score than both the baseline's `baseline_intent` and the founder's own gut on the same tests.

## Primary metric

Mean paired Brier difference, engine minus baseline, over eligible marked tests: for each test, (intent - y)^2 - (baseline_intent - y)^2, where y is 1 for Landed and 0 for Flopped. Negative favours the engine.

The gut comparison is the second pre-registered test and is also required for "supported": mean paired Brier difference, engine minus gut, where the gut's probability is 1 for "It lands" and 0 for "It flops", over the same eligible tests.

## Secondary metrics

- Each of the three mean Brier scores with n and its interval.
- Hits: share of tests where each forecaster's side of 50% matches the mark.
- Engine minus baseline over every marked test with a baseline, with or without a gut call.
- Every metric split by `result.agents`, if marked tests ran at more than one agent count.
- Reliability table of intent in five equal buckets (0-20% to 80-100%) against the share that landed, for the engine and the baseline.

## Data

- Rows of `post_tests` sealed after the commit that adds this file to `REGISTRY.md`, marked Landed or Flopped, whose sealed body holds `icp`, `idea`, `result.agents` and `result.baseline_intent`, and that have a gut call. The seal fixes intent, baseline and gut before the outcome exists, and the outcome happens after both the models' training cutoffs and this registration, so contamination cannot help any arm.
- Exclusions decided now: tests from accounts whose email domain is the company's own; tests whose sealed body fails to recompute to its seal; beyond each account's first 20 eligible marked tests, by sealed time, so no one founder decides the result.
- Real metrics and notes stored with marks are reported in an exploratory section only; they do not enter any pre-registered metric.
- Founders' tests are their own data: the repo commits only the computed metrics and per-test rows with the message text and ICP removed.

## Baseline

One Jev decision call per test with no segments ("Ideal customer: <description>. Product: <idea>. Message: <text>. Would a typical one of these customers sign up, try or buy because of it?"), run by the same request as the engine. A plain prompt beat persona panels in every pair of one 2026 preprint ([science/016](../../research/science/016-silicon-samples.md)), so it is the comparison a skeptic would pick. The founder's gut is the baseline they actually use ([decision 0012](../../research/decisions/0012-will-it-land-and-call-it.md)).

## Sample size and stopping rule

The analysis runs once, on the first UTC day with at least 100 eligible marked tests, and on the first 100 by marked time. 100 is the threshold the product already states ("Uncalibrated until 100 marked tests") and the [0015](../../research/decisions/0015-founders-and-companies.md) revisit trigger. No look at either difference before then; the product's own "Your tests" page shows each founder their own numbers, which is not an analysis of this experiment. If 100 is not reached by 2027-06-30, the experiment is marked abandoned with the count reached.

## Analysis plan

- Interval: 95% bootstrap over accounts (tests within an account are correlated), 10,000 resamples, seed 10.
- Supported if the interval for engine minus baseline lies wholly below zero and the interval for engine minus gut lies wholly below zero. Each test is reported on its own with its interval.
- Ties at exactly 0.5 count as a miss for hits; Brier is unaffected.
- A test whose seal does not recompute is excluded and counted in the report.

## Kill criterion

- If the interval for engine minus baseline does not lie wholly below zero, we stop claiming or implying that the 27 segments add anything over a single prompt: "Your tests" and the result lead with the baseline, and decision 0016 is revisited by a new record.
- If the interval for engine minus gut does not lie wholly below zero, no surface says or implies the engine knows better than the founder, and "Your tests" says so on the record.
- Either result is published in `experiments/E010/results/` and `REGISTRY.md` the same week.

## Cost cap

$0 for the analysis: it reads stored tests and makes no model calls. The tests themselves are capped per test by `TEST_MAX_COST_USD` and per day by `FORK_DAILY_BUDGET_USD` in `engine/rw/settings.py`, and refuse when a cap cannot be read.

## Command

`make experiment ID=E010`
