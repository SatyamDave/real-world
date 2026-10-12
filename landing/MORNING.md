# Morning: pre-launch landing page, 2026-10-12

Read this first. Everything below was done on draft PRs and a preview deploy. Nothing touched `tryrealworld.com`, DNS, a production branch, or the production database.

## Where it is

- **Preview:** https://landing-preview.real-world-landing.pages.dev (Cloudflare Pages project `real-world-landing`, preview branch `landing-preview`; it carries `noindex` by Cloudflare's design).
- **The stack**, all draft, all on `main` (PR #19, docs, is merged):

| PR | Title | Base | CI (check, description, size) |
| --- | --- | --- | --- |
| [#20](https://github.com/SatyamDave/real-world/pull/20) | feat(landing): page and globe | `main` | pass |
| [#22](https://github.com/SatyamDave/real-world/pull/22) | feat(landing): waitlist storage | #20 | pass |
| [#23](https://github.com/SatyamDave/real-world/pull/23) | feat(landing): design pass from competitor analysis | #22 | pass |
| [#24](https://github.com/SatyamDave/real-world/pull/24) | feat(landing): amplitude tracking | #23 | pass |
| [#25](https://github.com/SatyamDave/real-world/pull/25) | chore(landing): launch readiness | #24 | pass |

CI was read from GitHub after the last push of code (head `6c6c3e7` on #25); the `review` job shows "skipping" while a PR is a draft. A docs-only commit with this file follows, and its CI is the last thing to glance at.

## What needs you (in order of weight)

1. **The LCP budget is not reliably met on the live preview.** In Lighthouse's simulated slow phone the final build is under 2.0 s on 3 of 6 runs, median about 2.05 s; it passes against a local server and in what the browser actually measures (about 0.35 s). I self-hosted the fonts, and deferred the bot check and the analytics so they stop competing with the first paint; that cut main-thread work by 40% but not enough. The remaining cost is the 76 KB React bundle. Options (Preact swap, or pre-rendering per headline behind a Pages Function) and all 28 runs are in [perf/LIGHTHOUSE.md](perf/LIGHTHOUSE.md). I stopped because both are launch-risk choices. Your call: do one, or treat 2.0 s as a lab target and judge on real users once ads run.
2. **The Brazilian runoff card.** The receipt strip shows "Who wins the Brazilian presidential runoff on October 25, 2026?" (the globe chips on the hero show only the Fed and ECB decisions). [prelaunch-ads.md](../gtm/prelaunch-ads.md) bans election content in ad creative, and [decisions-needed item 2](../company/decisions-needed.md) (elections) is open. I did not edit `src/data/receipts.json`; removing it is deleting one object.
3. **Connect `tryrealworld.com`** when you are ready: [RUNBOOK.md section 1](RUNBOOK.md) has the Namecheap and Cloudflare steps. I did not run any of them.
4. **Real keys on a real host are untested.** The preview uses Cloudflare's always-pass Turnstile test keys and the Neon `dev` branch, so automation could sign up and production data stayed untouched. Before go-live: add the host to the real Turnstile widget's allowed hostnames and do one real signup against the production environment (go-live steps 5 and 6).
5. **The legal pages are drafts** (banner on both). Founders must read them. No retention period is set (the page says so), and the contact route appears only once `contactEmail` is set. Sending the launch email is not set up: Cloudflare Email Routing only receives.
6. **Reddit and X pixels are unexercised.** No pixel ids exist yet. The call shapes in `src/pixels.ts` come from secondary descriptions because the vendors' help pages did not load for me. [RUNBOOK section 9](RUNBOOK.md) is where they get checked against a live pixel.
7. **Amplitude cleanup.** Verification left test events in project 877388 (4 devices, `utm_source=test`, campaigns `preview_check*`). I had no tool to delete events. The dashboard I built labels them. You may want to filter them out or delete the users.
8. **`landing/BRIEF.md` does not exist** on any branch or on disk. I worked from your message, PLAN.md, the product spec and decision 0003. If it holds anything else, add it.

## Evidence for the definition of done

Per the root [CLAUDE.md](../CLAUDE.md), each item, across the five PRs.

| # | Item | Evidence |
| --- | --- | --- |
| 1 | Does one thing | One concern per PR: page and globe (#20), storage (#22), design pass (#23), analytics (#24), launch readiness (#25). #25 also carries performance and accuracy fixes found by the verification (fonts, deferred scripts, privacy wording, consent line); each is its own commit with its own message. |
| 2 | Every template section filled | CI `description` passes on all five. Bodies for #22, #24, #25 were corrected after the deploy to remove claims that stopped being true. |
| 3 | Links its loop step | Each "Why" links [decision 0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md) and [product/101](../research/product/101-prelaunch-landing-waitlist-ads.md); `feat` PRs need a `research/` path and CI enforces it. |
| 4 | Includes the check that proves it | Unit and integration tests (42, 9 of them against Neon dev), 40 Playwright tests including axe, `pnpm check:bundle`, Lighthouse runs, and the deployed-preview verification below. |
| 5 | Follows every touched folder's CLAUDE.md | [landing/CLAUDE.md](CLAUDE.md): no claim outside [messaging](../gtm/messaging.md) (the ad generator refuses forbidden claims; copy checked in [design/COPY.md](design/COPY.md)); no hash or probability shown (e2e asserts none, no 32-hex string and no percentage on the page); every result surface says AI-simulated (e2e checks every card); brand name only in `src/brand.ts` (grep over `src` is clean after a PR2 miss was fixed in #25); no secret committed (`.dev.vars` ignored, a scan of the staged diffs for connection strings and keys found none); preview deploys only; new dependencies pinned and named in the PR bodies. Outside `landing/` and the spec: `Makefile` and `pnpm-workspace.yaml` (both in #20: the `landing-dev` target and the workspace entry) and `pnpm-lock.yaml`. |
| 6 | Spec changes with the surface | [product/landing-page.md](../product/landing-page.md) updated in #23 (hero, strip, error states, motion). #25 changed only the legal text, which the spec already describes. |
| 7 | Every number traces | Lighthouse: [perf/LIGHTHOUSE.md](perf/LIGHTHOUSE.md). Bundle size: `pnpm check:bundle` (76.1 KB gzipped). Competitor facts are described, not quoted, in [design/INSPIRATION.md](design/INSPIRATION.md), whose screenshots stay local. Estimates are labelled in the PR bodies. Every link resolves (`scripts/check_links.py`). |
| 8 | No forecast, hash, salt, question list or registration changed | `git diff --name-only origin/main...landing/5-readiness` lists nothing under `experiments/`, `engine/`, `data/` or any ledger path. The page shows no hash or probability. |
| 9 | CI green, size | CI green on all five (table above). **Size: all five exceed the ~400 changed lines guide** (code lines excluding lockfile, images, docs and fonts: #20 1,781; #22 1,152; #23 772; #24 514; #25 836). Reasons are in each body: a new app, a rewritten stylesheet, tests that are most of the line count. They are stacked so each is reviewable alone; none could be split without leaving a broken page between pieces. |
| 10 | Reviewable without the author | Every body states what changed, how it was verified (with numbers), what was not verified, risk and rollback. [OVERNIGHT_LOG.md](OVERNIGHT_LOG.md) records every decision with why and how to reverse it. |

## The deploy checklist (engineering:deploy-checklist), filled

Scope: a preview-only Cloudflare Pages deploy.

**Before**
- [x] CI green on the rebased heads of all five PRs.
- [x] Stack linear on `main` (rebased with `git rebase --onto`, `--force-with-lease` pinned to old tips; recorded in the log).
- [x] Migrations 0001 and 0002 applied to both Neon branches; `main` branch tables confirmed empty.
- [x] Rollback plan: Pages deployments are immutable; the preview alias can be redeployed from any commit; test rows deleted by id.
- [x] Preview environment variables set (production environment left empty, checked by reading the project config back).
- [x] No custom domain, no production branch, no DNS.

**Deploy:** `wrangler pages deploy dist --branch landing-preview`, built with the public values only (Amplitude browser key, Turnstile test site key, Typeform id, preview URL).

**After (smoke tests, all on the deployed URL)**
- [x] `/`, `/privacy`, `/terms`, `/robots.txt` return 200; a POST of `{}` to `/api/signup` returns 400 `invalid_email`; a bad signature to `/api/typeform` returns 401.
- [x] Browser signup, two devices and several paths, below.
- [x] Console clean on a scoped check (one navigation, one signup): 0 warnings, 0 errors.
- [ ] Monitoring and alerts: none exist for the preview.

**Rollback triggers** (preview): a signup returning anything but 200 on a valid email; a webhook accepting an unsigned request; any row without a country or consent version.

## Verification of the signup path on the preview

| Step | Result |
| --- | --- |
| Browser signup with UTM | 200 `{signup_id, duplicate:false}`; one Neon row with `headline_variant`, the four UTM fields, device id, country `US`, consent version `2026-10-12`; no IP anywhere |
| Same email again | 200, `duplicate:true`, same `signup_id`; still one row |
| Typeform embed | iframe rendered, hidden fields `signup_id`, `device_id`, `variant`, `question_id` in the URL |
| Amplitude, browser | `landing_viewed`, `section_viewed`, `globe_ready`, `cta_clicked`, `email_submitted`, `signup_saved`, `typeform_opened` with `headline_variant`; page view and session start with UTM properties; session replay captured; the email field's events carry no value |
| Amplitude, server | `waitlist_email_saved` and, from a signed webhook call, `waitlist_completed`, on the same device and `signup_id` |
| Signed webhook | valid: row updated once (role, forecast 0.35, `completed_at`); replay: ignored; tampered body, no signature, wrong signature: all 401, logged with no payload |
| IP address | default SDK recorded IP and city; after the fix a fresh device has none (checked on browser and server events) |
| Lazy bot check | no request to Turnstile before interaction; submitting without focusing the field waits about 3 s for the token and succeeds |
| Cleanup | the dev branch's three tables are back to 0 rows, and so is `main`; deleted by exact id and key, 6 signups, 5 event rows and 4 rate-limit rows across the run |

**Not verified:** a real Typeform submission through the embedded form (the webhook was tested with a correctly signed request); the real Turnstile keys; the production database from a deployed host; real devices; a screen reader.

## What I got wrong on the way, and fixed

- The integration test cleanup silently stopped working after an edit that did not apply; it leaked rows. Found by the preview run, fixed, and checked by counting rows before and after.
- The privacy page said "we do not store your IP address" while Amplitude recorded it. Found on the deploy; fixed in the SDK and on the page.
- The Turnstile console warning took three fixes; the first two were not the cause.
- The runbook said a GET to `/api/signup` answers 405 (it returns the page with 200) and gave a wrong flag for preview secrets. Both corrected from tests.
- The consent line hard-coded the brand name (a PR2 miss).
- A pnpm install had added a release-age exemption to `pnpm-workspace.yaml` for a one-day-old package; I reverted it and pinned an older version.
- CI failed on #20 because I had fixed a lint line on the wrong branch. Fixed on #20 and logged.
- During the last re-cascade of the stack I passed the wrong rebase upstream and reset three local branches. Nothing was pushed; I restored each from its known tip and checked by diff. Details in the log.
- Two scripted edits and one rebase were silent no-ops at different points. After the second I started asserting on commit counts and diffs rather than trusting the exit code.

## External changes I made (all reversible, listed in the log with how to reverse)

Neon project `real-world-landing` and its tables; Cloudflare Pages project `real-world-landing` and its preview environment; a Typeform (id `xHCo5APC`) and its webhook; 15 planned events and one dashboard in Amplitude project 877388. Competitor screenshots are on disk only, git-ignored.

## Design decisions

- **Direction.** Kept "Commit Slip" (cool paper, ink, verify green, pending clay; IBM Plex). Original scores from the three built directions: A 4/5/5/5 = 19, B 5/3/5/3 = 16, C 4/5/3/4 = 16 (distinct from competitors, phone, receipt idea, LCP). After the competitor analysis: A 20, B 15, C 16. The analysis showed Aaru's lower page is black and Simile is light, which lowers B's distinctness and raises A's, so no reason to switch. Plan and re-score: [design/DESIGN-PASS.md](design/DESIGN-PASS.md).
- **Where the ideas came from:** [design/INSPIRATION.md](design/INSPIRATION.md), seven homepages at 390x844 and 1440x900, a comparison table, eight ranked patterns, and what Real World does differently. The central one: our credibility device is the receipt, shown where competitors put client logos. The globe stays ours. Patterns only, no assets.
- **Copy:** [design/COPY.md](design/COPY.md), checked line by line against messaging. The contrast line is "No accuracy claim. Read the receipts."
- **Accessibility review:** [design/A11Y-REVIEW.md](design/A11Y-REVIEW.md); axe is clean on all three routes at both viewports.
- **Quality loop:** three rounds, critiques in the body of #23. One round's reviewer said it had not run the design-critique skill; that is disclosed there.

## Go-live

[RUNBOOK.md section 10](RUNBOOK.md) is the ten-step checklist. The first three steps are: founders read the legal pages, connect the domain, set the production secrets and deploy once.
