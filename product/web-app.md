# Web app

## What it does

One page that opens on one line of thesis, "Don't ask a model. Ask a world.", with the record as its proof ("Scored in public since <first day>: N days, M receipts", from `GET /v1/receipts`), then today's question, not a globe. The header says which world is shown ("World of <date>"). The visitor answers with a slider and sees the instant reveal, the streak and a 7-square grid of their week with a "Copy your week" button. Below it is a strip of the latest receipts and a "Fork today's world" box with three prefilled events and a free-text field; a fork shows progress day by day and ends in a card: one setup sentence, the top three segment shifts, one generated sentence of meaning ("Inflation worry rose 1 pt across 16 countries; the 5 runs agree within 1 pt."), each shift row with its "n = N agents", the band across ensemble members on an axis zoomed to that band's values, cost in cents, and three share actions: "Copy link" (reopens the same result), "Copy text" (event, sentence, disclosure, link) and "Save image" (a 1200x630 PNG drawn in the browser). On screens 768 px and wider, a globe behind everything shows each country shaded by the topic in view, with its coverage tier, and a "Read one agent: United States, Brazil, Kenya" row under the question opens the panel without finding a country on the globe. Below 768 px the globe and its three.js chunk are not loaded; a "Read one agent" list of every simulated country with its tier takes its place. Choosing a country opens one sampled agent with two clearly labelled panels, "What moved this agent" (data) and "In its own words" (simulated). Each step shows the change in the agent's chance of leaning yes in percentage points, converted from the logit step the API returns, and traits read as words ("woman · 35-54 · higher education · urban"). A receipts page lists every committed forecast (probabilities as percentages, commit times in local time with the UTC string on hover) and verifies the hashes in the browser. Its score cards lead with "No claim yet" and the resolved n until 100 questions resolve, and show no interval below n = 10.

States, written out:

- Loading: "Loading <thing>" with a spinner, for every API call; the agent's account reads "Writing the account".
- Error: "Could not load <thing>. The server did not respond." (or "had an error", "refused the request", "It was not found."), with "Try again"; the response body is never shown.
- Empty: "No forecasts committed yet.", "No days committed yet.", "No forecast is hashed yet. The record starts with the first one.", "No segment moved more than the band."
- A fork id that does not exist: "This fork does not exist or has expired." Any other unknown path: "Page not found".

Every route sets its own title (a fork uses its event text), the page has a favicon, a static Open Graph image (`web/public/og.png`) and description, a skip link, and focus that moves into the agent panel on open and back on close.

## Who it is for

Curious visitors in their first 60 seconds, people opening a shared fork link, and skeptics checking receipts. It is also the PM's way to see that the whole system works.

## How we know it works

- Routes: `/` (daily question, receipts strip, fork box, globe), `/fork/{id}` (fork card, loads from `GET /v1/simulations/{id}`), `/receipts` (full list and verifier).
- All data comes through `@real-world/sdk`; the app has no hand-written fetch calls.
- Component tests (Vitest) for: the reveal and week grid after submit, the closed state, error copy and retry, the fork card from a fixture result, the fork form showing an acceptable-use refusal (`Refused: <detail>`) inline, the empty shifts state, the missing-fork copy, the agent panel labels and share-point deltas, the receipts verifier passing on the shared test vector and failing on a changed byte, the score card's "No claim yet", the thesis and proof line, and the not-found route. `share.test.ts` covers the grid, the share texts, the logit-to-share conversion and the trait words.
- A Playwright run at 1440 and 375 px, light and dark, against the local API: no horizontal scroll, the globe chunk is not requested at 375 px, the fork image is 1200x630.
- `pnpm --filter web build` succeeds with no type errors; the bundle has no runtime errors on load against the local API (smoke test).
- Every result view shows "Simulation, not a poll or a prediction of a real person" and the coverage tier.
- Measured after launch: first-minute activation and share-to-visit rate ([research/product/077](../research/product/077-daily-question-mechanics.md)).

## What it is not

- Not 100,000 dots: countries are cells, one agent is fetched on click.
- No sign-in, accounts, settings, dashboard, dark-pattern prompts or onboarding popups.
- No server-rendered OG images in the base build: the page carries one static image, and a fork's image is drawn in the browser for the visitor to attach. Per-fork link previews come with hosting.
- No mobile app. The page works at phone width.

## Where the code lives

- `web/` (Vite + React + react-globe.gl), via `sdk/typescript/`.
- Research: [engineering/071](../research/engineering/071-web-app-stack.md), [open-source/041](../research/open-source/041-globe-visualization.md), [product/076](../research/product/076-viral-simulations.md), [product/087](../research/product/087-trust-and-explainability.md), [lenses/cpo.md](../research/lenses/cpo.md).
