# Tracking plan: pre-launch landing page

The one list of what the page sends and why. The code is `src/analytics.ts` (the `track()` wrapper), `src/amplitude.ts` (SDK setup) and `src/pixels.ts` (ad pixels); server events are in `functions/_lib/signup.ts` and `functions/_lib/typeform.ts`. The question this answers is in [product/landing-page.md](../../product/landing-page.md): which headline and channel make a stranger sign up, and where they drop between the two steps.

## Rules

- Every event, browser and server, carries `headline_variant` (`receipts`, `hashed`, `public-score`, `your-call`, or `unknown`). It is also set as a user property.
- No email address, hash, probability or score is ever an event property. The email goes only to our own database.
- Nothing loads, and nothing is sent, when the browser sends Global Privacy Control or Do Not Track. The SDKs load after the page has loaded, on the visitor's first interaction or 1.5 seconds later, whichever is first; events fired before that wait in a queue. A visitor who leaves within 1.5 seconds without touching anything is therefore not counted in Amplitude (the pixels and the server events are unaffected). The bot check loads only when the visitor focuses the form or submits.
- With no `VITE_AMPLITUDE_API_KEY` the SDK is not loaded. With no pixel id that pixel is not loaded.
- The browser SDK is started with `trackingOptions: { ipAddress: false }`, so it does not send the visitor's IP address. What Amplitude then stores for location is checked on a deploy (see "Verify after a deploy"); the country we need is saved with the signup from the request header.
- US-only until a consent banner exists ([product/101](../../research/product/101-prelaunch-landing-waitlist-ads.md)).

## Browser events (Amplitude, custom)

| Event | When | Properties besides `headline_variant` |
| --- | --- | --- |
| `landing_viewed` | Once per load of any route | `path`, `referrer`, and any of `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` present in the URL |
| `section_viewed` | First time 40% of a section is on screen | `section`: `hero`, `receipts`, `how_it_works`, `repeat_cta`, `legal` |
| `globe_ready` | The animated globe started | none |
| `globe_fallback_shown` | Poster only | `reason`: `reduced_motion` or `no_webgl` |
| `cta_clicked` | Any call to action pressed | `location`: `hero`, `header`, `repeat`, `hero_secondary` |
| `email_submitted` | Valid email sent to the server | `location` |
| `signup_saved` | Server saved a new signup (the conversion) | `location`, `signup_id` |
| `signup_duplicate` | Server found the email already saved | `location`, `signup_id` |
| `signup_failed` | The request failed | `location`, `reason`: `request_failed`, `bot_check`, `rate_limited` |
| `typeform_opened` | The Typeform step mounted | `signup_id` |
| `typeform_submitted` | The Typeform was submitted | `signup_id` |
| `app_link_clicked` | "Try today's question" pressed (only when `APP_URL` is set) | `location` |
| `outbound_clicked` | Contact link pressed | `to` |

## Server events (Amplitude HTTP API, from the Pages Functions)

| Event | When | Properties besides `headline_variant` |
| --- | --- | --- |
| `waitlist_email_saved` | A new row was inserted | `signup_id`, `utm_source`, `utm_content`. `insert_id` is the signup id, so a retry is not counted twice. |
| `waitlist_completed` | A verified Typeform webhook filled in the row | `signup_id`, `role`. `insert_id` is `typeform:<Typeform event id>`. |

Both use the browser `device_id` when the signup carried one, so the funnel joins across browser and server; otherwise the signup id is the `user_id`.

## Autocapture (Amplitude browser SDK 2.47.2)

On: page views, sessions, element interactions, form interactions, attribution (UTM, referrer, click ids as user properties). Off: file downloads, frustration interactions, network tracking, web vitals. Session replay runs for a sample of sessions (`VITE_AMPLITUDE_REPLAY_SAMPLE_RATE`, default 0.1). Text inputs are masked by default and the email field also has the `amp-mask` class.

## Ad pixels

| Pixel | Loads when | Sends |
| --- | --- | --- |
| Reddit | `VITE_REDDIT_PIXEL_ID` is set | `PageVisit` on load; `Lead` with `conversionId` = signup id on `signup_saved` only |
| X | `VITE_X_PIXEL_ID` is set | Page config on load; the event `VITE_X_LEAD_EVENT_ID` with `conversion_id` = signup id on `signup_saved` only |
| Meta | never, no code | Stays off until the policy review clears |

The signup id as the conversion id lets a later server-side conversion call deduplicate against the browser event. The call shapes follow the vendors' base-code snippets as reported by secondary sources; they are not yet checked against a live pixel (see the pixel step in `RUNBOOK.md`).

## Funnel the dashboard shows

`landing_viewed` to `section_viewed` (receipts) to `cta_clicked` to `email_submitted` to `signup_saved` to `typeform_opened` to `typeform_submitted`, split by `headline_variant` and by `utm_source`. The server events are the check on the browser ones: `waitlist_email_saved` should match `signup_saved` within a few percent, and a gap means ad blockers or a failed script.

## Verify after a deploy

1. Open the preview with `?utm_source=test&utm_content=hashed`, accept nothing, wait 5 seconds.
2. In Amplitude, find the device in the user lookup. Expect `landing_viewed` with `headline_variant = hashed`, the autocapture page view with the UTM properties, and `section_viewed` for `hero`.
3. Submit a `test+<timestamp>@example.com` address. Expect `email_submitted`, `signup_saved` and the server `waitlist_email_saved` with the same `signup_id`.
4. Open the test device's events: the browser events should show no IP address and no city; if they do, the SDK option is not enough and the privacy page must say Amplitude records them.
5. Delete the test row by id afterwards (steps in `landing/RUNBOOK.md`, added in the next PR).
