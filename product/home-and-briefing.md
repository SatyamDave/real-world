# Home and briefing

## What it does

For a signed-in person, `/` is their home. It opens on the briefing: "Overnight, <date>" and how simulated opinion moved in the last daily cycle on the countries and topics they chose. Each row reads like "Kenya · Inflation worry 61% (+2 pts)" with the country's `TierBadge`, a clay "Experimental" stamp when the spread audit marked that country, and the top news item behind the move (title and source host), linking the day's `/cycle/{date}` for the full run. Under the rows: "Questions on your topics", the open questions whose topic or countries match the profile first, each with the simulation's forecast and its p10-p90 band, and today's question with its slider when it is open and unanswered. Then "Fork today's world": the fork input with the placeholder "What if …" and three suggested events, then the latest three forks from their history ([forks](forks.md)). Then their track record summary ([track record](track-record.md)), and for "Building on the API", the developer card (keys, spend today; [developer](developer.md)). Every section links the proof behind it: the cycle, the receipts, the question page. The disclosure and tiers appear as on every result view.

The briefing shows at most eight rows: the chosen country and topic pairs with the largest absolute change, largest first. It covers only what the cycle stored; it never runs the model.

Section order by the profile's use ([onboarding](onboarding.md)):

| Use | Order |
| --- | --- |
| Markets and investing | Briefing, questions, forks, track record |
| Policy and politics | Briefing, forks, questions, track record |
| Journalism and research | Briefing, forks, questions, then links to receipts and research, track record |
| Building on the API | Developer card, briefing, forks, questions, track record |
| Just curious, or skipped | Today's question, briefing, forks, track record |

Suggested forks are the prefilled events from `GET /v1/world`, ranked by how many of the person's topics and countries each event's signal touches, ties in the API's order. No suggestion is generated for the person.

States, written out:

- Loading: "Loading your briefing", "Loading questions", "Loading your forks".
- No countries or topics chosen: the briefing shows the eight largest moves across all simulated countries and topics, under the line "All countries and topics. Choose yours in Settings."
- Only one committed day: "No overnight change yet. The briefing starts after the second daily cycle."
- The last cycle is not today's: the heading reads "Last cycle, <date>" instead of "Overnight, <date>".
- No row moved: "No simulated change on your countries and topics in the cycle of <date>." (a change counts when it rounds to at least 1 pt).
- No open question on their topics: "No open question on your topics. All open questions:" and the full list.
- Error: `LoadError` per section, for example "Could not load your briefing. The server did not respond.", with "Try again"; other sections still render.
- Signed out: `/` is today's page as specified in [web-app](web-app.md); there is no signed-out briefing.

## Who it is for

The returning visitor who wants to see, in a minute, what moved in their countries and what to forecast today, and the analyst who starts the day with a fork.

## How we know it works

- `GET /v1/me/briefing` (tag `account`) returns, for the latest committed day and the one before it, the chosen pairs with share before and after, change in points, tier, the experimental flag, the day's top news item per topic, and the ranked open questions with their committed `sim` forecast and band. Every value is read from what the cycle and the ledger stored, the same numbers as `GET /v1/cycle/{date}` and `GET /v1/world`. Fields in `api/openapi.json`. Tests in `api/tests/test_briefing.py`: `test_the_briefing_shares_equal_the_cycle_shares_for_that_day`, `test_the_briefing_ranks_by_absolute_change_and_caps_at_eight_rows`, `test_with_one_committed_day_the_briefing_is_empty`, `test_the_briefing_makes_no_model_call` (counts `llm_calls` rows).
- The daily snapshot is a single run, not an ensemble, so a briefing row has no p10-p90 band; its method line says "Single daily run; the spread audit flags countries whose simulated spread is out of band." Rows for experimental countries carry the stamp. Questions show the committed band.
- `Home.test.tsx`: the section order for each use in the table; every empty and error state above; the disclosure and tier on every row; each row links `/cycle/{date}`.
- Measured after launch: the share of signed-in people who open `/` on at least 3 of their first 7 days.

## What it is not

- No notifications, email digests or push.
- No feed, streak flames, badges or ranking among people.
- No personal model calls: the briefing is read from the shared daily cycle, so it costs nothing per person.
- No market price rows beyond what the receipts page already shows ([decisions-needed](../company/decisions-needed.md), item 4).

## Where the code lives

- `web/src/Home.tsx`, `web/src/Briefing.tsx`; `api/rw_api/routes_briefing.py` over the cycle and ledger tables.
- Decision: [0011](../research/decisions/0011-consumer-product-and-api.md). Specs it reads from: [world](world.md), [daily question](daily-question.md). Research: [product/077](../research/product/077-daily-question-mechanics.md), [product/087](../research/product/087-trust-and-explainability.md).
