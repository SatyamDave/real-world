# web/

The Vite + React + TypeScript web app: daily question, receipts with an in-browser verifier, fork card, globe and agent panel. `web/README.md` maps each file.

## Specs and research

- Product: [product/web-app.md](../product/web-app.md)
- Decision: [0001-architecture](../research/decisions/0001-architecture.md) (stack: Vite, React, react-globe.gl, Natural Earth)
- Research: [engineering/071](../research/engineering/071-web-app-stack.md), [open-source/041](../research/open-source/041-globe-visualization.md)

## Boundaries

- All data comes through `@real-world/sdk` (`sdk/typescript/`); no hand-written fetch calls. `src/api.ts` holds the one client instance, and components call its methods.
- Every result view shows "AI-simulated. Not a poll or a prediction of a real person" and the coverage tier.
- Colours, type and radius come from `src/styles/tokens.css`, a copy of the landing page's tokens. Change both together; no colour literals in component CSS.
- No sign-in, accounts, onboarding popups or server-rendered images in the base build.
- Lint and format with Biome; type check with `tsc --noEmit`; test with Vitest.

## Test

```
pnpm --filter web test
pnpm --filter web typecheck
make check
```

## A reviewer rejects

- A result view without the simulation disclaimer or coverage tier.
- A fetch call that bypasses the SDK.
- A dependency beyond those the slice brief names.
- UI copy that is not literal status, or a popup that only explains the next step.
