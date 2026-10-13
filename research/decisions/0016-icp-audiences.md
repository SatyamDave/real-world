# 0016: Message tests simulate the founder's ideal consumer customer, against a plain baseline

- Date: 2026-10-13
- Status: accepted (founder decision, Satyam, in chat on 2026-10-13: "Let's just do ideal ICP instead of doing this countries and all, using Jev, and make sure all of this works." and later the same day: "It's B2C and B2B both, make it that way, and make sure you cover every aspect of this product: from working, to backtesting, to real results, to making sure it works; easy to understand and use; for all kinds of founders. See how Polsia does it and do it. Remove everything that's useless, and update the whole repo that way." and later the same day: "remove the b2b part of it! we only do enterprise on special request mainly its b2c!" and asked that each test use Jev "with 10000000000 agents parallel")
- Rests on: [0015](0015-founders-and-companies.md), [market/004-jev-typesafe](../market/004-jev-typesafe.md), [science/016-silicon-samples](../science/016-silicon-samples.md), [science/018-failure-modes](../science/018-failure-modes.md), [product/080-icp-product-teams](../product/080-icp-product-teams.md)

## Decision

A message test simulates the founder's ideal customer profile (ICP), not country populations. The product is for founders who sell to consumers. The founder writes what they are building in one line (the idea) and their ideal customer in plain words; the engine expands that description into 27 segments along three fixed dimensions and asks many simulated consumers in each segment one Jev decision call each: how they react, whether they would sign up, try or buy, and what objection stops them. Every test also runs one baseline Jev call with no segments, and the founder's marks score the engine against that baseline and against their own gut. The rest of this record lists the rules a reviewer can check code against.

1. Segments. Attitude to new products (early adopter, pragmatist, skeptic) x price sensitivity (price-sensitive, value-focused, premium buyer) x familiarity with the category (new to the category, uses a competitor, power user): 27 segments, every combination asked once. Segments are equally weighted because we do not know the founder's mix. Businesses and enterprise are on request only, not in the product.
1a. Simulated consumers. Each segment is asked by the same number of simulated consumers, one Jev call each, run in parallel; a segment's numbers are the mean over its consumers. The total is a setting (`RW_AGENTS`, default 1,080, 40 per segment), a multiple of 27 up to 10,800; any other value stops the API at startup. Ten billion, the founder's figure, is not possible: each consumer is a paid model call. Every test also refuses before any call when its estimate passes the per-test cost cap, and every result says how many consumers ran.
2. The idea. Step 0 of the guided flow asks "What are you building?" in one line, with "Show me an example". The engine puts it in the state as "Product: <idea>".
3. Making sure it works. Every test also asks one baseline Jev call with no segments ("Ideal customer: <description>. Product: <idea>. Message: <text>. Would a typical one of these customers sign up, try or buy because of it?") and returns `baseline_intent`. "Your tests" scores three lines on marked tests, engine, baseline and gut, each a Brier with its n, and says plainly when the engine does not beat the baseline. Simulated panels often lose to a plain prompt ([science/016](../science/016-silicon-samples.md)), so the baseline is the comparison a skeptic would pick. Pre-registered as [E010](../../experiments/E010/PREREG.md).
4. Backtesting. The simulator's "Backtest" mode takes up to 10 messages the founder already shipped, each with what really happened (Landed or Flopped, a real number such as "signup rate 3.2%", or both) and the same idea and ICP. The engine and the baseline each predict every message. It shows hits and Brier for both on messages with Landed or Flopped, a calibration table of predicted intent in buckets against the share that landed, and, where three or more messages carry the same metric, the rank agreement (Spearman) of each prediction with that metric. A number alone is never turned into Landed or Flopped. It is labelled "Backtest: not on your record" and stores nothing.
5. Real results. Marking a sealed test takes Landed or Flopped plus an optional real metric (name, value, unit) and an optional note, stored once with the mark on the test's row; nothing about a test changes after it is marked.
6. All kinds of founders. The use cases cover 14-16 founders who sell to consumers, across consumer apps, e-commerce and DTC, marketplaces, fintech, health, hardware, local services, creator tools, consumer AI, games, food, travel and education, each with an idea, an ICP and a message.
7. What goes. The web app drops the Event tab and its use cases, "Call it" from navigation and the home, the ledger tape, country registers, population lists and country selectors. The public record stays as one "Public record" link (receipts and scores), explained on "How it works": "The engine also forecasts real events every day and seals each forecast before the outcome, scored in public." The daily cycle, ledger, scoring, receipts, scores, question pages and the fork and daily-question API stay: the record needs them.
8. Pricing. One line on the home and "How it works": "Free while in beta. Enterprise on request." No plans, no numbers. Businesses and enterprise: on request only, not in the product.
9. Where data lives. "How it works" says "Signed in, your sealed tests and marks are stored on our server; signed out, nothing is stored" and links the privacy page.

What it is not: not a survey of real people, not calibrated yet, and not a model of the founder's real customer mix. Results say "AI-simulated" and "Simulated from your description, not real customers" instead of a coverage tier, which stays on country results (the public record and the fork). This narrows 0015's audience model; 0015's buyers, sealing and marks stay as they are.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Country populations by age and education (0015) | Already built, calibrated to published marginals | Founders launch to customers, not to a country; 0015's own revisit trigger names this ([0015](0015-founders-and-companies.md)) |
| The founder's ICP on three fixed consumer dimensions (chosen) | Fits the question founders ask ([product/080](../product/080-icp-product-teams.md)); Jev answers typed questions per state, which is exactly one segment ([market/004](../market/004-jev-typesafe.md)); fixed dimensions make results comparable across tests | Equal weights are a guess; dimensions from a description inherit stereotyping ([science/018](../science/018-failure-modes.md)) |
| Let the model invent segments from the description | Segments fit the description | Not comparable across tests, not checkable, and persona panels flatten groups ([science/018](../science/018-failure-modes.md)) |
| A single "describe the population" prompt only | Often beats persona panels ([science/016](../science/016-silicon-samples.md)) | No per-segment view and no objection mix; kept as the baseline instead |

## Why this one

- A no-persona population query beat persona panels in all nine pairs in one 2026 preprint ([science/016](../science/016-silicon-samples.md)); a segment model is only worth showing if it beats that baseline on real outcomes, so every test carries the baseline and the record scores both.
- Simulated respondents are too uniform and stereotyped ([science/018](../science/018-failure-modes.md)); fixed, plain dimensions and equal weights make that limit visible instead of hiding it behind an invented mix.
- Jev returns typed probabilities per state and question ([market/004](../market/004-jev-typesafe.md)); one call per segment is the cheapest honest unit.
- Product teams pay for message and pricing tests today and want a fast answer with a visible error bar and a track record ([product/080](../product/080-icp-product-teams.md)); backtests and real metrics on marks are how a founder checks it on their own data.
- The Polsia points (one promise, start from your idea, an instant first result, plain pricing, saying where data lives) are the founder's direction; no research note on Polsia exists yet, so this record cites none of its numbers.

## What would make us revisit it

- [E010](../../experiments/E010/PREREG.md) at 100 marked tests: the engine's Brier is not below the baseline's.
- Ten founders say the three dimensions do not describe their customers.
- Five founders a month ask for business buyers.
- Fewer than 1 in 10 founders who run a test mark it within 14 days.
