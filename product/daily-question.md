# Daily question (public record API)

Since [decision 0016](../research/decisions/0016-icp-audiences.md) this is part of the public record, not a product surface, and the web app has no `/call` page: it is not in the top bar or on the home. The engine's daily forecasts, seals, scoring and the answers API below are unchanged; the page described below returns only if a decision restores it.

`/call`: one question a day, the same for everyone, that resolves within 1 to 7 days ("Will the ECB cut rates on Oct 29?"), framed as the visitor against the AI. The page is two slips, side by side at 1024px and up and stacked below with yours first. "Your call": the question, "The AI's call" ("Shown after you call" until then) and when and where it resolves, and the slider. "The AI's call": the stamp "Sealed", the seal grid beside "The AI's call is sealed" and "<first 12 characters of the `sim` forecast's leaf hash> · day record <date>" linking that day's receipts, and "Its number is hidden until you call. The hash above was written <date>, before you could answer."; after the call, the AI's number large with "Sealed <date> · hash <12>". The slider starts unset: it reads "–" and the button, disabled, reads "Move the slider to call it", so no one calls 50% by one tap; after the first move it reads "Call it <n>%". Within a second they see four numbers side by side: their call, the crowd of other visitors, the AI (the simulated world's committed forecast), and the market price. Once questions resolve, the reveal carries their running record against the AI: "You <brier> · AI <brier> on <n> resolved questions · you beat the AI on <k>". When the question resolves, everyone's answer is scored, and the reveal draws you, the AI and the outcome on one 0-100% track ("You <n>% · AI <n>% · Outcome Yes/No") with "Closer: you / the AI, by <pts> pts." or "Closer: tie." A streak counts the days you submitted, not the days you were right. A share line gives a 7-square grid of your week plus a link to the receipt.

## Who it is for

Skeptics and forecasting-minded visitors who want to test the engine against their own call without signing up, and returning players who come back to see how they scored. Each answer also feeds the human panel, the one data set that grows only with time.

## How we know it works

- Contract: `GET /v1/daily` returns today's question (id, text, resolution source, closes at, resolves by) and, once the caller has answered, the reveal. `POST /v1/daily/answers` takes `{question_id, player_id, probability}`; `player_id` is a random id the browser keeps. One answer per player per question; a second answer returns `409` with code `already_answered`, and any answer at or after `closes_at` (a date-only `closes_at` means the start of that UTC day) returns `409` with code `answers_closed` and writes nothing. An answer to a question that is not today's returns `422` with code `wrong_question`.
- The reveal returns `you`, `crowd` (mean and count of other visitors' answers so far, never including yours; the mean is null when you are the first), `sim` and `market`, all as 0-1 numbers, plus the resolved outcome and your Brier once known, and `week`: the seven days ending today, oldest first, each with your answer (or null) and its Brier once resolved, computed from answer rows like the streak. A day with more than one answer shows your answer to today's question, and on earlier days your latest answer. Test: `test_week_shows_today_s_question_when_a_day_has_several_answers`.
- The share grid is a pure function of `week`: 🟩 Brier under 0.10, 🟨 0.10 to 0.25 (at least as good as a constant 50%), 🟥 above 0.25, 🟦 answered and not resolved, ⬜ no answer. The copied text is the grid, the streak and a link to that day's receipts (`/receipts#<date>`), never the answer itself. Test: `share.test.ts` "the week share text is the grid, the streak and the day's receipt, without the answer".
- Today's question is the latest committed day's own question while it is open. Once it closes, it is the open question with the soonest `closes_at` among those that day forecast and that are no day's own question, so the page stays answerable between daily runs and `sim` is still that question's committed forecast. A later day's own question is never shown early: once that day runs, the answer would sit under the wrong date. Tests: `test_the_daily_question_is_its_own_day_question_while_open`, `test_after_its_close_the_daily_question_is_the_next_open_one_the_day_forecast`, `test_the_fallback_is_never_a_later_day_s_own_question`, `test_when_every_question_has_closed_answers_are_refused_and_not_written`.
- When every question the day forecast has closed, today's question stays the day's own, and the page shows "Answers closed <time>. The next question opens after the next daily run." instead of the slider.
- Streak is computed from answer rows, never stored as a counter; a test covers a gap day.
- The `sim` number shown is the committed `sim` forecast for that question and date, the same value as its receipt.
- Before the answer, `GET /v1/daily` returns `sealed`: the `sim` forecast's leaf hash and commit time, never its probability. The reveal's `record` counts the player's resolved answers on questions with a committed `sim` forecast and both mean Briers. Tests: `test_the_ai_call_is_sealed_but_hidden_before_the_answer`, `test_the_record_scores_player_and_ai_on_the_same_questions`.
- Measured after launch: share of new visitors who submit within 60 seconds (target 30%+), and day-7 return of day-0 players ([research/lenses/cpo.md](../research/lenses/cpo.md)).

## What it is not

- No sign-in to answer. The streak and the record against the AI live with the browser's player id; the signed-in [record](track-record.md) shows message tests.
- No leagues, friend streaks, notifications or prizes.
- No questions without a fixed, free resolution source and tie-break rule.
- Player answers are not shown individually and are labelled "self-selected visitors", never "a poll".

## Where the code lives

- `api/rw_api/` (answers table and endpoints), question and `sim` forecast from `engine/rw/forecast.py`, screen in `web/`.
- Decision: [0012](../research/decisions/0012-will-it-land-and-call-it.md). Research: [product/077](../research/product/077-daily-question-mechanics.md), [product/076](../research/product/076-viral-simulations.md), [business/092](../research/business/092-moat-theory.md), [data/059](../research/data/059-resolvable-events-calendar.md).
