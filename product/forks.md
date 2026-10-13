# Forks

## What it does

The fork is the core action. Anyone types an event into the box with the placeholder "What if …" ("What if the ECB raises rates by a full point?"), and gets the fork card already specified in [web-app](web-app.md): the simulated reaction by country and segment, the spread across ensemble members, the coverage tiers, the cost and the share actions. A signed-in person's forks are saved to their account: `/forks` lists them newest first, each row showing the event, the date of the world it started from, the top shift, and "Started by you" or "Saved". A fork card shows "Save" (or "Saved") to a signed-in person, so a shared fork can be kept too, and "Remove from my forks" on their own list. Every saved fork keeps its public link `/fork/{id}`, which works for anyone, signed in or not.

A signed-out visitor can start forks up to the anonymous allowance per day. After that, the refusal reads "this address has started N forks today, the limit without an account; sign in for more, or try again after 00:00 UTC" with "Sign in" beside it; this replaces the `anon_daily_limit` sentence in [simulate API](simulate-api.md) when this is built. A signed-in person has their own daily allowance, then reads "you have started N forks today, your daily limit; try again after 00:00 UTC". A fork card seen while signed out shows "Sign in to save" instead of "Save"; after sign-in the same card is saved.

States, written out:

- `/forks` loading: "Loading your forks". Empty: "No forks yet. Forks you start or save appear here." with the fork box. Error: `LoadError` "Could not load your forks. The server did not respond." with "Try again".
- Signed out on `/forks`: "Sign in to keep your forks." and "Sign in".
- Refusals: the API's `detail` sentence as sent, as the fork card does today; each spend refusal in [simulate API](simulate-api.md) has its sentence.
- Saving: the button reads "Saving"; failure: "Not saved. Try again."

## Who it is for

The analyst who forks events and comes back to compare them, and the visitor who wants to keep or share one result.

## How we know it works

- Endpoints (tag `account`): `GET /v1/me/forks` (newest first, paged), `PUT /v1/me/forks/{job_id}` (save; idempotent), `DELETE /v1/me/forks/{job_id}` (removes it from the list only; the fork and its link stay). Fields in `api/openapi.json`.
- A fork started with a valid session is saved as "Started by you" in the same transaction that inserts the job. Test: `test_a_signed_in_fork_is_saved_when_its_job_is_written` in `api/tests/test_user_forks.py`.
- Spend checks for a signed-in caller, before the estimate and the policy screen and again under the write lock, in this order, each refusal writing no job and no `llm_calls` row: an invalid session cookie is `401 signed_out` (never treated as anonymous); the person's forks started today against `FORK_USER_PER_DAY` (`429 user_daily_limit`); `max_cost_usd` clamped to `FORK_MAX_COST_USD_DEFAULT`; today's fork budget against `FORK_DAILY_BUDGET_USD` (`402 fork_budget_spent`). A count or spend that cannot be read refuses with `503 spend_unreadable`. A signed-in caller skips the per-address count. Tests: `test_a_person_over_their_daily_forks_is_refused_before_any_model_call`, `test_an_unreadable_person_count_refuses_with_503`, `test_an_invalid_session_is_refused_not_treated_as_anonymous`.
- `FORK_USER_PER_DAY` is a new constant in `engine/rw/settings.py`, provisional, like `FORK_ANON_PER_DAY`, until the free fork allowance is decided ([decisions-needed](../company/decisions-needed.md), item 7).
- A fork job is never deleted while any account lists it; saved forks reopen with their result. Test: `test_a_saved_fork_reopens_after_its_idempotency_key_expires`.
- Component tests: "Save", "Saved", "Sign in to save" by session state; the empty, signed-out and error states of `/forks`; the over-allowance refusal shows "Sign in" only when signed out.
- Measured after launch: forks per signed-in person per week, and the share of forks opened from a shared link.

## What it is not

- No folders, tags, notes, comparisons or private forks: every fork link is public, as today, and the card says so ("Anyone with the link can open this fork.").
- No editing a fork after it runs; a new event is a new fork.
- Fork results are not scored and the card says so, as in [simulate API](simulate-api.md).
- The word on every surface is "fork"; the placeholder "What if …" is a sentence opener, not a name for the thing ([glossary](glossary.md)).

## Where the code lives

- `web/src/ForkCard.tsx`, `web/src/pages/forks.tsx`; `api/rw_api/routes_forks.py`, the spend checks in `api/rw_api/app.py`.
- Decision: [0011](../research/decisions/0011-consumer-product-and-api.md). Research: [product/076](../research/product/076-viral-simulations.md), [business/089](../research/business/089-unit-economics.md), [engineering/074](../research/engineering/074-abuse-and-safety.md).
