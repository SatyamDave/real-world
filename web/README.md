# web

The Vite + React + TypeScript web app: the daily question and its reveal, the latest receipts, a fork of today's world that runs into a shareable card, a globe of the 16 sample countries with one agent per click, and `/receipts` with an in-browser verifier. What it must do is specified in [product/web-app.md](../product/web-app.md).

## Run and test

```
make dev                   # API on :8000 and this app on :5173, from the repo root; API_PORT and WEB_PORT override them
pnpm --filter web test     # Vitest, with the API mocked and fixtures from src/fixtures/
pnpm --filter web build    # type check and production build
```

`VITE_API_URL` points the app at another API (default `http://localhost:8000`).

## Where things are

| File | What it does |
| --- | --- |
| `src/api.ts` | The one `@real-world/sdk` client, pointed at `VITE_API_URL`. Every component calls it; nothing else fetches. |
| `src/App.tsx` | Routes on `location.pathname` (`/`, `/fork/{id}`, `/receipts`) and the shared bits: disclosure line, tier badge, formatting. |
| `src/DailyQuestion.tsx` | Slider, submit, four-way reveal and streak. The player id lives in `localStorage`. |
| `src/ForkCard.tsx` | Fork box with cost estimate, SSE progress, and the fork card. |
| `src/Globe.tsx` | react-globe.gl over `public/countries-110m.geojson` (Natural Earth 1:110m admin-0, public domain), loaded after first paint. |
| `src/AgentPanel.tsx` | One sampled agent: "What moved this agent" and "In its own words". |
| `src/Receipts.tsx`, `src/verify.ts` | Receipts strip and page; the verifier recomputes leaves, roots and the chain with WebCrypto per [0002](../research/decisions/0002-benchmark-and-receipts.md). |
| `src/fixtures/` | API responses in the generated SDK shapes, for the component tests. |
