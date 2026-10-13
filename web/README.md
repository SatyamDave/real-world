# web

The Vite + React + TypeScript web app, for consumer founders: a home and a simulator for message tests (on simulated consumers, sealed when signed in, with the retrospective check), "How it works", your tests, sign-in, and the public record (`/scores`, `/receipts` with an in-browser verifier, `/questions/{id}`). What it must do is specified in [product/web-app.md](../product/web-app.md).

## Run and test

```
make dev                   # API on :8000 and this app on :5173, from the repo root; API_PORT and WEB_PORT override them
pnpm --filter web test     # Vitest, with the API mocked and fixtures from src/fixtures/
pnpm --filter web build    # type check and production build; fails if the API at VITE_API_URL shows a fixture question
pnpm --filter web exec vite build --mode fixtures   # local smoke build on fixtures, without that check
```

`VITE_API_URL` points the app at another API (default `http://localhost:8000`). `VITE_PUBLIC_ORIGIN` (an https origin, no path) is required by a production build and makes canonical, `og:` and sitemap URLs absolute; dev and `--mode fixtures` use `http://localhost:5173`.

## Where things are

| File | What it does |
| --- | --- |
| `src/api.ts` | The one `@real-world/sdk` client, pointed at `VITE_API_URL`. Every public read goes through it. |
| `src/session.ts` | The cookie-authenticated calls the SDK leaves out (sign-in, post tests, your record), `useSession`, and the in-browser seal check. The only other module that calls fetch. |
| `src/App.tsx` | Routes on `location.pathname` (`/`, `/receipts`, `/acceptable-use`, and every `src/pages/<name>.tsx` as `/<name>` and `/<name>/<param>`) and the shared bits: the top bar with the pages and sign-in, `SealGrid`, disclosure line, tier badge, formatting, footer. |
| `src/Home.tsx` | The home: the message box, an example result, and `UseCaseList` ([home and simulator](../product/playground.md)). |
| `src/pages/simulate.tsx` | The simulator: text, age, gut, "Test my message", the retrospective check, and the use cases before a run. |
| `src/results.tsx` | The drawn results: the post test slip (quoted post, landing chance, `PopulationField`, reaction mix bar, `SegmentMatrix`, best and worst, accounts, rewrite, seal line). |
| `src/usecases.ts` | The prepared use cases, each a category, an idea, an ideal consumer and a message. |
| `src/pages/how-it-works.tsx`, `src/pages/record.tsx`, `src/pages/sign-in.tsx` | `/how-it-works`; `/record` with Landed and Flopped, "Check seal" and the account actions; `/sign-in` and `/sign-in/confirm`. |
| `src/pages/scores.tsx`, `src/pages/questions.tsx`, `src/pages/privacy.tsx`, `src/pages/terms.tsx` | The proof and legal pages. Default export `Page({ param })`, named export `title`; loaded lazily. |
| `src/Chart.tsx`, `src/Method.tsx` | SVG charts with data tables, and the "How this is computed" panel, on the proof pages. |
| `src/AcceptableUse.tsx` | The `/acceptable-use` page: [product/acceptable-use.md](../product/acceptable-use.md) word for word. |
| `src/share.ts` | The share text of a message test. |
| `src/seo.ts` | Per-route descriptions, the public-origin check, `robots.txt` and `sitemap.xml` text, and the canonical and description tags set on navigation. |
| `src/Receipts.tsx`, `src/verify.ts` | Receipts page; the verifier recomputes leaves, roots and the chain with WebCrypto per [0002](../research/decisions/0002-benchmark-and-receipts.md). |
| `src/liveCheck.ts` | The production-build check `vite.config.ts` runs: lists every question the API would show and flags `fx-` ids and `example.com` sources. |
| `src/styles/tokens.css`, `src/styles/fonts.css` | The "Commit Slip" tokens and the self-hosted IBM Plex faces. `src/styles.css` holds the dark values and every component rule. |
| `public/og.png`, `public/favicon.svg`, `public/fonts/` | The static Open Graph image, the favicon, and IBM Plex Sans and Mono (SIL Open Font License in `OFL.txt`). |
| `src/fixtures/` | API responses in the generated SDK shapes, for the component tests. |
