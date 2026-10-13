# Tracking plan: pre-launch landing page

The one list of what the page sends and why. The code is `src/analytics.ts` (the `track()` wrapper), `src/amplitude.ts` (SDK setup) and `src/pixels.ts` (ad pixels); server events are in `functions/_lib/signup.ts` and `functions/_lib/tally.ts`. The question this answers is in [product/landing-page.md](../../product/landing-page.md): which headline and channel make a stranger sign up, and where they drop between the two steps.

## Rules

- Every event, browser and server, carries `environment` (`development`, `staging` or `production`) as well as `headline_variant`. The build sets it for the browser and `wrangler.toml` for the server; an unset server value reads as `production`, never as a test environment. Staging sends to the Real World - Staging project (877388), production to Real World - Prod (878019), and `pnpm dev` only logs to the console. See [AMPLITUDE_GUIDE.md](AMPLITUDE_GUIDE.md).
- Every event, browser and server, carries `headline_variant` (`receipts`, `hashed`, `public-score`, `your-call`, or `unknown`). It is also set as a user property.
- No email address, hash, probability or score is ever an event property. The email goes only to our own database.
- Nothing is queued, loaded or sent until the visitor accepts the cookie notice (`src/components/CookieNotice.tsx`, choice kept in local storage as `rw_analytics_consent`); Decline drops anything queued. Server events are sent only with the browser's Amplitude device id, which exists only after Accept. Nothing loads, and nothing is sent, when the browser sends Global Privacy Control or Do Not Track. After Accept the SDKs load after the page has loaded, on the visitor's first interaction or 1.5 seconds later, whichever is first; events fired before that wait in a queue. A visitor who leaves within 1.5 seconds without touching anything is therefore not counted in Amplitude (the pixels and the server events are unaffected). The bot check loads only when the visitor focuses the form or submits.
- With no `VITE_AMPLITUDE_API_KEY` the SDK is not loaded. In development it is not loaded either, unless `VITE_AMPLITUDE_DEV_SEND=true`. With no pixel id that pixel is not loaded.
- The browser SDK is started with `trackingOptions: { ipAddress: false }`, so it does not send the visitor's IP address. What Amplitude then stores for location is checked on a deploy (see "Verify after a deploy"); the country we need is saved with the signup from the request header.

## Browser events (Amplitude, custom)

| Event | When | Properties besides `headline_variant` |
| --- | --- | --- |
| `landing_viewed` | Once per load of any route | `path`, `referrer`, and any of `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` present in the URL |
| `section_viewed` | First time 40% of a section is on screen | `section`: `hero`, `receipts`, `thesis`, `how_it_works`, `use_cases`, `research`, `collaborate`, `repeat_cta`, `legal` |
| `globe_ready` | The animated globe started | none |
| `cta_clicked` | Any call to action pressed | `location`: `hero`, `header`, `repeat`, `hero_secondary`, `collaborate` |
| `email_focused` | The email field got focus (once per page view) | `location` |
| `email_started` | The first character was typed (once per page view) | `location` |
| `email_invalid` | Submit pressed with an address that is not valid | `location` |
| `email_submitted` | Valid email sent to the server | `location` |
| `signup_saved` | Server saved a new signup (the conversion) | `location`, `signup_id` |
| `signup_failed` | The request failed | `location`, `reason`: `request_failed`, `bot_check`, `rate_limited` |
| `form_opened` | The Tally form step mounted | `signup_id` |
| `form_loaded` | Tally reported the form rendered (`Tally.FormLoaded`) | `signup_id` |
| `form_submitted` | Tally reported the form submitted (a `Tally.FormSubmitted` message from tally.so) | `signup_id` |
| `app_link_clicked` | "Try today's question" pressed (only when `APP_URL` is set) | `location` |
| `outbound_clicked` | Contact link pressed | `to`: `contact` (footer) or `collaboration` |

