# Ideal customer profiles

**Since [0015](../research/decisions/0015-founders-and-companies.md):** the first users and first buyers are startup founders and company teams testing messages before they ship them: founders (launch posts and announcements), growth and marketing (ad lines, landing headlines), pricing and product (price changes, plans), comms and PR (incidents, policy changes) and market entry (the same message in a new country). Self-serve first; profile 1 below (insights teams) is the larger buyer once marked tests show the engine's error. Profiles 2-4 stay paused.

**Since [0012](../research/decisions/0012-will-it-land-and-call-it.md):** the first users are people about to post (creators, founders, people who post for work) and people who like calling the news against an AI, reached by the product itself, not by sales ([consumer wedge](../research/product/108-consumer-wedge.md)). The buyer profiles below are paused: no pilot is sold until the consumer product has a record. They stay as the later B2B path for the engine.

Ranked by who can pay us first, not by who is most interesting. No buyer calls have happened yet; every rank below rests on desk research and must be re-checked against the ten calls in [`launch-plan.md`](launch-plan.md).

## 1. Consumer-brand and agency insights teams (first paying buyer)

- **Who:** insights and research leads at consumer brands and ad agencies who run message, price and concept tests.
- **Evidence they pay:** they buy test-a-message and test-a-product answers from an existing market-research line item; every synthetic-research vendor names them ([who buys](../research/market/014-who-buys.md), [vendors](../research/market/003-synthetic-research-vendors.md)). Product teams already pay for slow, small human-panel tests ([product-team ICP](../research/product/080-icp-product-teams.md)).
- **What they need:** a cheap, fast, calibrated answer to one narrow question with a visible error bar and a track record ([product-team ICP](../research/product/080-icp-product-teams.md)).
- **Their objection:** synthetic answers miss on subgroups and on change over time; Strat7 found tracking accuracy no better than chance ([who buys](../research/market/014-who-buys.md)).
- **Our offer:** a founder-sold replication pilot in which we replay their finished studies blind and report the error by segment ([CRO lens](../research/lenses/cro.md)). Price in [`pricing.md`](pricing.md).
- **What to ask on every call:** what the last study cost and which survey we would replace ([who buys](../research/market/014-who-buys.md)).

## 2. Forecasting and market-data builders (first card swipes, first distribution)

- **Who:** Metaculus and Manifold bot authors, ForecastBench entrants, prediction-market traders, data-curious developers ([builders program](../research/product/086-builders-program.md), [CPO lens](../research/lenses/cpo.md)).
- **Evidence:** comparable developer APIs grew on a free monthly allowance with no card and pay-as-you-go pricing ([API pricing](../research/market/013-api-pricing-benchmarks.md), [API launch playbooks](../research/product/078-api-launch-playbooks.md)).
- **What they need:** a quickstart, typed SDKs, a frozen contract, and the receipts to judge us by ([CPO lens](../research/lenses/cpo.md)).
- **Expected revenue:** small; developers pay for API credits first, but the amounts will be small ([CRO lens](../research/lenses/cro.md)).

## 3. Finance and media users of the public probability feed (free at launch)

- **Who:** people who already consume prediction-market probabilities.
- **Evidence:** funds pay for probability feeds; Polymarket is building data-licensing tiers aimed at hedge funds, banks and media. No evidence found of any fund paying for LLM-agent simulation ([who buys](../research/market/014-who-buys.md)). Funds need point-in-time history we do not have ([alt data](../research/market/015-alt-data-finance.md)).
- **Plan:** offer the daily forecast free to build the record; no sales motion before 2027 ([CRO lens](../research/lenses/cro.md)).

## 4. Newsrooms (distribution partner, not a customer)

- **Who:** international desks and data teams.
- **Plan:** offer five newsrooms a free co-published piece using one real event and its hashed forecast before Oct 27; success is two published pieces with a link back ([games and media ICP](../research/product/083-icp-games-media.md)).

## 5. Policy analysts and academics (credibility, not revenue)

- **Evidence:** policy units pay little and slowly; the one public contract found was a two-year classical simulation contract ([who buys](../research/market/014-who-buys.md), [policy ICP](../research/product/081-icp-policy-research.md)).
- **Plan:** free access, a run-bundle export and a limits page; cite open policy questions in public forks ([policy ICP](../research/product/081-icp-policy-research.md)).

## Who we refuse before Nov 2

| Segment | Why |
| --- | --- |
| Political campaigns and consultants | Reputational and regulatory landmine; we publish an acceptable-use policy and log inbound demand instead ([political ICP](../research/product/082-icp-political.md), [regulation](../research/business/091-regulation.md)) |
| Game studios | No willingness-to-pay evidence ([game NPC AI](../research/market/010-game-npc-ai.md), [games and media ICP](../research/product/083-icp-games-media.md)) |
| Funds as paying customers | Need years of point-in-time history ([alt data](../research/market/015-alt-data-finance.md)) |
| Decisions about individuals (hiring, credit, insurance, housing) | Keeps us out of high-risk AI rules ([regulation](../research/business/091-regulation.md), [CRO lens](../research/lenses/cro.md)) |
