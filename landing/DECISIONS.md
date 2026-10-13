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

## Milestone B: sections below the hero (`landing/7-sections`)

### B1. What goes below the receipts

Options:
1. Eight or more sections: thesis, how it works, use cases, research, FAQ, roadmap, team, collaboration.
2. Four new sections only (thesis, use cases, research and limits, collaboration) plus the existing how it works and repeat CTA.
3. Leave the page as it is.

Evidence: the screenshot critique at 390x844 and 1440x900, two passes (`design/section-passes/pass1-*` and `pass2-*`). Pass 1 showed the thesis statement works as the one large type moment, but the collaboration band had nothing to press and was as tall as the content sections. Pass 2 fixed both (one row on desktop, an action that focuses the waitlist field). The page is about 3,360 px tall on desktop and about 4,600 CSS px on a phone, which is already long for a visitor from an ad, so more sections were rejected. A roadmap, team and FAQ would need content that is not approved for public use.

Risks and reversibility: every new sentence is a restatement of an allowed claim in [gtm/messaging.md](../gtm/messaging.md) or a statement of what we leave out; `src/copy/sections.test.ts` fails on forbidden claims and on competitor, price, funding, model and "demo" wording. Each section is one component and one line in `App.tsx`, so any can be removed alone.

Checks: copy against messaging.md (done by the test and by reading); privacy (no new data collected; four new `section_viewed` values and one `outbound_clicked` value, in the tracking plan); mobile and desktop critique (above); axe on `/` passes on both viewports.

Decision: option 2. Runner-up: option 1 minus the FAQ and roadmap. Would change our mind: measured scroll depth (the "Sections seen" chart) showing most visitors never reach the lower sections, in which case cut them; or a founder-approved FAQ.

### B2. Collaboration call to action

Options: a contact form of its own; a mailto link; the waitlist's role question as the entry point.

Evidence: `BRAND.contactEmail` is empty because email routing does not exist yet (RUNBOOK section 3), so a mailto would be a dead address. The waitlist form already asks "Which best describes you?" with "Developer or builder" among the answers.

Decision: a mailto link when `contactEmail` is set; until then a button that focuses the waitlist field ("Join the waitlist and choose your role"). The waitlist stays the single dominant action and no partner is named. Runner-up: a form (a second place to collect email, so rejected). Would change our mind: collaboration enquiries that do not want to join a list.

### B3. LCP: pre-render, Preact, or leave as shipped

Options:
1. Leave the React bundle as it is (Rohit's 2026-10-12 decision, made before this brief gave the choice back).
2. Swap React for Preact to shrink the JavaScript.
3. Pre-render the home page into the HTML at build time and hydrate it.

Evidence (Lighthouse mobile, simulated slow 4G, 4x CPU, the method in [perf/LIGHTHOUSE.md](perf/LIGHTHOUSE.md); all on the build with the new sections):

| Series | Where | Runs | LCP median | Under 2.0 s | LCP range |
| --- | --- | --- | --- | --- | --- |
| F, as shipped (no pre-render) | local preview | 8 | 2085 ms | 3 of 8 | 1830 to 2130 ms |
| G, pre-rendered | local preview | 12 (8 + 4 on another headline) | 1805 ms | 12 of 12 | 1803 to 1812 ms |
| H, as shipped | live staging | 8 | 2274 ms | 2 of 8 | 1832 to 2514 ms |
| I, pre-rendered | live staging, run right after H | 8 | 2027 ms | 4 of 8 | 1774 to 2645 ms |
| J, pre-rendered and stylesheet inlined (tried, reverted) | live staging | 8 | 2082 ms | 1 of 8 | 1871 to 2356 ms |

The LCP element was the globe poster image in every run. Its real load is about 20 to 200 ms; without pre-rendering the image only exists once JavaScript has run, which Lighthouse's simulation counts. Pre-rendering took local LCP from 3 of 8 to 12 of 12 under 2.0 s, but on the live host it moved the median by about 250 ms (2274 to 2027) and the count from 2 to 4 of 8, with FCP steady near 1.8 s. So pre-rendering is a measured improvement, and the budget is still not reliably met on the live host. Inlining the 3 KB stylesheet cut FCP (about 850 to 1400 ms) but not LCP, and was worse on the count, so it was reverted. Live and local differ because the live runs add real network time to first byte (90 to 210 ms in the reports). Preact was not built or measured: pre-rendering already puts the element in the HTML, so what remains is network path, which a smaller bundle does not change much.

Risks and reversibility: pre-rendering adds a build step (`scripts/prerender.mjs`) and a hydration path. The risks are a hydration mismatch and home markup flashing on `/privacy` and `/terms`. Mitigations, each tested in `e2e/landing.spec.ts`: the h1 and subline for each `utm_content` are swapped by an inline script before first paint so hydration sees the text it renders; the script empties the root on any path but `/`; with JavaScript off the headline, email field and poster are in the HTML; each variant loads with zero console errors and a working form. Reversible by removing the `prerender.mjs` step from `build` and `build.mjs`; `main.tsx` falls back to `createRoot` when the root is empty.

Checks: copy unchanged; privacy unchanged (the markup is what the page already shows); no tracking change (analytics still start after load or first interaction).

Decision: option 3, kept because it is a measured gain with the tests green (54 end-to-end tests, 44 unit tests), and not claimed as meeting the budget on the live host. Runner-up: option 1. Would change our mind: real-user LCP from the first ad days (the lab number is a simulation), or a hydration problem in the field. Still open if the budget matters: reduce what competes with the poster on first paint (the 80 KB script and two fonts are fetched in parallel with it), or serve the hero from a single smaller poster.

### Left out of Milestone B, and why

- Pricing, customers, ICP language, funding or accelerator plans, competitor names and positioning tables: private strategy ([gtm/messaging.md](../gtm/messaging.md) positioning is for us, not the page).
- Research findings on persona panels, vendors' accuracy, the red-team and lens documents: internal; the page says only that we claim nothing about accuracy.
- Model, prompt and engine details (which model, how archetypes are called, agent counts): not allowed as a headline and not needed.
- Any live demo, v1 link, API description, or anything depending on `APP_URL`: out of scope by the brief; the "Try today's question" link remains hidden while `APP_URL` is empty.
- Partner, advisor or customer names, team bios, a roadmap and dates other than Oct 27 and the three event dates: no approved source.
- Backtest numbers and any accuracy figure: forbidden by messaging.md.
