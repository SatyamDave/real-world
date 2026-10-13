# 0012: Real World is two consumer jobs, "Will this land?" and "Call it", on the existing engine

- Date: 2026-10-13
- Status: superseded by 0013
- Rests on: [product/108-consumer-wedge](../product/108-consumer-wedge.md), [product/076-viral-simulations](../product/076-viral-simulations.md), [product/077-daily-question-mechanics](../product/077-daily-question-mechanics.md), [product/087-trust-and-explainability](../product/087-trust-and-explainability.md), [market/004-jev-typesafe](../market/004-jev-typesafe.md), [0011](0011-consumer-product-and-api.md)

## Decision

What was built so far becomes the engine; the product a person sees is two jobs. "Will this land?" (the home, `/`): a person pastes a post of up to 500 characters, picks an audience (countries and age bands, default every simulated country), records their own gut ("land" or "flop"), and gets the simulated reaction of that audience: the share who would like or share it, the reaction mix, the best and worst segments, two simulated accounts and one rewrite to test. A signed-in person's post test is sealed at that moment (a SHA-256 over the canonical post, audience, gut, result and time, stored with the time) and can be marked "landed" or "flopped" once; the person's record shows the engine against their gut on their marked tests. A retrospective check on up to five already-published posts proves the engine before trust is asked, and never enters the record. "Call it" (`/call`): the daily question, framed as the person against the AI, with the `sim` forecast's leaf hash shown before they answer and their running record against the AI after. The receipts, scores and question pages stay open as the public proof. Forks, the world page, the cycle and research pages, the developer area, the onboarding profile and the briefing leave the product; `POST /v1/simulate` and the SDKs stay as the engine's interface. This supersedes 0011's product scope; 0011's accounts (free email sign-in, no paid plan) stay.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep 0011: forks, briefing, track record, developer keys | Built in part; one loop per journey | Six surfaces and no one-sentence proof moment; a free-form "what if" box is the MiroFish pattern ([108](../product/108-consumer-wedge.md)) |
| "Will this land?" plus "Call it" (chosen) | A frequent personal decision whose outcome is known in days, so every test can be sealed and scored per person; a free game that reuses the sealed daily forecast | Competes with Reach and Synthetiq; the engine models country populations, not a platform's followers |
| "Ask the world": any question, answered by country | Shareable cards | Most answers never resolve, so nothing proves it right |
| Prediction game only | Rides prediction-market demand | Kalshi and Polymarket own that attention; no paid job |

## Why this one

- A specific decision with visible reasons converted Rally's users; a generic scenario app (MiroFish) did not hold them ([108](../product/108-consumer-wedge.md)).
- People with a stake are retained and spectators are not ([076](../product/076-viral-simulations.md)); both jobs give the person a stake: their post, their call.
- Trust comes from a record that cannot be backfilled ([087](../product/087-trust-and-explainability.md)); sealing each person's calls makes that record personal, and the engine is compared with the person's own gut, the baseline they actually use.
- TypeSafe sold an engine with a proof moment and a channel, not a feature list ([market/004](../market/004-jev-typesafe.md)).

## What would make us revisit it

- After 100 marked post tests, the engine's Brier is not below the people's gut Brier on the same tests.
- Day-7 return of people who ran a post test is below that of daily-question players.
- Ten creator interviews say "landed" must be a measured number rather than their judgment.
