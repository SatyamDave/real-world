# Landing page build plan

Recovery checklist for the overnight build. Tick items as they land. Branches are stacked: each PR's base is the previous PR's branch (nothing merges to `main` tonight). Rebase the stack onto `origin/main` before starting each branch.

Legend: [ ] todo · [x] done · [~] in progress · [B] blocked (see OVERNIGHT_LOG)

## Step 0 — preflight
- [x] Tool versions, connector auth, `.dev.vars` key audit
- [x] Read required docs and lenses
- [x] Teaser question chosen and date verified
- [x] PLAN.md + OVERNIGHT_LOG.md written

## PR 1 — docs (`landing/1-docs`, title `docs: pre-launch landing page`) — DONE, draft PR #19
- [x] Add `research/product/101-prelaunch-landing-waitlist-ads.md` (already local, not on main)
- [x] `research/decisions/0003-prelaunch-landing-and-waitlist.md` (status proposed)
- [x] `research/decisions/0004-launch-name-real-world.md` (status proposed; Satyam approves in PR)
- [x] Remove item 1 from `company/decisions-needed.md`; 085 caveats kept in 0004 revisit triggers
- [x] `product/landing-page.md` (five spec questions; all states written literally)
- [x] `gtm/prelaunch-ads.md` (UTM scheme, headline allow-list with ids, channels Reddit+X, $50/day/channel×3d cap, kill rule, no election/policy)
- [x] draft PR #19 opened (base main)

## PR 2 — design + page (`landing/2-page`, title `feat(landing): page and globe`) — DONE
- [x] frontend-design skill; 3 directions in `landing/design/direction-{a,b,c}/`
- [x] Screenshots 390×844 + 1440×900 each (Playwright)
- [x] Scores logged (A 19 / B 16 / C 16); winner A → `tokens.css`; b/c swappable (one import line). Table also in MORNING.md
- [x] Scaffold Vite+React+TS, Biome/Vitest/tsc; exact versions pinned; pnpm-workspace + `make landing-dev`; make check covers it
- [x] cobe globe lazy (dynamic import), poster fallback (no-WebGL, reduced-motion), Natural Earth poster, pause offscreen/hidden
- [x] Sections: hero, how-it-works (allowed claims), receipts preview (pending, no fake hashes), repeat CTA + footer
- [x] Message match `utm_content` → `headlines.ts` (ids match gtm); variant on every event; signup row carries it (PR3)
- [x] APP_URL gating of "Try today's question" + device-id append (hook ready; real id in PR4)
- [x] OG image (og.png), favicon.svg, a11y (skip link, visible focus, alt, labels)
- [x] Build: critical JS 74.6KB gz (<120), cobe split 5.9KB gz; smoke-tested in browser, 0 console errors
- [ ] /ship-pr draft PR (base landing/1-docs)

## PR 3 — data (`landing/3-data`, title `feat(landing): waitlist storage`) — DONE, draft PR
- [x] Neon project `real-world-landing` (id frosty-river-82145431), db `landing`, dev branch; conn strings written to `.dev.vars`
- [x] Migrations `0001_init.sql`, `0002_rate_limit.sql` applied dev -> main; no IPs stored
- [x] `POST /api/signup` (Turnstile, email validation, insert/duplicate, Amplitude event, hashed-IP rate limit)
- [x] `POST /api/typeform` (log first, constant-time HMAC, first answer wins, idempotent, Amplitude event)
- [x] Typeform as code (`typeform/form.json`, `scripts/typeform-sync.mjs`), `@typeform/embed` lazy-loaded; form is created at deploy time (step 5)
- [x] Tests: 12 unit + 8 Neon-dev integration (skipped without DATABASE_URL_DEV)
- [x] draft PR

