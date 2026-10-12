# Messaging

## One-liner

Every morning Real World simulates how the world's population will react to today's news, publishes its forecasts as hashes before anything resolves, and scores itself in public against the prediction markets, misses included.

Short form: simulations with receipts.

Sub-line: AI simulates how the world reacts to the news. Every forecast is sealed before the outcome and scored in public. "Sealed" is the plain word for hashed and anchored; it makes no accuracy claim, and every country or result next to it still carries its coverage tier.

Category: a forecast and simulation API with a public score, not a world model or an agent-based modelling platform ([VC lens](../research/lenses/vc.md), [funding landscape](../research/market/012-funding-landscape-2026.md), [world-model state of the art](../research/engineering/100-world-model-sota.md)).

The demo order is receipts, then one fork, then one agent's "what moved it" panel ([CEO lens](../research/lenses/ceo.md)).

## User journeys

Every surface proves one part of the one-liner, and each page offers one next action.

| Who | Starts on | Next action per page |
| --- | --- | --- |
| Daily-question visitor | `/` | "See how the world answered" opens `/questions/{id}`; "Fork today's world" opens the fork card; "Run this from your code" opens `/docs`. |
| Receipts and forecasting skeptic | `/receipts` | Verify the hashes in the browser, then `/scores` (skill with n and interval), then `/research` (papers and experiments). |
| Analyst forking events | The fork box on `/` | Read the segments and the trace on the fork card, then repeat the same fork through the API. |
| Developer on the API with a capped key | `/docs` | Request a key with a dollar cap, then run the SDK quickstart. |

Surface specs: [product/README.md](../product/README.md).

## Positioning

| Against | What they offer | What we say |
| --- | --- | --- |
| Aaru | Enterprise simulations for consumer and financial-services research, sold through consultancies such as EY and Accenture; accuracy reported by the vendor ([Aaru](../research/market/001-aaru.md), [who buys](../research/market/014-who-buys.md)) | Our forecasts are committed before outcomes exist and scored in public. Aaru publishes no scored record. |
| Simile | Well-funded enterprise customer simulations for companies such as CVS Health; the most credible method in the field, aimed at "what do these people say about my product" ([Simile](../research/market/002-simile.md)) | We do not compete on enterprise panels. We publish a daily, global, scored record and let anyone fork today's world. |
| Synthetic-research vendors in general | Each reports its own accuracy; independent tests found 12-15 point question-level errors and poor subgroup behaviour ([vendors](../research/market/003-synthetic-research-vendors.md)) | Do not trust our accuracy claim either. Read the receipts. |
| A plain LLM prompt | A frontier model with search sits close to superforecasters, and a no-persona "describe the population" call beat persona panels on 9 of 9 pairs in one 2026 preprint ([LLM forecasting](../research/science/021-llm-forecasting.md), [silicon samples](../research/science/016-silicon-samples.md)) | We score a plain-LLM baseline next to our simulation every day and publish both. If the baseline wins, the receipts page says so. |

## Claims we may make

- "Forecasts hashed before the outcome, scored in public since <date of first hash>." ([forecast scoring](../research/science/030-forecast-scoring.md))
- "A record that cannot be backfilled." Qualify it where precision matters: the anchor proves the bytes have not changed since the anchor time, and the pre-committed question list is what rules out choosing questions after the fact ([forecast scoring](../research/science/030-forecast-scoring.md), [commit-reveal](../research/engineering/070-commit-reveal-timestamping.md), [red team](../research/lenses/red-team.md)).
- "Skill against the market price at commit time, with n and an interval", only as the number the receipts page computes ([forecast scoring](../research/science/030-forecast-scoring.md)).
- "Calibrated to published marginals" for the population, until written licence replies say otherwise ([data licensing](../research/data/060-data-licensing-legal.md), [CEO lens](../research/lenses/ceo.md)).
- "News in 65 languages through GDELT translation." ([GDELT](../research/data/050-gdelt.md), [news ingestion](../research/open-source/042-news-ingestion.md))
- The number of archetype calls made today, and the coverage tier of every country we show ([large-scale sims](../research/science/028-large-scale-llm-sims.md), [coverage tiers](../research/data/099-country-coverage-tiers.md)).
- "AI-simulated" on every output, and "simulated account, not the cause" on agent narratives ([regulation](../research/business/091-regulation.md), [trust](../research/product/087-trust-and-explainability.md)).
- "A cheap first pass with stated error; then run the real poll." ([policy ICP](../research/product/081-icp-policy-research.md))

## Claims we may not make

| Claim | Why |
| --- | --- |
| "Beats the market", "outperforms", any ranking claim | Not below about 100 resolved questions, and then only as the computed interval ([forecast scoring](../research/science/030-forecast-scoring.md), [benchmark design](../research/science/097-benchmark-design.md)) |
| "X% accurate", "parity", "85-92% match" | Every vendor says it and independent tests contradict it ([vendors](../research/market/003-synthetic-research-vendors.md)) |
| "Sampled from census microdata", "built on IPUMS" | IPUMS International forbids commercial use and redistribution ([IPUMS](../research/data/046-ipums-international.md)) |
| "100+ languages" | GDELT translates 65 ([GDELT](../research/data/050-gdelt.md)) |
| "World model" | The term now means visual or physical models such as Genie 3, and a social simulator gets compared to Simile and Aaru instead ([world-model state of the art](../research/engineering/100-world-model-sota.md), [funding landscape](../research/market/012-funding-landscape-2026.md)) |
| "100,000 agents" as the headline | Agent count is not what sets us apart, and the LLM is called per archetype, not per agent ([CTO lens](../research/lenses/cto.md), [red team](../research/lenses/red-team.md)) |
| "The whole world" without tiers | Rich data exists for a minority of countries; show tiers ([coverage tiers](../research/data/099-country-coverage-tiers.md), [cross-cultural bias](../research/science/027-cross-cultural-llm-bias.md)) |
| "Replaces surveys", "a poll" | Simulated respondents fail on spread, subgroups and change over time ([failure modes](../research/science/018-failure-modes.md), [policy ICP](../research/product/081-icp-policy-research.md)) |
| "Deterministic", "reproducible with a seed" | The Anthropic Messages API documents no seed parameter; replay means re-running our engine on recorded model outputs ([replay](../research/engineering/072-replay-and-caching.md), [red team](../research/lenses/red-team.md)) |
| "Bet on our forecast", any trading offer | We use markets as a benchmark only ([regulation](../research/business/091-regulation.md), [CRO lens](../research/lenses/cro.md)) |
| Any backtest number in public copy | Models have seen the past; backtests are retrospective only ([forecast scoring](../research/science/030-forecast-scoring.md)) |

Changing either list needs a decision record in `research/decisions/`.
