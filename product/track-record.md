# Your tests (`/record`)

## What it does

`/record` shows a signed-in person their sealed calls and how they scored.

**Message tests.** A strip with three Brier scores in mono, each with its n: the engine, the plain baseline and your gut (decision [0016](../research/decisions/0016-icp-audiences.md)); when the engine's Brier is not below the baseline's, "The engine does not beat the plain baseline on your marked tests."; then "<n> marked tests · hits <k> of <n>" (hits count tests where the engine's side of 50% matched the outcome) and "Brier: 0 is perfect, 0.25 is a coin flip." Then "Waiting to be marked": each sealed test without an outcome as a row with its small seal grid, the post quoted on one line, "Sealed <date> · <hash prefix> · would act <n>%", their gut, and "Landed" and "Flopped", with an optional real metric (name, value, unit) and an optional note. Then "Marked": the same rows with the outcome stamp ("Landed" green, "Flopped" clay) and both Briers.

**Call it.** Their daily calls against the AI on resolved questions: "You <brier> · AI <brier> on <n> questions", and "You beat the AI on <k>".

Each seal can be checked: "Check seal" recomputes the SHA-256 of the stored test in the browser and shows "Seal matches" or "Seal does not match".

States, written out:

- Loading: "Loading your record". Error: "Could not load your record. The server did not respond." with "Try again".
- No tests: "No sealed tests yet. Test a message to start." with a link to `/`.
- No marked tests: "Mark a test Landed or Flopped once you know how it did."
- Signed out: the page with nothing in it: "Every message test you seal waits here until you mark how it did. Then the engine and your gut are scored on the same messages.", a slip "The engine vs your gut" with "The engine" and "Your gut" each at "– Brier" and "0 marked tests", an empty seal grid and "Sign in to keep your tests", then "Brier: 0 is perfect, 0.25 is a coin flip." No other number.

## Who it is for

A person who has tested posts or called questions and wants to know whether the engine, or their gut, is worth listening to.

## How we know it works

- `GET /v1/me/tests` returns the person's sealed tests and the summary; `POST /v1/me/tests/{id}/outcome` takes `{outcome: "landed" | "flopped", metric?: {name, value, unit}, note?}` once, stored on the test's row; a second mark returns `409 already_marked`, and the database refuses any later change to the mark. `GET /v1/daily` returns the Call it record in its reveal. Fields in `api/openapi.json`.
- Briers come from `engine/rw/score.py`, the function the receipts use. Tests in `api/tests/test_tests.py`: `test_a_mark_is_stored_once_with_its_metric_and_note`, `test_the_database_refuses_any_change_to_a_mark`, `test_the_record_scores_engine_baseline_and_gut_on_marked_tests_only`.
- Measured after launch: day-7 return of people with a marked test ([0012](../research/decisions/0012-will-it-land-and-call-it.md)).

## What it is not

- No leaderboard, public profile or badges.
- Not a claim about the engine in general: that is the public record on `/scores` and `/receipts`.

## Where the code lives

- `web/src/pages/record.tsx`; `api/rw_api/routes_tests.py`; the Call it record in `api/rw_api/app.py`.
- Decision: [0012](../research/decisions/0012-will-it-land-and-call-it.md). Research: [product/108](../research/product/108-consumer-wedge.md), [science/030](../research/science/030-forecast-scoring.md).
