# World page: the simulated population

## What it does

`/world` shows the population the forecasts come from, as of the latest world snapshot. It opens on "The simulated population" and one line: "World of <date>: N agents in M segments across 16 countries. Agents are rows of numbers. The model is called once per segment, never per agent." A table lists every country, sorted by coverage tier and then name, with its tier, region, agent count, segment count and the five rubric parts (population, attitudes, markets, news, ground truth), and an "Experimental" stamp on a country whose spread audit failed that day. Selecting a country opens its panel: the coverage score out of 100 and the tier floor it clears, a bar per segment with its agent count, and per topic the published share against the simulated share with its p10 to p90 range and median. Each topic carries a stamp, "In band", "Out of band" or "Not audited", and the sentence "SD ratio <r> = simulated sd <a> / survey sd <b>, band 0.8 to 1.2." (band from `SPREAD_BAND` in `engine/rw/settings.py`) with its n, or "Spread audit has not run for this day." before the `learn` step has run. "How this is computed" gives the sampling formula, the shown quantiles, the spread audit and the tier floors, with the parameters as used and the licence row of the data source; for the fixture source it adds "These marginals are illustrative samples written for this repository, not survey data." "Get this via API" shows the call and downloads the response as JSON and the per-topic rows as CSV. The page ends with "See today's cycle" and the simulation disclaimer with the coverage tiers.

States, written out:

- Loading: "Loading the population".
- No snapshot (the API returns 404): "No world snapshot yet. The first daily cycle creates one."
- Error: "Could not load the population" with a retry.

## Who it is for

A visitor who has answered the daily question and asks "who is this world?", and a builder checking which countries a `world_snapshot_id` covers well before trusting a fork there.

## How we know it works

- `GET /v1/world/population` returns the latest snapshot's population; its schema is the `Population` model in [api/openapi.json](../api/openapi.json). `api/tests/test_world.py` checks that every count adds up (agents per segment, per country and in total), that each topic's published share equals `data/sample/attitudes.csv`, that p10 <= p50 <= p90, that `in_band` matches `SPREAD_BAND`, that audit fields are null before `learn` has run, and that no snapshot is a 404 in the one error shape.
- Both SDKs expose it as `population()`; `scripts/check_sdk_parity.py` checks the pair.
- `web/src/pages/world.test.tsx` checks the table lists every country, the best-covered country opens first and selecting another switches the panel, the disclaimer and the API call show, an unaudited topic says so, and the no-snapshot state.

## What it is not

- Not a map: the globe on `/` shades countries; this page is the table behind it.
- Not real survey data in the base build: the marginals are the illustrative sample, and the page says so ([world](world.md)).
- No per-agent list. One agent at a time opens from the globe's agent panel.

## Where the code lives

- `api/rw_api/routes_world.py`, `web/src/pages/world.tsx`; the engine side is `engine/rw/population.py` and the `learn` step's `audits` and `country_status` rows ([world](world.md)).
- Decision: [0006-engine-visible-surfaces](../research/decisions/0006-engine-visible-surfaces.md).
- Research: [data/099](../research/data/099-country-coverage-tiers.md), [science/018](../research/science/018-failure-modes.md), [data/057](../research/data/057-global-synthetic-population.md).
