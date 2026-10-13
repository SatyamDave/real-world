# Landing page (pre-launch)

## What it does

A temporary one-page site, live Oct 13 to Oct 27, that explains Real World in a sentence, shows a slowly turning globe with "receipt" cards that mark where tracked events will resolve, and collects a waitlist. Signup is two steps: a visitor types their email and we save it at once; then an embedded Typeform asks one teaser forecast and their role. Each ad sets `utm_content`, and the page shows the matching headline from an allow-list so we can measure which message makes strangers act. The page makes no claim outside [`gtm/messaging.md`](../gtm/messaging.md): it shows no hash, no probability and no accuracy number, because the public record does not exist yet. It links to the v1 app only once `APP_URL` is set. On Oct 27 the domain moves to the live daily receipts page and this page is retired ([0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md), [product/101](../research/product/101-prelaunch-landing-waitlist-ads.md)).

## Who it is for

Strangers arriving from a Reddit or X ad on a phone, who need to understand the idea and act in under a minute. A secondary reader is a forecasting or market-data builder who clicks through from a shared link and judges us by whether the idea is honest. It is not for existing users; there are none yet.

## How we know it works

- Routes: `/` (header with a join button, hero, receipt strip, how-it-works, repeat CTA, footer), `/privacy`, `/terms`. Two Pages Functions: `POST /api/signup` and `POST /api/typeform`. The field and event shapes are defined once in `landing/db/migrations/` (the signup row) and `landing/analytics/TRACKING_PLAN.md` (events); this spec does not restate them.
- The email CTA writes a row to Neon before any Typeform iframe loads, so a Typeform outage never loses a lead ([101](../research/product/101-prelaunch-landing-waitlist-ads.md)).
- The headline is chosen from `utm_content` against the allow-list in [`gtm/prelaunch-ads.md`](../gtm/prelaunch-ads.md); an unknown or missing value falls back to the default headline. The chosen `headline_variant` is recorded on every analytics event and on the signup row.
- Automated checks (Vitest + Playwright, in `landing/`): the headline resolver returns the default for an unknown `utm_content` and the right headline for each known id; the signup form shows each state below from a mocked endpoint (empty, loading, error, duplicate, success); the globe falls back to the poster under `prefers-reduced-motion` and when WebGL is absent; an axe pass finds no violations on `/`. "Works" for the deploy is a Playwright signup on the preview URL that writes a row to Neon and an event to Amplitude.
- Measured after ads run, not tonight: signups by `headline_variant` and `utm_source`, and the step-1 to step-2 drop-off ([101](../research/product/101-prelaunch-landing-waitlist-ads.md)).

## Copy (written literally)

All copy below is the whole of what the page says. `{BRAND}` is the display name from `landing/src/brand.ts` (currently "Real World", [0004](../research/decisions/0004-launch-name-real-world.md)).

### Headlines (message-matched; ids match `gtm/prelaunch-ads.md`)

- `receipts` (default) — H1: "Simulations with receipts." Subhead: "Every morning {BRAND} simulates how the world's population reacts to the day's news. We hash each forecast before anything resolves, then score it in public — the misses too."
- `hashed` — H1: "Forecasts, hashed before the outcome." Subhead: "{BRAND} commits each day's forecast as a hash before the event happens, and scores it in public when it resolves. Nothing is backfilled."
- `public-score` — H1: "We publish our misses." Subhead: "{BRAND} scores its forecasts against the prediction markets in public, wins and misses alike. Watch the record start."
- `your-call` — H1: "Make your call before the world does." Subhead: "Give us your forecast on today's question. When it resolves, we score you against the simulated world and the market price."

### Hero

- Eyebrow (above H1): "A daily, public, scored forecast of the world. Launching Oct 27."
- Contrast line (below the subline, same for every headline): "No accuracy claim. Read the receipts." It restates the line in [messaging](../gtm/messaging.md) and names no competitor.
- Secondary action (below the email form): "See the receipts". It scrolls to the receipt strip. The primary action stays "Join the waitlist"; the header carries a small copy of it on the home page only.
- On a phone the globe sits above the headline, about 250px wide, and the anchored chips are hidden; from 820px the globe is in the right column with two chips (each shows the event, "Pending", and its resolve date).
- Below the globe, a one-line caption: "Simulated population. Not a poll, and not a prediction about any real person."
- Email CTA, default (empty) state:
  - Label: "Get the first receipts in your inbox."
  - Input placeholder: "you@email.com"
  - Button: "Join the waitlist"
  - Consent line (stored version recorded with the row): "We'll email you about {BRAND}'s launch and your forecast. Unsubscribe anytime."
