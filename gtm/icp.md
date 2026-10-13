# Ideal customer profiles

**Since [0016](../research/decisions/0016-icp-audiences.md):** the product is for consumer (B2C) founders: people building an app, a DTC or e-commerce brand, a marketplace, a consumer fintech or health product, hardware, a creator tool, a local service or a consumer AI product, who sell to individual people and must decide what to say before they ship. Businesses and enterprise are served only on special request and are not in the product; no pitch, price or sales motion here is aimed at them. The self-serve test is free while in beta.

No founder calls have happened yet; every claim below rests on desk research and must be re-checked against the ten calls in [`launch-plan.md`](launch-plan.md).

## 1. Consumer founders (the only customer profile)

- **Who:** founders and first marketers of a consumer product, early enough that they write the launch post, the headline, the price line and the ad copy themselves.
- **Evidence they want this:** product teams already pay for slow, small human-panel message and pricing tests, and want a cheap, fast answer with a visible error bar and a track record ([product-team ICP](../research/product/080-icp-product-teams.md)). That research is about teams at companies; the founder case is our reading of it, to be confirmed on calls.
- **What they need:** to say who their customer is in plain words, get an answer in seconds, and see whether the answer was right once they know what happened.
- **Their objection:** a simulated customer is not a real one. Simulated respondents are too uniform and stereotyped, and a plain no-segment prompt often does as well ([failure modes](../research/science/018-failure-modes.md), [silicon samples](../research/science/016-silicon-samples.md)). So every test runs a plain Jev baseline beside the 27 segments, and the product says when the baseline wins ([E010](../experiments/E010/PREREG.md)).
- **Our offer:** the message test, a backtest on up to 10 messages they already shipped, and "Your tests", where marked real results score the engine, the baseline and their own gut. Free while in beta.
- **What to ask on every call:** what they last shipped, where, what really happened, and what they used to check the message before.

## Audiences for the track record (not customers)

The public record of daily forecasts, receipts and scores is the proof behind the product. These groups read it; none is sold to.

- **Forecasting and market-data builders:** bot authors and prediction-market traders who judge the engine by its receipts ([builders program](../research/product/086-builders-program.md)). The builders program is paused ([`builders-program.md`](builders-program.md)).
- **Newsrooms:** a distribution partner. Offer five newsrooms a free co-published piece using one real event and its hashed forecast; success is two published pieces with a link back ([games and media ICP](../research/product/083-icp-games-media.md)).
- **Policy analysts and academics:** credibility, not revenue; free access to the public record ([policy ICP](../research/product/081-icp-policy-research.md)).

## Who we refuse before Nov 2

| Segment | Why |
| --- | --- |
| Businesses and enterprise teams, as a product or a sales motion | Founder ruling 2026-10-13: B2C only; enterprise on request, outside the product |
| Political campaigns and consultants | Reputational and regulatory landmine; we publish an acceptable-use policy and log inbound demand instead ([political ICP](../research/product/082-icp-political.md), [regulation](../research/business/091-regulation.md)) |
| Game studios | No willingness-to-pay evidence ([game NPC AI](../research/market/010-game-npc-ai.md), [games and media ICP](../research/product/083-icp-games-media.md)) |
| Funds as paying customers | Need years of point-in-time history ([alt data](../research/market/015-alt-data-finance.md)) |
| Decisions about individuals (hiring, credit, insurance, housing) | Keeps us out of high-risk AI rules ([regulation](../research/business/091-regulation.md)) |
