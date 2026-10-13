# Tally form spec: build two forms by hand

You build **two** Tally forms with identical fields: one for staging, one for production. They differ only in name, webhook URL and signing secret. A Tally webhook belongs to one form, so one form per environment keeps a staging test out of the production database.

Everything is on Tally's **free plan**. Free includes unlimited forms and submissions, hidden fields and webhooks, per [Tally's pages](https://tally.so/help/hidden-fields) and [webhook page](https://tally.so/help/webhooks). Free keeps a small "Made with Tally" badge in the form; removing it needs Tally Pro ([embed page](https://tally.so/help/embed-your-form)). I could not load a free-plan form to screenshot the badge: the one demo form I embedded belongs to Tally and shows no badge. Check how it looks in your own form (step 9) and tell me if it clashes.

How sure each step is: steps marked **(docs)** quote Tally's documentation. Steps marked **(check on screen)** describe Tally's editor from general knowledge and I could not open the editor, so the button label may differ a little. Nothing here needs a Tally API key.

## Before you start

1. Make a Tally account at tally.so (free).
2. Generate two different signing secrets in a terminal, one per form. Do not reuse one:
   ```
   openssl rand -hex 32     # staging
   openssl rand -hex 32     # production
   ```
   Keep both. They go into `landing/.dev.vars` in step 11 and into the forms in step 7. Never paste them anywhere public or into a PR.

## Build the form (do steps 1 to 10 twice)

1. **New form.** In Tally click New form, then Start from scratch (check on screen). Name it `Waitlist: your forecast (staging)`, or `(production)` for the second one.
2. **Block 1, a number question.** Click into the first line and type `/number` and pick the Number block **(docs for the slash menu: blocks are added by typing `/`; `/hidden` is documented, `/number` follows the same pattern, check on screen)**.
   - Question text: `Will the US Federal Reserve cut its policy rate at the meeting ending October 28, 2026?`
   - Description: `Enter your chance that the answer is yes, from 0 to 100.`
   - Turn on Required.
   - If the block has minimum and maximum settings, set 0 and 100 (check on screen). The server also rejects anything outside 0 to 100, so this is only a friendlier form.
3. **Block 2, a multiple choice question.** Type `/multiple choice` and pick Multiple choice (check on screen).
   - Question text: `Which best describes you?`
   - Options, in this order, one per line: `Forecaster or trader`, `Researcher or academic`, `Journalist or analyst`, `Developer or builder`, `Just curious`.
   - Required on. Single choice only: leave "allow multiple selection" off. Randomise order off.
4. **Block 3, the hidden fields.** Type `/hidden` and pick Hidden fields **(docs: "Hidden fields are created by typing `/hidden` in the form editor.")**. Add exactly four, named exactly like this, lower case with underscores, because the names are case sensitive and the webhook reads them by name:
   - `signup_id`
   - `device_id`
   - `variant`
   - `question_id`

   Our page fills them in through the embed address (`?signup_id=...&device_id=...`). Tally documents hidden fields as URL query parameters **(docs)**. Whether the same parameters work on the `/embed/` address is the one thing we confirm in the final check (step 12); the form still saves answers if they do not, but the webhook cannot match the row without `signup_id`.
5. **Only these blocks.** The server finds the answers by type: the first Number block is the forecast and the first Multiple choice block is the role. Do not add another number or choice question, and do not ask for an email address (we already have it).
6. **Thank-you page.** Open the form's end or completion settings (check on screen) and use a thank-you page, not a redirect:
   - Title: `Thanks. You're on the list.`
   - No button, no link, no redirect.
7. **Webhook.** Publish the form first **(docs: "Publish your form and go to the Integrations tab. Click Connect to Webhooks.")**. Then in the Integrations tab, next to Webhooks click Connect, and fill in:
   - Endpoint URL, staging: `https://landing-preview.real-world-landing.pages.dev/api/tally`
   - Endpoint URL, production: `https://tryrealworld.com/api/tally` (the domain is not connected yet; set it now and Tally will report failures until go-live, or leave this step for go-live)
   - Signing secret: paste the staging secret into the staging form and the production secret into the production form **(docs: a signing secret makes each request carry a `Tally-Signature` header)**.
   - Event: form responses (the only event Tally offers for webhooks).
   - Save. Tally retries a failed delivery five times (5 min, 30 min, 1 hour, 6 hours, 1 day) and emails you if all fail **(docs)**.
8. **Look.** Hide the form title (we hide it in the embed address too). In the design settings (check on screen) set the button colour to ink `#15201b` and the text colour to the same, and pick a font from the list that is closest to IBM Plex Sans if one is offered. Custom CSS is a paid feature, so the form will not match the page exactly; the embed address already asks for a transparent background.
9. **Look at the badge.** Open the published form's link. Note where "Made with Tally" sits and whether it clashes with the page. Send me a screenshot if it bothers you.
10. **Copy the form id.** The share link is `https://tally.so/r/<FORM ID>`. The id is the part after `/r/`. It is not a secret.

## Put the values where the code reads them (step 11)

In `landing/.dev.vars` (git-ignored; never commit it):

```
TALLY_FORM_ID_STAGING=<staging form id>
TALLY_FORM_ID_PROD=<production form id>
TALLY_SIGNING_SECRET_STAGING=<staging secret from step 2>
TALLY_SIGNING_SECRET_PROD=<production secret from step 2>
```

The two secrets must differ. `set-prod-secrets.sh` refuses to run if they match.

## Final check on staging (step 12)

```
node landing/scripts/set-staging-env.mjs          # writes the staging secret to the Pages preview
pnpm --filter landing build:staging               # build with the staging form id
pnpm exec wrangler pages deploy landing/dist --project-name real-world-landing --branch landing-preview
node landing/scripts/verify-staging.mjs --form    # signs up, fills the real Tally form, prints ids
```

Then open Neon, branch `staging`, and check the signup row has the role, the forecast and `completed_at` set, and that `typeform_events` has a row with `signature_valid = true`. Delete the test rows by id (RUNBOOK section 8). If `signup_id` did not arrive as a hidden field the row is not matched: tell me, and the fix is on our side (the embed address).

## What the server does with a delivery

It reads `Tally-Signature` (base64 HMAC-SHA256). Tally's own example signs the re-serialized JSON, other write-ups say the raw body, so the server accepts either; a changed body fails both. A missing or wrong signature gets `401` and is logged without its content. A valid event is saved once by Tally's `eventId`, so a retry is ignored. The first completed answer for a signup wins. Hidden fields arrive in `data.fields` as entries with `type: "HIDDEN_FIELDS"` and the field name in `label` **(docs example)**. The number answer is `INPUT_NUMBER`, and the choice answer is `MULTIPLE_CHOICE` with the chosen option id in `value` and the option texts in `options` **(docs example)**.