- Email CTA, loading state: button text becomes "Saving…" and is disabled; input is disabled.
- Email CTA, error state (network or server): inline message below the input: "That didn't save. Check your connection and try again." The button returns to "Join the waitlist".
- Email CTA, bot-check failure (server says the Turnstile check failed): "We couldn't confirm you're human. Reload the page and try again."
- Email CTA, rate-limited state (server says too many tries from this visitor): "Too many tries from this device. Wait a few minutes and try again."
- Email CTA, invalid-email state (client-side, before submit): inline message: "Enter an email address like you@email.com."
- Email CTA, duplicate-email state (server returns the existing signup): heading "You're already on the list." Body: "We've got this email. Answer the teaser question below to finish." The Typeform opens as in the success state.
- Email CTA, success state: heading "You're in." Body: "One quick question while you're here — it's the kind {BRAND} scores every day." The embedded Typeform opens below. When `APP_URL` is set, a link also appears: "Try today's question →".
- Turnstile note (shown small near the button): "Protected by a bot check."

### How it works (three steps; allowed claims only)

1. "Simulate. Each morning {BRAND} simulates how the world's population reacts to the day's news, calibrated to published population marginals." 
2. "Hash. We commit the forecast as a hash before the outcome exists, so the record cannot be backfilled."
3. "Score. When the event resolves, we score the forecast in public against the market price and a plain-language-model baseline — misses included."

### Receipt strip (directly under the hero, where other sites put client logos)

- Section heading: "The first receipts."
- Section note: "These are the events {BRAND} will forecast first. No hashes or probabilities are shown here yet. The record starts when the first forecast is hashed."
- Four forecast cards in a row from 820px; on a phone they scroll sideways and snap, with the next card peeking. Each card has a torn bottom edge and shows: "Receipt" and a "Pending" stamp, the question, a "Committed" column ("Hash publishes Oct 14" or "Awaiting hash") and a "Resolves" column (the date and the resolution source). No hash, probability or score appears. Cards read from `landing/src/data/receipts.json`.
- Disclosure on every card: "AI-simulated. Not a poll."
- Motion: the only motion that runs on its own is each event's marker pulsing once on the globe, in turn, and the two chips fading in as their pulse lands. With `prefers-reduced-motion` or without WebGL the globe is the still poster and the chips are simply shown.

### Repeat CTA (footer band)

- Heading: "Watch the record start."
- Button: "Join the waitlist" (scrolls to / focuses the hero email field).

### Footer

- Links: "Privacy" (`/privacy`), "Terms" (`/terms`), "Contact" (`mailto:` the launch inbox, e.g. hello@ the live domain; until the domain exists, this is the value of a config field and is hidden if empty).
- Disclosure line: "{BRAND} outputs are AI-simulated. Simulated populations are not polls and not predictions about real people."
- Copyright: "© 2026 {BRAND}."

### /privacy and /terms

- Both carry a banner at the top: "Draft — reviewed by the founders before launch." Full copy lives in the page components; the privacy page lists what we collect, the processors (Cloudflare, Neon, Amplitude, Typeform, Reddit, X), the purpose, retention, deletion on request, and that we do not sell data. See `landing/RUNBOOK.md` for the go-live review step.

## What it is not

- Not the launch. It never links to a waitlist from Show HN; Show HN links the live daily page ([launch plan](../gtm/launch-plan.md)). It is deleted on Oct 27.
- Not a place that shows a forecast number, a hash, a probability or an accuracy claim. The record does not exist yet, and inventing one is forbidden ([messaging](../gtm/messaging.md), [CLAUDE.md](../CLAUDE.md)).
- Not the app. No account, no daily question answered here, no fork. The teaser forecast is collected by Typeform for the waitlist only.
- Not targeted outside the US until a consent banner exists ([101](../research/product/101-prelaunch-landing-waitlist-ads.md)).
- Not built in `web/`; it is a separate app so it cannot break the launch ([0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md)).

## Where the code lives

- `landing/` (Vite + React + TypeScript on Cloudflare Pages; Pages Functions for signup and the Typeform webhook; Neon Postgres; Amplitude).
- Rests on: [0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md), [0004](../research/decisions/0004-launch-name-real-world.md), [product/101](../research/product/101-prelaunch-landing-waitlist-ads.md), [lenses/cpo.md](../research/lenses/cpo.md), [open-source/041](../research/open-source/041-globe-visualization.md), [engineering/071](../research/engineering/071-web-app-stack.md), [messaging](../gtm/messaging.md).
