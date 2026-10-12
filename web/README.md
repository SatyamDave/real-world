# web

The Vite + React + TypeScript web app: the daily question and its reveal, the latest receipts, a fork of today's world that runs into a shareable card, a globe of the 16 sample countries with one agent per click, and `/receipts` with an in-browser verifier. What it must do is specified in [product/web-app.md](../product/web-app.md).

## Run and test

```
make dev                   # API on :8000 and this app on :5173, from the repo root; API_PORT and WEB_PORT override them
pnpm --filter web test     # Vitest, with the API mocked and fixtures from src/fixtures/
pnpm --filter web build    # type check and production build; fails if the API at VITE_API_URL shows a fixture question
pnpm --filter web exec vite build --mode fixtures   # local smoke build on fixtures, without that check
```

`VITE_API_URL` points the app at another API (default `http://localhost:8000`).

## Where things are

| File | What it does |
| --- | --- |
| `src/api.ts` | The one `@real-world/sdk` client, pointed at `VITE_API_URL`. Every component calls it; nothing else fetches. |
| `src/App.tsx` | Routes on `location.pathname` (`/`, `/fork/{id}`, `/receipts`) and the shared bits: disclosure line, tier badge, formatting. |
| `src/DailyQuestion.tsx` | Slider, submit, four-way reveal and streak. The player id lives in `localStorage`. |
| `src/ForkCard.tsx` | Fork box with cost estimate, SSE progress, and the fork card. |
| `src/Globe.tsx` | Loaded only at 768 px and wider, once the page has loaded and gone idle; a still poster holds its place. react-globe.gl over `public/countries-110m.geojson` (Natural Earth 1:110m admin-0, public domain). Each simulated country rings once when it appears; with reduced motion it does not rotate or ring. |
| `src/share.ts` | Pure share builders: the week grid and its text, the fork sentence, text and 1200x630 image, logit steps as share points, trait codes as words. |
| `public/og.png`, `public/favicon.svg` | The static Open Graph image and the favicon. |
| `src/styles/tokens.css`, `src/styles/fonts.css` | The "Commit Slip" tokens and the self-hosted IBM Plex faces, copied from the landing page. `src/styles.css` holds the dark values and every component rule. |
| `public/fonts/`, `public/globe-poster.svg` | IBM Plex Sans and Mono (latin, woff2, SIL Open Font License in `OFL.txt`) and the still globe shown until the live one loads. |
| `src/AgentPanel.tsx` | One sampled agent: "What moved this agent" and "In its own words". |
| `src/Receipts.tsx`, `src/verify.ts` | Receipts strip and page; the verifier recomputes leaves, roots and the chain with WebCrypto per [0002](../research/decisions/0002-benchmark-and-receipts.md). |
| `src/liveCheck.ts` | The production-build check `vite.config.ts` runs: lists every question the API would show and flags `fx-` ids and `example.com` sources. |
| `src/fixtures/` | API responses in the generated SDK shapes, for the component tests. |
