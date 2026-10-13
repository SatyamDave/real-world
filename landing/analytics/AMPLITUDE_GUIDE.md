# Amplitude guide for the landing page

For someone who has never opened Amplitude. Read it top to bottom once, then use the headings as a lookup. The list of events and their properties is in [TRACKING_PLAN.md](TRACKING_PLAN.md); this file is about how to use them.

## What Amplitude does for us

Every visitor gets an anonymous id (a "device id") stored in their browser. Each thing they do on the page is sent to Amplitude as an **event** with that id: `landing_viewed`, `cta_clicked`, `signup_saved`. Amplitude joins the events by id, so we can ask "of the people who saw the page, how many saved their email?" That question is a **funnel**.

Two kinds of events reach it:

- **Browser events** come from the page itself. An ad blocker can hide them.
- **Server events** come from our Cloudflare functions (`waitlist_email_saved`, `waitlist_completed`). Nothing hides them, so they are the check on the browser numbers. If browser signups are far below server signups, ad blockers are the likely reason.

We never send an email address to Amplitude. Visitors with Global Privacy Control or Do Not Track on are never tracked at all, so the real visitor count is a little higher than Amplitude shows.

## Two projects, three environments

Amplitude allows two projects on our plan, so the environments share them:

| Environment | Where it runs | Project | `environment` property |
| --- | --- | --- | --- |
| dev | your laptop (`pnpm dev`, `wrangler pages dev`) | none: events print in the console | `development` |
| staging | the Cloudflare Pages preview, `landing-preview.real-world-landing.pages.dev` | Real World - Staging (id 877388) | `staging` |
| prod | `tryrealworld.com`, after go-live | Real World - Prod (id 878019) | `production` |

Every event carries `environment`, and the value is set by the build and by `wrangler.toml`, not by hand. The staging build holds the staging key and the production build holds the production key, so a staging visit cannot reach the Prod project. The rule when something looks wrong: open the Prod project and filter any chart on `environment = production`. If a number there does not match, the filter is the first thing to check.

To send dev events to the Staging project on purpose, set `VITE_AMPLITUDE_DEV_SEND=true` in `.dev.vars` before `pnpm dev`. They still carry `environment = development`.

## Where to look

Open Amplitude and pick the project from the top-left menu. Menu names below are as of this build and may differ slightly.

- **Dashboard.** Search for "Landing page" in the search box. It holds the funnel and five charts: visitors and signups per day, signups by source, sections seen, call-to-action presses, completed forms by role. It is saved in a personal space; use Share to publish it to teammates.
- **User lookup.** Left menu, "User Look-Up". Paste a device id to see one visitor's event stream in order. This is the fastest way to check that your own test visit arrived.
- **Session Replay.** Left menu, "Session Replay". Plays back what a sampled visitor saw. The email field is masked. Watch five replays before you change the hero; five real sessions tell you more than a chart.
- **Event segmentation.** "Create", then "Event Segmentation". Pick an event, choose "Uniques" (people) or "Totals" (how many times), and add "Group by" a property such as `headline_variant` or `utm_source`.

## Reading the funnel

The funnel steps are `landing_viewed`, `email_submitted`, `signup_saved`, `form_opened`, `waitlist_completed`, split by `headline_variant`. Each bar is "people who did this step after the one before, within the window". The drop between two bars is the question to ask: a big drop after `landing_viewed` is a hero problem; a drop after `signup_saved` means people save the email and skip the forecast question.

Rules for reading it honestly:

- Look at the count (n) as well as the percentage. Two signups out of three visitors is 67% and means nothing.
- Do not pick a winning headline until each has a few hundred visitors. The ad plan stops spending at a fixed cap, so there may never be enough; say "not enough data" when that is true.
- Everything before ads start is test traffic. See "Filtering out test traffic".

## Autocapture and session replay

Autocapture is the SDK recording things without our code: page views, sessions, clicks on buttons and links, form interactions, and where a visitor came from (UTM and referrer). We turned on only those. We left off file downloads, rage-click detection, network tracking and web vitals, because each adds events, and event volume is capped.

Session replay records a **sample** of sessions. The sample rate is `VITE_AMPLITUDE_REPLAY_SAMPLE_RATE`:

| Environment | Rate | Why |
| --- | --- | --- |
| staging | 1.0 (every session) | few sessions, and you want to see your own test |
| production | 0.1 (one in ten) | the plan includes 10,000 replays a month; at 10% that is reached at 100,000 sessions, and we do not know our monthly sessions until ads run |

Check the usage page in Amplitude's settings after the first ad day (the menu wording changes; search for "usage"). If the count is on track to pass 10,000 in the month, lower the rate and rebuild; if it is far below, raise it.

## Filtering out test traffic

Staging is all test traffic. Production should have none, but if a developer opens the production site, those events are real events from the point of view of Amplitude. To exclude your own visits, find your device id (User Look-Up, or `localStorage`/cookie `AMP_...` in the browser) and add a segment "device id is not ...". The verification devices from this build are listed in [MORNING.md](../MORNING.md).

## The one experiment we propose (not launched)

Amplitude Web Experiment lets us show half of visitors a changed page and compare signup rates. We propose one test and have not created it.

- **Question.** Does removing the hero's secondary link "See the receipts" raise `signup_saved` per unique `landing_viewed`? The page's rule is one dominant call to action. The link may pull people off the form, or it may be what makes the form believable.
- **Variants.** Control: the page as it is. Variant: no secondary link in the hero (everything else, including the receipt strip, unchanged).
- **Metric.** `signup_saved` uniques divided by `landing_viewed` uniques, per variant. Guardrail: `waitlist_completed` per `signup_saved` must not fall.
- **Exposure.** All paid and organic visitors, split 50/50, bucketed by device id.
- **Do not start it until** the first ad days show how many visitors a day we get. The baseline conversion rate is unknown today, and the sample size needed depends on it. If the visitors we can afford cannot reach that size in the time we are willing to wait, do not run it: a test that cannot finish only produces a false winner.
- **Copy check.** The change removes words. It adds no claim, so [gtm/messaging.md](../../gtm/messaging.md) is unaffected.

## Go-live checklist for Amplitude

1. Build production with `pnpm build:prod`. It refuses if the prod and staging keys match.
2. After the first production deploy, open the Prod project, User Look-Up, and find your own visit. Expect `environment = production`.
3. Recreate the dashboard in the Prod project. Charts live inside one project. Rebuild them in Prod from the Staging charts (same events, same group-by), or ask Claude to recreate the dashboard through the connector; we did not test a copy feature. The Prod project only knows an event name after it has seen the event once, so do step 2 first.
4. Confirm the Staging project did not receive production events. Filter `environment = production` there; it should be empty.
5. After the first ad day, check the replay count and the event volume against the plan.

## Words you will meet

- **Event**: one thing a visitor did, with a time and properties.
- **Property**: a detail on an event (`utm_source`) or on a user (`headline_variant`).
- **Uniques / Totals**: people who did it / times it was done.
- **Device id**: the anonymous browser id. Clearing cookies makes a new one.
- **Funnel**: an ordered list of events; the chart shows who gets through each step.
- **Session**: a visit, ended after 30 minutes without activity.
