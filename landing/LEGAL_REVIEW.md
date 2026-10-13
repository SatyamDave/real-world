# For a lawyer: privacy and terms drafts

The pages are `src/pages/Privacy.tsx` and `src/pages/Terms.tsx`, shown at `/privacy` and `/terms` with a draft banner. They were written from what the code does, not from a template, and they are not legal advice. Nothing here has been read by a lawyer. This file lists what to check, in the order of risk.

## What we collect (from the code, 2026-10-13)

| Data | Where it goes | Source in code |
| --- | --- | --- |
| Email, consent line version, time | Neon, table `waitlist_signups` | `functions/_lib/signup.ts` |
| utm values, referrer, landing path, headline shown, Amplitude device id, country | same row | same |
| Hashed IP (salted, per time window), no raw IP | Neon, `signup_rate_limit`, rows deleted after a day | `functions/_lib/ratelimit.ts` |
| Forecast probability and role | Tally (free plan), then the same row through a signed webhook | `functions/_lib/tally.ts` |
| Page views, clicks, scroll sections, form steps; random device id in a cookie or local storage | Amplitude (browser SDK, IP collection turned off) | `src/amplitude.ts` |
| Sampled session replay, inputs masked | Amplitude | `src/amplitude.ts` |
| Server events with the device id and a random signup id, no email | Amplitude | `functions/_lib/amplitude.ts` |
| Signup id on a signup, no email | Reddit and X pixels, only when ads run and the pixel id is set | `src/pixels.ts` |

Not collected: raw IP addresses (we store none; Cloudflare, Tally and Turnstile see them in the course of serving), payment data, anything from children knowingly.

No analytics or pixel loads when the browser sends Global Privacy Control or Do Not Track (`src/analytics.ts`).

## Questions for the lawyer

1. **Email promises.** The consent line says "We'll email you about the launch and your forecast. Unsubscribe anytime." The privacy page says every email has an unsubscribe link. No email is sent yet and no sender is chosen. CAN-SPAM needs a physical postal address and a working opt-out in each message. Who is the sender, and what address do we print?
2. **Consent model.** We rely on a pre-launch notice plus the consent line next to the button, and a US-only audience. There is no cookie banner. Amplitude sets a device id in the browser and Tally sets its own cookies. Is a notice enough for US-only traffic, including California, or do we need a banner or an opt-out link beyond Global Privacy Control?
3. **US-only.** The page says it is for people in the United States. We do not block other countries; ads are targeted to the US. If someone from the EU or UK joins, are we exposed, and should we block them?
4. **State privacy rights.** The page says people can ask us to show or delete their data and gives a contact link that is hidden until an address exists. Which state laws apply at our size, and what must the page say about access, deletion, sale or sharing and the ad pixels (Reddit and X may count as "sharing" for targeted advertising)? "We do not sell your data" is a statement of fact today; check it against the statutory definition of sale.
5. **Children.** The page says it is not meant for children under 13. Is a statement enough, or do we need an age screen?
6. **Retention.** We have not set a period; the page says data is kept until a person asks for deletion. Pick a period, and confirm that the signup rate-limit rows (deleted after a day) and the Amplitude and Tally copies are covered by the deletion promise.
7. **Processors.** Cloudflare, Neon, Amplitude, Tally, Reddit and X are named. Do we need data processing agreements with each, and is a list of processors on the page enough?
8. **Session replay.** Inputs are masked by Amplitude's default setting; we did not watch a replay to confirm the email field never appears. Check that before any claim that it is masked is relied on.
9. **Terms.** "AI-simulated, not polls, not advice, not a way to bet" and a no-warranty clause. Is the liability limit enforceable as written, and do we need an arbitration or governing-law clause?
10. **Tally is a new processor (replaced Typeform on 2026-10-13).** The free plan keeps Tally's own branding in the form and does not offer Tally's data-retention controls (the paid Business plan lists them; we have not verified it against Tally's own pricing page, only a third-party summary). Check Tally's data processing terms and where it stores responses, and whether the form needs its own privacy link. Responses live in Tally as well as in our database, so a deletion request has to reach both.
11. **The forecast question and a public score.** People answer a forecast question and may later be scored against the simulation. Does storing a person's forecast with their email need extra notice?

## Keeping the pages true

Change the page in the same change as any new collection or processor. `CONSENT_VERSION` changes only when the consent line changes; `PRIVACY_UPDATED` changes when the privacy page does (`src/copy/consent.ts`). The end-to-end test in `e2e/landing.spec.ts` checks the processors and the main statements.
