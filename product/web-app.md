# Web app

## What it does

A ledger desk ([decision 0014](../research/decisions/0014-ledger-desk.md)): a top bar and, under it, the ledger tape, one mono line from `GET /v1/status`, described in [home and simulator](playground.md). `/` is the home: "Will this land?" with a post box, today's simulated populations and the use cases. `/simulate` runs a post test or a fork; its post test is [Will this land?](will-it-land.md): paste a post, pick an audience, record your gut, test it. `/call` is [Call it](daily-question.md): today's question against the AI, whose call is sealed first. `/record` is [your record](track-record.md): sealed post tests to mark, and your calls against the AI. The top bar links Simulate, Call it, Your record, Receipts `/receipts` and Scores `/scores`, and the account; today's spend is on the tape. Every result links the proof it rests on.

| Route | Needs sign-in | Spec |
| --- | --- | --- |
| `/` | no | [home and simulator](playground.md) |
| `/simulate` | no; sealing a test needs it | [home and simulator](playground.md), [will it land](will-it-land.md), [simulate API](simulate-api.md) |
| `/call` | no | [call it](daily-question.md) |
| `/record` | yes | [track record](track-record.md) |
| `/sign-in` | no | [accounts](accounts.md) |
| `/scores`, `/receipts`, `/questions/{id}` | no | [receipts](receipts.md), [question](question.md) |
| `/acceptable-use`, `/privacy`, `/terms` | no | [acceptable use](acceptable-use.md), [privacy](privacy.md), [terms](terms.md) |

A page that needs sign-in shows its own one-line reason and "Sign in", never a redirect to a wall; after sign-in the visitor returns to that page.

States, written out: "Loading <thing>" with a spinner; "Could not load <thing>. The server did not respond." (or "had an error", "refused the request", "It was not found.") with "Try again"; any unknown path: "Page not found".

The look is [design.md](design.md). Every route title is `<Page> · Real World` and every page ends in the footer: links to Receipts, Acceptable use, Privacy, Terms and Source, the line "Real World outputs are AI-simulated. Simulated populations are not polls and not predictions about real people." and "© 2026 Real World."

## Who it is for

People deciding whether a post will land, people who want to call today's question against the AI, and skeptics checking the public record ([product/108](../research/product/108-consumer-wedge.md)).

## How we know it works

- All public data comes through `@real-world/sdk`; the cookie-authenticated calls live only in `web/src/session.ts`.
- A file `src/pages/<name>.tsx` is the route `/<name>` and `/<name>/<param>`; its default export is the page and its named export `title` sets the document title.
- Search and share metadata: `VITE_PUBLIC_ORIGIN` makes every share URL absolute and a production build fails without it; `robots.txt` and `sitemap.xml` list the parameterless routes. `src/seo.test.ts` covers it.
- A production build asks the API at `VITE_API_URL` for every question it would show and fails if any is a fixture; `vite build --mode fixtures` skips the check. `src/liveCheck.test.ts` covers it.
- Every result view shows "AI-simulated. Not a poll or a prediction of a real person" and the coverage tier.
- Component tests (Vitest): the post test form and result, the refused and error states, the retrospective check, the sealed line, Call it's sealed AI line and reveal, the record and its seal check, sign-in, the footer on every route, the receipts verifier on the shared test vector, and the not-found route.
- `pnpm --filter web build` succeeds with no type errors.

## What it is not

- No globe, world, cycle, research or developer pages; the fork appears only as the simulator's Event ([0014](../research/decisions/0014-ledger-desk.md)).
- No popups, tours or sign-up walls; no teams, plans or billing.
- No mobile app. The page works at phone width.

## Where the code lives

- `web/`, via `sdk/typescript/`.
- Research: [product/108](../research/product/108-consumer-wedge.md), [engineering/071](../research/engineering/071-web-app-stack.md), [product/087](../research/product/087-trust-and-explainability.md).
