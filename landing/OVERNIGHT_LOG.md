# Overnight log — pre-launch landing page

Running unattended from ~02:55 PT on 2026-10-12. One line per decision: time (PT), decision, why, how to reverse. Blocked items at the bottom.

## Preflight (Step 0)

- 02:56 — Tooling: node 23.7.0, pnpm 11.2.2, wrangler 4.149.0, gh 2.102.0. No `zeroshot` and no `neonctl` on PATH. Why: measured with `--version`. Reverse: n/a.
- 02:56 — Ignoring the Zeroshot section of CLAUDE.md. Why: `zeroshot --version` is "command not found", and CLAUDE.md gates it on that. Reverse: install Zeroshot and re-read that section.
- 02:57 — Neon connector authenticated; `list_projects` returns `[]` (no projects yet). Amplitude connector authenticated (org `old-tooth-895556`, plan `starter_v4`, one project appId `877388` "default"). Cloudflare: `wrangler whoami` shows a logged-in token with `pages (write)`. Playwright MCP present. Why: called one read-only check on each. Reverse: n/a.
- 02:58 — `landing/.dev.vars` keys present: AMPLITUDE_API_KEY, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, TYPEFORM_TOKEN, TYPEFORM_WEBHOOK_SECRET are SET; DATABASE_URL, DATABASE_URL_DEV, APP_URL are EMPTY. Values never printed. Reverse: n/a.
- 02:58 — `.dev.vars` is already git-ignored via `.git/info/exclude:8`. Added a committed `landing/.gitignore` with `.dev.vars` as a durable, shared guard. Why: the local exclude is not shared and not visible in the tree. Reverse: delete `landing/.gitignore`.
- 03:00 — Teaser question = the US Fed rate decision on 2026-10-28. Why: `data/fixtures/questions.json` holds only `FIXTURE:`/example.com illustrative questions (not a real committed list), so the brief's default applies. Date verified on federalreserve.gov (FOMC meets Oct 27-28, decision on the 28th). Reverse: swap the question in `landing/src/brand.ts` / teaser config once Satyam commits a real question list.
- 03:00 — APP_URL is empty, so every "Try it / Try today's question" link is hidden until it is set. Why: brief + the v1 app URL is unknown tonight. Reverse: set APP_URL in `.dev.vars` and the Pages env.

## Decisions

- 03:15 — PR1 docs: used decision numbers 0003 (landing/waitlist) and 0004 (launch name); both free on origin/main. Why: 0001/0002 taken, Satyam had not claimed 0003. Reverse: renumber before merge if Satyam pushes a 0003.
- 03:16 — Removed item 1 from `company/decisions-needed.md` without renumbering the rest. Why: `company/risks.md` and `plan-to-nov-2.md` cite items by number (elections = item 2); renumbering would break them. Reverse: re-add item 1 text.
- 03:16 — Branch strategy: stacked branches. PR1 base=main; PR2 base=landing/1-docs; PR3 base=landing/2-page; etc. Why: PRs 2-5 all build on the same `landing/` app and nothing merges to main tonight, so each must inherit the previous. Reverse: Rohit can merge them in order, or I can squash to one branch on request.
- 03:17 — PR1 pushed, draft PR #19 opened (base main). Why: docs-only, independent of the app. Reverse: `gh pr close 19`.
- 03:17 — Left `landing/` scaffolding (PLAN, OVERNIGHT_LOG, .gitignore, .dev.vars.example) untracked during PR1; commits with the app in PR2. Why: keep PR1 one concern (docs). Reverse: n/a.
- 03:30 — Built 3 design directions (A Commit Slip, B Observatory, C Almanac) in `landing/design/direction-{a,b,c}/`, screenshot at 390×844 and 1440×900. Scores (distinct/phone/receipt/LCP): A 4/5/5/5=19, B 5/3/5/3=16, C 4/5/3/4=16. Winner: A. Why: ad traffic is phones, where A wins on legibility and LCP (CPO lens, note 071) while carrying the receipt idea most directly. The built page uses A's tokens but keeps the brief's turning-globe + anchored-receipt-cards concept. Reverse: switch tokens by changing one import line in `landing/src/main.tsx` to `tokens-b.css` or `tokens-c.css`. Full table goes in MORNING.md.
- 03:50 — cobe 2.0.1 dropped the v1 `onRender` option; it animates via `globe.update(state)`. Implemented a RAF loop calling update() and advancing phi; pause via IntersectionObserver + visibilitychange (destroy/recreate). Reverse: n/a.
- 03:52 — Pinned exact dep versions for landing (react/react-dom 19.3.0, vite 8.3.4, vitest 5.0.3, typescript 7.0.2, jsdom 30.1.2 to match web; cobe 2.0.1). Why: decision 0001 says pin exact after checking npm, and matching web dedupes the lockfile. Reverse: edit landing/package.json.
- 03:55 — Did NOT add @testing-library/react or axe-core as deps. Why: web/ convention uses raw createRoot/act with `// @vitest-environment jsdom`; the axe pass runs in Playwright e2e (PR5) instead. Reverse: add them if desired.
- 04:00 — Built and smoke-tested the production bundle in headless Chromium: hero/message-match/globe/receipts all render, 0 console errors; critical JS 74.6KB gz (<120 budget), cobe a separate 5.9KB gz chunk. Reverse: n/a.

## PR3 (data) — in progress, NOT yet a PR

