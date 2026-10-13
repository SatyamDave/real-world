# Privacy

This notice covers the Real World web app and API. Browsing, answering today's question and opening a fork need no account. The web app has no analytics and no tracking pixels, and Real World sends no newsletter. This notice is a draft that needs legal review.

## What we collect

1. **Email address.** Collected when you ask for a sign-in link. It is used only to sign you in.
2. **Sign-in links and codes.** Stored only as hashes. A link or code works once and for 15 minutes.
3. **Session cookie.** After you sign in, the cookie `rw_session` keeps you signed in on that browser for 30 days. It is strictly necessary, set `HttpOnly`, and removed when you sign out. Only a hash of it is stored.
4. **Profile.** The answers you give in onboarding: what you use Real World for, your countries and your topics. You can change them in settings.
5. **Saved forks.** The forks you started or saved.
6. **Daily-question answers.** Without an account, an answer is tied to a random player id kept in your browser's local storage. When you sign in, that id is linked to your account.
7. **API keys.** Stored only as hashes, with what each key has spent.
8. **IP address.** Used for rate limits and stored only as a hash.
9. **What you type into a fork.** The event text you type is public, because every fork link can be opened by anyone who has it.

## Who processes it

| Processor | For | What it receives |
| --- | --- | --- |
| Resend | The sign-in email | Your email address and the sign-in link and code |
| Fly.io | Hosting (provisional) | Everything above |
| Cloudflare R2 | Backups | Everything above |
| TypeSafe, OpenRouter and a host of Mistral Small 3.2 | Model calls for forks and the daily cycle | The text of a fork event and public news text. No email address, account id, player id or IP address |

Do not put personal data in a fork event: the event text goes to the model providers and is public.

## What deleting your account does

"Delete account" in settings removes your email, profile, sessions, sign-in links and codes, and saved-fork list, and revokes every API key. It keeps what holds no personal data: fork jobs, so shared links keep working; daily answers, unlinked from you; and key spend rows, which the day's budget needs.

Published forecasts and receipts are public and are never removed, because they hold no personal data.

## Your choices

- Sign out on this browser or everywhere from settings.
- Change your profile in settings.
- Delete your account from settings.

## Contact

Provisional: no contact address is published yet. One will be added here before accounts open.

## Changes

A change to this notice is published on this page with its date.

## Why

[product/accounts.md](accounts.md), [decision 0011](../research/decisions/0011-consumer-product-and-api.md) and [research/engineering/106](../research/engineering/106-sign-in-methods.md). Regulation: [research/business/091-regulation.md](../research/business/091-regulation.md). Open item: [company/decisions-needed.md](../company/decisions-needed.md), item 17. What the model providers receive: `engine/rw/llm.py` sends only the prompts built by the forecast, screening and agent-account paths, none of which include account data.
