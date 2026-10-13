# Runbook: pre-launch landing page

For the founders. Everything here is a step you run; nothing below has been done to the production domain. Live Oct 13 to Oct 27, retired on Oct 27 ([decision 0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md), [launch plan](../gtm/launch-plan.md)).

## Where things stand

| Item | State |
| --- | --- |
| Production domain | `tryrealworld.com`, bought on Namecheap. DNS is not configured and nothing is deployed to it (founder instruction, 2026-10-12). |
| Cloudflare Pages project | `real-world-landing`. Only preview deploys so far (`*.pages.dev`). |
| Environments | dev (your laptop), staging (the Pages preview), prod (the Pages production branch, never deployed to). Table in section 4. Every Amplitude event carries `environment`. |
| Database | Neon project `real-world-landing` (id `frosty-river-82145431`), database `landing`. Branches: `main` (prod, schema only, no rows), `staging` (the preview), `dev` (local and tests). |
| Analytics | Two Amplitude projects (the plan allows two): `877388` Real World - Staging and `878019` Real World - Prod. Plan: [analytics/TRACKING_PLAN.md](analytics/TRACKING_PLAN.md); how to read it: [analytics/AMPLITUDE_GUIDE.md](analytics/AMPLITUDE_GUIDE.md). |
| Sending email | Not set up. Cloudflare Email Routing only receives. Sending the launch email needs an email provider with SPF and DKIM on `tryrealworld.com`; decide before Oct 27. |

## 1. Connect tryrealworld.com to Cloudflare Pages

Do this in order. Steps 1 to 3 change where the domain's DNS lives; until step 5 nothing public changes.

