# Sign-in methods for free consumer accounts

- Date: 2026-10-12
- Area: engineering
- Confidence: medium. Each fact below comes from a page opened on 2026-10-12. Where a claim is inference (Sybil cost, recovery), it is labelled. No user research on sign-in preference was found or run, and the W3C WebAuthn text was too long to read in full, so its secure-context rule comes from MDN.

## Answer

Use an email sign-in link that also carries a six-digit code as the one sign-in method at launch. It works for every visitor with an inbox, gives every account a verified address for recovery and deletion requests, and makes each account cost an inbox, which keeps a per-account fork allowance meaningful. Its one human step is an email provider key; without one, the API writes the email to a local outbox file and the terminal, so `make dev` keeps working with no keys, and the API refuses to start on a non-local origin without a provider. Passkeys are the best second method later, and Google sign-in is the best third; neither should be the only method.

## Findings

**Passkeys (WebAuthn) need no third party and work on localhost.**
- MDN: the Web Authentication API "is available only in secure contexts (HTTPS)", and "On the web, passkeys are implemented using the Web Authentication API" ([MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).
- MDN lists `http://localhost` as a secure context, so the local stack needs no certificate ([MDN Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)).
- A Python server library exists: `webauthn` by Duo Labs, version 3.0.1, released 2026-09-25, BSD-3-Clause ([PyPI webauthn](https://pypi.org/project/webauthn/)). It would be a new dependency.
- Synced passkeys are kept available across a person's devices by their provider; device-bound passkeys "can't be moved to other devices"; a phone can sign in a laptop through the hybrid transport ([passkeys.dev terms](https://passkeys.dev/docs/reference/terms/)).
- OWASP: FIDO "provides protection against phishing" by tying authentication to the site's URL ([OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)).

**Google sign-in needs a client ID per origin, a human step.**
- "You must have a client ID to configure Sign In With Google"; each origin, including `http://localhost:<port>`, is added to the client's authorized JavaScript origins ([Google: get a client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)).
- Apps that request only non-sensitive scopes do not need app verification; showing the app's name and logo on the consent screen needs a lighter brand verification ([Google Cloud Help: OAuth verification](https://support.google.com/cloud/answer/13463073)). The page does not name `openid`, `email` and `profile`; the console labels each scope.

**Email sign-in links need a provider key, and corporate scanners spend one-time links.**
- Resend's free plan is 3,000 emails a month and "limited to 100 emails per day", with 3 domains ([Resend pricing](https://resend.com/pricing)). A launch day with more than 100 sign-ups would pass that limit, so a paid tier or another provider is needed before launch. This is one provider, read as an example, not a survey.
- Mail gateways in enterprise, university and hospital networks open links in incoming mail, so a single-use token "is already spent" before the person clicks. The fix offered is a landing page that reads the token from the URL fragment, which scanners do not send, and redeems it only after an explicit click ([Supabase discussion 41618](https://github.com/orgs/supabase/discussions/41618)).
- OWASP: login and recovery should return a generic message so that responses do not reveal which accounts exist, and throttling should be tied to the account rather than only to the source address ([OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)).

**Sessions.**
- OWASP: session ids need at least 64 bits of entropy, from a CSPRNG of at least 128 bits if generated in-house; the cookie must be `Secure` and `HttpOnly` and set `SameSite=Strict` or `Lax`; the id is regenerated after sign-in ([OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)).

## What it means for Real World

- For the product: a visitor types an email and gets a link and a code; there is no password and no separate sign-up. Inference: journalists, policy staff and analysts often read mail behind the gateways described above, so the link must land on a page with a "Sign in" button, and the code covers reading mail on another device.
- For the engineering: email sign-in needs no new Python dependency beyond an HTTP call to the provider (`httpx` is already used by the SDK). Inference: per-account spend caps are only as strong as accounts are costly to make. A passkey account costs nothing to script; an email account costs an inbox. The global `FORK_DAILY_BUDGET_USD` stays the backstop in every case.
- For the business: the provider key, the sending domain and a privacy notice are human steps before launch.

## Recommendations

1. Launch with email sign-in: a link plus a six-digit code in one email, 15-minute expiry, single use, redeemed only by a POST from a landing page that reads the token from the URL fragment.
2. With no provider key, write each email to `$RW_HOME/outbox/` and the API log, and allow that only when every allowed origin is `localhost` or `127.0.0.1`; otherwise refuse to start.
3. Opaque 256-bit session tokens, stored as SHA-256, in an `HttpOnly`, `SameSite=Lax` cookie that is `Secure` off localhost, rotated at sign-in.
4. Answer every sign-in request with the same message and status, and throttle per address and per email.
5. Add passkeys as an optional method in settings after launch; add Google sign-in only if sign-in completion is measured to be low.

## Open questions

- Which provider and plan, and who owns the sending domain: a founder call ([company/decisions-needed.md](../../company/decisions-needed.md)).
- Sign-in completion rate: measure the share of sign-in requests that end in a session in the first week.

Agrees with [074-abuse-and-safety](074-abuse-and-safety.md) on failing closed; it is the first note on accounts.

## Sources

- [MDN: Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API), accessed 2026-10-12
- [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), accessed 2026-10-12
- [PyPI: webauthn](https://pypi.org/project/webauthn/), accessed 2026-10-12
- [passkeys.dev: terms](https://passkeys.dev/docs/reference/terms/), accessed 2026-10-12
- [Google: get your Google API client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), accessed 2026-10-12
- [Google Cloud Help: OAuth app verification](https://support.google.com/cloud/answer/13463073), accessed 2026-10-12
- [Resend pricing](https://resend.com/pricing), accessed 2026-10-12
- [Supabase discussion 41618: links consumed by email scanners](https://github.com/orgs/supabase/discussions/41618), accessed 2026-10-12
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), accessed 2026-10-12
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), accessed 2026-10-12
