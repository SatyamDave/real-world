# World: the daily mirror

## What it does

Every morning the system takes yesterday's simulated population, shows it the news that broke since, corrects it against the polls that came out, and saves today's world. Each agent's beliefs move a little when news reaches it, less if it is stubborn, and drift back toward where it started. Where a real poll exists, the matching group of agents is pulled toward it, by a capped amount that is recorded. Every country carries a coverage grade, and any country whose simulated disagreement is far narrower or wider than real surveys is marked experimental for the day. The result is a dated snapshot that the daily question, forks, the globe and "ask why" all read from.

## Who it is for

Nobody visits "the world" directly. Visitors meet it through the globe and an agent's panel; builders meet it through `world_snapshot_id` on every API result. Internally it is for the founder and engineers who check each morning that the cycle ran, what moved, and whether the spread audit passed.

## How we know it works

- `make daily DATE=<fixture date>` runs all six steps on the bundled fixtures with no API key and writes `var/snapshots/<date>/agents.parquet`; re-running it does no new work (checked by a test that counts `llm_calls` rows).
- Property test: with no signals and no polls, the population mean per topic stays put and per-agent spread does not shrink beyond the stated weekly limit.
- Property test: a nudge never moves a segment by more than the cap, and the nudge is stored.
- Test: no market price appears in any prompt or input of the assimilation and `sim` forecast steps.
- The `learn` step writes an SD ratio per country and topic; a country outside 0.8-1.2 is marked experimental, and the API and globe show it.
- Measured outcome after launch: SD ratio inside 0.8-1.2 for Tier A/B countries on most days ([research/science/018](../research/science/018-failure-modes.md)).

## What it is not

- Not 100,000 minds. The model is called per segment and per news cluster; agents are rows of numbers. We say how many calls ran.
- Not the whole world in the base build: 16 countries from illustrative sample marginals, labelled as such. Real populations come from GLOPOP-S once its licence row is cleared.
- No social graph, neighbour talk, twins, native-language prompts or fine-tuning.
- No market prices as observations. Markets are a baseline to score against, not a signal to copy.
- No ensemble Kalman filter until a hindcast shows capped nudging overfits.

## Where the code lives

- `engine/rw/population.py`, `beliefs.py`, `news.py`, `daily.py`; data in `data/` (`sources.csv`, `countries.csv`, `topics.csv`, `sample/`, `fixtures/`).
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md).
- Research: [SYNTHESIS](../research/SYNTHESIS.md), [science/022](../research/science/022-data-assimilation-abm.md), [science/025](../research/science/025-news-exposure-diffusion.md), [science/028](../research/science/028-large-scale-llm-sims.md), [engineering/064](../research/engineering/064-agent-state-storage.md), [engineering/065](../research/engineering/065-belief-update-operators.md), [data/057](../research/data/057-global-synthetic-population.md), [data/060](../research/data/060-data-licensing-legal.md), [data/099](../research/data/099-country-coverage-tiers.md).
