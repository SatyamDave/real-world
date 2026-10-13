# 0014: The app is a ledger desk: a top bar and ledger tape, "Will this land?" first, the simulator at /simulate

- Date: 2026-10-12
- Status: accepted (founder direction in chat, 2026-10-12: "should not look like their clone, we should look like our own deep tech company, with actual use cases")
- Rests on: [product/107-design-direction-references](../product/107-design-direction-references.md), [product/108-consumer-wedge](../product/108-consumer-wedge.md), [0013](0013-console-and-playground.md)

## Decision

The app keeps 0013's three simulation kinds (Reaction, Event, Call) and its prepared use cases, and replaces its console shape. Every page sits under a top bar (brand, Simulate, Call it, Your record, Receipts, Scores, account) and a one-line mono ledger tape from `GET /v1/status`; there is no sidebar. The home opens with "Will this land?" and a post box that submits to the simulator, beside today's simulated populations (16 countries with coverage tier and one belief's share) and the day record's seal drawn as a grid. The simulator lives at `/simulate` (`/playground` is gone), with the use cases grouped by who they serve (creators, founders and marketers, newsrooms, policy and public affairs, curious people). Each result is a slip: the input quoted, the population drawn as data, and the seal drawn as a visible artefact. The words "Learn to simulate", "Primitive", "Playground", "Quickstart", "in action", "Example requests", "Walkthrough lessons", "Real-life use cases", "Instructions" and "Example output" leave every surface.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep the TypeSafe console (0013) | Built and tested; a known pattern for teaching typed primitives | The founder judged it a clone; its vocabulary and layout belong to another company |
| Top bar plus ledger desk (chosen) | Puts what is ours first: sealed records, coverage tiers, real countries, around the receipt [107](../product/107-design-direction-references.md) names as the memorable shape; leads with the one job a stranger finishes in a minute ([108](../product/108-consumer-wedge.md)) | Rewrites the home, the simulator layout and the result views in one change |
| Landing-only home that links into the app | Least work in the app | Two first screens to keep in step; the app's first screen would still teach primitives |

## Why this one

- A post box answers a stranger's first question in their own words, the specific-decision pattern that converted in [108](../product/108-consumer-wedge.md).
- Note [107](../product/107-design-direction-references.md) finds the base look already right and the receipt its one memorable shape; the ledger tape, the slips and the seal grid carry that shape to every page instead of borrowing another company's layout.

## What would make us revisit it

- Under half of simulator runs start from a use case or the home post box after 1,000 runs.
