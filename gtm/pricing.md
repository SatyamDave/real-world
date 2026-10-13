# Pricing

**Since [0015](../research/decisions/0015-founders-and-companies.md):** free to start for founders (a daily count of message tests per person, provisional `TEST_*` caps); the first price to test is a team plan for companies that test often, set only after real-model cost per test is measured. The insights-team pilot below is the later, larger offer.

**Since [0012](../research/decisions/0012-will-it-land-and-call-it.md):** post tests and calls are free within a per-address daily count and a per-test cost cap (`TEST_ANON_PER_DAY`, `TEST_MAX_COST_USD`, provisional until [decisions-needed](../company/decisions-needed.md) item 7). A paid plan for people who test many posts is the first consumer price to test; no price is set. The agent-step meter below stays the engine's unit for builders later.

Status: proposed. The lenses agree on the shape and disagree on three numbers; those are open in [`company/decisions-needed.md`](../company/decisions-needed.md). Every dollar figure below is an estimate built on token counts nobody has measured yet ([CFO lens](../research/lenses/cfo.md)). No price is published until the cost ledger has measured real calls.

## Principles

1. **Charge for the unit that costs us money.** Comparable developer APIs price by a countable unit of work, give a free monthly allowance with no card, and charge pay-as-you-go with no minimum ([API pricing](../research/market/013-api-pricing-benchmarks.md)).
2. **The record is free forever.** The receipts page, the daily forecast and the daily question are never paywalled; they are the acquisition channel and the sales collateral ([CRO lens](../research/lenses/cro.md), [pricing models](../research/product/079-pricing-models.md)).
3. **Every spend path fails closed.** Each call carries a cost cap checked against an estimate before it runs, and a cap check that errors refuses the run ([unit economics](../research/business/089-unit-economics.md), [abuse and safety](../research/engineering/074-abuse-and-safety.md), [CFO lens](../research/lenses/cfo.md)).

## The meter

One meter: the **agent-step**, meaning one agent, one simulated day and one ensemble member. 1 credit = 1,000 agent-steps. The notes used three names for this unit; agent-step is the one we keep ([CFO lens](../research/lenses/cfo.md), [CRO lens](../research/lenses/cro.md)).

## Price points

| Item | Proposed | Evidence |
| --- | --- | --- |
| API list price | $1 per 1,000 agent-steps | Estimated 73% gross margin on LLM cost at standard prices, 87% on batch, before Stripe fees ([unit economics](../research/business/089-unit-economics.md)) |
| Price floor | 3x measured standard cost; $1 holds only if measured cost is $0.33 or less per 1,000 | [CFO lens](../research/lenses/cfo.md) |
| Minimum top-up | $20 | Stripe's fee is 8.9% of a $5 charge ([unit economics](../research/business/089-unit-economics.md), [CFO lens](../research/lenses/cfo.md)) |
| Credits | Do not expire | [CFO lens](../research/lenses/cfo.md); Browser Use's credits never expire ([API pricing](../research/market/013-api-pricing-benchmarks.md)) |
| Large accounts | "Talk to us" above 1M agent-steps a month | [CRO lens](../research/lenses/cro.md), [CFO lens](../research/lenses/cfo.md) |
| Insights-team pilot | $7,500 for 6 weeks: replay 3 completed studies blind, report error by segment, then run live tests; converts to $2,000 a month | Proposal from the [CRO lens](../research/lenses/cro.md). Synthetic-research contracts found run about $12.5k-$85k a year, and the only public list price is a $12,500 annual floor ([vendors](../research/market/003-synthetic-research-vendors.md), [pricing models](../research/product/079-pricing-models.md)). Treat as a hypothesis until calls confirm. |

## Free tier

| Visitor | Gets | Estimated cost to us |
| --- | --- | --- |
| Anonymous | Daily question, receipts, cached prefilled forks only | Near zero once cached ([replay and caching](../research/engineering/072-replay-and-caching.md)) |
| Signed in, free | Small custom forks: 200 agents, 7 days, 1 ensemble member, cached by input hash; allowance open (see below) | About $0.37 per fork ([unit economics](../research/business/089-unit-economics.md)) |
| Launch builders | API key capped at a dollar amount | [`builders-program.md`](builders-program.md) |

A global daily free-tier budget trips a kill switch; when it runs out, free users get cached forks only ([CRO lens](../research/lenses/cro.md), [CFO lens](../research/lenses/cfo.md)).

## Why caps matter more than price

The nightly run is cheap. Multiplication is the risk: ensembles, 7-day horizons and free forks. A full 100k-agent, 7-day, 5-member fork is estimated at $185-600, and 10,000 uncapped free forks at about $11,100 in a day ([unit economics](../research/business/089-unit-economics.md), [API pricing](../research/market/013-api-pricing-benchmarks.md), [system architecture](../research/engineering/061-system-architecture.md)). No full-population fork is sold at launch; paid forks are capped at 5,000 agents ([CFO lens](../research/lenses/cfo.md)).

## Open, for the founder

- Free fork allowance: 3 a day ([CEO lens](../research/lenses/ceo.md), [CTO lens](../research/lenses/cto.md)) or 3 a month ([CFO lens](../research/lenses/cfo.md)) or a dollar cap per fork with the sample sized to fit ([CPO lens](../research/lenses/cpo.md)).
- Decided 2026-10-12: no Pro plan and no paid credits at launch; accounts and self-serve keys are free with daily caps ([decision 0011](../research/decisions/0011-consumer-product-and-api.md)).
- The pilot price and terms above.
