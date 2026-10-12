# Web app

## What it does

One page that opens on today's question, not on a globe. The visitor answers with a slider and sees the instant reveal. Below it is a strip of the latest receipts and a "Fork today's world" box with three prefilled events and a free-text field; a fork shows progress day by day and ends in a card: one setup sentence, the top three segment shifts, the band across ensemble members with one line on what it means, and a link that reopens the same result. Behind everything, a globe shows each country shaded by the topic in view, with its coverage tier; clicking a country opens one sampled agent with two clearly labelled panels, "What moved this agent" (data) and "In its own words" (simulated). A receipts page lists every committed forecast and verifies the hashes in the browser.

## Who it is for

Curious visitors in their first 60 seconds, people opening a shared fork link, and skeptics checking receipts. It is also the PM's way to see that the whole system works.

## How we know it works

- Routes: `/` (daily question, receipts strip, fork box, globe), `/fork/{id}` (fork card, loads from `GET /v1/simulations/{id}`), `/receipts` (full list and verifier).
- All data comes through `@real-world/sdk`; the app has no hand-written fetch calls.
- Component tests (Vitest) for: the reveal after submit, the fork card from a fixture result, the fork form showing an acceptable-use refusal (`Refused: <detail>`) inline, the agent panel labels, the receipts verifier passing on the shared test vector and failing on a changed byte.
- `pnpm --filter web build` succeeds with no type errors; the bundle has no runtime errors on load against the local API (smoke test).
- Every result view shows "Simulation, not a poll or a prediction of a real person" and the coverage tier.
- Measured after launch: first-minute activation and share-to-visit rate ([research/product/077](../research/product/077-daily-question-mechanics.md)).

## What it is not

- Not 100,000 dots: countries are cells, one agent is fetched on click.
- No sign-in, accounts, settings, dashboard, dark-pattern prompts or onboarding popups.
- No server-rendered OG images in the base build; shareable URLs work, images come with hosting.
- No mobile app. The page works at phone width.

## Where the code lives

- `web/` (Vite + React + react-globe.gl), via `sdk/typescript/`.
- Research: [engineering/071](../research/engineering/071-web-app-stack.md), [open-source/041](../research/open-source/041-globe-visualization.md), [product/076](../research/product/076-viral-simulations.md), [product/087](../research/product/087-trust-and-explainability.md), [lenses/cpo.md](../research/lenses/cpo.md).
