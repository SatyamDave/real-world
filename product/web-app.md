# Web app

## What it does

The app for consumer founders ([decision 0016](../research/decisions/0016-icp-audiences.md)): a top bar with Simulate, Your tests, "Public record" and "How it works". `/` is the home: "Test your message on simulated consumers before you ship it.", the message box, a labelled example result and the use cases, described in [home and simulator](playground.md). `/simulate` runs a message test or a backtest of up to 10 past messages ([message test](will-it-land.md)). `/record` is [your tests](track-record.md): the engine against the baseline and your gut, sealed tests waiting to be marked, and the marked ones with their real results. `/receipts` opens the latest day record and shows every earlier day as one row that opens in place; `/receipts#{date}` opens that day. `/scores` shows the engine's skill on real events. These three are the track record behind the product. The daily question has no page in the app; its API stays ([daily question](daily-question.md)). Every result links the proof it rests on.

| Route | Needs sign-in | Spec |
| --- | --- | --- |
| `/` | no | [home and simulator](playground.md) |
| `/simulate` | no; sealing a test needs it | [home and simulator](playground.md), [message test](will-it-land.md) |
| `/how-it-works` | no | [home and simulator](playground.md) |
| `/record` | yes | [your tests](track-record.md) |
| `/sign-in` | no | [accounts](accounts.md) |
| `/scores`, `/receipts`, `/questions/{id}` | no | [receipts](receipts.md), [question](question.md), [track record](track-record.md) |
| `/acceptable-use`, `/privacy`, `/terms` | no | [acceptable use](acceptable-use.md), [privacy](privacy.md), [terms](terms.md) |

A page that needs sign-in shows its own one-line reason and "Sign in", never a redirect to a wall; after sign-in the visitor returns to that page.

States, written out: "Loading <thing>" with a spinner; "Could not load <thing>. The server did not respond." (or "had an error", "refused the request", "It was not found.") with "Try again"; any unknown path: "Page not found".

The look is [design.md](design.md). Every route title is `<Page> · Real World` and every page ends in the footer: links to Receipts, Acceptable use, Privacy, Terms and Source, the line "Real World outputs are AI-simulated. Simulated customers are not polls and not predictions about real people." and "© 2026 Real World."

## Who it is for

Consumer founders testing a message, and skeptics checking the public record ([0016](../research/decisions/0016-icp-audiences.md), [product/108](../research/product/108-consumer-wedge.md)).

## How we know it works

- All public data comes through `@real-world/sdk`; the cookie-authenticated calls live only in `web/src/session.ts`.
- A file `src/pages/<name>.tsx` is the route `/<name>` and `/<name>/<param>`; its default export is the page and its named export `title` sets the document title.
- Search and share metadata: `VITE_PUBLIC_ORIGIN` makes every share URL absolute and a production build fails without it; `robots.txt` and `sitemap.xml` list the parameterless routes. `src/seo.test.ts` covers it.
- A production build asks the API at `VITE_API_URL` for every question it would show and fails if any is a fixture; `vite build --mode fixtures` skips the check. `src/liveCheck.test.ts` covers it.
- Every result view shows "AI-simulated. Simulated from your description, not real customers"; the coverage tier shows on country results in the public record only.
- Component tests (Vitest): the message test form and result, the refused and error states, the backtest, the sealed line, the record and its seal check, sign-in, the footer on every route, the receipts verifier on the shared test vector, and the not-found route.
- `pnpm --filter web build` succeeds with no type errors.

## What it is not

- No globe, world, cycle, research or developer pages, no Event tab, no ledger tape, no country selectors or population lists ([0016](../research/decisions/0016-icp-audiences.md)).
- No pitch to businesses or enterprise.
- No popups, tours or sign-up walls; no teams, plans or billing.
- No mobile app. The page works at phone width.

## Where the code lives

- `web/`, via `sdk/typescript/`.
- Research: [product/108](../research/product/108-consumer-wedge.md), [engineering/071](../research/engineering/071-web-app-stack.md), [product/087](../research/product/087-trust-and-explainability.md).
