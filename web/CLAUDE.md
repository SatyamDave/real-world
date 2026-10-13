# web/

The Vite + React + TypeScript web app: "Will this land?" (post tests), "Call it" (the daily question against the AI), the person's record, sign-in, and the receipts and scores pages as proof ([decision 0012](../research/decisions/0012-will-it-land-and-call-it.md)). `web/README.md` maps each file.

## Specs and research

- Product: [product/web-app.md](../product/web-app.md), [product/will-it-land.md](../product/will-it-land.md), [product/daily-question.md](../product/daily-question.md), [product/track-record.md](../product/track-record.md)
- Decision: [0001-architecture](../research/decisions/0001-architecture.md) (stack: Vite, React, react-globe.gl, Natural Earth)
- Research: [engineering/071](../research/engineering/071-web-app-stack.md), [open-source/041](../research/open-source/041-globe-visualization.md)

## Boundaries

- All data comes through `@real-world/sdk` (`sdk/typescript/`); no hand-written fetch calls. `src/api.ts` holds the one client instance, and components call its methods.
- Every result view shows "AI-simulated. Not a poll or a prediction of a real person" and the coverage tier.
- Colours, type and radius come from `src/styles/tokens.css`, a copy of the landing page's tokens, and `src/styles/tokens-dark.css`. `scripts/check_design.py` enforces both rules in the root `CLAUDE.md` section "One product, one look, one voice". Canvas code (the share image) reads token values from `tokens.css`, never hard-coded colours.
- One implementation per UI pattern, named in [product/design.md](../product/design.md): the button, card, receipt, stamp, `TierBadge`, `Disclosure`, `Loading`, `LoadError` and the formatting helpers in `src/App.tsx`. Extend the one that exists; a parallel one is a defect `check_design.py` catches when the name repeats and a reviewer catches otherwise.
- Styles live in `src/styles.css` under a class; an inline style needs a `/* design: reason */` on its line. Spacing in 4px steps, borders 1.5px, `var(--radius)`, weights 400 to 600.
- Screenshots in the PR sit beside the reference shots named in `product/design.md`; the `consistency-reviewer` agent compares them.
- Sign-in is the only account surface; no onboarding, popups, tours or server-rendered images. No fork, globe, world or developer surface: those are the engine's, reached through the API.
- Lint and format with Biome; type check with `tsc --noEmit`; test with Vitest.

## Test

```
pnpm --filter web test
pnpm --filter web typecheck
make check
```

## A reviewer rejects

- A result view without the simulation disclaimer or coverage tier.
- A UI change without 390 and 1440 px screenshots, or one that departs from `landing/design/` without a design PR first.
- A fetch call that bypasses the SDK.
- A dependency beyond those the slice brief names.
- UI copy that is not literal status, or a popup that only explains the next step.