## Server events (Amplitude HTTP API, from the Pages Functions)

| Event | When | Properties besides `headline_variant` |
| --- | --- | --- |
| `waitlist_email_saved` | A new row was inserted | `signup_id`, `utm_source`, `utm_content`. `insert_id` is the signup id, so a retry is not counted twice. |
| `waitlist_completed` | A verified Tally webhook filled in the row | `signup_id`, `role`. `insert_id` is `tally:<Tally event id>`. |

Both use the browser `device_id` when the signup carried one, so the funnel joins across browser and server; otherwise the signup id is the `user_id`.

## Autocapture (Amplitude browser SDK 2.47.2)

On: page views, sessions, attribution (UTM, referrer, click ids as user properties). Off: element interactions and form interactions (both would send on-page text), file downloads, frustration interactions, network tracking, web vitals. Session replay runs for a sample of sessions (`VITE_AMPLITUDE_REPLAY_SAMPLE_RATE`, default 0.1) with `defaultMaskLevel: "conservative"`, which masks all text on the page and every input.

## Ad pixels

| Pixel | Loads when | Sends |
| --- | --- | --- |
| Reddit | `VITE_REDDIT_PIXEL_ID` is set | `PageVisit` on load; `Lead` with `conversionId` = signup id on `signup_saved` only |
| X | `VITE_X_PIXEL_ID` is set | Page config on load; the event `VITE_X_LEAD_EVENT_ID` with `conversion_id` = signup id on `signup_saved` only |
| Meta | never, no code | Stays off until the policy review clears |

The signup id as the conversion id lets a later server-side conversion call deduplicate against the browser event. The call shapes follow the vendors' base-code snippets as reported by secondary sources; they are not yet checked against a live pixel (see the pixel step in `RUNBOOK.md`).

## Funnel the dashboard shows

`landing_viewed` to `email_focused` to `email_started` to `email_submitted` to `signup_saved` to `form_opened` to `form_loaded` to `form_submitted`, split by `headline_variant` and by `utm_source`. The server events are the check on the browser ones: `waitlist_email_saved` should match `signup_saved` within a few percent, and a gap means ad blockers or a failed script.

## Verify after a deploy

0. On staging, `node scripts/verify-staging.mjs --form` runs steps 1 to 3 and the Tally form for you and prints the ids.
1. Open the preview with `?utm_source=test&utm_content=hashed`, accept nothing, wait 5 seconds.
2. Accept the cookie notice. In Amplitude, find the device in the user lookup. Expect `landing_viewed` with `headline_variant = hashed`, the autocapture page view with the UTM properties, and `section_viewed` for `hero`.
3. Submit a `test+<timestamp>@example.com` address. Expect `email_submitted`, `signup_saved` and the server `waitlist_email_saved` with the same `signup_id`.
4. Open the test device's events: the browser events should show no IP address and no city; if they do, the SDK option is not enough and the privacy page must say Amplitude records them.
5. Delete the test row by id afterwards (steps in `landing/RUNBOOK.md`, added in the next PR).

## Where people drop off (review on #24, 2026-10-13)

Satyam asked to monitor where people drop off in the form interaction. Each step above is one event, so the funnel shows the loss between them: page seen but field never focused (the form is not noticed), focused but nothing typed (hesitation), typed but not submitted (second thoughts, or a too-long consent line), submitted but not saved (`signup_failed` with its `reason`), saved but the Tally form not loaded or not submitted. Tally reports nothing per answer, so inside its form the only measurable gap is `form_loaded` to `form_submitted`. Visitors who decline the cookie notice are not measured at all, so every rate here is for consenting visitors.

Removed in the same review: `globe_fallback_shown` (complexity for no decision) and `signup_duplicate` (a repeat email is not a conversion; the page still says "You're already on the list."). My reading of "remove sign-up duplication" was the second event; the first sentence of the review on #24 is unambiguous.