Why Cloudflare nameservers: on a Free plan the only zone setup Cloudflare offers is the full one, where Cloudflare is the DNS host ([Cloudflare zone setups](https://developers.cloudflare.com/dns/zone-setups/)). A Pages custom domain on the apex (`tryrealworld.com`, not just `www`) needs the zone on Cloudflare. If you would rather keep Namecheap DNS, only a subdomain such as `www` can be a CNAME to `real-world-landing.pages.dev`, and the apex would not work.

1. **Add the domain to Cloudflare.** Cloudflare dashboard, Domains, Onboard a domain, enter `tryrealworld.com`, choose the Free plan. Accept the DNS records Cloudflare finds (there should be none worth keeping on a new domain). Cloudflare shows two nameservers; copy them.
2. **Point Namecheap at them.** Namecheap, Domain List, Manage next to `tryrealworld.com`, Nameservers, choose Custom DNS, paste the two Cloudflare nameservers, save. Propagation can take hours; Cloudflare emails when the zone is active.
3. **Turn off Namecheap's own redirects and email forwarding** for the domain if any are set, so they do not fight the new records.
4. **Attach the domain to the Pages project.** Workers & Pages, `real-world-landing`, Custom domains, Set up a custom domain, enter `tryrealworld.com`, confirm. Cloudflare creates the DNS record and issues the certificate. Repeat for `www.tryrealworld.com`, then add a redirect from `www` to the apex (Rules, Redirect Rules).
5. **Only now deploy to production.** The production branch is whichever branch Pages settings name (Settings, Builds, Production branch; check it). Run `pnpm --filter landing build:prod` (it takes the production values from `.dev.vars` and refuses test keys), then `pnpm exec wrangler pages deploy landing/dist --project-name real-world-landing --branch <production branch>`. Never run this from a session that has not been told to.
6. **SSL/TLS.** Set encryption mode to Full (strict) and turn on Always Use HTTPS.
7. **Check.** `https://tryrealworld.com/` loads the page; `/privacy` and `/terms` load; a POST of `{}` to `https://tryrealworld.com/api/signup` answers `400` with `{"error":"invalid_email"}` (it is rejected before anything is saved). A GET is not a useful check: the function only handles POST, so a GET falls through and returns the page with a `200`.

After step 4 also update, then redeploy:

- `VITE_PUBLIC_BASE_URL` is `https://tryrealworld.com` in `pnpm build:prod` already; nothing to set.
- Turnstile: add `tryrealworld.com` to the widget's allowed hostnames (Cloudflare dashboard, Turnstile). Without it the bot check fails on the new domain and every signup shows "We couldn't confirm you're human."
- Typeform webhook: `node landing/scripts/typeform-sync.mjs --env production --webhook-url https://tryrealworld.com/api/typeform` (section 6).
- Reddit and X ad accounts: add the domain where they ask for a verified or allowed site.

Rollback: remove the custom domain from the Pages project (Custom domains, remove). The page stays on `real-world-landing.pages.dev`. Nameservers can stay on Cloudflare.

## 2. The app subdomain

The v1 app is hosted separately by Satyam. Pick its hostname (for example `app.tryrealworld.com`), add the record Satyam's host asks for in Cloudflare DNS (DNS only unless the host says to proxy), then set `APP_URL` (server) and `VITE_APP_URL` (build) to it and redeploy. While both are empty every "Try today's question" link is hidden. The link adds `ampDeviceId=<id>`, which the Amplitude SDK on the app reads if it is initialised with no explicit device id ([Amplitude cross-domain tracking](https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2)).

## 3. Email routing (receiving only)

1. Cloudflare dashboard, Compute, Email Service, Email Routing, Onboard Domain, choose `tryrealworld.com`. Cloudflare adds the MX, SPF and DKIM records for routing. Routing needs Cloudflare DNS and takes over the MX records, so do not add another mail provider's MX records on the same domain without turning routing off first ([Cloudflare Email Routing](https://developers.cloudflare.com/email-service/configuration/domains/)).
2. Destination addresses, add the founder inbox that should receive mail and click the verification link Cloudflare sends. Rules stay disabled until it is verified.
3. Routing rules, create `hello@tryrealworld.com`, action Send to an email, destination the verified inbox.
4. Set `contactEmail` in `landing/src/brand.ts` to `hello@tryrealworld.com` and redeploy; the footer Contact link and the privacy page's contact route appear when it is non-empty.

## 4. Secrets and build variables

Never commit a secret. Local values live in `landing/.dev.vars` (git-ignored); `landing/.dev.vars.example` lists every name.

| Name | Kind | Where it is set |
| --- | --- | --- |
| `ENVIRONMENT` | variable | `wrangler.toml`: `staging` under `[env.preview.vars]`, `production` under `[env.production.vars]`. Pages ignores plain-text variables set in the dashboard when a `wrangler.toml` exists, so do not set it there. |
| `DATABASE_URL` | secret | Pages secret, one per environment. Preview: Neon `staging` branch (`scripts/set-staging-env.mjs`). Production: Neon `main` (`scripts/set-prod-secrets.sh`). Locally in `.dev.vars` it is the `dev` branch, so a local run cannot touch real signups. |
| `DATABASE_URL_DEV`, `DATABASE_URL_STAGING`, `DATABASE_URL_PROD` | local only | `.dev.vars`. `_DEV` is used by the integration tests; `_STAGING` and `_PROD` are read by the two scripts above. Never Pages secrets under these names. |
| `AMPLITUDE_API_KEY` | secret | Pages secret, one per environment: the Staging project key on preview, the Prod project key on production. |
| `AMPLITUDE_API_KEY_STAGING`, `AMPLITUDE_API_KEY_PROD` | local only | `.dev.vars`; the source for the scripts and for `pnpm build:staging` and `pnpm build:prod`. |
| `TURNSTILE_SECRET_KEY` | secret | Pages secret. Preview: Cloudflare's always-pass test secret. Production: the real one, kept as `TURNSTILE_SECRET_KEY_PROD` in `.dev.vars`. |
| `TYPEFORM_WEBHOOK_SECRET` | secret | Pages secret; the same value `typeform-sync.mjs` sends to Typeform. |
| `TYPEFORM_TOKEN` | local only | `.dev.vars`; used only by `typeform-sync.mjs`. |
| `RATE_LIMIT_SALT` | optional secret | Pages secret. Falls back to `TURNSTILE_SECRET_KEY`. `set-prod-secrets.sh` generates one for production. |
| `APP_URL` | variable | Pages variable; mirror in `VITE_APP_URL`. Empty for now. |
| `VITE_*` (Amplitude key, replay rate, Turnstile site key, Typeform form id, base URL, pixel ids, `VITE_ENVIRONMENT`) | build-time | Set by `scripts/build.mjs` from `.dev.vars` (`pnpm build:staging`, `pnpm build:prod`). They end up in the public bundle, so none may be a secret. |

**Preview (staging)** variables are set with `node landing/scripts/set-staging-env.mjs`. It uses wrangler's own login, writes only the preview environment, prints variable names and never values, and removes nothing else. **Production** secrets are set with `bash landing/scripts/set-prod-secrets.sh`, which you run yourself at go-live (section 10). It reads `.dev.vars`, refuses test keys and a shared Amplitude key, asks you to type `production`, and prints names only. Wrangler 4.149 has no flag for the preview environment, and a preview deployment does not see production secrets (tested on 2026-10-12 with a dummy secret, since removed). The production environment has no variables set today (checked 2026-10-13).

The staging environment deliberately differs from production: its database is the Neon `staging` branch, so test signups never touch the real waitlist, and its Turnstile secret is Cloudflare's always-pass test secret, paired with the test site key `1x00000000000000000000AA` at build time, so automated checks can sign up. The real Turnstile keys are therefore not yet tested on a `*.pages.dev` or `tryrealworld.com` host: add the host to the widget's allowed hostnames and check one real signup before go-live.

## 5. Deploy and roll back

- **Preview** (safe, any time): `pnpm --filter landing build:staging`, then `pnpm exec wrangler pages deploy landing/dist --project-name real-world-landing --branch landing-preview`. The URL is `https://landing-preview.real-world-landing.pages.dev` (the exact URL is printed). Plain `pnpm build` makes a production-tagged build with no keys; do not deploy it.
- **Production** (only at go-live, by a person): `pnpm --filter landing build:prod`, then the deploy command with `--branch main` (section 1 step 5 and section 10). `build:prod` refuses test Turnstile keys, a shared Amplitude key and a missing production Typeform id.
- **Functions** deploy with the same command; they come from `landing/functions/`.
- **Roll back:** Workers & Pages, `real-world-landing`, Deployments, pick the last good deployment, Rollback. Or check out the last good commit and deploy it again.
- **Budgets before any production deploy:** `pnpm --filter landing check:bundle` (first-load JS under 120 KB gzipped) and a Lighthouse mobile run with LCP under 2.0 s and CLS under 0.05.
- **Browser checks:** `pnpm --filter landing e2e` (Playwright, needs Google Chrome; 40 tests across a phone and a desktop viewport, including an axe pass).

## 6. The Typeform and its webhook

The form is code: `landing/typeform/form.json`. `node landing/scripts/typeform-sync.mjs` creates it the first time (it writes the id to `typeform/form-id.txt`) and updates it after that; add `--webhook-url https://<host>/api/typeform` to point the webhook at a deployment. A Typeform webhook is one URL per form, so staging and production need two forms: the default run manages the staging form (`typeform/form-id.txt`) and `--env production` creates and manages a separate production form (`typeform/form-id.production.txt`). Point the production form's webhook at `https://tryrealworld.com/api/typeform` and leave the staging form on the preview. It reads `TYPEFORM_TOKEN` and `TYPEFORM_WEBHOOK_SECRET` from `.dev.vars`. Set `VITE_TYPEFORM_FORM_ID` to the id and rebuild. The webhook is signed; a request with a missing or wrong `Typeform-Signature` gets `401` and is logged with no payload in `typeform_events`.

## 7. Export the waitlist (CSV)

```
psql "$DATABASE_URL_PROD" -c "\copy (select email, created_at, headline_variant, utm_source, utm_medium, utm_campaign, utm_content, country, role, forecast_question_id, forecast_probability, completed_at from waitlist_signups order by created_at) to 'waitlist.csv' csv header"
```

Use the production connection string (`DATABASE_URL_PROD` in `.dev.vars`, the Neon `main` branch). The file contains email addresses: keep it out of the repo and delete it after use.

## 8. Verify tracking after a deploy

Follow "Verify after a deploy" in [analytics/TRACKING_PLAN.md](analytics/TRACKING_PLAN.md). On staging, `node landing/scripts/verify-staging.mjs --typeform` does it for you: it signs up on the preview, completes the real Typeform embed, and prints the signup id. Expect `environment = staging` on every event, browser and server. Then check the Prod project is empty (filter `environment = production`, or open User Look-Up for the device). Delete the rows the check created, by id, never by pattern (run it on the branch you tested: staging for a preview, `main` only for a production check):

```
delete from waitlist_signups where id = '<signup id>';
delete from typeform_events where id = '<event id>';
```

## 9. Reddit and X ads

Rules and caps are in [gtm/prelaunch-ads.md](../gtm/prelaunch-ads.md): $50 a day per channel, at most 3 days a flight, no election or policy content, kill rule included. Do not change them here.

1. **Creative.** Images are in `landing/ads/` (four headlines, three sizes: 1080x1080, 1080x1350, 1080x1920, listed in `ads/manifest.json`). Regenerate with `pnpm --filter landing ads`. Each says "AI-simulated. Not a poll." Their text sits inside conservative safe zones we chose ourselves; the Reddit and X safe zones are not verified ([product/101](../research/product/101-prelaunch-landing-waitlist-ads.md)), so check each in the platform's preview before submitting.
2. **Links.** `https://tryrealworld.com/?utm_source=reddit&utm_medium=paid_social&utm_campaign=prelaunch_waitlist_2026_10&utm_content=<headline id>` (use `x` for X). Ids: `receipts`, `hashed`, `public-score`, `your-call`.
3. **Pixels.** Create the Reddit pixel and the X pixel in each ads account and set `VITE_REDDIT_PIXEL_ID` and `VITE_X_PIXEL_ID`. In X Ads Manager create a Lead event for the pixel and set `VITE_X_LEAD_EVENT_ID` to its id. Rebuild and deploy, then use each platform's pixel test tool to see `PageVisit` (Reddit) and the Lead on a test signup. The call shapes in `src/pixels.ts` have not yet been checked against a live pixel; this step is where that happens.
4. **Review.** X may hold ads for review. Its review time and political-content rules are unverified in [product/101](../research/product/101-prelaunch-landing-waitlist-ads.md): submit early. Meta does not run until its policy review is read and a decision is recorded.

## 10. Go-live checklist

Each step is yours to run. Nothing here has been done.

1. **Read the legal pages.** Founders read `/privacy` and `/terms` with [LEGAL_REVIEW.md](LEGAL_REVIEW.md), ideally with a lawyer, then remove the draft banner (`src/pages/DraftBanner.tsx`) or decide what changes.
2. **Real Turnstile keys.** Cloudflare dashboard, Turnstile, add a widget with hostnames `tryrealworld.com` and `www.tryrealworld.com` (and the `*.pages.dev` host if you want to test the real keys there first). Put the site key in `.dev.vars` as `TURNSTILE_SITE_KEY_PROD` and the secret as `TURNSTILE_SECRET_KEY_PROD`.
3. **Rotate the Typeform token.** Create a new personal token in Typeform, replace `TYPEFORM_TOKEN` in `.dev.vars`, revoke the old one. Run `node landing/scripts/typeform-sync.mjs --env production --webhook-url https://tryrealworld.com/api/typeform` to create the production form (see MORNING.md on the Typeform plan).
4. **Connect the domain.** Section 1, steps 1 to 4 and 6. Do not deploy yet.
5. **Set the production secrets.** Check `.dev.vars` has `DATABASE_URL_PROD`, `AMPLITUDE_API_KEY_PROD`, `TURNSTILE_SECRET_KEY_PROD`, `TYPEFORM_WEBHOOK_SECRET`, then run `bash landing/scripts/set-prod-secrets.sh`. Check the names with `pnpm exec wrangler pages secret list --project-name real-world-landing`.
6. **Pixels and email.** Section 9 step 3 (pixel ids, or leave them empty on purpose) and section 3 (`hello@tryrealworld.com`, `contactEmail`). Sections 2 and 9: app URL left empty unless the app is ready.
7. **Build and deploy production.** `pnpm --filter landing check:bundle`, `pnpm --filter landing build:prod`, then section 1 step 5.
8. **Test production once.** Section 1 step 7 and section 8: sign up with a `test+<time>@example.com` address, complete the Typeform, confirm the row in Neon `main` and the events in the **Prod** Amplitude project with `environment = production`, confirm the Staging project got nothing new, then delete the rows by id.
9. **Amplitude.** The Prod project's dashboard: [AMPLITUDE_GUIDE.md](analytics/AMPLITUDE_GUIDE.md), "Go-live checklist for Amplitude". Check the replay count after the first ad day.
10. **Lighthouse** on the production URL, mobile, and judge LCP on real-user numbers once ads run ([perf/LIGHTHOUSE.md](perf/LIGHTHOUSE.md)).
11. **The question list** on the page is the one the founders want public: three central-bank decisions (US Fed, ECB, Bank of Japan); the election question was removed ([decisions-needed item 2](../company/decisions-needed.md) stays open).
12. **Ads.** Submit with the first flight's caps (section 9).

## 11. Retire on Oct 27

1. Export the waitlist (section 7) and send the launch email from the provider chosen for sending.
2. Point `tryrealworld.com` at the live daily receipts page: attach it to that project, then remove it from `real-world-landing` (Custom domains, remove). Keep `/api/*` working until the Typeform webhook is removed.
3. Remove the Typeform webhook; stop the ad flights and remove the pixels.
4. Decide retention for the waitlist table and update the privacy page, then archive or delete this folder ([0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md)).
