# landing/

The temporary pre-launch landing page and waitlist. A Vite + React + TypeScript
single-page app on Cloudflare Pages, separate from `web/`, live Oct 13–27 and
retired when the apex domain moves to the live daily page.

- Product spec: [product/landing-page.md](../product/landing-page.md)
- Decisions: [0003 landing/waitlist](../research/decisions/0003-prelaunch-landing-and-waitlist.md), [0004 launch name](../research/decisions/0004-launch-name-real-world.md)
- Research: [product/101](../research/product/101-prelaunch-landing-waitlist-ads.md), [open-source/041](../research/open-source/041-globe-visualization.md), [engineering/071](../research/engineering/071-web-app-stack.md)
- Ads and copy: [gtm/prelaunch-ads.md](../gtm/prelaunch-ads.md), claims allowed in [gtm/messaging.md](../gtm/messaging.md)

## Run

```
pnpm --filter landing dev          # or: make landing-dev
pnpm --filter landing build        # tsc --noEmit && vite build -> dist/
pnpm --filter landing test         # Vitest
pnpm --filter landing typecheck
```

Secrets go in `landing/.dev.vars` (git-ignored); copy `.dev.vars.example`.
Preview deploy: `wrangler pages deploy ./dist --branch <branch>` (see `RUNBOOK.md`, added in the launch-readiness PR).

## Where things live

| Path | What |
| --- | --- |
| `src/brand.ts` | the display name and teaser question, in one place |
| `src/config.ts` | client config from `VITE_*` (APP_URL gating, pixel ids) |
| `src/copy/headlines.ts` | message-matched headlines keyed by `utm_content` |
| `src/copy/consent.ts` | the consent line and its stored version |
| `src/data/receipts.json` | pending receipt cards (no hash, no probability) |
| `src/analytics.ts` | one `track()` wrapper (Amplitude + pixels wired in PR4) |
| `src/components/Globe.tsx` | cobe globe, lazy after first paint, poster fallback |
| `src/styles/tokens.css` | chosen design tokens (A); `tokens-b/-c.css` are swappable |
| `scripts/gen_globe_poster.py` | builds `public/globe-poster.svg` from Natural Earth |
| `design/direction-{a,b,c}/` | the three design directions and their screenshots |
| `functions/` | Cloudflare Pages Functions (signup, Typeform webhook) — added in PR3 |
| `db/migrations/` | Neon Postgres migrations — added in PR3 |

See [PLAN.md](PLAN.md) for the build plan and [OVERNIGHT_LOG.md](OVERNIGHT_LOG.md) for decisions.
