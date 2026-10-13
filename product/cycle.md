# Cycle page: the daily run log

## What it does

`/cycle` shows the latest daily cycle as a run log, and `/cycle/<date>` any day that ran; a row of date links under the title switches day. It opens on "The daily cycle" and one line, "Cycle of <date>". Below it, each section reads one part of `GET /v1/cycle/{date}`:

- Run log: a row per step with its status stamp ("Ran", "Failed", "Running", "Not run"), start time in UTC, seconds, model calls, tokens in and out, cost and detail, a bar chart of seconds per step, and the model, steps that ran and spend against the nightly budget. A fake model says no money was spent.
- News in: source, articles, clusters and countries, then per topic the signal count, mean push and the three strongest items with their coverage tier.
- What moved: how many country-topic shares met a poll, with every country and topic before, after the news, observed, nudge applied and after behind a disclosure.
- Spread audit: how many shares are inside the band, any country that is experimental, and every share outside the band.
- Day record: receipts, root, record hash and anchor status, linking to `/receipts`.
- Replay: the day's forecasts recomputed from stored model answers with no model call, each with committed value, replayed value, difference and a "Matches", "Differs" or "Not replayable" stamp (`GET /v1/cycle/{date}/replay`).
- "How this is computed" with the settings the cycle ran with, "Get this via API" and the simulation disclaimer.

States, written out:

- Loading: "Loading the cycle".
- No cycle (404): "No cycle has run yet. The first daily cycle creates one."; for a date, "No cycle ran on <date>."
- Error: "Could not load the cycle" with a retry.
- A section with nothing to show says so in one sentence: "The ingest step has not run for this day.", "No world snapshot for this day yet.", "Spread audit has not run for this day.", "No receipts are hashed for this day yet.", "No replay for this day. It needs hashed receipts and a world snapshot."

## Who it is for

The founder or engineer checking each morning that the cycle ran and what moved, and the skeptic who wants to see that a forecast can be recomputed from what was stored.

## How we know it works

- `web/src/pages/cycle.test.tsx`: every step is listed with its status, news, audit, record and replay render, a step that did not run and a forecast that cannot be replayed read as such, each empty section says what is missing, the no-cycle and no-date states, loading, and error with retry.
- `api/tests/test_cycle.py` and `engine/tests/test_replay.py` check the data ([world](world.md)).
- `web/src/App.test.tsx` checks every header and footer link opens a page.

## What it is not

- Not a live view: it reads what the cycle stored, after the fact.
- No control: nothing here starts, reruns or edits a cycle.
- No number computed for display only.

## Where the code lives

- `web/src/pages/cycle.tsx`; the API is `api/rw_api/routes_cycle.py`; both SDKs expose `cycle()` and `cycle_replay()`.
- Decision: [0006-engine-visible-surfaces](../research/decisions/0006-engine-visible-surfaces.md). Contract: [world](world.md).
