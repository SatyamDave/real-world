# Developer area

## What it does

`/developers` is where a signed-in person makes and manages API keys for [`POST /v1/simulate`](simulate-api.md). It lists their keys: label, the first characters (`rw_3f9a…`), created date, daily cap, spent today and status. "Create key" asks for a label and a daily cap in dollars (prefilled with the default); the new key is shown once with "Copy" and the line "This key is shown once. Store it now; it cannot be shown again." Each key has "Revoke", which asks "Revoke <label>? Calls with this key stop at once." with "Cancel" focused. Under the keys: usage for the last 30 days per key (spend per day as a bar chart with its data table, forks started, and refusals by code), and links to the API reference `/docs` and both SDK quickstarts. Spend made with the fake model reads as an estimate, as in the keys CLI today.

States, written out:

- Loading: "Loading your keys", "Loading usage". Error: `LoadError` "Could not load your keys. The server did not respond." with "Try again".
- No keys: "No API keys yet. Create one to call the API from your code."
- At the key limit: "You have N active keys, the limit. Revoke one to create another." and "Create key" disabled.
- Cap out of range: "The daily cap must be more than $0 and at most $<max>."
- Signed out: "Sign in to create an API key." with "Sign in", and the docs links.
- A call over a key's daily cap gets `402 key_daily_cap_spent`: "this API key's $<cap> daily cap would be passed: $<spent> today, and this fork may cost up to $<max>; try again after 00:00 UTC".

## Who it is for

The developer who wants a population response in their own code without writing to anyone for a key.

## How we know it works

- Endpoints (tag `account`; a key cannot manage keys): `GET /v1/me/keys`, `POST /v1/me/keys` (returns the key once), `DELETE /v1/me/keys/{id}` (revoke; the row stays for spend), `GET /v1/me/keys/{id}/usage`. Fields in `api/openapi.json`.
- Keys are made as by the keys CLI today: `rw_` and 32 hex characters, only the SHA-256 stored, plus the first 4 hex characters for display. A self-serve key has `user_id` and `daily_cap_usd`; an operator key keeps its lifetime `cap_usd`. Tests in `api/tests/test_user_keys.py`: `test_a_new_key_is_returned_once_and_only_its_hash_is_stored`, `test_a_person_cannot_see_or_revoke_another_persons_key`.
- Spend check for a self-serve key, added to the keyed checks in [simulate API](simulate-api.md), before any model call and again under the write lock: today's spend on the key (screens at cost, forks at recorded cost or `max_cost_usd` while unfinished) plus this fork's `max_cost_usd` plus one screen call must not pass `daily_cap_usd`, else `402 key_daily_cap_spent`. Keyed spend still counts against `FORK_DAILY_BUDGET_USD`. A key, its owner or its spend that cannot be read refuses with `503 spend_unreadable`; a key whose owner deleted their account is revoked (`401 invalid_api_key`). Tests: `test_a_key_over_its_daily_cap_is_refused_before_any_model_call`, `test_the_daily_cap_resets_at_utc_midnight`, `test_an_unreadable_key_spend_refuses_with_503`.
- Limits in `engine/rw/settings.py`, provisional until decided ([decisions-needed](../company/decisions-needed.md)): `KEY_DAILY_CAP_USD_DEFAULT`, `KEY_DAILY_CAP_USD_MAX`, `KEYS_PER_USER`.
- Usage is read from `key_forks` and `key_screens`, the same rows the spend check reads, so the page and the refusal agree. Test: `test_usage_totals_equal_the_spend_the_cap_check_reads`.
- Component tests for every state above, the shown-once key, and the revoke confirm with "Cancel" focused.
- Measured after launch: people who make a key and make a successful call within a day of making it ([product/078](../research/product/078-api-launch-playbooks.md)).

## What it is not

- No paid credits, billing, invoices or plans; no team keys or shared keys.
- No webhooks, batch endpoint or hosted MCP endpoint ([CPO lens](../research/lenses/cpo.md)).
- No key scopes: a key can start forks and estimates, as today.
- The builders program's operator keys stay; this page does not list them.

## Where the code lives

- `web/src/pages/developers.tsx`; `api/rw_api/routes_keys.py`, `api/rw_api/keys.py`, the key spend check in `api/rw_api/app.py`.
- Decision: [0011](../research/decisions/0011-consumer-product-and-api.md). Research: [product/078](../research/product/078-api-launch-playbooks.md), [engineering/069](../research/engineering/069-api-design.md), [business/089](../research/business/089-unit-economics.md).
