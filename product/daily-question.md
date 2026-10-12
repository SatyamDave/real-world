# Daily question

## What it does

One question a day, the same for everyone, that resolves within 1 to 7 days ("Will the ECB cut rates on Oct 29?"). The visitor drags a slider from 0 to 100 and submits. Within a second they see four numbers side by side: their answer, the crowd of other visitors, the simulated world, and the market price. When the question resolves, everyone's answer is scored. A streak counts the days you submitted, not the days you were right. A share line gives a 7-square grid of your week plus a link to the receipt.

## Who it is for

First-time visitors from Show HN and X, who need something to do in under a minute without signing up, and returning players who come back to see how they scored. Each answer also feeds the human panel, the one data set that grows only with time.

## How we know it works

- Contract: `GET /v1/daily` returns today's question (id, text, resolution source, closes at, resolves by) and, once the caller has answered, the reveal. `POST /v1/daily/answers` takes `{question_id, player_id, probability}`; `player_id` is a random id the browser keeps. One answer per player per question; a second answer returns `409`, and so does any answer at or after `closes_at` (a date-only `closes_at` means the start of that UTC day), which writes nothing.
- The reveal returns `you`, `crowd` (mean and count of other visitors' answers so far, never including yours; the mean is null when you are the first), `sim` and `market`, all as 0-1 numbers, plus the resolved outcome and your Brier once known, and `week`: the seven days ending today, oldest first, each with your answer (or null) and its Brier once resolved, computed from answer rows like the streak.
- The share grid is a pure function of `week`: 🟩 Brier under 0.10, 🟨 0.10 to 0.25 (at least as good as a constant 50%), 🟥 above 0.25, 🟦 answered and not resolved, ⬜ no answer. The copied text is the grid, the streak and a link to that day's receipts (`/receipts#<date>`), never the answer itself. Test: `share.test.ts` "the week share text is the grid, the streak and the day's receipt, without the answer".
- Today's question is the latest committed day's own question while it is open. Once it closes, it is the open question that day forecast with the soonest `closes_at`, so the page stays answerable between daily runs and `sim` is still that question's committed forecast. Tests: `test_the_daily_question_is_its_own_day_question_while_open`, `test_after_its_close_the_daily_question_is_the_next_open_one_the_day_forecast`, `test_when_every_question_has_closed_answers_are_refused_and_not_written`.
- When every question the day forecast has closed, today's question stays the day's own, and the page shows "Answers closed <time>. The next question opens after the next daily run." instead of the slider.
- Streak is computed from answer rows, never stored as a counter; a test covers a gap day.
- The `sim` number shown is the committed `sim` forecast for that question and date, the same value as its receipt.
- Measured after launch: share of new visitors who submit within 60 seconds (target 30%+), and day-7 return of day-0 players ([research/lenses/cpo.md](../research/lenses/cpo.md)).

## What it is not

- No sign-in in the base build; the streak lives with the browser's player id. Sign-in to keep a streak comes with accounts.
- No leagues, friend streaks, notifications or prizes.
- No questions without a fixed, free resolution source and tie-break rule.
- Player answers are not shown individually and are labelled "self-selected visitors", never "a poll".

## Where the code lives

- `api/rw_api/` (answers table and endpoints), question and `sim` forecast from `engine/rw/forecast.py`, screen in `web/`.
- Research: [product/077](../research/product/077-daily-question-mechanics.md), [product/076](../research/product/076-viral-simulations.md), [business/092](../research/business/092-moat-theory.md), [data/059](../research/data/059-resolvable-events-calendar.md).
