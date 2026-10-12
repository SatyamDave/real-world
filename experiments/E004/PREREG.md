# E004: Live hashed forecasts vs the market price (Brier)

- Registered: 2026-10-11
- Owner seat: CEO
- Rests on: [forecast scoring](../../research/science/030-forecast-scoring.md), [benchmark design](../../research/science/097-benchmark-design.md), [LLM forecasting](../../research/science/021-llm-forecasting.md), [commit-reveal](../../research/engineering/070-commit-reveal-timestamping.md), [events calendar](../../research/data/059-resolvable-events-calendar.md), [prediction market APIs](../../research/data/051-prediction-market-apis.md), [red team](../../research/lenses/red-team.md), [CEO lens](../../research/lenses/ceo.md)
- Claim it earns or kills: "scored live since <date>" is always allowed; any comparative claim against the market or a plain LLM waits for this analysis ([`gtm/messaging.md`](../../gtm/messaging.md)).

## Hypothesis

On pre-committed binary questions, the engine's blind forecast, which never sees market prices, has a lower mean Brier score than the market price at commit time.

## Primary metric

Mean paired Brier difference per question, engine blind forecast minus market price at commit. Negative favours the engine.

## Secondary metrics

- Engine blind minus the plain-LLM baseline, paired: the number that decides whether the population simulation adds value ([CEO lens](../../research/lenses/ceo.md), [red team](../../research/lenses/red-team.md)).
- The assimilated forecast, which may see market moves, as a separate labelled row against the same baselines ([red team](../../research/lenses/red-team.md)).
- Log-score differences with probabilities clipped to [0.01, 0.99] ([forecast scoring](../../research/science/030-forecast-scoring.md)).
- Persistence and constant 0.5 (Brier 0.25) baselines.
- Every metric split by region and coverage tier.

## Data

Questions come only from the question list committed and hashed in the ledger before any forecast on them, each with a fixed resolution source and a yes or no outcome ([forecast scoring](../../research/science/030-forecast-scoring.md), [events calendar](../../research/data/059-resolvable-events-calendar.md)). The market price is the snapshot stored at commit time. Market prices are read from public endpoints and are not displayed or redistributed until their terms have been read ([prediction market APIs](../../research/data/051-prediction-market-apis.md)). Every forecast is in the hashed daily Merkle root before its outcome exists, so contamination cannot help. Retrospective questions are excluded.

## Baseline

The market price at commit, which LLM forecasters largely copy ([LLM forecasting](../../research/science/021-llm-forecasting.md)). The plain-LLM baseline is a pinned frontier model with search, five to eight samples and a trimmed mean, run on the same questions the same day ([CEO lens](../../research/lenses/ceo.md)).

## Sample size and stopping rule

The analysis runs when 100 pre-committed questions have resolved, the rough floor for a comparative claim in [forecast scoring](../../research/science/030-forecast-scoring.md), which says it is a rule of thumb. Before that, the receipts page shows the running numbers with n and intervals, labelled "no claim below 100". No early stop for a good result. If a question is voided by its resolution source, it stays on the record as voided and is excluded from the scores.

## Analysis plan

95% interval for each paired difference by block bootstrap over commit days (10,000 resamples), since questions committed on the same day are correlated ([forecast scoring](../../research/science/030-forecast-scoring.md)). Every committed question is reported, hits and misses. Salts are revealed at resolution so anyone can recompute every hash.

## Kill criterion

At 100 resolved questions: if the interval for engine minus plain LLM is not entirely below zero, the population simulation is dropped from the pitch as a source of forecast accuracy, and the product is presented as the ledger plus the cheaper forecaster ([red team](../../research/lenses/red-team.md), [CTO lens](../../research/lenses/cto.md)). "Beats the market" is claimed only if the interval for engine minus market is entirely below zero; otherwise the copy stays "scored live since <date>".

## Cost cap

Engine forecasts run inside the nightly budget of $25 with an alarm at $60 ([CEO lens](../../research/lenses/ceo.md)). The plain-LLM baseline draws on the $800 baseline and benchmark budget in the [CFO lens](../../research/lenses/cfo.md). Both stop when the cost ledger cannot be read.

## Command

`make experiment ID=E004`
