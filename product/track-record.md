# Track record

## What it does

`/track-record` shows a signed-in person how their daily-question answers scored against the simulation on the same questions. The top line reads "Your Brier <yours> · simulation <sim> on the same <n> questions" (lower is better, as the line under it says), then a chart of both running means over time (`Chart.tsx` trajectory, with its data table), then every question they answered: the question, their answer, the simulation's committed forecast, the market at commit where shown, the outcome and their Brier, newest first; unresolved ones read "Resolves <date>". With 10 or more resolved answers, the difference gets a 95% interval from the day-block bootstrap the receipts page uses. The streak from [daily question](daily-question.md) shows here too, counted across every browser linked to the account.

When a person signs in, the browser's `player_id` is linked to their account, so answers given before signing in, and on any other signed-in browser, count. Answering stays open to everyone.

States, written out:

- Loading: "Loading your track record". Error: `LoadError` "Could not load your track record. The server did not respond." with "Try again".
- No answers: "No answers yet. Answer today's question to start your track record." with a link to today's question.
- Answers but none resolved: "None of your answers has resolved yet. The first resolves <date>."
- Fewer than 10 resolved: the numbers with "n = <n>; no interval below 10 resolved answers."
- Signed out: "Sign in to keep your track record across devices." and "Sign in".

## Who it is for

The returning daily player who wants the slow reward: a score that grows with time and that they can compare with the simulation's.

## How we know it works

- `POST /v1/me/players` links `{player_id}` to the signed-in person; a `player_id` already linked to another person returns `409 player_linked` and changes nothing. `GET /v1/me/track-record` returns the answers, Briers, the simulation's Briers on the same questions, n, the running means and, from n = 10, the interval. Both tag `account`; fields in `api/openapi.json`.
- Briers come from the same rows and the same function as the reveal in [daily question](daily-question.md) (`engine/rw/score.py`), and the interval from its `block_bootstrap` with `data/protocol.json`'s settings, so the numbers match the question page and receipts. Tests in `api/tests/test_track_record.py`: `test_the_track_record_brier_equals_the_reveal_brier`, `test_the_simulation_is_scored_only_on_questions_the_person_answered`, `test_no_interval_below_ten_resolved_answers`, `test_a_player_id_links_to_one_person_only`.
- The streak is computed from answer rows across linked player ids, never stored. Test: `test_the_streak_counts_days_across_linked_browsers`.
- Component tests for every state above.
- Measured after launch: day-7 return of signed-in daily players against signed-out ones ([CPO lens](../research/lenses/cpo.md)).

## What it is not

- No leaderboard, ranking among people, badges or public profile.
- Not a claim about the simulation's skill: that is the receipts and scores pages, with their own n. The page says "Your record against the simulation on the questions you answered."
- No scoring of forks; they have no real outcome.

## Where the code lives

- `web/src/pages/track-record.tsx`; `api/rw_api/routes_record.py` over `daily_answers` and the score tables.
- Decision: [0011](../research/decisions/0011-consumer-product-and-api.md). Research: [product/077](../research/product/077-daily-question-mechanics.md), [science/030](../research/science/030-forecast-scoring.md).
