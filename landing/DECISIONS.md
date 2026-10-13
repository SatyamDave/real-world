# Landing decisions

Each decision follows one protocol: options (at least three when it is not trivial), evidence, risks and reversibility, checks, then the decision, the runner-up and what would change it. Nothing here has an external side effect: no merge, no DNS, no production deploy, no production secret, no spend, no message to anyone. This file is in the private repo and is not shipped with the page.

Privacy of strategy: the page is public, the repo is private. The page may use only text approved in [gtm/messaging.md](../gtm/messaging.md) and what the page already says. Each milestone ends with a list of what was left out and why.

## Milestone A: environments, analytics, legal, runbook

### A1. How to separate dev, staging and prod in Amplitude

Options:
1. One project, an `environment` property, one key everywhere.
2. Two projects (the plan caps us at two): Staging, and Prod used only by production; dev logs to the console; every event also carries `environment`.
3. Three projects, one per environment.

Evidence: the Amplitude connector lists exactly two projects, `877388` Real World - Staging and `878019` Real World - Prod, and the brief says the cap is two, so option 3 is unavailable. Option 1 puts test traffic and real traffic in the same funnel and relies on every chart filtering correctly. Measured after the change: Staging holds events tagged `staging`, and Prod held zero events in the last 30 days (query on 2026-10-13).

Risks and reversibility: reversible (keys and a property). The risk in option 2 is staging code holding the prod key. `scripts/build.mjs` refuses a production build when the two keys are equal or the Turnstile site key is a test key, and the production key exists only in the production build and the production secret.

Checks: no copy change; no new data collected; the privacy page already lists Amplitude.

Decision: option 2. Runner-up: option 1, which would be fine for one environment. Would change our mind: a plan with more projects, at which point dev would get its own.

### A2. Where `ENVIRONMENT` is set for the Pages functions

Options:
1. A plain-text variable in the Pages dashboard or API.
2. A secret.
3. `[env.preview.vars]` and `[env.production.vars]` in `wrangler.toml`.

Evidence: I tried option 1 first. The first staging run tagged its four server events `production` in the Staging project, because Pages ignores dashboard plain-text variables when a `wrangler.toml` exists (found by querying the events by `environment`). After moving the variable into `wrangler.toml` the next signup's server events carried `staging`. That miss was visible only because an unset value is deliberately read as `production` rather than as a test environment.

Risks and reversibility: reversible. A variable in `wrangler.toml` is in the repo, which is fine because it is not a secret and a reviewer can see it.

Decision: option 3. Runner-up: option 2 (works, but hides a non-secret). Would change our mind: Pages allowing dashboard variables next to `wrangler.toml`.

### A3. Which Neon branch the preview uses

Options: reuse `dev` (what the preview used on 2026-10-12); a new `staging` branch from `main`; point the preview at `main`.

Evidence: `main` holds the schema and zero rows (checked 2026-10-13: three tables, 19 columns on `waitlist_signups`, 0 rows), so a branch from it starts clean. The preview on `dev` shared a database with the local integration tests, which delete rows by id; staging runs would have raced with them.

Risks and reversibility: a Neon branch is cheap and deletable. Pointing the preview at `main` would put test rows in the real waitlist.

Decision: a `staging` branch. Runner-up: keep `dev`. Would change our mind: Neon branch limits.

### A4. Session replay sample rate

Options: replay every session; 10% in production and 100% in staging; no replay.

Evidence: the brief gives a 10,000 replay cap. At 10% the cap is reached at 100,000 sessions a month. Our monthly sessions are unknown until ads run (cap and budget are in [gtm/prelaunch-ads.md](../gtm/prelaunch-ads.md); no traffic number exists). Replays recorded on staging show the SDK recording.

Risks and reversibility: the rate is a build variable, so lowering it is a rebuild. A session recorded and not needed costs only quota. Inputs are masked by the SDK's default; I did not watch a replay to confirm it, which is on the lawyer list.

Decision: 100% staging, 10% production. Runner-up: 25% production. Would change our mind: the usage page after the first ad day.

### A5. One Typeform or two

Options: one form for both environments with its webhook moved at go-live; two forms (staging and production); a shared form with the webhook URL carrying the environment.

Evidence: a Typeform webhook is one URL per form. With one form, the day the webhook points at production a staging test would post to the production database (rejected today only because the signup id would not exist there).

Decision: two forms, the second created at go-live by `typeform-sync.mjs --env production`. Runner-up: one form. Would change our mind: a webhook that can fan out to two URLs.

### A6. The one web experiment

Options: test a hero button label; test the page order (receipts strip above or below the fold); test whether the hero's secondary link "See the receipts" helps or hurts.

Evidence: unknown baseline conversion, so no sample size can be computed yet. Ads already vary the headline through `utm_content`, so a headline test would duplicate that. The button label has no allowed alternative in gtm/messaging.md.

Decision: propose the secondary-link test, do not launch it ([AMPLITUDE_GUIDE.md](analytics/AMPLITUDE_GUIDE.md)); run it only if the first ad days show enough visitors. Runner-up: page order. Would change our mind: a visitor count that makes any test infeasible, in which case none runs.

### A7. Legal pages

Options: keep the drafts and tighten them against the code; replace them with a generated template; ship them unchanged.

Evidence: the drafts omitted that the device id is stored with the signup, that Typeform keeps and sets cookies of its own, that Amplitude stores a browser id, and that Turnstile loads on form focus. A template would not know these.

Decision: tighten the drafts, keep the draft banner, and put every open legal question in [LEGAL_REVIEW.md](LEGAL_REVIEW.md). Runner-up: a template plus edits. Would change our mind: a lawyer's own text.

### Left out of Milestone A, and why

The analytics guide, runbook and decisions describe how we operate; none of that is on the page. The page itself changed only on the privacy text, which states what we collect. Nothing about pricing, customers, YC or the engine appears anywhere in what is shipped.
