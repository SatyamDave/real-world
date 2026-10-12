# Runbook: pre-launch landing page

For the founders. Everything here is a step you run; nothing below has been done to the production domain. Live Oct 13 to Oct 27, retired on Oct 27 ([decision 0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md), [launch plan](../gtm/launch-plan.md)).

## Where things stand

| Item | State |
| --- | --- |
| Production domain | `tryrealworld.com`, bought on Namecheap. DNS is not configured and nothing is deployed to it (founder instruction, 2026-10-12). |
| Cloudflare Pages project | `real-world-landing`. Only preview deploys so far (`*.pages.dev`). |
| Database | Neon project `real-world-landing` (id `frosty-river-82145431`), database `landing`, branches `main` and `dev`. |
| Analytics | Amplitude project `877388`. Plan: [analytics/TRACKING_PLAN.md](analytics/TRACKING_PLAN.md). |
| Sending email | Not set up. Cloudflare Email Routing only receives. Sending the launch email needs an email provider with SPF and DKIM on `tryrealworld.com`; decide before Oct 27. |

## 1. Connect tryrealworld.com to Cloudflare Pages

Do this in order. Steps 1 to 3 change where the domain's DNS lives; until step 5 nothing public changes.

Why Cloudflare nameservers: on a Free plan the only zone setup Cloudflare offers is the full one, where Cloudflare is the DNS host ([Cloudflare zone setups](https://developers.cloudflare.com/dns/zone-setups/)). A Pages custom domain on the apex (`tryrealworld.com`, not just `www`) needs the zone on Cloudflare. If you would rather keep Namecheap DNS, only a subdomain such as `www` can be a CNAME to `real-world-landing.pages.dev`, and the apex would not work.

1. **Add the domain to Cloudflare.** Cloudflare dashboard, Domains, Onboard a domain, enter `tryrealworld.com`, choose the Free plan. Accept the DNS records Cloudflare finds (there should be none worth keeping on a new domain). Cloudflare shows two nameservers; copy them.
2. **Point Namecheap at them.** Namecheap, Domain List, Manage next to `tryrealworld.com`, Nameservers, choose Custom DNS, paste the two Cloudflare nameservers, save. Propagation can take hours; Cloudflare emails when the zone is active.
3. **Turn off Namecheap's own redirects and email forwarding** for the domain if any are set, so they do not fight the new records.
4. **Attach the domain to the Pages project.** Workers & Pages, `real-world-landing`, Custom domains, Set up a custom domain, enter `tryrealworld.com`, confirm. Cloudflare creates the DNS record and issues the certificate. Repeat for `www.tryrealworld.com`, then add a redirect from `www` to the apex (Rules, Redirect Rules).
5. **Only now deploy to production.** The production branch is whichever branch Pages settings name (Settings, Builds, Production branch; check it). Build with the production values in section 4, then `pnpm --filter landing build && pnpm exec wrangler pages deploy landing/dist --project-name real-world-landing --branch <production branch>`. Never run this from a session that has not been told to.
6. **SSL/TLS.** Set encryption mode to Full (strict) and turn on Always Use HTTPS.
7. **Check.** `https://tryrealworld.com/` loads the page; `/privacy` and `/terms` load; `https://tryrealworld.com/api/signup` answers `405` to a GET (the function only accepts POST).

After step 4 also update, then redeploy:

- `VITE_PUBLIC_BASE_URL=https://tryrealworld.com` (canonical and social tags).
- Turnstile: add `tryrealworld.com` to the widget's allowed hostnames (Cloudflare dashboard, Turnstile). Without it the bot check fails on the new domain and every signup shows "We couldn't confirm you're human."
- Typeform webhook: `node landing/scripts/typeform-sync.mjs --webhook-url https://tryrealworld.com/api/typeform` (section 6).
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
| `DATABASE_URL` | secret | Pages secret. Neon pooled string for the `main` branch. |
| `DATABASE_URL_DEV` | local only | `.dev.vars`; used by the integration tests on the Neon `dev` branch. Never a Pages secret. |
| `AMPLITUDE_API_KEY` | secret | Pages secret. The project API key (server events). |
| `TURNSTILE_SECRET_KEY` | secret | Pages secret. |
| `TYPEFORM_WEBHOOK_SECRET` | secret | Pages secret; the same value `typeform-sync.mjs` sends to Typeform. |
| `TYPEFORM_TOKEN` | local only | `.dev.vars`; used only by `typeform-sync.mjs`. |
| `RATE_LIMIT_SALT` | optional secret | Pages secret. Falls back to `TURNSTILE_SECRET_KEY`. |
| `APP_URL` | variable | Pages variable; mirror in `VITE_APP_URL`. |
| `VITE_AMPLITUDE_API_KEY`, `VITE_AMPLITUDE_REPLAY_SAMPLE_RATE`, `VITE_TURNSTILE_SITE_KEY`, `VITE_TYPEFORM_FORM_ID`, `VITE_PUBLIC_BASE_URL`, `VITE_APP_URL`, `VITE_REDDIT_PIXEL_ID`, `VITE_X_PIXEL_ID`, `VITE_X_LEAD_EVENT_ID` | build-time | Set in the shell that runs `pnpm --filter landing build`. They end up in the public bundle, so none may be a secret. |

Set a **production** secret with `pnpm exec wrangler pages secret put <NAME> --project-name real-world-landing`. Wrangler 4.149 has no flag for the preview environment, and a preview deployment does not see production secrets (tested on 2026-10-12 with a dummy secret, since removed). Preview values are set in the dashboard (Workers & Pages, `real-world-landing`, Settings, Variables and Secrets, Preview) or with the Pages API (`PATCH /accounts/<id>/pages/projects/real-world-landing` with `deployment_configs.preview.env_vars`, each secret as `{"type": "secret_text", "value": ...}`).

The preview environment as set up on 2026-10-12 deliberately differs from production: `DATABASE_URL` is the Neon **`dev`** branch (so test signups never touch the real waitlist), and `TURNSTILE_SECRET_KEY` is Cloudflare's always-pass test secret, paired with the test site key `1x00000000000000000000AA` at build time (so automated checks can sign up). The real Turnstile keys are therefore not yet tested on a `*.pages.dev` or `tryrealworld.com` host: add the host to the widget's allowed hostnames and check one real signup before go-live. The production environment has no variables set.

## 5. Deploy and roll back

- **Preview** (safe, any time): `pnpm --filter landing build`, then `pnpm exec wrangler pages deploy landing/dist --project-name real-world-landing --branch landing-preview`. The URL is `https://landing-preview.real-world-landing.pages.dev` (the exact URL is printed).
- **Functions** deploy with the same command; they come from `landing/functions/`.
- **Roll back:** Workers & Pages, `real-world-landing`, Deployments, pick the last good deployment, Rollback. Or check out the last good commit and deploy it again.
- **Budgets before any production deploy:** `pnpm --filter landing check:bundle` (first-load JS under 120 KB gzipped) and a Lighthouse mobile run with LCP under 2.0 s and CLS under 0.05.
- **Browser checks:** `pnpm --filter landing e2e` (Playwright, needs Google Chrome; 40 tests across a phone and a desktop viewport, including an axe pass).

## 6. The Typeform and its webhook

The form is code: `landing/typeform/form.json`. `node landing/scripts/typeform-sync.mjs` creates it the first time (it writes the id to `typeform/form-id.txt`) and updates it after that; add `--webhook-url https://<host>/api/typeform` to point the webhook at a deployment. It reads `TYPEFORM_TOKEN` and `TYPEFORM_WEBHOOK_SECRET` from `.dev.vars`. Set `VITE_TYPEFORM_FORM_ID` to the id and rebuild. The webhook is signed; a request with a missing or wrong `Typeform-Signature` gets `401` and is logged with no payload in `typeform_events`.

## 7. Export the waitlist (CSV)

```
psql "$DATABASE_URL" -c "\copy (select email, created_at, headline_variant, utm_source, utm_medium, utm_campaign, utm_content, country, role, forecast_question_id, forecast_probability, completed_at from waitlist_signups order by created_at) to 'waitlist.csv' csv header"
```

`DATABASE_URL` is the Neon `main` branch string from `.dev.vars`. The file contains email addresses: keep it out of the repo and delete it after use.

## 8. Verify tracking after a deploy

Follow "Verify after a deploy" in [analytics/TRACKING_PLAN.md](analytics/TRACKING_PLAN.md). Delete the rows the check created, by id, never by pattern:

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

1. Founders read `/privacy` and `/terms` and remove the draft banner (`src/pages/DraftBanner.tsx`), or decide what changes.
2. Section 1 steps 1 to 7 done; `https://tryrealworld.com/` loads over HTTPS.
3. Section 4: every secret set on the Pages project, every build variable set, one production build deployed.
4. Section 3: `hello@tryrealworld.com` forwards; `contactEmail` set.
5. Section 6: Typeform webhook pointed at the production URL; a test signup completes the form and fills the row.
6. Section 8: a test signup shows in Neon and in Amplitude; test rows deleted.
7. Sections 2 and 9: app URL and pixel ids set, or deliberately left empty.
8. Lighthouse and `check:bundle` pass on the production URL.
9. The question list on the page is the one the founders want public (the Brazilian runoff card is an open decision, [decisions-needed item 2](../company/decisions-needed.md)).
10. Ads submitted with the first flight's caps.

## 11. Retire on Oct 27

1. Export the waitlist (section 7) and send the launch email from the provider chosen for sending.
2. Point `tryrealworld.com` at the live daily receipts page: attach it to that project, then remove it from `real-world-landing` (Custom domains, remove). Keep `/api/*` working until the Typeform webhook is removed.
3. Remove the Typeform webhook; stop the ad flights and remove the pixels.
4. Decide retention for the waitlist table and update the privacy page, then archive or delete this folder ([0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md)).
