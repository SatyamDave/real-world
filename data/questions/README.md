# Question lists

Real questions the engine forecasts and scores, one file per horizon. Fixtures stay in `data/fixtures/questions.json` and remain the default; `python -m rw.daily --date D --questions live` reads the lists here.

## Lifecycle

1. **Proposed.** A list is drafted with `"status": "proposed"` and merged for review. `rw.daily --questions live` refuses to load any list that is not `"approved"`, so a proposed list cannot be forecast.
2. **Signed off.** The founder reads every question, drops or edits any, decides the items it depends on (see `needs_decision`), and sets `"status": "approved"` in one PR. That is the only edit an approved list ever gets.
3. **Frozen.** In the same PR, before the first forecast on it, the list's `sha256sum` is committed (decision [0002](../../research/decisions/0002-benchmark-and-receipts.md), pre-registration step 2). From then on the file is never edited: the daily cycle commits its sha256 as a `question_set` leaf on the first day it forecasts it, and any byte change would give a different hash. Changes go in a new list file.

Nobody but the founder approves or hashes a list. The draft below has not been hashed.

## `2026-10-proposed.json`

29 binary questions from 2026-10-14 to 2026-11-30 across the 16 base countries, drawn from the calendar in [research/data/059](../../research/data/059-resolvable-events-calendar.md) under the rules in [decision 0002](../../research/decisions/0002-benchmark-and-receipts.md), [science/097](../../research/science/097-benchmark-design.md) and [`data/protocol.json`](../protocol.json): binary, an official resolution source, resolves within 30 days of opening, and closes before the event.

| Field | Meaning |
| --- | --- |
| `id`, `text`, `topic`, `countries` | As in the fixtures. `topic` is one of the eight in [`data/topics.csv`](../topics.csv): the belief whose state feeds the simulation's answer. |
| `event_date` | The day the source publishes the answer. |
| `opens`, `closes` | First and last forecast day. `opens` is 2026-10-14 or 30 days before `resolves_by`, whichever is later; `closes` is before `event_date` for every question. |
| `resolves_by` | If the source has not published by this date, the question is void (listed, not dropped). |
| `resolution_source` | An official page that publishes the answer. |
| `tie_break` | How ties, revisions, moved meetings and late results are handled. |
| `market_source` | Empty. Market prices stay out until their licence is read ([`data/sources.csv`](../sources.csv), decisions-needed item 4). |
| `checked` | What was opened on 2026-10-12 to confirm the date and source, and what could not be opened. |
| `date_confirmed` | `false` for the 8 questions whose date could not be confirmed on the official site (pages blocked or not rendered, or the date is an inference). Re-verify or drop these before sign-off. |
| `needs_decision` | Set on the three election questions (Brazil runoff, Israel Knesset, the Michigan US Senate race). They are forecastable only if the founder allows election questions ([decisions-needed](../../company/decisions-needed.md) item 2). Each closes the day before polls open. |

Election wording is neutral: one party or list is named only because a binary question needs one side, the text says nothing about candidates, and the question asks about the official count, not a media call ([gtm/messaging.md](../../gtm/messaging.md), [engineering/074](../../research/engineering/074-abuse-and-safety.md)).

Thresholds come from the latest published value where one was readable (for example UK CPI 3.1 percent for August); otherwise a question compares the new figure with the previous one, with an equal value resolving no.
