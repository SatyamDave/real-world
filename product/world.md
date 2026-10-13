# World: the daily mirror

## What it does

Every morning the system takes yesterday's simulated population, shows it the news that broke since, corrects it against the polls that came out, and saves today's world. Each agent's beliefs move a little when news reaches it, less if it is stubborn, and drift back toward where it started. Where a real poll exists, the matching group of agents moves toward it by an amount that grows with how unsure we are and shrinks with how noisy the poll is, and the move is recorded; the point agents drift back to moves with it, so tomorrow's pull does not undo it. Every country carries a coverage grade, and any country whose simulated disagreement is far narrower or wider than real surveys is marked experimental for the day. The result is a dated snapshot that the daily question, forks, the globe and "ask why" all read from.

## Who it is for

Nobody visits "the world" directly. Visitors meet it through the globe and an agent's panel; builders meet it through `world_snapshot_id` on every API result. Internally it is for the founder and engineers who check each morning that the cycle ran, what moved, and whether the spread audit passed.

## How we know it works

- `make daily DATE=<fixture date>` runs all eight steps on the bundled fixtures with no API key and writes `var/snapshots/<date>/agents.parquet`; re-running it does no new work (checked by a test that counts `llm_calls` rows).
- `python -m rw.daily --date <past UTC day> --news live` runs the same eight steps on that day's real news from GDELT instead of the fixtures. It reads all 96 GKG files of the day, keeps English-feed articles whose locations name one of the 16 countries and whose themes include one of nine GKG themes, and saves them in the fixture shape at `var/news/<date>.csv`; a rerun reads that file and downloads nothing. A missing file, a network error or a day with no kept articles stops the run at `ingest`, so a day without news never forecasts (checked by `engine/tests/test_news_live.py`).
- `publish` writes the day's receipt to `var/receipts/<date>.json`, and `anchor` then timestamps the day's record hash ([receipts](receipts.md)). A fixture day, one whose committed entries name a fixture question (an id starting `fx-`), is illustrative: whatever flags the run used, it is never sent to a public timestamp server or the public mirror, so fixture runs, `make e2e` and CI make no network call (checked by `engine/tests/test_daily.py` and `engine/tests/test_mirror.py`).
- `python -m rw.daily --date <day> --questions live` reads the real question lists in `data/questions/` instead of the fixtures, and refuses to run, before any step, unless every list has `"status": "approved"` (checked by `engine/tests/test_questions.py`). Fixtures stay the default.
- `GET /v1/cycle` (latest day) and `GET /v1/cycle/{date}` show one daily cycle as a run log for that morning check: each step's status, times and `detail`, its model calls, tokens and dollars by purpose, the news per topic with its top three items, each country and topic's share before, after the news, observed and after the poll nudge, the spread audit, experimental countries, the day record with its anchor status, and the settings used. Every value is read from what the cycle stored; a step that has not run reads `not_run` (checked by `api/tests/test_cycle.py`).
- `GET /v1/cycle/{date}/replay` recomputes the day's committed `sim` and `plain_llm` forecasts from the model answers stored in `llm_calls`, with no model call, and diffs each against its ledger entry. A forecast whose answers are not all stored reads `replayed: null` and is listed in `missing`, never as a match. On a fixture day the diff is zero (checked by `engine/tests/test_replay.py`, which also shows a changed stored answer appears as a diff).
- Property test: with no signals and no polls, the population mean per topic stays put and per-agent spread does not shrink beyond the stated weekly limit.
- Unit tests: the update matches the textbook scalar Kalman step, moves a whole group and its anchor offset by the same amount, does nothing but grow the uncertainty with no poll, and absorbs a shock in one poll; every move is stored.
- [E006](../experiments/E006/results/2026-10-12-none/RESULTS.md): on the synthetic world, day-30 segment error is below persistence's (-0.0182 logit, 95% interval -0.0190 to -0.0174, n = 50 seeds). Synthetic only; no claim about real polls.
- Test: no market price appears in any prompt or input of the assimilation and `sim` forecast steps.
- The `learn` step writes an SD ratio per country and topic; a country outside 0.8-1.2 is marked experimental, and the API and globe show it.
- The `improve` step, last, follows [decision 0008](../research/decisions/0008-self-improving-loop.md): it fits a recalibration map on older resolved questions, tests it on the newest ones resolved since the engine config version in force took effect, and promotes it from the next day only past the minimum n, the Brier margin and a day-block bootstrap interval wholly below zero. Otherwise, or when scoring did not finish or evaluation fails, the version in force stays and the step's `stage_runs` row says why. Fixture days never reach the minimum n (checked by `engine/tests/test_improve.py`).
- Measured outcome after launch: SD ratio inside 0.8-1.2 for Tier A/B countries on most days ([research/science/018](../research/science/018-failure-modes.md)).

## What it is not

- Not 100,000 minds. The model is called per segment and per news cluster; agents are rows of numbers. We say how many calls ran.
- Not a product surface: the world is the public record's engine, and message tests simulate the founder's ideal customer instead ([0016](../research/decisions/0016-icp-audiences.md)).
- Not the whole world in the base build: 16 countries from illustrative sample marginals, labelled as such. Real populations come from GLOPOP-S once its licence row is cleared.
- No social graph, neighbour talk, twins, native-language prompts or fine-tuning.
- Not the world's news. Live news is GDELT's English GKG feed, which leans toward outlets that publish online in English, and its theme and location tags are machine-assigned and noisy ([research/data/050](../research/data/050-gdelt.md)). Live days carry no polls yet.
- No market prices as observations. Markets are a baseline to score against, not a signal to copy.
- No ensemble Kalman filter. The update is a scalar filter per country and topic ([decision 0005](../research/decisions/0005-assimilation-v2.md)); an ensemble filter waits until one observation covers several groups.

## Where the code lives

- `engine/rw/population.py`, `beliefs.py`, `news.py`, `daily.py`, `replay.py`; `api/rw_api/routes_cycle.py`; data in `data/` (`sources.csv`, `countries.csv`, `topics.csv`, `sample/`, `fixtures/`).
- Decisions: [0001-architecture](../research/decisions/0001-architecture.md) (GDELT GKG is the news source the fixture mimics), [0005-assimilation-v2](../research/decisions/0005-assimilation-v2.md).
- Research: [SYNTHESIS](../research/SYNTHESIS.md), [science/022](../research/science/022-data-assimilation-abm.md), [science/025](../research/science/025-news-exposure-diffusion.md), [science/028](../research/science/028-large-scale-llm-sims.md), [engineering/064](../research/engineering/064-agent-state-storage.md), [engineering/072](../research/engineering/072-replay-and-caching.md), [engineering/065](../research/engineering/065-belief-update-operators.md), [data/050](../research/data/050-gdelt.md), [open-source/042](../research/open-source/042-news-ingestion.md), [data/057](../research/data/057-global-synthetic-population.md), [data/060](../research/data/060-data-licensing-legal.md), [data/099](../research/data/099-country-coverage-tiers.md).
