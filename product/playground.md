# Home and playground

## What it does

The app is a console ([decision 0013](../research/decisions/0013-console-and-playground.md)). A left sidebar links Home `/`, Playground `/playground`, Call it `/call`, Your record `/record`, and under "Proof" Scores and Receipts; at its foot a card shows today's spend from `GET /v1/status` and the account (email, or "Sign in").

**Home** opens with "Learn to simulate", the line "Three primitives. Every result is AI-simulated, and every call you seal is scored." and a "Playground" button, beside three primitive cards. Each card names its primitive, its instruction and its output, with a small chart:

- **Reaction**: "How does this audience react to a post?" Output: landing chance, reaction mix, best and worst segments.
- **Event**: "How do beliefs shift after one event?" Output: per topic, the share before and after with its p10-p90 band, day by day.
- **Call**: "Will this happen?" Output: one sealed probability, scored when it resolves.

Below, "Real World in action" lists the use cases in `web/src/usecases.ts` (each a title, one sentence and its primitive); choosing one opens the playground with it filled in. A "Quickstart" column lists three steps (pick a use case or paste your own, run it, sign in to seal and mark it) and links today's Call it question and your record.

**Playground** is two panes. The left pane: the primitive (Reaction or Event; Call opens `/call`), the text, the audience (countries and age bands), the gut for Reaction, the days for Event, and "Run". The right pane shows "Example requests" (the three primitives as lessons) and "Real-life use cases" until something runs, then the result:

- Reaction: the [post test](will-it-land.md) result, with the landing chance as a large number, the reaction mix as one stacked bar, every segment as a dot in a grid shaded by its landing chance, best and worst lists with tiers, the two simulated accounts, the rewrite with "Test this version", and the seal or "Sign in to seal".
- Event: the [fork](simulate-api.md) result: per topic a row with the share before, the median after and its p10-p90 band; the top segment shifts with their agent counts; the trajectory of the largest move day by day; cost, members and agents; the line "Counterfactual: not scored".

States, written out: "Running the simulation" while it runs; a refusal shows the API's `detail` sentence as sent; "Could not run the simulation. The server did not respond." with "Try again".

## Who it is for

Anyone deciding something that depends on how people react: a post, an announcement, a price, a policy, a headline ([product/108](../research/product/108-consumer-wedge.md)).

## How we know it works

- A use case id in `?use=` fills the playground exactly with that use case's primitive, text and audience. Test: `App.test.tsx` "a use case opens the playground filled in".
- Reaction runs call `POST /v1/tests`; Event runs call `POST /v1/simulate` and wait on the job through the SDK, with its caps and refusals unchanged ([simulate API](simulate-api.md)).
- Component tests: the home shows the three primitives and every use case; the playground shows lessons before a run and each result after; the Event result shows every topic row and the counterfactual line.
- Measured after launch: share of runs that start from a use case ([0013](../research/decisions/0013-console-and-playground.md)).

## What it is not

- No API keys page and no code editor: inputs are form fields, not JSON.
- No Event result is sealed or scored: a fork has no real outcome.

## Where the code lives

- `web/src/Shell.tsx`, `web/src/Home.tsx`, `web/src/pages/playground.tsx`, `web/src/usecases.ts`, `web/src/results.tsx`.
- Decision: [0013](../research/decisions/0013-console-and-playground.md).
