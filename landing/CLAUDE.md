# landing/

The pre-launch landing page and waitlist (Vite + React + TypeScript on Cloudflare
Pages). It is temporary and separate from `web/` so it cannot break the launch.
`README.md` maps the files; the product spec is [product/landing-page.md](../product/landing-page.md).

## Specs, decisions, research

- Product: [product/landing-page.md](../product/landing-page.md)
- Decisions: [0003](../research/decisions/0003-prelaunch-landing-and-waitlist.md), [0004](../research/decisions/0004-launch-name-real-world.md)
- Research: [product/101](../research/product/101-prelaunch-landing-waitlist-ads.md), [open-source/041](../research/open-source/041-globe-visualization.md), [engineering/071](../research/engineering/071-web-app-stack.md)

## Boundaries

- Every public claim comes from the allowed list in [gtm/messaging.md](../gtm/messaging.md). No accuracy %, no "beats the market", no "world model", no "100k agents" headline.
- No hash, salt, probability or score is ever shown or invented. Receipt cards show an honest pending state only, from `src/data/receipts.json`.
- Every result-like surface carries "AI-simulated" and the simulation disclaimer.
- The display name lives only in `src/brand.ts`. Do not hard-code "Real World" elsewhere ([0004](../research/decisions/0004-launch-name-real-world.md)).
- Secrets live in `.dev.vars` (git-ignored). Never print, log or commit a secret. Commit only `.dev.vars.example`.
- While `APP_URL`/`VITE_APP_URL` is empty, every "Try it" link is hidden.
- Cloudflare: preview deploys only (`wrangler pages deploy --branch <branch>`). Never a custom domain or the production branch from here.
- Lint and format with Biome; type check with `tsc --noEmit`; test with Vitest. New dependencies are pinned to exact versions and named in the PR.

## Test

```
pnpm --filter landing test
pnpm --filter landing typecheck
make check
```

## A reviewer rejects

- A claim `gtm/messaging.md` does not allow, anywhere including tests, fixtures and ad creative.
- A shown or invented hash, salt or probability.
- A result view without the "AI-simulated" disclosure.
- A hard-coded brand name outside `src/brand.ts`.
- A secret value printed, logged or committed, or a `.dev.vars` that is not git-ignored.
- A dependency beyond those the slice names.