- 04:35 — Neon project created: `real-world-landing`, id `frosty-river-82145431` (aws-us-east-2, pg18). Default branch `main` = `br-solitary-smoke-b49w8m6q`; test branch `dev` = `br-empty-frost-b4ph3qt8`; database `landing`; role `neondb_owner`. Reverse: delete the project in the Neon console (it is the only project we created tonight; never delete anything else).
- 04:40 — Migration `landing/db/migrations/0001_init.sql` written and applied to BOTH branches (dev first, then main): tables `waitlist_signups` and `typeform_events` confirmed present on main. No IP addresses stored. Reverse: drop the tables.
- 04:42 — Pooled connection strings written into `landing/.dev.vars` (DATABASE_URL = main, DATABASE_URL_DEV = dev). Values never printed/committed. Verified both keys are SET.
- 04:45 — Added deps to `landing/package.json` (not yet installed): `@neondatabase/serverless` 1.2.0, `@typeform/embed` 6.1.0, dev `@cloudflare/workers-types` 5.20261012.1.

### What PR3 still needs (next session continues on branch `landing/3-data`)
- `pnpm install` for the new deps; a `landing/functions/tsconfig.json` (Workers types) and update the `typecheck` script to also check `functions/`.
- Pages Functions: `functions/api/signup.ts` (Turnstile verify, email validate, insert/duplicate via `ON CONFLICT (email)`, Amplitude server event `waitlist_email_saved` insert_id=signup_id, IP rate limit WITHOUT storing IPs — hash the IP), and `functions/api/typeform.ts` (log raw to `typeform_events` first, constant-time HMAC-SHA256 verify of `Typeform-Signature: sha256=`, update row by signup_id, idempotent, Amplitude `waitlist_completed`).
- Add a `signup_rate_limit` table (hashed IP + window) in migration 0001 before committing, and re-apply to both branches.
- Add the Turnstile widget + token and the Amplitude device id to `SignupForm`/`SignupInput`; wire `@typeform/embed` into `TypeformSlot` (URL params signup_id/device_id/variant; fire typeform_opened/submitted).
- `landing/typeform/form.json` + a create/update script (Create API, TYPEFORM_TOKEN).
- Tests (gate DB-integration ones on DATABASE_URL_DEV so CI without the secret skips them): signature valid/invalid/missing, duplicate email, webhook replay, Turnstile failure.

## Blocked

- None yet. (TYPEFORM_TOKEN, TURNSTILE_*, AMPLITUDE_API_KEY are all present in .dev.vars, so nothing is credential-blocked.)

## Session note

- ~04:45 — Session paused: usage limit reached mid-PR3. Done: PR1 (docs, draft PR #19), PR2 (page+globe, draft PR #20), Neon project+schema+.dev.vars (above). Remaining: finish PR3, then PR4 (analytics), PR5 (launch readiness), preview deploy + verification, and MORNING.md. Branch `landing/3-data` holds uncommitted WIP (migration, package.json deps, .dev.vars). Stack bases drifted behind origin/main (now 22b64ea) — rebase the stack before the final deploy. MORNING.md not yet written.

## Resumed 2026-10-12 (session 2)

- `landing/BRIEF.md` does not exist in the repo (no branch, no history) or on disk. Proceeding from the task message guardrails, PLAN.md budgets, product/landing-page.md and decision 0003. Rohit: re-add BRIEF.md if it holds anything not captured here.
- PR3 finished. Decisions: (1) pinned workers-types 5.20261002.1, not the newest, because pnpm offered to add a minimumReleaseAgeExclude for a 1-day-old version and that weakens the repo's supply-chain guard; reverted the yaml. Reverse: bump the version and add the exclude. (2) Rate-limit table is migration 0002, not an edit to applied 0001. (3) Salt for the IP hash falls back to TURNSTILE_SECRET_KEY so no new secret is needed. (4) Typeform: first completed answer per signup wins, because the duplicate-email response returns the signup id; unverified webhook bodies log metadata only. (5) Fixed a line-length lint in PR2's gen_globe_poster.py so `make check` passes on the stack. (6) The Typeform form is created at deploy time (step 5), when the webhook URL exists.
- Instruction from Rohit (mid-run): PR #19 (landing/1-docs) is merged into main. Never touch landing/1-docs. At the rebase step (plan step 5): `git fetch`, then `git rebase --onto origin/main <old base> <branch>` for landing/2-page and landing/3-data (use --onto in case #19 was squashed), push with --force-with-lease, make sure PR #20's base is main (`gh pr edit 20 --base main`), and log the result here. Branches stacked above them (design-pass, 4-analytics, 5-readiness) get the same treatment so the stack stays linear.
- CI failure on PR #20 (commit cc2dc7d, run 38265505179, job `check`, 3 annotations): `make check` stopped at its first step, `ruff check`, with E501 (line 94 of `landing/scripts/gen_globe_poster.py` was 101 > 100 characters). Cause: I had fixed that line only on landing/3-data, not on the PR it came from. Fix: `a2829ab` on landing/2-page (wrapped the aria-label string; `ruff format --check` clean). Verified before pushing: ruff check and format, biome, link check, landing tsc, 9 landing tests, vite build, pyright (0 errors), pytest (167 passed, 1 skipped). After the push, PR #20 `check`, `description` and `size` pass (`review` is skipped while the PR is a draft). PR #22 `check`, `description` and `size` already pass. PR #19 is merged. Not run locally: the Playwright e2e step of `make check` (CI ran it and passed).
- Found while doing this: origin/landing/2-page had already been rebased onto main (5cd1281 is its parent; PR #20's base is `main`), but my local landing/2-page and landing/3-data still sit on the old base 99c8774. At the rebase step use `git rebase --onto origin/landing/2-page 99c8774 landing/3-data`. The landing/2-page content is identical to the old branch (`git diff 99c8774 cc2dc7d -- landing` is empty).
- Rule I am following from here: before marking any PR done I check `gh pr checks` on every PR in the stack, not just the one I last touched.