## Design pass (`landing/design-pass`, title `feat(landing): design pass from competitor analysis`) — DONE, draft PR #23, stacked on #22
- [x] Competitor screenshots (local, git-ignored) + INSPIRATION.md (table, top 8 patterns, what Real World does differently)
- [x] frontend-design plan (DESIGN-PASS.md): kept A, re-scored 20/15/16
- [x] Receipt strip, hero, contrast line, CTA row, pulses, mobile layout
- [x] design:ux-copy (COPY.md), checked against gtm/messaging.md; spec updated
- [x] Quality loop x3 (critique in PR body), design:accessibility-review (A11Y-REVIEW.md)
- [x] Lighthouse (LCP 1.81 s median, CLS 0.0003, perf 99, a11y 100) and JS budget pass; before/after screenshots in PR
- [x] code review, draft PR, CI green

## PR 4 — analytics (`landing/4-analytics`, title `feat(landing): amplitude tracking`) — in review
- [x] `@amplitude/analytics-browser` 2.47.2 with autocapture + attribution + UTM; session-replay plugin 1.35.5 (sample rate, email masked); both lazy
- [x] `landing/analytics/TRACKING_PLAN.md` with the full event list; every event carries headline_variant
- [x] One `track()` wrapper fanning out to Reddit + X pixels (env-flagged, signup id as dedupe key, Lead on save only); GPC/DNT off-switch
- [x] 15 event definitions registered in Amplitude project 877388 (planned events)
- [x] Funnel dashboard built after the preview verification (Amplitude dashboard rm64etf3, personal and unpublished); link in MORNING.md
- [x] draft PR #24

## PR 5 — launch readiness (`landing/5-readiness`, title `chore(landing): launch readiness`) — in review
- [x] `/privacy` + `/terms` drafts written from what the code does; processors listed; US-only; draft banner until founders review
- [x] Consent line + stored version (already in PR2/3; privacy page states the version)
- [x] Perf budgets: `check:bundle` (first-load JS 75.7 KB gz); Lighthouse with the SDK and full-rate replay active, 8 runs: LCP 1.80 to 1.98 s on 7, one cold-start outlier at 2.66 s; CLS 0.0003
- [x] Playwright e2e (40 tests, mobile + desktop): globe fallbacks, reduced motion, signup states (mocked), message match, receipts, legal pages, axe on all three routes
- [x] Ad creative: `pnpm ads` -> 12 PNGs in `landing/ads/` (4 headlines x 3 sizes), forbidden-claim and safe-zone checks
- [x] `landing/RUNBOOK.md` incl. tryrealworld.com -> Cloudflare Pages steps (not performed), secrets, webhook, deploy/rollback, CSV export, tracking verification, Reddit/X setup, go-live, retire Oct 27
- [x] draft PR #25

## Final — deploy + MORNING.md
- [x] engineering:deploy-checklist, then `wrangler pages deploy --branch landing-preview` (project `real-world-landing` created; preview environment set through the Pages API: dev Neon branch, Turnstile test secret)
- [x] Verified on the preview: browser signup -> Neon row -> Amplitude events (browser and server, same device and signup id); signed Typeform webhook valid, replay, tampered, unsigned
- [x] Deleted only the test rows created, by id (dev and main Neon branches both at 0 rows)
- [x] `landing/MORNING.md`
- [x] LCP budget not reliably met on the live preview (3 of 6 runs); decided ship as-is by Rohit, judged on real-user numbers once ads run (MORNING.md). Milestone B may revisit with proof; see landing/perf/LIGHTHOUSE.md

## Revised priorities (2026-10-13): best landing page, working waitlist, ads-ready fast

Waitlist is the only call to action; v1 is not connected before ads. Decisions follow the protocol in [DECISIONS.md](DECISIONS.md).

