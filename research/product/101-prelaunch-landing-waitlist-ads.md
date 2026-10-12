# Pre-launch landing page, waitlist and paid ads

- Date: 2026-10-12
- Area: product
- Confidence: medium for vendor plan limits and APIs (read on vendor pages, linked below). Low for ad-platform review times and ad-policy rules: those pages were not opened, so they are marked unverified. Domain availability was not checked: registry lookups were blocked from the research environment.

## Answer

A pre-launch page from Oct 13 to Oct 27 can do two jobs the launch plan does not cover. It can test which message makes strangers act, and it can collect a first cohort of daily-question players before the receipts page exists. It must not replace the launch: Show HN links the live daily page, never a landing page or waitlist ([launch plan](../../gtm/launch-plan.md)). So the landing page is temporary. It lives in its own folder, writes signups to Postgres, tracks behaviour in Amplitude, makes no claim outside [`gtm/messaging.md`](../../gtm/messaging.md), and hands the domain to the live app on launch day.

## Findings

Typeform:
- The pricing page lists Basic at 100 responses a month (750 max), Plus at 1,000 (2,500 max) and Business at 10,000. Webhooks are listed on Basic and above. Removing Typeform branding needs Plus. The page shows two different price sets for each plan without explaining the difference: Basic is $39 or $29 a month on monthly billing ([Typeform pricing](https://www.typeform.com/pricing)).
- The Free plan allows 10 responses a month, according to a third-party summary. Typeform's own pricing page did not state it ([CostBench](https://www.costbench.com/software/survey-software/typeform/free-plan/)). Inference: one day of paid traffic can exceed the Free and Basic caps.
- URL parameters (formerly hidden fields) are a Free feature. They are passed after `#` in the form URL. Names must be lower case with underscores ([Typeform help](https://help.typeform.com/hc/en-us/articles/360052676612-Using-URL-parameters-formerly-Hidden-Fields)).
- Webhooks are signed. The `Typeform-Signature` header is `sha256=` plus the base64 HMAC-SHA256 of the raw body, keyed with the webhook secret ([Typeform webhook security](https://www.typeform.com/developers/webhooks/secure-your-webhooks/)).

Amplitude:
- The Free plan includes 2M events a month, autocapture, 10,000 session replays a month with 1 month of retention, and 1 active web experiment ([Amplitude pricing](https://amplitude.com/pricing)).
- Server events go to `POST https://api2.amplitude.com/2/httpapi`. Each event needs `event_type` and either a `user_id` or `device_id` of at least 5 characters. Amplitude drops repeats with the same `insert_id` and `device_id` within 7 days, so retries are safe if every event carries an `insert_id` ([Amplitude HTTP V2](https://amplitude.com/docs/apis/analytics/http-v2)).
- The Amplitude MCP server (`https://mcp.amplitude.com/mcp`) can read and write charts, dashboards, experiments and event definitions. It cannot send event data ([Amplitude MCP](https://amplitude.com/docs/amplitude-ai/amplitude-mcp)).

Postgres:
- Neon's serverless driver, `@neondatabase/serverless`, queries over HTTP and is listed for Cloudflare Workers ([Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)). This matches the CTO lens choice of Cloudflare plus Neon ([CTO lens](../lenses/cto.md)).
- The Neon MCP server is at `https://mcp.neon.tech/mcp`. `npx neon@latest plugins` installs it with skills for Claude Code ([Neon MCP](https://neon.com/docs/ai/neon-mcp-server)).

Globe:
- cobe is an MIT WebGL globe of about 5 KB with no dependencies. It supports markers, arcs, and DOM labels anchored to markers that can fade as they rotate behind the globe ([cobe](https://github.com/shuding/cobe)).
- The app's globe is react-globe.gl on three.js ([0001](../decisions/0001-architecture.md), [071](../engineering/071-web-app-stack.md)). Unmeasured inference: three.js is a much larger download than cobe. Ad traffic lands on phones, where download weight hurts first paint.

Design and tooling:
- Anthropic publishes a `frontend-design` plugin for Claude Code. It makes the model settle the subject, audience and a token system before writing UI ([ClaudeLog](https://claudelog.com/faqs/what-is-frontend-design-skill-in-claude-code/)).
- Playwright MCP is added with `claude mcp add playwright npx @playwright/mcp@latest` ([playwright-mcp](https://github.com/microsoft/playwright-mcp)).
- Cloudflare runs managed MCP servers, including the full API at `https://mcp.cloudflare.com/mcp` and docs at `https://docs.mcp.cloudflare.com/mcp` ([Cloudflare MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/)).

Unverified (pages not opened; check before relying on them):
- Meta ad review usually finishes within a day but can take longer for new accounts.
- Ads that mention elections, or possibly economic policy, can fall under "social issues, elections or politics" rules on Meta and X. Those rules require advertiser authorization that takes days.

## What it means for Real World

- For the product: the waitlist is one input to the daily question. The strongest pre-launch hook is to ask for a forecast as the first step of signup: "Make your call now; we score you against the simulated world and the market when it resolves." It previews the core loop ([daily question](../../product/daily-question.md), [CPO lens](../lenses/cpo.md)) without showing any simulated number before one exists.
- For the engineering: keep it out of `web/` so it cannot collide with the v1 app being built at the same time. One Cloudflare Pages project with two Pages Functions (signup, Typeform webhook), one Neon table, one Amplitude project. Store the email in our own table first, so a Typeform response cap or a failed iframe never loses a lead.
- For the business: paid signups are weak YC evidence on their own. The useful outputs are which message converts (by `utm_content`), cost per signup, and how many signups answer the first daily question on Oct 27. Spend should stay small until those three numbers exist.

## Recommendations

1. Decide the launch name before buying a domain. The name is open item 1 in `company/decisions-needed.md` and needs a decision record ([naming](085-naming-trademark.md)).
2. Build the page in `landing/` as a separate Vite app on Cloudflare Pages. Write a spec at `product/landing-page.md` and a decision record for the hosting and data choices.
3. Two-step signup: a native email field writes a row to Postgres at once, then the embedded Typeform collects the forecast and role. Rows are joined by a `signup_id` URL parameter.
4. Use Typeform Plus, or Basic for the first day only, and watch the response count against the cap.
5. Amplitude Browser SDK with autocapture and session replay. Server-side events from the Pages Functions reuse the browser `device_id` and send an `insert_id`.
6. Use cobe for the hero globe, loaded after first paint, with a static poster for no-WebGL and reduced-motion visitors.
7. Message-matched headlines: each ad sets `utm_content`, and the page picks the matching headline from an allow-list in `gtm/messaging.md`. Report conversion by headline.
8. No election and no policy questions in ad creative until the ad-policy rules are read. Lead with the product, not a political event.
9. Publish a privacy policy before any ad runs, and target the US only until there is a consent banner.
10. On Oct 27, point the domain at the live daily page and turn the landing page off.

## Open questions

- Which names and domains are free? Check at a registrar, since lookups were blocked here.
- The actual Meta, X and Reddit review times and policy categories for this ad copy. Read each platform's policy page and submit one test ad early.
- Cost per signup by channel. Unknown until ads run; report it with n.
- Whether Typeform's embedded form slows mobile pages enough to matter. Compare drop-off between step 1 and step 2 in Amplitude.

## Sources

- [Typeform pricing](https://www.typeform.com/pricing), accessed 2026-10-12
- [CostBench: Typeform free plan](https://www.costbench.com/software/survey-software/typeform/free-plan/), accessed 2026-10-12
- [Typeform help: URL parameters](https://help.typeform.com/hc/en-us/articles/360052676612-Using-URL-parameters-formerly-Hidden-Fields), accessed 2026-10-12
- [Typeform: secure your webhooks](https://www.typeform.com/developers/webhooks/secure-your-webhooks/), accessed 2026-10-12
- [Amplitude pricing](https://amplitude.com/pricing), accessed 2026-10-12
- [Amplitude HTTP V2 API](https://amplitude.com/docs/apis/analytics/http-v2), accessed 2026-10-12
- [Amplitude MCP](https://amplitude.com/docs/amplitude-ai/amplitude-mcp), accessed 2026-10-12
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), accessed 2026-10-12
- [Neon MCP server](https://neon.com/docs/ai/neon-mcp-server), accessed 2026-10-12
- [cobe](https://github.com/shuding/cobe), accessed 2026-10-12
- [ClaudeLog: frontend-design skill](https://claudelog.com/faqs/what-is-frontend-design-skill-in-claude-code/), accessed 2026-10-12
- [Playwright MCP](https://github.com/microsoft/playwright-mcp), accessed 2026-10-12
- [Cloudflare managed MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/), accessed 2026-10-12
