# Morning: pre-launch landing page

## Update 2026-10-14 (read this first): Tally, the globe, the research section

Same guardrails: draft PRs only, no merge, no DNS, no production deploy, no production secret, nothing in `web/`, `engine/` or `api/`.

**First unchecked item: the real Tally verification has not been done.** `TALLY_SIGNING_SECRET_STAGING` and `TALLY_FORM_ID_STAGING` in `.dev.vars` are empty, so no real form exists. Unverified until one does: which bytes Tally signs (the server accepts raw or re-serialized), and that `/embed/<id>?signup_id=...` fills the hidden field. Steps: `tally/FORM_SPEC.md`, then a Playwright submission through the staging embed, then replay, tamper and unsigned requests, then delete the rows by id.

- [ ] **Tally**, as above. Then PR [#98](https://github.com/SatyamDave/real-world/pull/98) can leave draft.
- [ ] **Apply `db/migrations/0003_drop_referrer_landing_path.sql`** to dev and staging (a column drop, so I did not run it), main at go-live.
- [ ] **Answer the D1 question** in [design/SISTER_DB.md](design/SISTER_DB.md): does D1 replace the Neon waitlist? Nothing was created.
- [ ] **LaunchDarkly** has no account or key; the flag layer is not built.
- [ ] Look at the globe PR (`landing/9-wow`), the screenshots in `design/c-rounds/` and the open spots below.

What changed: Tally replaces Typeform (#98); the page follows decision 0012 (copy and field first, then the interactive globe whose markers open pending receipts that end in "Make your call"); a cited research section with no figures ([design/PAPERS.md](design/PAPERS.md)); referrer and landing_path removed; SEO tags; [REVIEW_LOG.md](REVIEW_LOG.md) maps Satyam's comments to answers. Decisions C1 to C9 in [DECISIONS.md](DECISIONS.md). `SYNC.md` logs the merge of main.

Measured: first-load JavaScript 81.9 KB gzipped (budget 120); local Lighthouse LCP about 1.8 s on four of five runs (2.4 s cold), CLS 0.039; 69 end-to-end tests pass on desktop and mobile; live-staging LCP was not re-measured after this change.

Open spots, said plainly: on a phone the open receipt covers the whole globe; land dots are near black in light mode; mobile Playwright cannot tap a spinning marker (real taps work; tests use hover or dispatch); the relocation of `landing/` and the flag layer are proposals only.

---

## Earlier: 2026-10-12

Read this first. Everything below was done on draft PRs and a preview deploy. Nothing touched `tryrealworld.com`, DNS, a production branch, or the production database.

## Update 2026-10-13 (read this first): the revised brief

Same guardrails: draft PRs only, no merge, no DNS, no production deploy, no production secret set, nothing in `web/`, `engine/` or `api/`. Two new draft PRs on top of the stack: [#92](https://github.com/SatyamDave/real-world/pull/92) `landing/6-envs` (base `landing/5-readiness`) and [#93](https://github.com/SatyamDave/real-world/pull/93) `landing/7-sections` (base `landing/6-envs`). Decisions with options, evidence and what would change them: [DECISIONS.md](DECISIONS.md). Plan: [PLAN.md](PLAN.md).

### Milestone A: ads-ready (#92)

- **Environments.** dev logs events to the console; staging is the Pages preview; prod is the Pages production branch (never deployed to). Every event carries `environment`. Evidence: Amplitude Staging (877388) holds 349 events tagged `staging` in the last day; the Prod project (878019) has **zero events over 30 days** (queried at the end of the session).
- **Neon.** New `staging` branch for the preview; schema on `main` verified (3 tables, 19 columns on the signups table). All three branches (`main`, `dev`, `staging`) are at **0 rows**; test rows were deleted by id.
- **Prod secrets.** `landing/scripts/set-prod-secrets.sh` is written and **not run**. `--check` validates `.dev.vars` and writes nothing; it passes with your real Turnstile keys. The production Pages environment still has no variables.
- **Amplitude.** Dashboard now has 6 charts (limit 10), renamed "Landing page (staging): funnel and sources"; autocapture on; session replay at 100% staging and 10% production; [analytics/AMPLITUDE_GUIDE.md](analytics/AMPLITUDE_GUIDE.md) for a beginner; one experiment proposed in the guide and **not launched**.
- **Real Typeform submission through the embed on staging, with Playwright** (`scripts/verify-staging.mjs --typeform`): three runs. The signed webhook filled each row (role, forecast, completion time), each run's webhook event was logged as signature-valid. Test data deleted by id. (You wrote "Typeform to D1"; we stayed on Neon Postgres.)
- **Legal.** Privacy page tightened to what the code stores (device id saved with the signup, Amplitude browser id, Typeform's own cookies, Turnstile on focus). [LEGAL_REVIEW.md](LEGAL_REVIEW.md) lists ten questions for a lawyer. Nothing has been read by a lawyer.
- **RUNBOOK** has the go-live checklist (section 10) and the three-environment tables. The stale "4 devices" notes are fixed in the #24 body, the dashboard note and below (it was 20).

### Milestone B: sections and pre-rendering (#93)

- **Four new sections** (thesis, use cases, research and limits, collaboration) from allowed claims only; a test fails on forbidden claims and on competitor, price, funding, model or demo wording. No demo, no v1 link, nothing depends on `APP_URL`. Screenshot critique, two passes at 390x844 and 1440x900, in `design/section-passes/`. What I left out and why is at the end of DECISIONS.md.
- **LCP, honestly.** The budget is **not reliably met on the live host**. Lighthouse mobile, 8 runs a series: local as shipped 3 of 8 under 2.0 s (median 2085 ms); local pre-rendered 12 of 12 (1805 ms); live staging as shipped 2 of 8 (2274 ms); live staging pre-rendered 4 of 8 (2027 ms). Pre-rendering is kept (a measured gain, 54 end-to-end tests pass), and it supersedes the "ship as is" decision of 2026-10-12 only in that the page is now pre-rendered; the real test is real-user LCP once ads run. Inlining the stylesheet did not help and was reverted. Preact was not tried. Details: [perf/LIGHTHOUSE.md](perf/LIGHTHOUSE.md).
- `SYNC.md`: one file with a manual prompt for syncing landing copy to product changes as a draft PR. No watcher.

### What still needs you (updated)

- [ ] **Rotate the Typeform token**, then create the production form: `node landing/scripts/typeform-sync.mjs --env production --webhook-url https://tryrealworld.com/api/typeform`. Staging and production use two forms so a staging test cannot reach the production webhook.
- [ ] **Real Turnstile keys.** They are in `.dev.vars` (thank you) and `set-prod-secrets.sh` maps them. Still to do: add `tryrealworld.com` and `www.tryrealworld.com` to the widget's allowed hostnames and check one real signup. Preview and staging keep the test keys.
- [ ] **Connect `tryrealworld.com` to Cloudflare** (RUNBOOK section 1), then `bash landing/scripts/set-prod-secrets.sh --check`, then without `--check`, then `pnpm --filter landing build:prod` and the production deploy, then the production test (RUNBOOK section 10 steps 4 to 9).
- [ ] **Rebuild the dashboard in the Prod Amplitude project** after the first production visit (AMPLITUDE_GUIDE, go-live checklist). Decide whether to run the proposed experiment once the first ad days show the visitor count.
- [ ] **Read the draft legal pages with LEGAL_REVIEW.md**, pick a retention period, set `contactEmail` (this also turns the collaboration link into a mailto).
- [ ] **Ad accounts and pixels**, **Typeform plan** and **pick the design** as in the list below. Decide whether to chase LCP further or wait for real-user numbers.

### Verification traffic from this session (filter these out)

All of it is in the **Staging** Amplitude project, which is test traffic by definition. By `environment`: events tagged `staging` are verification; four server events from the first run are wrongly tagged `production` (see mistakes) and belong to signups `2cdd1854-b79c-4f0d-b3bf-11c17f69d7fb` and `a0b3b8b3-c3c7-47a7-8bde-70fa4bd19c4e`. Browser-driven staging devices (all three had a real Typeform submission): `d3b1d4e7-15c9-4436-a603-0660929ab49a`, `da510a36-f595-41ca-adb7-d56e52f7677a`, `a6b706df-3fbe-453a-9917-39bc42c1919c` (signup `15ce7c71-4e67-447b-8782-75e8f37bbf4f` for the last). The Lighthouse runs on the live staging page (32 today) each created a device; their ids were not captured, but they have `environment = staging` and no `utm_source`. The Prod project has none of it.

### Mistakes this time, and fixes

- **First staging run tagged four server events `production`** in the Staging project. Cause: Pages ignores dashboard plain-text variables when a `wrangler.toml` exists. Found by querying events by `environment`; fixed by setting `ENVIRONMENT` in `wrangler.toml`; the next signup was tagged `staging`. The four events cannot be deleted with the tools I have.
- **A scripted edit silently did not apply again** (Biome had reformatted `scripts/build.mjs`), so the staging build skipped the pre-render step and I deployed it once before noticing. Caught by asserting the pre-render marker in `dist/index.html`; fixed and redeployed.
- **The end-to-end server built without the pre-render step**, so the tests would not have covered it. Now it runs `pnpm build`.
- **A flaky axe test** (measured contrast while a chip was fading in) was found by the subagent run, not by me; fixed and rerun 3 times.
- **I first read the local 12 of 12 as a win.** The live host showed a smaller gain (4 of 8, not 12 of 12). I measured the live A/B before writing the decision; DECISIONS.md B3 gives both.
- **My verify script printed the signup id of only the last of two runs** (I had cut the output); I recovered the first from the database. The cleanup went by exact ids.
- **Inlined stylesheet experiment** made the live count worse (1 of 8). Reverted.

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

CI was read from GitHub after the last push of code (head `db73246` on #25, which removed the Brazil card); the `review` job shows "skipping" while a PR is a draft. A docs-only commit with this file follows it, and its CI was checked too.

## What needs you (in order of weight)

1. **LCP: decided, ship as-is.** Rohit's decision: leave the current React bundle as it is, with no Preact swap and no pre-rendering. We will judge LCP on real-user numbers once ads run. For the record, on the live preview in Lighthouse's simulated slow phone the final build is under 2.0 s on 3 of 6 runs, median about 2.05 s (it passes against a local server, and the browser's own measurement is about 0.35 s); the remaining cost is the 76 KB React bundle. All 28 runs are in [perf/LIGHTHOUSE.md](perf/LIGHTHOUSE.md), which also lists the options that were declined.
2. **The Brazilian runoff card: removed.** The receipts data now holds three central-bank decisions (US Fed, ECB, Bank of Japan); the election question is gone from the page, the globe and the tests. [decisions-needed item 2](../company/decisions-needed.md) (elections) is untouched and still open. To bring an election question back, add an object to `src/data/receipts.json` after that decision.
3. **Connect `tryrealworld.com`** when you are ready: [RUNBOOK.md section 1](RUNBOOK.md) has the Namecheap and Cloudflare steps. I did not run any of them.
4. **Real keys on a real host are untested.** The preview uses Cloudflare's always-pass Turnstile test keys and the Neon `dev` branch, so automation could sign up and production data stayed untouched. Before go-live: add the host to the real Turnstile widget's allowed hostnames and do one real signup against the production environment (go-live steps 5 and 6).
5. **The legal pages are drafts** (banner on both). Founders must read them. No retention period is set (the page says so), and the contact route appears only once `contactEmail` is set. Sending the launch email is not set up: Cloudflare Email Routing only receives.
6. **Reddit and X pixels are unexercised.** No pixel ids exist yet. The call shapes in `src/pixels.ts` come from secondary descriptions because the vendors' help pages did not load for me. [RUNBOOK section 9](RUNBOOK.md) is where they get checked against a live pixel.
7. **Amplitude cleanup.** Verification left test events from **20 devices** in project 877388 (an earlier version of this file, and the dashboard note, said 4: that was wrong). The full list of ids is in "Verification traffic in Amplitude" below. I had no tool to delete events.
8. **`landing/BRIEF.md` does not exist** on any branch or on disk. I worked from your message, PLAN.md, the product spec and decision 0003. If it holds anything else, add it.

## What Rohit still has to do

- [ ] **Pick the design.** Direction A, "Commit Slip", is built and is what the preview shows. Directions B (dark observatory) and C (almanac) exist only as token sets, `src/styles/tokens-b.css` and `tokens-c.css`; switching is the one `tokens.css` import in `src/main.tsx`. B and C were designed with their own display fonts (a serif for B, a grotesque for C); those font files are not in the repo, because the page now serves only IBM Plex. Screenshots of all three are in `landing/design/direction-*/` and the scores are under "Design decisions" below.
- [ ] **Replace the Typeform token.** `TYPEFORM_TOKEN` in `landing/.dev.vars` is read only by `scripts/typeform-sync.mjs` (it is not a Pages secret). Put the new token there and revoke the old one in Typeform. If the new token belongs to a different Typeform account, delete `landing/typeform/form-id.txt` and run `node landing/scripts/typeform-sync.mjs --webhook-url <the /api/typeform URL>` to create the form and its webhook there, then set `VITE_TYPEFORM_FORM_ID` and rebuild ([RUNBOOK section 6](RUNBOOK.md)). The current form is `xHCo5APC`, with its webhook pointing at the preview.
- [ ] **Real Turnstile keys.** (Keys now in `.dev.vars`; see the update above.) The preview uses Cloudflare's always-pass test keys. For production, create a widget, add `tryrealworld.com` to its allowed hostnames, set the site key as `VITE_TURNSTILE_SITE_KEY` at build time and the secret as the `TURNSTILE_SECRET_KEY` production secret, then do one real signup ([RUNBOOK sections 1 and 4](RUNBOOK.md)).
- [ ] **Connect `tryrealworld.com` to Cloudflare.** Nameservers at Namecheap, then the Pages custom domain, `www` redirect and SSL ([RUNBOOK section 1](RUNBOOK.md)). Then set `VITE_PUBLIC_BASE_URL`, repoint the Typeform webhook, and redeploy. Not done by me.
- [ ] **Ad accounts and pixels.** Create the Reddit and X ad accounts and their pixels, set `VITE_REDDIT_PIXEL_ID`, `VITE_X_PIXEL_ID` and the X Lead event id, and check the pixel calls against the live pixels, which I could not do ([RUNBOOK section 9](RUNBOOK.md)). The images are in `landing/ads/`; the caps and the kill rule are in [prelaunch-ads.md](../gtm/prelaunch-ads.md).
- [ ] **Typeform Plus.** Upgrade the Typeform account to the Plus plan. I do not know which plan the current account is on, or what response limits, hidden fields and webhooks the plans include: that is unknown to me, so check the plan page before the ads run. The page depends on hidden fields (`signup_id` and three others) and on the webhook.
- [ ] **Read the draft legal pages.** `/privacy` and `/terms` carry a draft banner. Read them, decide a retention period, set `contactEmail` in `src/brand.ts` once `hello@tryrealworld.com` exists, then remove the banner (`src/pages/DraftBanner.tsx`).
- [x] **Test a real Typeform submission through the embed on the deployed preview.** Done on staging on 2026-10-13 with Playwright (see the update above). Original note: Open `https://landing-preview.real-world-landing.pages.dev/?utm_source=test&utm_content=hashed`, sign up with your own address, and answer both questions in the embedded form. Then check that the row in the Neon `dev` branch has `role`, `forecast_probability` and `completed_at` (the preview writes to `dev`, not `main`), and that Amplitude shows `waitlist_completed`. I tested the webhook only with a correctly signed request, never with Typeform's own delivery. Delete your test row afterwards by id ([RUNBOOK section 8](RUNBOOK.md)).

## Verification traffic in Amplitude (filter these out)

Amplitude project 877388. Everything in the project so far is test traffic: nothing has been sent by a real visitor, and no ads have run. As of the last verification on 2026-10-12 there are **20 devices, 30 `landing_viewed` events and 6 `signup_saved` events**. There are no user ids: every event, browser and server, carries a device id, and the server events reuse the browser's. I got the list by grouping `landing_viewed`, `signup_saved` and `waitlist_email_saved` by Device ID over the last 30 days.

Filter on the device ids, not on `utm_source=test`: only the first three carry it; the Lighthouse devices visited the bare URL.

**Three browser-driven verification devices** (all UTM `utm_source=test`, campaigns `preview_check*`; all 6 signups and all server events are on these):

| Device id | `landing_viewed` | `signup_saved` |
| --- | --- | --- |
| `e38f14cb-ef4e-4e19-b694-d0f16571ec41` | 5 | 2 |
| `5db773f5-b724-4f9f-a222-95040fb20ab4` | 3 | 1 |
| `de5c7080-43e1-4f19-95fb-e8c2303bfc0f` | 5 | 3 |

**Seventeen Lighthouse devices** (one `landing_viewed` each, no UTM; one per live Lighthouse run, 5 + 6 + 6):

```
1932e556-c592-42a4-95e0-65df5666c191
1bc48e85-03ba-436f-a148-0c0aa51bcfa0
2bd2b61a-9a50-47ba-9e8d-c3e970ab140c
2edcbff6-9a87-4109-8848-0983084c7913
4ccd0492-8217-4658-ad00-6a0df7793378
51a6b9c4-fbf6-4319-8146-6e043ab9491c
6252a66f-e9ff-4fc2-871c-0c8c6e676659
66974115-e7b7-45cb-8366-2b59be61924c
85c7a839-29ca-4e96-b119-1adc6f8dda2f
b9216ca3-b24a-44a9-b817-6274ae0b7870
bd842940-62a6-4c8f-81c7-44fbdd60ff57
cc80fb4d-900e-4784-b926-918da07cd9fb
d450610a-41f2-4c02-a012-358fad3ae74d
e00a057b-f36e-4772-ace3-218a7f928eab
e6819914-b6f0-44ea-a4fe-b6344136a9d1
e9f779b4-d860-4da7-aa54-a54b90febe72
f82afa3e-deb3-443e-8704-188bbcdbd2a4
```

The list covers everything up to the last verification. Any later visit to the preview, including yours, creates another device, so also filter by date: the simplest rule is to exclude everything before the first ad flight. The six test signups' rows were deleted from Neon; their addresses were all `test+...@example.com`. The dashboard note ("4 devices with `utm_source = test`") and the PR #24 body are out of date on this point; this section is correct.

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
- I first counted 4 verification devices in Amplitude. The real count is 20: the 17 live Lighthouse runs each created a device, and those visited the bare URL, so they carry no `utm_source=test`. The PR #24 body and the dashboard note still say 4.
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
