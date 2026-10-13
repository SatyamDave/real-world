# Product

One file per product surface. Each spec is short and answers the same questions in the same order, so a PM and an engineer read the same thing:

1. **What it does**, in one paragraph a user would understand.
2. **Who it is for** and the moment they reach for it.
3. **How we know it works**: the measurable outcome and the automated check that proves it.
4. **What it is not**: the cut list for this surface.
5. **Where the code lives**: the folder that owns it, and the research notes it rests on.

A PR that changes what a surface does updates its spec in the same PR.

## How people use it

Since [decision 0013](../research/decisions/0013-console-and-playground.md) the app is a console: Home teaches three primitives (Reaction, Event, Call) and lists use cases; the [playground](playground.md) runs them.

Real World tells you how a post will land before you publish it, and lets you call today's question against an AI whose call is sealed first ([decision 0012](../research/decisions/0012-will-it-land-and-call-it.md)). Under both runs the engine: simulated populations of 16 countries, a typed decision per segment, and a ledger that seals forecasts before outcomes exist.

- **Person about to post.** Opens `/`, pastes a post, picks an audience, records their gut and taps "Test it"; reads the landing chance, the best and worst audiences, two simulated accounts and a rewrite; signed in, the test is sealed and later marked "Landed" or "Flopped" on `/record`. Specs: [will-it-land.md](will-it-land.md), [track-record.md](track-record.md), [accounts.md](accounts.md).
- **Person calling the news.** Opens `/call`, sees that the AI's call is sealed, calls today's question, and sees their call next to the AI, the crowd and the market, then their running record against the AI. Spec: [daily-question.md](daily-question.md).
- **Skeptic.** Opens `/receipts` and `/scores` from any result: every sealed forecast, verified in the browser, and the engine's skill with n and an interval. Specs: [receipts.md](receipts.md), [question.md](question.md).

The engine's own interface, `POST /v1/simulate` and the two SDKs, stays for the web app and for builders later; it is not a product surface. Specs: [simulate-api.md](simulate-api.md), [sdks.md](sdks.md), [world.md](world.md).
