# Your tests (`/record`)

## What it does

`/record` shows a signed-in founder their sealed message tests and how they scored.

**Message tests.** A strip with three Brier scores in mono, each with its n: the engine, the plain baseline and your gut (decision [0016](../research/decisions/0016-icp-audiences.md)); when the engine's Brier is not below the baseline's, "The engine does not beat the plain baseline on your marked tests."; then "<n> marked tests · hits <k> of <n>" (hits count tests where the engine's side of 50% matched the outcome) and "Brier: 0 is perfect, 0.25 is a coin flip." Then "Waiting to be marked": each sealed test without an outcome as a row with its small seal grid, the message quoted on one line, "Sealed <date> · <hash prefix> · would act <n>%", their gut, and "Landed" and "Flopped", with an optional real metric (name, value, unit) and an optional note. Then "Marked": the same rows with the outcome stamp ("Landed" green, "Flopped" clay) and both Briers.

Each seal can be checked: "Check seal" recomputes the SHA-256 of the stored test in the browser and shows "Seal matches" or "Seal does not match".

States, written out:

- Loading: "Loading your record". Error: "Could not load your record. The server did not respond." with "Try again".
- No tests: "No sealed tests yet. Test a message to start." with a link to `/`.
- No marked tests: "Mark a test Landed or Flopped once you know how it did."
- Signed out: the page with nothing in it: "Every message test you seal waits here until you mark how it did. Then the engine and your gut are scored on the same messages.", a slip "The engine vs your gut" with "The engine", "The baseline" and "Your gut" each at "– Brier" and "0 marked tests", an empty seal grid and "Sign in to keep your tests", then "Brier: 0 is perfect, 0.25 is a coin flip." No other number.

## Who it is for

A consumer founder who has tested messages and wants to know whether the engine, the plain baseline or their own gut is worth listening to.

## How we know it works

- `GET /v1/me/tests` returns the person's sealed tests and the summary; `POST /v1/me/tests/{id}/outcome` takes `{outcome: "landed" | "flopped", metric?: {name, value, unit}, note?}` once, stored on the test's row; a second mark returns `409 already_marked`, and the database refuses any later change to the mark. Fields in `api/openapi.json`.
- Briers come from `engine/rw/score.py`, the function the receipts use. Tests in `api/tests/test_tests.py`: `test_a_mark_is_stored_once_with_its_metric_and_note`, `test_the_database_refuses_any_change_to_a_mark`, `test_the_record_scores_engine_baseline_and_gut_on_marked_tests_only`.
- Measured after launch: the share of founders who mark a sealed test within 14 days, and the engine's Brier against the baseline at 100 marked tests ([E010](../experiments/E010/PREREG.md)).

## What it is not

- No leaderboard, public profile or badges.
- Not a claim about the engine in general: that is the public record on `/scores` and `/receipts`.

## Where the code lives

- `web/src/pages/record.tsx`; `api/rw_api/routes_tests.py`.
- Decision: [0012](../research/decisions/0012-will-it-land-and-call-it.md). Research: [product/108](../research/product/108-consumer-wedge.md), [science/030](../research/science/030-forecast-scoring.md).
