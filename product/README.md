# Product

One file per product surface. Each spec is short and answers the same questions in the same order, so a PM and an engineer read the same thing:

1. **What it does**, in one paragraph a user would understand.
2. **Who it is for** and the moment they reach for it.
3. **How we know it works**: the measurable outcome and the automated check that proves it.
4. **What it is not**: the cut list for this surface.
5. **Where the code lives**: the folder that owns it, and the research notes it rests on.

A PR that changes what a surface does updates its spec in the same PR.

## How people use it

Real World is message testing for consumer (B2C) founders ([decision 0016](../research/decisions/0016-icp-audiences.md)). A founder says what they are building in one line, describes their ideal customer, and tests a message on 27 simulated segments of that customer, beside a plain baseline. Under it runs the engine, whose daily forecasts about real events are sealed before their outcomes and scored in public ([decision 0012](../research/decisions/0012-will-it-land-and-call-it.md)); that record is the track record behind the product, not the product.

- **Consumer founder.** Opens `/`, writes the product in one line and the ideal customer in plain words, pastes a message, records their gut and taps "Test my message"; reads the intent across 27 segments, the baseline, the objections and a rewrite; signed in, the test is sealed and later marked Landed or Flopped, with an optional real metric and note, on `/record`. The simulator's Backtest takes up to 10 past messages with what really happened. Specs: [will-it-land.md](will-it-land.md), [playground.md](playground.md), [track-record.md](track-record.md), [accounts.md](accounts.md).
- **Skeptic.** Opens "Public record" (`/receipts`, `/scores`): every sealed forecast, verified in the browser, and the engine's skill with n and an interval. The daily question lets a visitor call it against the engine. Specs: [receipts.md](receipts.md), [question.md](question.md), [daily-question.md](daily-question.md).

The engine's own interface, `POST /v1/simulate` and the two SDKs, stays for the track record and for builders later; it is not a product surface. Specs: [simulate-api.md](simulate-api.md), [sdks.md](sdks.md), [world.md](world.md).
