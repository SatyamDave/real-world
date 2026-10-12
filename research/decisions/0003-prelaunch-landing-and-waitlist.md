# 0003: Pre-launch landing page and waitlist

- Date: 2026-10-12
- Status: proposed
- Rests on: [product/101](../product/101-prelaunch-landing-waitlist-ads.md), [product/085](../product/085-naming-trademark.md), [open-source/041](../open-source/041-globe-visualization.md), [engineering/071](../engineering/071-web-app-stack.md), [lenses/cto.md](../lenses/cto.md), [lenses/cpo.md](../lenses/cpo.md), [0001-architecture](0001-architecture.md)

## Decision

We ship a temporary pre-launch page as its own app in `landing/`, separate from `web/`, live from Oct 13 to Oct 27. It is a Vite + React + TypeScript single-page app hosted on Cloudflare Pages, with two Pages Functions (`/api/signup`, `/api/typeform`). Signups are stored first in our own Neon Postgres table, then enriched by an embedded Typeform (role and one teaser forecast) joined on a `signup_id`; native email capture never depends on Typeform being up. Behaviour is tracked in Amplitude (browser SDK plus server events that reuse the browser `device_id`). The hero uses a dot-sampled [cobe](../open-source/041-globe-visualization.md) globe, lazy-loaded after first paint with a static poster for no-WebGL and reduced-motion visitors, not the app's react-globe.gl/three.js globe. The page links to the v1 app through an `APP_URL` config value on a separate subdomain, and hides every "Try it" link while `APP_URL` is empty. The display name lives in one file, `landing/src/brand.ts` ([085](../product/085-naming-trademark.md)). Every claim on the page comes from the allowed list in [`gtm/messaging.md`](../../gtm/messaging.md); no hash, probability or accuracy number is shown. On Oct 27 the apex domain moves to the live daily receipts page and this page is retired; see [`product/landing-page.md`](../../product/landing-page.md).

## Options considered

| Option | For | Against |
| --- | --- | --- |
| A separate `landing/` app (chosen) | Cannot collide with the v1 app being built in `web/` in parallel; can be deleted whole on Oct 27; its own deploy, deps and risk ([101](../product/101-prelaunch-landing-waitlist-ads.md)) | A second small app to maintain for two weeks |
| Build the page inside `web/` | One app, one deploy | Couples a throwaway marketing page to the launch app's build and router; a landing change can break the daily page ([101](../product/101-prelaunch-landing-waitlist-ads.md)) |
| Neon Postgres for signups (chosen) | Serverless driver runs on Cloudflare Workers over HTTP; same engine family as the planned production DB; owns the lead before Typeform ([101](../product/101-prelaunch-landing-waitlist-ads.md), [cto.md](../lenses/cto.md)) | A second managed service for a two-week page |
| Cloudflare D1 / KV for signups | No extra vendor | D1 is the wrong store for the production path; a throwaway choice we would migrate anyway ([0001](0001-architecture.md), [cto.md](../lenses/cto.md)) |
| Two-step signup: native email then embedded Typeform (chosen) | Email row is saved before any iframe loads, so a Typeform cap or failure never loses a lead; Typeform adds the forecast hook cheaply ([101](../product/101-prelaunch-landing-waitlist-ads.md)) | Two systems to join; a join key to carry through the URL |
| Typeform only | One form | A response-cap or iframe failure loses the lead outright ([101](../product/101-prelaunch-landing-waitlist-ads.md)) |
| cobe globe, lazy after first paint (chosen) | ~5 KB, no three.js, fast first paint on the phones ad traffic lands on ([041](../open-source/041-globe-visualization.md)) | A different globe library than the app; the receipt-pulse visual is bespoke |
| Reuse the app's react-globe.gl globe | One globe everywhere | three.js is a much heavier first paint; the wrong trade for a phone ad landing page ([041](../open-source/041-globe-visualization.md), [071](../engineering/071-web-app-stack.md)) |
| Cloudflare Pages host (chosen) | Static files, preview deploys per branch, Pages Functions for the two endpoints, no commercial-use licence trap ([071](../engineering/071-web-app-stack.md)) | Pages Functions differ slightly from a standalone Worker |
| Vercel host | Familiar | Hobby is non-commercial only; Pro is a paid plan for a two-week page ([071](../engineering/071-web-app-stack.md)) |

## Why this one

It is the smallest page that does the two jobs the launch plan does not cover — test which message makes strangers act, and collect a first cohort of daily-question players — without risking the v1 app or losing a lead ([101](../product/101-prelaunch-landing-waitlist-ads.md)). Keeping it in its own folder, on its own deploy, with the name in one config field, means it can be retired on Oct 27 by pointing the domain elsewhere and deleting a folder, with nothing left coupled to the launch. The storage, analytics and globe choices each follow the note that studied them.

## What would make us revisit it

- Oct 27 arrives: the apex domain moves to the live daily receipts page and this page is retired ([launch plan](../../gtm/launch-plan.md)).
- The embedded Typeform measurably slows the mobile page (step-1 to step-2 drop-off in Amplitude worsens): drop the iframe and keep role and forecast as native fields ([101](../product/101-prelaunch-landing-waitlist-ads.md)).
- Ads are approved for the EU or UK: a consent banner is required before this page may run there ([101](../product/101-prelaunch-landing-waitlist-ads.md)).
- The launch name changes from the working name: update `landing/src/brand.ts` only ([085](../product/085-naming-trademark.md), [0004](0004-launch-name-real-world.md)).
