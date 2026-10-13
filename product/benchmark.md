# Benchmark

## What it does

Every day, every question is forecast by three forecasters: our simulated population (which never sees market prices), a plain LLM reading the same news, and the market price at commit time. When questions resolve, each forecast gets a Brier score and a log score. The benchmark reports one thing per comparison: on average, how much better or worse the simulation scored than that baseline, over how many questions, with an interval. It also breaks this down by coverage tier and region, so a good average cannot hide bad results outside rich countries. Until 100 questions have resolved, it says the sample is too small to claim anything.

## Who it is for

Us first: it answers whether the simulation adds anything over one model call. Then the forecasting community, reviewers and YC, who will read the numbers and the protocol, not our copy.

## How we know it works

- Protocol: `data/protocol.json`, hashed into every day record; rules in [decision 0002](../research/decisions/0002-benchmark-and-receipts.md). Contract: `GET /v1/scores` returns, per baseline, `n`, mean Brier difference, the 95% interval, the same per tier and region, and `claim` (`insufficient_n` below 100). `GET /v1/scoreboard` returns the protocol and its hash, resolved and open question counts, mean Brier and log score per forecaster with a day-block bootstrap interval from 10 resolved questions, the same skill as `GET /v1/scores`, reliability bins (10 equal bins of committed probability, empty ones omitted), every scored question-day newest first and the five worst `sim` forecasts; `api/tests/test_scores.py` checks each part against the rows.
- Page: `/scores` in `web/` shows the scoreboard per [decision 0006](../research/decisions/0006-engine-visible-surfaces.md): the table and bar chart per forecaster, skill against each baseline by tier and region, one reliability plot per forecaster, the biggest misses, every resolved question, how each number is computed, and the API call that returns it. Below 100 resolved questions it says no claim can be made and every number is raw.
- Unit tests: Brier and log score on known values; the log-score clip; the paired difference sign (negative means the simulation was better); the bootstrap resamples whole days and is repeatable with its seed.
- Test: no market price string reaches any `sim` prompt (prompts are recorded in `llm_calls`).
- On fixtures, `make daily` over all fixture days produces scores for every resolved fixture question.
- The three numbers we watch: simulation minus plain-LLM Brier with n and interval; resolved pre-committed questions; SD ratio per country.

## What it is not

- No backtests on the page: models have seen the past. Retrospective runs are labelled and kept out of the ledger.
- No numeric questions, CRPS or difficulty adjustment in the base build. The reliability bins on `/scores` are shown raw and change no forecast.
- No recalibration of forecasts except as [decision 0008](../research/decisions/0008-self-improving-loop.md) allows, and only after the [E008](../experiments/E008/PREREG.md) gate: the `sim` row may carry a promoted recalibration map, the raw `sim` probability stays recorded, and each receipt names the engine config version that produced it. `plain_llm` and `market` are never recalibrated.
- No persistence or demographic-lookup baselines yet; they need per-question status quo and attitude mapping.
- No pooled "accuracy" number.

## Where the code lives

- `engine/rw/score.py`, `engine/rw/forecast.py` (baselines), `data/protocol.json`; the endpoint in `api/rw_api/`; display on the receipts page and `web/src/pages/scores.tsx`.
- Research: [science/030](../research/science/030-forecast-scoring.md), [science/097](../research/science/097-benchmark-design.md), [science/098](../research/science/098-darpa-socialsim.md), [science/021](../research/science/021-llm-forecasting.md), [science/016](../research/science/016-silicon-samples.md), [market/005](../research/market/005-prediction-markets-landscape.md).
