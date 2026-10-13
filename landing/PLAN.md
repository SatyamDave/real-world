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

## PR 4 — analytics (`landing/4-analytics`, title `feat(landing): amplitude tracking`)
- [ ] `@amplitude/analytics-browser` autocapture+attribution+UTM; session-replay plugin w/ sample rate; mask email
- [ ] `landing/analytics/TRACKING_PLAN.md` with the full event list; all carry headline_variant
- [ ] One `track()` wrapper fanning out to Reddit + X pixels (env-flagged, event_id dedupe, Lead on save)
- [ ] Register event definitions + build dashboard via Amplitude connector; link in MORNING.md
- [ ] /ship-pr draft PR

## PR 5 — launch readiness (`landing/5-readiness`, title `chore(landing): launch readiness`)
- [ ] `/privacy` + `/terms` (draft, reviewed by founders); processors list; US-only; consent-banner follow-up
- [ ] Consent line + stored version
- [ ] Perf budgets (LCP<2.0s, CLS<0.05, JS<120KB gz); Lighthouse numbers in PR + MORNING
- [ ] Playwright e2e: mobile+desktop, globe fallback, signup happy path (mocked), duplicate email, reduced motion
- [ ] Ad creative script → PNGs 1080×1080/1350/1920 per headline id into `landing/ads/`; safe zones; no politics
- [ ] `landing/RUNBOOK.md` (domain/DNS, Pages custom domain, app subdomain, email routing, secrets, webhook, deploy/rollback, CSV export, tracking verification, Reddit/X ad setup, retire Oct 27)
- [ ] /ship-pr draft PR

## Final — deploy + MORNING.md
- [ ] engineering:deploy-checklist, then `wrangler pages deploy --branch landing-preview`; set preview secrets
- [ ] Verify on preview: Playwright signup (test+<ts>@…), row in Neon, events in Amplitude
- [ ] Delete only the test rows created, by id
- [ ] `landing/MORNING.md`: preview URL, done, screenshots, decisions to check, blocked + click-by-click, 10-step go-live checklist