### Milestone A: ads-ready (`landing/6-envs`, off `landing/5-readiness`)
- [x] Environments: dev logs to the console, staging is the Pages preview, prod is the Pages production branch. Every event carries `environment`. Two Amplitude keys in `.dev.vars`.
- [x] Neon `staging` branch; preview uses staging values only (`scripts/set-staging-env.mjs`); schema on `main` verified (3 tables, 0 rows)
- [x] `scripts/set-prod-secrets.sh` written, not run; `scripts/build.mjs` refuses test keys for production
- [x] Amplitude: autocapture and sampled session replay (100% staging, 10% prod), funnel plus five charts (6 of the 10-chart limit), guide for a beginner, one experiment proposed and not launched
- [x] Retested on staging; events carry `environment = staging`; the Prod project has zero events
- [x] Real Typeform submission through the embed on staging with Playwright; the signed webhook filled the row; test data deleted by id
- [x] Legal drafts tightened to the code; `LEGAL_REVIEW.md` for a lawyer
- [x] RUNBOOK go-live checklist; stale "4 devices" notes fixed
- [x] draft PR [#92](https://github.com/SatyamDave/real-world/pull/92)

### Milestone B: design and content (`landing/7-sections`, separate draft PR)
- [x] frontend-design: thesis, use cases, research and limits, collaboration CTA (contact only); how it works kept
- [x] No live demo, no v1 link, nothing that depends on APP_URL; waitlist stays the single dominant call to action
- [x] Screenshot critique loop twice at 390x844 and 1440x900; Lighthouse and axe; LCP (not reliably met live) and CLS reported honestly. PR [#93](https://github.com/SatyamDave/real-world/pull/93)
- [x] Pre-rendering adopted (measured gain, tests green); Preact not tried; live budget still not reliably met (DECISIONS B3)

### Later
- [x] `landing/SYNC.md`: a manual prompt to sync landing copy to product changes as a draft PR (one file, no watcher)

### Finish
- [x] MORNING.md: evidence per milestone, what still needs Rohit, mistakes. Stop servers and browsers, clean tree.

## One-shot: Tally, award-level UI, public research (2026-10-13)

Order: Phase 1, then 2, then 3, then Finish. Commit after each phase. Resume from the first unchecked box. Decisions follow the protocol in DECISIONS.md (Milestone C).

### Phase 1: Tally instead of Typeform (`landing/8-tally`, off `landing/7-sections`, draft PR on top of #93)
- [x] Verify Tally facts from docs: hidden fields on the free plan and how they reach the embed; the `Tally-Signature` header and what it signs; payload shape; retries and duplicates; CSP the embed needs
- [x] Screenshot and report the free-plan "Made with Tally" badge (not possible: no free-plan form to load; reported in DECISIONS C1 and FORM_SPEC step 9)
- [x] Replace the Typeform webhook and embed with Tally (signature, replay, tamper, idempotency); remove Typeform code and `TYPEFORM_TOKEN`
- [x] Per-environment secrets and form ids; `set-prod-secrets.sh`, RUNBOOK, go-live checklist
- [x] `landing/tally/FORM_SPEC.md`: click-by-click for two forms (staging, prod)
- [x] Privacy page and LEGAL_REVIEW.md: Tally is a processor
- [x] Commit, push, draft PR [#98](https://github.com/SatyamDave/real-world/pull/98)

### Satyam sync (added mid-run)
- [x] Fetched origin/main; Satyam merged main into the landing stack and added a cookie notice; Phase 1 rebased onto `origin/landing/7-sections` (SYNC.md)
- [x] Screenshots of his UI and ours in `design/satyam-diff/`
- [ ] `design/SATYAM_DIFF.md`: every difference that makes his better, and why
- [ ] Adopt the improvements as tokens and patterns (not his components); log each in DECISIONS.md
- [ ] Tell Rohit what to copy from his agent workflow

### Satyam's product memo (pasted mid-run, 2026-10-13): incorporate without leaking
- [ ] Use the memo's lesson: people adopt a fast answer to their own decision and believe it after seeing it checked; spectators are not retained, a stake is. So the page's job is to get a *personal call*: every globe marker opens a pending receipt with "Make your call" (the waitlist field, no v1 link)
- [ ] Always show the baseline and keep misses visible (already allowed copy); "sealed" is the plain word
- [ ] A 10-second honest "what happens next" for the first question: sealed, resolves, scored (from `receipts.json`)
- [ ] Keep private: TypeSafe, MiroFish, Rally, Reach, prediction-market and consumer-trust figures, product directions A, B, C, the cut list. The copy test bans the names
- [ ] DECISIONS C6: the tension between "the globe may be demoted" (his memo, undecided) and Rohit's globe-as-hero brief
- [ ] Phase 3: add ForecastBench and the FRI update to the papers to verify (do not repeat the memo's figures unless the source says them)
- [ ] FORM_SPEC: optional "Creator or publisher" role option, to test direction A with real waitlist data (flagged as optional)
- [ ] Not done on purpose: the product brief the memo offers to write (out of scope of the landing run)

### Phase 2: Milestone C, an award-level page (`landing/9-wow`, off `landing/8-tally`, draft PR)
- [ ] Audit first, no code: `design/UI_AUDIT.md` (screenshots at 390x844 and 1440x900, ruthless critique); references listed in `INSPIRATION.md`
- [ ] `design/EQUIP.md`: options, byte costs, recommendation (skills, OGL/raw shaders/cobe, GSAP, Lenis, CSS scroll-driven, View Transitions)
- [ ] Three bold directions scored against the audit; one picked and logged
- [ ] Interactive globe like Google Earth: drag with inertia, pinch, zoom buttons, reset, marker click to receipt cards; no scroll hijack; touch scrolls vertically; keyboard; accessible alternative; reduced motion; honest pending markers only
- [ ] Scroll story; waitlist stays the one dominant action; no demo, no v1 link, nothing on APP_URL
- [ ] Budgets: poster first, globe after first paint on capable devices only, static fallback; Amplitude events for drag, zoom, marker open; Lighthouse/CLS/LCP before and after, local and live staging
- [ ] Screenshot critique loop at least three times at both sizes; say plainly if not clearly better
- [ ] Commit, push, draft PR

### Phase 3: public research citations (same branch)
- [ ] `design/PAPERS.md`: every source opened and verified (title, authors, year, exact finding); unverifiable entries dropped
- [ ] A citations section on the page; every line checked against `gtm/messaging.md`; no accuracy implication
- [ ] Commit

### Phase 4: Satyam's directives (pasted mid-run, 2026-10-13; read his PR comments every phase)
Review comments on #22 and #24 are tracked in `landing/REVIEW_LOG.md` with the commit that answers each.
- [ ] #22: remove `referrer`; `landing_path` is always "/" (only the home page has the form), remove it too; say so in the migration comments
- [ ] Sister DB "D1": the waitlist and conversion data move to Cloudflare D1 (SQLite, like the product's main DB "R1"); email is the primary key (lower-cased, same rule as R1's `users.email`); a random `spoof_id` is the only id analytics sees; no product user id ever enters D1
- [ ] R1: a proposal for the column that shows which users came from the waitlist (api/ is read-only for me), and a one-way sync from R1 emails to D1 `converted_at`
- [ ] Amplitude: which waitlist people convert, filterable for ICP (role, source, variant); the same data saved in D1; cookie policy respected for Amplitude
- [ ] LaunchDarkly: flag abstraction, consent-gated, flags for the headline and one small change at a time; no account or keys exist here, so tests use a fake and live verification is open
- [ ] Iteration loop: staging flag on, end-to-end check, then prod flag on a person's say-so, then read the Amplitude drop-off; every iteration stored in D1 `experiments`
- [ ] SEO: canonical, Open Graph, sitemap, robots, structured data; per-environment noindex
- [ ] Reference sites converted to design tokens (`design/REFERENCE_TOKENS.md`), compared with `product/design.md`
- [ ] Relocation: `landing/` out of the repo root as a skin of the product; a proposal and one script, not run (it touches every open PR and his guards)
- [ ] Keep reading origin/main docs, gtm and research; shape the work to the direction (consumer pivot 0012 is open as #99)

### Finish
- [ ] Check `.dev.vars` for `TALLY_SIGNING_SECRET_STAGING` and the staging form id; if present, real Playwright submission on staging plus replay, tamper, unsigned, cleanup by id; if not, first unchecked item in MORNING.md
- [ ] MORNING.md, PR bodies, RUNBOOK; stop servers and browsers; clean tree
