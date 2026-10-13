# Accounts

## What it does

Anyone can make a free account with an email address. On `/sign-in` they type their email and press "Email me a sign-in link"; the page then reads "Check <email>. The link and the code in it work for 15 minutes." The email holds a link and a six-digit code. The link opens `/sign-in/confirm`, which shows one button, "Sign in as <email>"; the code can instead be typed on `/sign-in` on any device. There is no password and no separate sign-up: the first sign-in makes the account; every sign-in returns to the page the person came from. A signed-in person stays signed in on that browser for 30 days. The foot of [your record](track-record.md) shows their email, "Sign out", "Sign out everywhere" and "Delete account". Accounts are free; there is no plan, billing, team or workspace.

States, written out:

- Sending: "Sending the sign-in email". Sent: the line above, the same whether or not an account exists for that email.
- Wrong or used code: "That code is not valid. Request a new email." After five wrong codes the email's link and code stop working, with the same sentence.
- Expired or used link: "This sign-in link has expired or was already used. Request a new one." with the email field filled in.
- Throttled: "Too many sign-in emails for this address. Try again after <time>." (from the API's `detail`).
- Email could not be sent: "The sign-in email could not be sent. Try again in a few minutes." Nothing is shown as sent.
- Signed out on a page that needs an account: the page's one-line reason and "Sign in" (each spec names its line).
- Delete account: a confirm reading "Delete your account? Your email and sessions are removed, and your sealed tests stay without your name. This cannot be undone." with "Cancel" focused and "Delete account". After it: signed out on `/`, with "Your account was deleted."

## Who it is for

Every person who wants their message tests sealed and kept in a record. Testing a message, playing the daily question and browsing the public record never need an account ([decision 0012](../research/decisions/0012-will-it-land-and-call-it.md)).

## How we know it works

Endpoints, all under the OpenAPI tag `account` (cookie-authenticated, not in the SDKs; fields in `api/openapi.json`):

| Method and path | Purpose |
| --- | --- |
| `POST /v1/auth/email` | Send a link and code to an email. Always `202` with the same body for a valid address; `422` for a malformed one; `429 sign_in_throttled`; `503 email_unavailable` when the provider call fails |
| `POST /v1/auth/verify` | Redeem `{token}` or `{email, code}`; sets the session cookie and returns the person. `400 sign_in_invalid` for a wrong, used or expired token or code |
| `POST /v1/auth/sign-out` | End this session; `?everywhere=true` ends all of the person's sessions |
| `GET /v1/me` | The signed-in person (id, email, created at) or `401 signed_out` |
| `DELETE /v1/me` | Delete the account as described below |

Rules and their tests (`api/tests/test_auth.py` unless named):

- Sign-in follows [research/engineering/106](../research/engineering/106-sign-in-methods.md). The email's link is `/sign-in/confirm#token=<token>`: the token sits in the fragment, so mail scanners that fetch the link never send it, and it is redeemed only by the button's POST. Tokens and codes are single use, expire after `SIGN_IN_TTL_MINUTES` (15), and are stored only as SHA-256. Five wrong codes end the token, link included, and wrong codes from one address are throttled at `SIGN_IN_WRONG_CODES_PER_ADDRESS_PER_HOUR` (20). Tests: `test_a_token_works_once_and_not_after_expiry`, `test_a_code_signs_in_once`, `test_five_wrong_codes_end_the_token`, `test_wrong_codes_are_throttled_per_address`, `test_a_get_on_the_confirm_page_signs_nobody_in`.
- `POST /v1/auth/email` answers the same status, body and timing class for known and unknown emails. Throttles: `SIGN_IN_PER_EMAIL_PER_HOUR` (5) and `SIGN_IN_PER_ADDRESS_PER_HOUR` (20); the address is read as for forks, and only its hash is kept. A throttle, session or address that cannot be read refuses with `503` (`account_unreadable`, `client_unknown`). Tests: `test_sign_in_does_not_reveal_whether_an_account_exists`, `test_sign_in_emails_are_throttled_per_email_and_per_address`, `test_an_unreadable_throttle_refuses_with_503`.
- Sessions: a random 256-bit token in the cookie `rw_session`, `HttpOnly`, `SameSite=Lax`, `Secure` except on `localhost` and `127.0.0.1`, path `/`, 30-day absolute expiry (`SESSION_DAYS`); only its SHA-256 is stored. A new token is issued at every sign-in. State-changing account routes accept only `application/json` and an `Origin` on the allowed list, so a cross-site form cannot post them; a request without both is `403 cross_origin`. Tests: `test_the_session_cookie_has_its_attributes`, `test_a_new_session_is_issued_at_every_sign_in`, `test_a_cross_origin_form_post_is_refused`, `test_sign_out_everywhere_ends_every_session`.
- An unknown, expired or ended session cookie reads as signed out (`401 signed_out` on account routes); it never falls back to another identity. Test: `test_a_bad_session_cookie_is_refused_not_treated_as_anonymous`.
- Keyless local path: with no `RW_EMAIL_API_KEY`, the API writes each email to `$RW_HOME/outbox/<utc time>-<hash of email>.eml` and prints the link and code to its log, so `make dev` and `make e2e` sign in with no key. It does so only when every allowed origin is `localhost` or `127.0.0.1`; on any other origin without a key, the API refuses to start with "RW_EMAIL_API_KEY is not set; email sign-in cannot run on <origin>." With a key, `RW_EMAIL_FROM` (the sender address) is required too, and the email goes through the provider named as the example in [106](../research/engineering/106-sign-in-methods.md) until the provider is decided; a failed provider call is `503 email_unavailable`. Tests: `test_without_a_provider_key_the_email_lands_in_the_outbox`, `test_the_api_refuses_to_start_on_a_public_origin_without_an_email_key`, `test_a_failed_provider_call_says_so_and_shows_nothing_sent`.
- Data stored per person, and nothing else: email; sessions and sign-in tokens (hashed); their sealed message tests ([will it land](will-it-land.md)). The email is used only to sign in; no newsletter, no tracking pixel.
- Deletion removes the email, sessions and sign-in tokens. It keeps rows with no personal data: sealed message tests stay sealed and keep pointing at the account row, so abusive patterns stay traceable. The account row itself stays with its email removed, so those rows still point at it; the email can make a new account later. The database holds one live account per email (`UNIQUE`). Tests: `test_deleting_an_account_removes_its_personal_data`, `test_the_database_holds_one_account_per_email`.
- Web: component tests for every state above; the delete confirm opens with "Cancel" focused.
- Measured after launch: sign-in completion, the share of `POST /v1/auth/email` calls that end in a session within an hour ([decision 0011](../research/decisions/0011-consumer-product-and-api.md) revisits sign-in methods below 50%).

## What it is not

- No passwords, no Google sign-in and no passkeys at launch ([106](../research/engineering/106-sign-in-methods.md) names them as later methods).
- No teams, workspaces, roles, seats, plans or billing.
- No marketing email, no notification email, no email change in the base build (delete and sign in with the new address).
- No profile pictures or public profiles.
- Accounts do not need to exist to test a post, call today's question or browse the proof.

## Where the code lives

- `api/rw_api/auth.py`, `api/rw_api/routes_me.py`, `api/rw_api/sql/accounts.sql`; `web/src/pages/sign-in.tsx`, `web/src/session.ts`.
- Decisions: [0011](../research/decisions/0011-consumer-product-and-api.md), [0012](../research/decisions/0012-will-it-land-and-call-it.md). Research: [engineering/106](../research/engineering/106-sign-in-methods.md), [engineering/074](../research/engineering/074-abuse-and-safety.md).
