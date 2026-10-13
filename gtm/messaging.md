# Messaging

## One-liner

Test your message on your ideal customer before you ship it ([0016](../research/decisions/0016-icp-audiences.md)).

Sub-line: Say what you are building in one line and who your customer is. Real World simulates 27 kinds of that customer, by attitude to new products, price sensitivity and familiarity with the category, and shows who would sign up, try or buy, who would not, and what stops them. Every test also runs a plain baseline beside the segments. Every result is AI-simulated, and every test you seal is scored when you mark how it really did.

Pricing line: "Free while in beta. Enterprise on request."

Category: message testing for consumer founders, with a public score for the engine behind it; not a world model, a poll or a survey replacement ([VC lens](../research/lenses/vc.md), [who buys](../research/market/014-who-buys.md)).

The demo order is one message test (describe the product, paste a message, read who reacts and why, and the baseline beside it), then the seal, then the track record.

## User journeys

Each page does one job and offers one next action.

| Who | Starts on | Next action per page |
| --- | --- | --- |
| Consumer founder | `/` | "What are you building?", then "Test my message", then "Test this version" on the rewrite; signed in, the test is sealed and "Your tests" marks it later with what really happened. |
| Founder with past messages | `/simulate`, Backtest | Add up to 10 shipped messages with their results, read hits and calibration for the engine and the baseline. |
| Skeptic or investor | "Public record" | `/receipts` to verify in the browser, `/scores` for skill with n and an interval. |

Surface specs: [product/README.md](../product/README.md).

## Positioning

| Against | What they offer | What we say |
| --- | --- | --- |
| Aaru | Enterprise simulations for consumer and financial-services research, sold through consultancies such as EY and Accenture; accuracy reported by the vendor ([Aaru](../research/market/001-aaru.md), [who buys](../research/market/014-who-buys.md)) | We sell to founders, not through consultancies. Our daily forecasts are committed before outcomes exist and scored in public; Aaru publishes no scored record. |
| Simile | Well-funded enterprise customer simulations for companies such as CVS Health; the most credible method in the field, aimed at "what do these people say about my product" ([Simile](../research/market/002-simile.md)) | We do not compete on enterprise panels. A founder describes their own customer and checks the answer against what really happened; the engine's daily record is scored in public. |
| Synthetic-research vendors in general | Each reports its own accuracy; independent tests found 12-15 point question-level errors and poor subgroup behaviour ([vendors](../research/market/003-synthetic-research-vendors.md)) | Do not trust our accuracy claim either. Read the receipts. |
| A plain LLM prompt | A frontier model with search sits close to superforecasters, and a no-persona "describe the population" call beat persona panels on 9 of 9 pairs in one 2026 preprint ([LLM forecasting](../research/science/021-llm-forecasting.md), [silicon samples](../research/science/016-silicon-samples.md)) | Every message test runs a plain Jev baseline beside the 27 segments, and "Your tests" scores both on your marked results. We also score a plain-LLM baseline against the engine every day in the public record. If the baseline wins, the product says so. |

## Claims we may make

- "Forecasts hashed before the outcome, scored in public since <date of first hash>." ([forecast scoring](../research/science/030-forecast-scoring.md))
- "A record that cannot be backfilled." Qualify it where precision matters: the anchor proves the bytes have not changed since the anchor time, and the pre-committed question list is what rules out choosing questions after the fact ([forecast scoring](../research/science/030-forecast-scoring.md), [commit-reveal](../research/engineering/070-commit-reveal-timestamping.md), [red team](../research/lenses/red-team.md)).
- "Skill against the market price at commit time, with n and an interval", only as the number the receipts page computes ([forecast scoring](../research/science/030-forecast-scoring.md)).
- "Calibrated to published marginals" for the public record's country populations, until written licence replies say otherwise ([data licensing](../research/data/060-data-licensing-legal.md), [CEO lens](../research/lenses/ceo.md)).
- "News in 65 languages through GDELT translation." ([GDELT](../research/data/050-gdelt.md), [news ingestion](../research/open-source/042-news-ingestion.md))
- The coverage tier of every country the public record shows ([large-scale sims](../research/science/028-large-scale-llm-sims.md), [coverage tiers](../research/data/099-country-coverage-tiers.md)).
- "AI-simulated" on every output, and "simulated account, not the cause" on agent narratives ([regulation](../research/business/091-regulation.md), [trust](../research/product/087-trust-and-explainability.md)).
- "A cheap first pass with stated error; then run the real poll." ([policy ICP](../research/product/081-icp-policy-research.md))
- "Test your message on your ideal customer before you ship it.", "Simulated from your description, not real customers." and "Your tests are sealed when you make them." ([0016](../research/decisions/0016-icp-audiences.md), [consumer wedge](../research/product/108-consumer-wedge.md))
- "Free while in beta. Enterprise on request."
- "See how the engine does against the plain baseline and your gut", only as the numbers "Your tests" computes on marked tests, with their n.

## Claims we may not make

| Claim | Why |
| --- | --- |
| "Beats the market", "outperforms", any ranking claim | Not below about 100 resolved questions, and then only as the computed interval ([forecast scoring](../research/science/030-forecast-scoring.md), [benchmark design](../research/science/097-benchmark-design.md)) |
| "X% accurate", "parity", "85-92% match" | Every vendor says it and independent tests contradict it ([vendors](../research/market/003-synthetic-research-vendors.md)) |
| "Sampled from census microdata", "built on IPUMS" | IPUMS International forbids commercial use and redistribution ([IPUMS](../research/data/046-ipums-international.md)) |
| "100+ languages" | GDELT translates 65 ([GDELT](../research/data/050-gdelt.md)) |
| "World model" | The term now means visual or physical models such as Genie 3, and a social simulator gets compared to Simile and Aaru instead ([world-model state of the art](../research/engineering/100-world-model-sota.md), [funding landscape](../research/market/012-funding-landscape-2026.md)) |
| "100,000 agents" as the headline | Agent count is not what sets us apart, and the LLM is called per archetype, not per agent ([CTO lens](../research/lenses/cto.md), [red team](../research/lenses/red-team.md)) |
| "The whole world" without tiers, or country populations as the product | Rich data exists for a minority of countries; show tiers ([coverage tiers](../research/data/099-country-coverage-tiers.md), [cross-cultural bias](../research/science/027-cross-cultural-llm-bias.md)) |
| "Replaces surveys", "a poll" | Simulated respondents fail on spread, subgroups and change over time ([failure modes](../research/science/018-failure-modes.md), [policy ICP](../research/product/081-icp-policy-research.md)) |
| "Deterministic", "reproducible with a seed" | Neither Jev nor the open text model is documented to take a seed; replay means re-running our engine on recorded model outputs ([replay](../research/engineering/072-replay-and-caching.md), [red team](../research/lenses/red-team.md)) |
| "Bet on our forecast", any trading offer | We use markets as a benchmark only ([regulation](../research/business/091-regulation.md), [CRO lens](../research/lenses/cro.md)) |
| Any backtest number in public copy | Models have seen the past; backtests are retrospective only ([forecast scoring](../research/science/030-forecast-scoring.md)) |
| "Your real customers", "a survey of your market", any B2B or enterprise pitch | The segments are simulated from the founder's description; the product is for consumer founders and enterprise is on request only ([0016](../research/decisions/0016-icp-audiences.md)) |

Changing either list needs a decision record in `research/decisions/`.
