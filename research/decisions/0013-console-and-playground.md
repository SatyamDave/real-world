# 0013: The app is a console with a playground of three simulation primitives and ready use cases

- Date: 2026-10-13
- Status: superseded by 0014
- Rests on: [market/004-jev-typesafe](../market/004-jev-typesafe.md), [product/108-consumer-wedge](../product/108-consumer-wedge.md), [product/076-viral-simulations](../product/076-viral-simulations.md), [0012](0012-will-it-land-and-call-it.md)

## Decision

The web app takes the shape of TypeSafe's console: a left sidebar (Home, Playground, Call it, Your record, Proof, and the account with today's spend at its foot) and a main pane. Home opens with "Learn to simulate" and a "Playground" action beside three primitive cards, each showing its instruction, its output and a small chart of a real-shaped result: **Reaction** (how an audience reacts to a post: the share who would like or share it, by segment), **Event** (how simulated beliefs shift over days after one event: the engine's fork) and **Call** (one sealed probability on a question that resolves). Below them, "Real World in action" lists ready use cases that open the playground prefilled, and a quickstart names the three steps. The Playground is two panes: the input (primitive, text, audience, gut for Reaction, days for Event) with "Run", and the output, which shows example requests and real-life use cases until something runs, then the result drawn as charts. This keeps 0012's two jobs (Reaction is "Will this land?", Call is "Call it") and its sealing and record rules, and brings the fork back as the Event primitive, reached only from the playground; it supersedes 0012's removal of the fork from the app.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep 0012's two pages | Fewer surfaces | The founder asked for the console shape and many use cases; one post box shows one use |
| Console with three primitives and use cases (chosen) | TypeSafe sold its engine through typed primitives, playground lessons and cookbooks ([market/004](../market/004-jev-typesafe.md)); a use case is a specific decision, which converts people ([108](../product/108-consumer-wedge.md)) | More screens; the Event primitive brings back a free-form input, the pattern that failed for MiroFish ([108](../product/108-consumer-wedge.md)), so it opens on prepared use cases |
| Developer console with keys and usage only | Matches TypeSafe exactly | Not a consumer product; 0012 keeps keys out of the app |

## Why this one

- TypeSafe's console teaches its engine through three typed primitives, walkthrough lessons and real-life use cases next to a playground ([market/004](../market/004-jev-typesafe.md)).
- A prepared use case is a specific decision with visible reasons, the pattern that converted Rally's users ([108](../product/108-consumer-wedge.md)); one surprising story per run is what spread for Smallville ([076](../product/076-viral-simulations.md)).

## What would make us revisit it

- Fewer than half of playground runs start from a use case after the first 1,000 runs: the cards are not doing their job.
- Event runs cost more than the day's budget allows for Reaction runs.
