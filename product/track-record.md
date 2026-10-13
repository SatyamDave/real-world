# Your record

## What it does

`/record` shows a signed-in person their sealed calls and how they scored.

**Post tests.** Every sealed post test, newest first: the post, the audience, their gut, the landing chance, "Sealed <time> · <hash prefix>", and two buttons, "Landed" and "Flopped", until they mark it. A marked test shows its outcome and both Briers (engine and gut). The top line reads "Engine <brier> · your gut <brier> on <n> marked tests (lower is better)", and "Hits <k> of <n>" counts tests where the engine's side of 50% matched the outcome.

**Call it.** Their daily calls against the AI on resolved questions: "You <brier> · AI <brier> on <n> questions", and "You beat the AI on <k>".

Each seal can be checked: "Check seal" recomputes the SHA-256 of the stored test in the browser and shows "Seal matches" or "Seal does not match".

States, written out:

- Loading: "Loading your record". Error: "Could not load your record. The server did not respond." with "Try again".
- No tests: "No sealed tests yet. Test a post to start your record." with a link to `/`.
- No marked tests: "Mark a test Landed or Flopped once you know how it did."
- Signed out: "Sign in to keep your record." and "Sign in".

## Who it is for

A person who has tested posts or called questions and wants to know whether the engine, or their gut, is worth listening to.

## How we know it works

- `GET /v1/me/tests` returns the person's sealed tests and the summary; `POST /v1/me/tests/{id}/outcome` takes `{outcome: "landed" | "flopped"}` once, and a second mark returns `409 already_marked`. `GET /v1/daily` returns the Call it record in its reveal. Fields in `api/openapi.json`.
- Briers come from `engine/rw/score.py`, the function the receipts use. Tests in `api/tests/test_tests.py`: `test_an_outcome_is_marked_once`, `test_the_record_scores_engine_and_gut_on_marked_tests_only`.
- Measured after launch: day-7 return of people with a marked test ([0012](../research/decisions/0012-will-it-land-and-call-it.md)).

## What it is not

- No leaderboard, public profile or badges.
- Not a claim about the engine in general: that is the public record on `/scores` and `/receipts`.

## Where the code lives

- `web/src/pages/record.tsx`; `api/rw_api/routes_tests.py`; the Call it record in `api/rw_api/app.py`.
- Decision: [0012](../research/decisions/0012-will-it-land-and-call-it.md). Research: [product/108](../research/product/108-consumer-wedge.md), [science/030](../research/science/030-forecast-scoring.md).
