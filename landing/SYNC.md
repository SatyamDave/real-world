# Syncing landing copy to product changes (manual)

Run this by hand when a product or messaging change might make the landing page wrong. There is no watcher and nothing runs automatically. The result is always a draft PR; a person merges it.

## When to run it

- `gtm/messaging.md` changed (a claim was added, removed or reworded).
- A `product/` spec changed in a way a visitor would notice (what the daily record contains, what a forecast card shows, what the waitlist leads to).
- The launch date, the question list in `landing/src/data/receipts.json`, or the processors on the privacy page changed.

## The prompt

Paste this into a Claude Code session started in the repo root, filling the first line:

```
Landing sync. What changed: <one sentence, with the file or PR>.

Read CLAUDE.md, landing/CLAUDE.md, gtm/messaging.md, product/landing-page.md and landing/DECISIONS.md.
Then compare every public sentence on the landing page against gtm/messaging.md and the changed file:
landing/src/copy/headlines.ts, landing/src/copy/sections.ts, landing/src/copy/consent.ts, the copy in
landing/src/components/*.tsx and landing/src/pages/*.tsx, landing/src/data/receipts.json, and the ad copy
that landing/ads/ generates.

Change only sentences that are now wrong or no longer allowed, and add a sentence only if an allowed
claim was added and the page needs it. Do not add features, options or sections. Do not use anything
that is not on the "Claims we may make" list. Do not name competitors, customers, prices, funding plans
or internal documents. Keep the waitlist the single dominant call to action; no demo and no link that
depends on APP_URL.

Update product/landing-page.md in the same PR if the page's behaviour or copy changed. Run, from landing/:
pnpm typecheck, pnpm test, pnpm exec biome check ., pnpm e2e, and python3 ../scripts/check_links.py.
If the privacy text depends on the change, update src/pages/Privacy.tsx and PRIVACY_UPDATED in
src/copy/consent.ts, and add any new question to landing/LEGAL_REVIEW.md.

Open a DRAFT PR from a new branch cut from origin/main, one change per PR, using
.github/pull_request_template.md. Put a before and after table of every sentence you changed in
"What changed". Do not merge, deploy, touch DNS, or set a secret. If nothing is wrong, say so and
open no PR.
```

## After the PR is open

A person reads the before and after table, checks it against `gtm/messaging.md` and merges. Deploying is a separate step in [RUNBOOK.md](RUNBOOK.md).

## Log: main and the landing branches

- **2026-10-13, `origin/main` a698ebd.** `landing/` was untouched on main, but main changed files the page depends on: `gtm/messaging.md` (a "sealed" sub-line and user journeys), the root `CLAUDE.md` (one product, one look, one voice), `product/design.md`, `scripts/check_design.py` and `check_glossary.py`, `pr-quality.yml` (screenshots required for UI PRs). I read them with `git show origin/main:<path>`; I did not rebase.
- **2026-10-13, Satyam merged main into the landing stack himself** and pushed two landing commits on top (`5a1e500` no analytics before the cookie notice is accepted; `4bd815a` server events and privacy text follow consent). I found this when a subagent reported `landing/7-sections` at `4bd815a`, not at the `0f01888` I had pushed. My local branches were stale. Action: `git rebase --onto origin/landing/7-sections 0f01888 landing/8-tally` (the only conflict was `product/landing-page.md`: took his text, re-applied the Typeform to Tally rename). My local `landing/6-envs` and `landing/7-sections` are behind origin and are not mine to push over: next time, fetch first, branch from `origin/...`, and never force-push a branch someone else has pushed to.
- **Not done on purpose:** no force-push to any existing branch, no rebase of the older PRs (#20 to #25, #92, #93). Satyam's merges already carry main.
