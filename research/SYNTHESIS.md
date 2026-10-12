# Synthesis: what we build, why it can win, what the research says

- Date: 2026-10-11
- Rests on: the 100 notes below and the seven lenses in [`lenses/`](lenses/)
- Confidence: medium. Most notes were written after the shared web-search budget ran out, so they rest on primary pages opened directly. Every licensing conclusion is unverified until a written reply exists.

## The answer

On Oct 27 we launch one product: a population simulator whose forecasts are hashed before the outcome exists and scored in public against the market price and simple baselines. Simile ($2B) and Aaru (about $1B headline) sell simulations nobody can check, and no funded competitor publishes a forward, hashed, scored record. That record is the product and the moat. The globe, the agents, forks and "ask why" make it interesting to look at. Two findings change the plan. IPUMS International bans commercial use, so the population is built from GLOPOP-S (CC BY 4.0) plus published survey aggregates and labelled "calibrated to published marginals". The record will hold about 25 resolved questions at launch, so the claim is "a record nobody can backfill, started on <date>", never "beats the market". The first hash goes out by Oct 14. The engine is one small Python module: about 1-2k segments, one cheap batched model call per segment and question, a nightly spread audit, and a daily score against five forecasters, so we find out in public whether the simulation adds anything over a plain LLM reading the same news.

## What we are building (Oct 27)

1. **Receipts page**, above everything else: each forecast with its hash, commit time, our probability, market price at commit, outcome, Brier, and running skill against each baseline with n.
2. **Daily question**: one slider, an instant reveal (you vs crowd vs sim vs market), questions that resolve in 1-7 days, streaks that count submissions.
3. **Fork**: drop an event into today's world, run 7 simulated days on a sampled population, get a shareable card with segment shifts and ensemble spread.
4. **`POST /v1/simulate`** plus generated Python and TypeScript SDKs: async job, typed output with segments, spread, coverage tier, cost, hash and trace.
5. **Globe** as backdrop: aggregated cells, single agents fetched on click.

## Why it can win

- **Nobody else publishes a scored record.** Aaru's one public forecast (2024 swing states for Semafor) was wrong, and it publishes no record ([001](market/001-aaru.md)). Simile's accuracy is self-reported, US-only and private ([002](market/002-simile.md)). Synthetic-research vendors show 12-15 point errors in independent tests and publish nothing scored ([003](market/003-synthetic-research-vendors.md)).
- **The category is funded.** Simile raised $200M at $2B in July 2026; AI forecasting and world models are drawing large rounds ([012](market/012-funding-landscape-2026.md), [096](business/096-recent-news.md)).
- **History rewards scored records.** The Good Judgment Project won by scoring against baselines in public; Simulmatics, Google Flu Trends and Cambridge Analytica oversold models of people and were discredited ([093](business/093-precedents-and-failures.md)).
- **Time is the moat.** A hashed record cannot be backfilled, so each day before a competitor starts is lead they cannot buy. The daily question, if people answer it, becomes a human panel that improves the forecast; the pipeline, GDELT and twins can all be copied ([092](business/092-moat-theory.md)).
- **Cost is not the constraint.** A nightly 100k-agent update is about $7-28 on Haiku 5.5 batch, hosting about $3 a night ([089](business/089-unit-economics.md), [068](engineering/068-compute-hosting.md)). The risk is multiplication from ensembles, 7-day runs and free forks.

## What the research says

**The simulation science works against us, and that shapes the engine.** LLM personas match group means but collapse variance: twin SD is below human SD in 94% of 164 outcomes ([018](science/018-failure-modes.md)), and a no-persona "describe the population" baseline beat persona panels 9 of 9 times ([016](science/016-silicon-samples.md)). Interview-grounded twins reach 83-86% of human test-retest on one US sample, at a cost that does not scale ([017](science/017-generative-agents.md)). Every model defaults to rich English-speaking values, and native-language prompting barely helps ([027](science/027-cross-cultural-llm-bias.md), [073](engineering/073-multilingual-agents.md)). What does work: verbalized distributions instead of logprobs, distribution-first sampling per segment, a calibration map fitted on surveys, and rectification against a human panel ([019](science/019-calibration-methods.md), [063](engineering/063-typed-probabilities.md)). Every "million-agent" system calls the model for only a slice of the population; AgentTorch's archetypes beat per-agent LLM calls on error at a fraction of the cost ([028](science/028-large-scale-llm-sims.md), [033](open-source/033-agenttorch.md)).

**Forecasting is close to a tie with markets.** Frontier LLMs with search sit within about 0.017 Brier of superforecasters and roughly match the Kalshi price, and LLMs largely copy market prices when shown them ([021](science/021-llm-forecasting.md), [006](market/006-ai-forecasting-companies.md)). So we score a blind run that never sees market prices, and we need about 100 resolved questions before any ranking claim ([030](science/030-forecast-scoring.md), [097](science/097-benchmark-design.md)).

**Assimilation has only worked on aggregates.** Nobody has assimilated belief states of 100k LLM agents; per-agent particle filters blow up. Run it on segment-by-topic cells in logit space and push the increments into agents ([022](science/022-data-assimilation-abm.md), [038](open-source/038-data-assimilation-libs.md), [065](engineering/065-belief-update-operators.md)).

**The data is thinner and less licensable than the plan assumed.** IPUMS International bans commercial use and redistribution ([046](data/046-ipums-international.md), [060](data/060-data-licensing-legal.md)). WVS, Pew, Gallup and the barometers have unconfirmed commercial terms ([047](data/047-world-values-survey.md), [048](data/048-gallup-pew-global.md), [049](data/049-regional-barometers.md)). GDELT (free for commercial use with attribution) and GLOPOP-S (CC BY 4.0, 7.3B synthetic people, demographics only) are the clean foundation ([050](data/050-gdelt.md), [057](data/057-global-synthetic-population.md)). GDELT translates 65 languages, not 100+. Rich data exists for only 20-30 countries, so every output carries a coverage tier ([099](data/099-country-coverage-tiers.md)).

**Build small and own it.** No framework fits: OASIS, AgentSociety, Concordia and Mesa are built for thousands of agents or fewer, and AgentTorch and FLAME GPU are AGPL ([031](open-source/031-oasis.md)-[036](open-source/036-ai-town-tinytroupe.md)). The stack is one Python package of re-runnable steps, the Anthropic Batch API, Parquet snapshots in R2, Neon Postgres and DuckDB, with no orchestrator ([061](engineering/061-system-architecture.md), [067](engineering/067-orchestration.md)).

**Buyers.** Nobody pays for "simulate the world". The first money is consumer-brand and agency insights teams testing messages, prices and products out of research budgets ([014](market/014-who-buys.md), [007](market/007-market-research-tam.md)). Games, campaigns, policy and finance are later or never ([010](market/010-game-npc-ai.md), [082](product/082-icp-political.md), [015](market/015-alt-data-finance.md)).

## Decisions this forces

Each needs a record in [`decisions/`](decisions/) before the code that depends on it.

1. **Category: a forecast API with a public score**, not a world model or an agent platform. The receipts page sits above the globe. ([009](market/009-abm-commercial.md), [012](market/012-funding-landscape-2026.md), [087](product/087-trust-and-explainability.md))
2. **Start the ledger by Oct 14.** Freeze the question list, resolution source and scoring rule first; salted per-entry hashes in a daily Merkle root chained to the previous day; OpenTimestamps plus one RFC 3161 token; a public git mirror; no backfill, ever. Model version, prompt hash, data cutoff and market price go inside each entry. ([070](engineering/070-commit-reveal-timestamping.md), [030](science/030-forecast-scoring.md), [059](data/059-resolvable-events-calendar.md))
3. **Score five forecasters on every question**: market price at commit, persistence, a non-LLM demographic lookup, a plain LLM reading the same news, and the swarm, with a blind swarm run that never sees prices. Brier and log score for binary questions, fair CRPS for numeric ones, block-bootstrap intervals, n always shown. ([021](science/021-llm-forecasting.md), [020](science/020-opinion-benchmarks.md), [093](business/093-precedents-and-failures.md), [098](science/098-darpa-socialsim.md))
4. **No IPUMS International in anything shipped.** Population = GLOPOP-S aged to 2026 with UN WPP, attitudes from survey aggregates by donor matching, labelled "calibrated to published marginals". A licence table (`data/SOURCES.md`) gates the loader in code: any source marked unknown is blocked. GADM is banned. ([046](data/046-ipums-international.md), [057](data/057-global-synthetic-population.md), [026](science/026-population-synthesis.md), [058](data/058-geodata.md))
5. **Engine: distribution-first archetypes.** About 1-2k segments; one Haiku 5.5 batch call per segment and question returning a verbalized distribution with randomized option order; agents sample from it with persistent latent offsets; about 500 fully prompted agents back "ask why". Our own small module, no framework dependency. ([028](science/028-large-scale-llm-sims.md), [033](open-source/033-agenttorch.md), [039](open-source/039-inference-structured-output.md), [063](engineering/063-typed-probabilities.md))
6. **Assimilation: capped per-segment nudging in logit space**, stored as an auditable field. Upgrade to a hand-rolled ETKF on segment aggregates only if nudging fails out-of-sample Brier. ([065](engineering/065-belief-update-operators.md), [022](science/022-data-assimilation-abm.md), [038](open-source/038-data-assimilation-libs.md))
7. **Spread is a gate, not a chart.** Nightly SD ratio against survey spread per country; the run fails outside 0.8-1.2. Countries are scored 0-100 into tiers A-D, the tier ships on every output, and headline claims cover Tier A/B only. ([018](science/018-failure-modes.md), [066](engineering/066-ensembles.md), [099](data/099-country-coverage-tiers.md))
8. **Every spend path fails closed.** A per-call cost ledger from day one; caps per call, per user, per night and on free usage; `max_cost` on the API; free forks at 200 agents and 1 ensemble member. Measure 1-2k real calls before any price is published, then price credits per 1,000 agent-steps, pay-as-you-go. ([089](business/089-unit-economics.md), [013](market/013-api-pricing-benchmarks.md), [079](product/079-pricing-models.md))
9. **Freeze `/v1/simulate` v1 by Oct 16-20.** 202 plus job id, Idempotency-Key, date-pinned version header, JSON Schema 2020-12 as the one source of truth for Pydantic, zod and the SDKs, and `simulated`, `world_snapshot_id`, `model`, `seed`, spread, tier, `cost`, `hash` and `sources` on every result. ([069](engineering/069-api-design.md), [045](open-source/045-sdk-generation.md), [074](engineering/074-abuse-and-safety.md))
10. **Cut for launch**: opt-in twins, the paid daily human panel beyond a small capped pilot, LLM neighbour talk and social graphs, fine-tuning, orchestrators, a raw 100k-dot globe, native-language prompting, and campaign, games, policy and finance revenue. ([017](science/017-generative-agents.md), [023](science/023-opinion-dynamics.md), [025](science/025-news-exposure-diffusion.md), [029](science/029-human-behavior-models.md))
11. **Guardrails before launch**: an acceptable-use policy by Oct 20 (no named private people, no voter targeting, aggregate-only election outputs, segment-size floor), EU AI Act Article 50 labels, and market data used read-only as a benchmark. ([074](engineering/074-abuse-and-safety.md), [082](product/082-icp-political.md), [091](business/091-regulation.md))
12. **Go to market**: Show HN pointed at the live daily page with no signup; ten hand-picked builders; a $7.5k founder-led pilot for insights teams that replays three of their finished studies blind; YC application submitted Oct 30. ([084](product/084-launch-channels.md), [086](product/086-builders-program.md), [088](business/088-yc-application.md), [lenses/cro.md](lenses/cro.md))

### Conflicts still open

The notes and lenses disagree on these; settle each in a decision record.

| Question | Positions |
| --- | --- |
| Nightly trigger and fork host | GitHub Actions cron plus one Fly machine ([cto](lenses/cto.md)) vs Modal cron and spawn ([067](engineering/067-orchestration.md), [068](engineering/068-compute-hosting.md)). Pick one platform. |
| Nightly spend cap | $25 hard stop ([cto](lenses/cto.md)) vs alert at $60, stop at $100 ([cfo](lenses/cfo.md)) |
| Free fork allowance | 3 a day ([089](business/089-unit-economics.md), [cro](lenses/cro.md)) vs 3 a month ([079](product/079-pricing-models.md), [cfo](lenses/cfo.md)) |
| Paid plan | one $49 Pro plan ([079](product/079-pricing-models.md), [cro](lenses/cro.md)) vs credits only, no plan at launch ([cfo](lenses/cfo.md), [cpo](lenses/cpo.md)) |
| Human panel | $1.5-3k a day ([008](market/008-polling-economics.md)) vs $5k total before YC ([cfo](lenses/cfo.md)) vs cut ([red-team](lenses/red-team.md)) |
| Ensemble size | K=20 on 5k-agent subsamples ([066](engineering/066-ensembles.md)) vs 3-5 members ([022](science/022-data-assimilation-abm.md), [062](engineering/062-llm-cost-choices.md)) |
| Globe library | globe.gl with merged points ([041](open-source/041-globe-visualization.md)) vs react-globe.gl on aggregated cells ([071](engineering/071-web-app-stack.md)); deck.gl GlobeView spike |

## Biggest open risks

1. **No legal basis for the data.** Not one attitude source (WVS, Gallup, Pew, barometers) or eval set has confirmed commercial terms, and Kalshi and Polymarket terms are unread. Watch: share of shipped sources with written clearance. ([060](data/060-data-licensing-legal.md), [red-team](lenses/red-team.md))
2. **The swarm may add nothing.** A plain LLM with search may score as well as the agents, which would make them decoration. Watch: swarm Brier minus plain-LLM Brier, with n and an interval. ([016](science/016-silicon-samples.md), [021](science/021-llm-forecasting.md), [vc](lenses/vc.md))
3. **The headline metric is empty at launch.** About 25 resolved questions against a floor of about 100, and a forecast that assimilates market moves cannot honestly be scored against those markets. The blind run is the fix. ([030](science/030-forecast-scoring.md), [097](science/097-benchmark-design.md))
4. **Variance collapse and Western flattening** in Tier C/D countries, which are most of the world. ([018](science/018-failure-modes.md), [027](science/027-cross-cultural-llm-bias.md), [099](data/099-country-coverage-tiers.md))
5. **Cost assumptions are unmeasured.** Every dollar figure assumes 800-2,000 input tokens per answer; if real prompts are 3-5x larger, $1 per 1,000 agent-steps loses money. ([089](business/089-unit-economics.md), [cfo](lenses/cfo.md))
6. **No buyer in writing** and a weak, possibly conflicting name ("Real World" vs MTV, Real World Records, gothinkster/realworld). Both must be settled before the first public hash carries the brand. ([014](market/014-who-buys.md), [085](product/085-naming-trademark.md))

### Claims to stop making

"100,000 LLM agents" (the model is called per segment), "100+ languages" (GDELT translates 65), "sampled from census microdata" (IPUMS is out), any accuracy percentage, and "beats the market" before about 100 resolved questions.

## Index of notes

Confidence is the note's own rating. Paths are relative to this folder.

### Market

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [market/001-aaru.md](market/001-aaru.md) | Sales-led enterprise vendor, ~$1B headline, wrong on 2024; no public record, so ours is the opening | medium |
| [market/002-simile.md](market/002-simile.md) | $2B, credible interview method, private and US-only; own global, daily, forkable, scored | medium |
| [market/003-synthetic-research-vendors.md](market/003-synthetic-research-vendors.md) | One-shot audience vendors show 12-15 pt errors in independent tests; publish Brier and subgroup error, not "% accuracy" | medium |
| [market/004-jev-typesafe.md](market/004-jev-typesafe.md) | Typed classifier, not a competitor; copy its typed JSON quickstart and launch playbook | medium |
| [market/005-prediction-markets-landscape.md](market/005-prediction-markets-landscape.md) | Kalshi and Polymarket are a credible baseline; score against price at publish, blind run, no trading | medium |
| [market/006-ai-forecasting-companies.md](market/006-ai-forecasting-companies.md) | AI bots tie top humans narrowly; none simulates a population; copy their unbackfillable record | medium |
| [market/007-market-research-tam.md](market/007-market-research-tam.md) | $153bn insights industry is context, not TAM; first budget line is concept and message pre-testing | medium |
| [market/008-polling-economics.md](market/008-polling-economics.md) | Simulated answers are ~10,000x cheaper; correctness is the contest and the human panel is the real cost | medium |
| [market/009-abm-commercial.md](market/009-abm-commercial.md) | Commercial ABM is a small toolkit niche; sell a scored forecast API, not a modeling platform | medium |
| [market/010-game-npc-ai.md](market/010-game-npc-ai.md) | Game studios are a poor first market; drop them from launch and the YC slide | medium |
| [market/011-society-digital-twins.md](market/011-society-digital-twins.md) | Government twins model physical systems; money for simulating people is private; plan no government revenue | medium |
| [market/012-funding-landscape-2026.md](market/012-funding-landscape-2026.md) | Capital flows to closed synthetic-people vendors; a public scored record is unoccupied ground | medium |
| [market/013-api-pricing-benchmarks.md](market/013-api-pricing-benchmarks.md) | Meter agent-days, free monthly credit, pay-as-you-go, estimate endpoint and `max_cost` | medium |
| [market/014-who-buys.md](market/014-who-buys.md) | Buyers are brand and agency insights teams with research budgets; nobody pays for world forecasts | medium |
| [market/015-alt-data-finance.md](market/015-alt-data-finance.md) | Funds need years of point-in-time history; ship an append-only export, sell to finance later | medium |

### Science

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [science/016-silicon-samples.md](science/016-silicon-samples.md) | Personas match means but fail variance and non-Western groups; score against a no-persona baseline | medium |
| [science/017-generative-agents.md](science/017-generative-agents.md) | Interview twins reach 83-86% of test-retest on one US sample; use survey personas, twins later | medium |
| [science/018-failure-modes.md](science/018-failure-modes.md) | Variance collapse and WEIRD bias are large; nightly spread audit, real respondent seeds, per-country grades | medium |
| [science/019-calibration-methods.md](science/019-calibration-methods.md) | Verbalized distributions, a fitted calibration map and rectification work; logprobs do not | medium |
| [science/020-opinion-benchmarks.md](science/020-opinion-benchmarks.md) | No benchmark tests a daily world sim; report SimBench plus a fitted non-LLM baseline | medium |
| [science/021-llm-forecasting.md](science/021-llm-forecasting.md) | LLMs with search roughly match markets; ship a plain LLM baseline and score it daily | medium |
| [science/022-data-assimilation-abm.md](science/022-data-assimilation-abm.md) | DA works only on aggregates; EnKF on segment x topic cells, not per-agent particle filters | medium |
| [science/023-opinion-dynamics.md](science/023-opinion-dynamics.md) | Numeric anchored Friedkin-Johnsen update if any; drop neighbour talk unless it improves Brier | medium |
| [science/024-synthetic-social-networks.md](science/024-synthetic-social-networks.md) | Rule-based layered graph fitted to Facebook SCI, never LLM-generated; not needed for v1 | medium |
| [science/025-news-exposure-diffusion.md](science/025-news-exposure-diffusion.md) | Exposure = channel reach x salience x attention decay; no social graph for v1 | medium |
| [science/026-population-synthesis.md](science/026-population-synthesis.md) | IPF per country plus donor matching for attitudes; IPUMS terms block commercial use | medium |
| [science/027-cross-cultural-llm-bias.md](science/027-cross-cultural-llm-bias.md) | Every model skews to rich English-speaking values; per-country validated flag and A/B | medium |
| [science/028-large-scale-llm-sims.md](science/028-large-scale-llm-sims.md) | Large sims call the LLM per archetype; archetype-first engine with a dispersion gate | medium |
| [science/029-human-behavior-models.md](science/029-human-behavior-models.md) | Do not train before launch; log clean temporally split data for a Q1 2027 LoRA test | medium |
| [science/030-forecast-scoring.md](science/030-forecast-scoring.md) | Brier and log vs market with bootstrap CIs; salted Merkle manifest plus OpenTimestamps | medium |
| [science/097-benchmark-design.md](science/097-benchmark-design.md) | Forward-only, hash-committed, frozen question generator, three baselines; no claims before ~100 resolved | medium |
| [science/098-darpa-socialsim.md](science/098-darpa-socialsim.md) | Copy SocialSim's evaluation design: fixed metrics, persistence baseline, per-scale scores | low |

### Open source

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [open-source/031-oasis.md](open-source/031-oasis.md) | Feed simulator, not our engine; copy activation, trace-table and interview patterns | medium |
| [open-source/032-agentsociety.md](open-source/032-agentsociety.md) | City-scale research framework; borrow the state schema and caching ideas, do not depend | medium |
| [open-source/033-agenttorch.md](open-source/033-agenttorch.md) | AGPL, do not import; reimplement LLM archetypes with per-agent latent traits | medium |
| [open-source/034-concordia.md](open-source/034-concordia.md) | Game-master library for ~100 agents; borrow patterns, deep tier only, off the critical path | medium |
| [open-source/035-classic-abm.md](open-source/035-classic-abm.md) | No ABM framework as engine; thin Python over columnar arrays; reject AGPL/GPL | medium |
| [open-source/036-ai-town-tinytroupe.md](open-source/036-ai-town-tinytroupe.md) | None scales; borrow persona JSON, empirical validator and AI Town's ordered input log | medium |
| [open-source/037-synthpop-tools.md](open-source/037-synthpop-tools.md) | GLOPOP-S (CC BY 4.0, 7.3B people) is the seed; confirm commercial use with the author | medium |
| [open-source/038-data-assimilation-libs.md](open-source/038-data-assimilation-libs.md) | No DA library; hand-roll a ~20-line ETKF, DAPPER as test oracle only | medium |
| [open-source/039-inference-structured-output.md](open-source/039-inference-structured-output.md) | Forced-enum output is commodity; Haiku has no logprobs, so calibrate against polls | medium |
| [open-source/040-forecasting-tools.md](open-source/040-forecasting-tools.md) | Use ForecastBench and Metaculus MiniBench as external proof; keep our own ledger as the record | medium |
| [open-source/041-globe-visualization.md](open-source/041-globe-visualization.md) | globe.gl with merged points and own click lookup, deck.gl spike; aggregate server-side | medium |
| [open-source/042-news-ingestion.md](open-source/042-news-ingestion.md) | Raw GDELT 15-minute files, no client library; trafilatura for full text only | medium |
| [open-source/043-eval-harnesses.md](open-source/043-eval-harnesses.md) | Inspect for survey fidelity only; the ledger and scoring are ~100 lines of our own code | medium |
| [open-source/044-python-ts-monorepo-tooling.md](open-source/044-python-ts-monorepo-tooling.md) | uv + pnpm workspaces, ruff, Biome, pytest, pyright, one root Makefile | medium |
| [open-source/045-sdk-generation.md](open-source/045-sdk-generation.md) | Generate SDKs from a frozen OpenAPI spec with Stainless free tier; fail CI on drift | medium |

### Data

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [data/046-ipums-international.md](data/046-ipums-international.md) | Bans commercial use and redistribution; research-only unless IPUMS grants written permission | medium |
| [data/047-world-values-survey.md](data/047-world-values-survey.md) | Free trend files for 120 countries; commercial terms unread, ask in writing | medium |
| [data/048-gallup-pew-global.md](data/048-gallup-pew-global.md) | Use published toplines and aggregates as calibration anchors, not agent inputs | medium |
| [data/049-regional-barometers.md](data/049-regional-barometers.md) | Free to download, no open licence; aggregate targets only, permission from all five | medium |
| [data/050-gdelt.md](data/050-gdelt.md) | Free for commercial use with attribution; nightly raw-file ingest, a noisy attention signal | medium |
| [data/051-prediction-market-apis.md](data/051-prediction-market-apis.md) | Free keyless reads; snapshot daily now, show price plus link until terms are read | medium |
| [data/052-search-and-attention.md](data/052-search-and-attention.md) | Wikipedia pageviews (CC0) are the only open global attention signal; apply for Trends alpha | medium |
| [data/053-official-statistics.md](data/053-official-statistics.md) | Official stats are slow priors, not daily signal; five thin adapters with `published_at` | medium |
| [data/054-global-poll-sources.md](data/054-global-poll-sources.md) | Pew spring 2026 (36 countries, subgroups) is the first post-cutoff backtest set | medium |
| [data/055-social-media-data.md](data/055-social-media-data.md) | Do not build on social APIs; GDELT primary, small Bluesky and YouTube samples | medium |
| [data/056-markets-and-prices.md](data/056-markets-and-prices.md) | FX free via Frankfurter, FRED and EIA with keys; equities and fuel prices are gaps | medium |
| [data/057-global-synthetic-population.md](data/057-global-synthetic-population.md) | GLOPOP-S is the fastest global route; age 2015 rows to 2026 with WPP | medium |
| [data/058-geodata.md](data/058-geodata.md) | Ban GADM; WorldPop to H3 res 7, publish res 4 or coarser | medium |
| [data/059-resolvable-events-calendar.md](data/059-resolvable-events-calendar.md) | About 25 dated binary events, clustered Oct 25 to Nov 7; hash them by Oct 26 | medium |
| [data/060-data-licensing-legal.md](data/060-data-licensing-legal.md) | Only GDELT is clearly commercial; build on aggregates and open data, licence table gates use | medium |
| [data/099-country-coverage-tiers.md](data/099-country-coverage-tiers.md) | Rich data for 20-30 countries; 0-100 rubric, tiers A-D on every output | medium |

### Engineering

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [engineering/061-system-architecture.md](engineering/061-system-architecture.md) | Nightly batch module, Batch API, R2 Parquet plus Postgres; forks are the only live compute | medium |
| [engineering/062-llm-cost-choices.md](engineering/062-llm-cost-choices.md) | Haiku 5.5 batch for the loop, Sonnet for "ask why"; no self-hosting at this scale | medium |
| [engineering/063-typed-probabilities.md](engineering/063-typed-probabilities.md) | No logprobs or seed; verbalized distributions, randomized order, calibrate at population level | medium |
| [engineering/064-agent-state-storage.md](engineering/064-agent-state-storage.md) | One small row per agent in daily Parquet; forks are a pointer plus overrides | medium |
| [engineering/065-belief-update-operators.md](engineering/065-belief-update-operators.md) | Numeric belief vector with bounded update and pull to prior; capped per-segment nudging | medium |
| [engineering/066-ensembles.md](engineering/066-ensembles.md) | Raw spread is not uncertainty; small ensembles on subsamples, calibrated by scoring | medium |
| [engineering/067-orchestration.md](engineering/067-orchestration.md) | No orchestrator; one idempotent entrypoint with a stage table, cron plus dead-man check | medium |
| [engineering/068-compute-hosting.md](engineering/068-compute-hosting.md) | LLM bill dominates; Modal, Neon, R2 and Workers or one Fly machine; no GPUs | medium |
| [engineering/069-api-design.md](engineering/069-api-design.md) | Async 202 job, Idempotency-Key, date versioning, JSON Schema contract from v1 | medium |
| [engineering/070-commit-reveal-timestamping.md](engineering/070-commit-reveal-timestamping.md) | Daily chained Merkle root, OpenTimestamps plus FreeTSA, public git mirror | medium |
| [engineering/071-web-app-stack.md](engineering/071-web-app-stack.md) | Vite + React + react-globe.gl static app, SSE fork progress, aggregated cells | medium |
| [engineering/072-replay-and-caching.md](engineering/072-replay-and-caching.md) | Storage is cheap, calls are not; replay recorded outputs, cache forks by input hash | medium |
| [engineering/073-multilingual-agents.md](engineering/073-multilingual-agents.md) | English prompt plus explicit country block; native language only as a measured arm | medium |
| [engineering/074-abuse-and-safety.md](engineering/074-abuse-and-safety.md) | Five-rule AUP, `simulated: true` on every output, no named people, layered rate limits | medium |
| [engineering/075-repo-and-pr-practices.md](engineering/075-repo-and-pr-practices.md) | Five-field PR template enforced by a required check, ruleset, CODEOWNERS, ADRs | medium |
| [engineering/100-world-model-sota.md](engineering/100-world-model-sota.md) | Nobody publishes scored population forecasts; the daily assimilate-hash-score loop is the novelty | medium |

### Product

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [product/076-viral-simulations.md](product/076-viral-simulations.md) | Sims spread through one surprising story and one-click forks; design the fork card first | medium |
| [product/077-daily-question-mechanics.md](product/077-daily-question-mechanics.md) | One shared daily item, instant reveal, pasteable result, streak of submissions | medium |
| [product/078-api-launch-playbooks.md](product/078-api-launch-playbooks.md) | Free capped tier, typed SDKs, llms.txt, one named launch a week | medium |
| [product/079-pricing-models.md](product/079-pricing-models.md) | Credits per 1,000 agent-answers; free daily world and receipts, paid forks and API | medium |
| [product/080-icp-product-teams.md](product/080-icp-product-teams.md) | Product teams are the first API user type, not the lead ICP | medium |
| [product/081-icp-policy-research.md](product/081-icp-policy-research.md) | Policy buyers want auditable run bundles; academics are a free credibility channel | low |
| [product/082-icp-political.md](product/082-icp-political.md) | Do not serve campaigns; elections stay aggregate and public on the receipts page | medium |
| [product/083-icp-games-media.md](product/083-icp-games-media.md) | Newsrooms over games, neither proven; pitch five newsrooms a co-published piece | low |
| [product/084-launch-channels.md](product/084-launch-channels.md) | Show HN to a live no-signup page; receipts must exist before launch | medium |
| [product/085-naming-trademark.md](product/085-naming-trademark.md) | "Real World" is a weak, crowded name; trademark knockout and fallbacks before the first hash | low |
| [product/086-builders-program.md](product/086-builders-program.md) | Ten hand-picked builders each ship one public demo; never ask for upvotes | medium |
| [product/087-trust-and-explainability.md](product/087-trust-and-explainability.md) | Trust comes from the scored record and honest spread; "ask why" is labelled a simulated account | medium |

### Business

| Note | One-line answer | Confidence |
| --- | --- | --- |
| [business/088-yc-application.md](business/088-yc-application.md) | Deadline Nov 2, 8pm PT; the hashed record is the application; submit Oct 30 | medium |
| [business/089-unit-economics.md](business/089-unit-economics.md) | Nightly update $7-28; multipliers are the risk; cost ledger and capped free forks | medium |
| [business/090-seed-comps.md](business/090-seed-comps.md) | Big money at the top, one verified seed comp; take YC's standard $500K | low |
| [business/091-regulation.md](business/091-regulation.md) | Lightly regulated if read-only; Article 50 labels, GDPR for twins, never trade | medium |
| [business/092-moat-theory.md](business/092-moat-theory.md) | Only the hashed record and the daily human panel hold; the pipeline is cost of entry | medium |
| [business/093-precedents-and-failures.md](business/093-precedents-and-failures.md) | Oversold people-models failed; GJP won by public baseline scoring | medium |
| [business/094-team-and-advisors.md](business/094-team-and-advisors.md) | Four advisors before Nov 2; first hire is a forecasting and evaluation scientist | medium |
| [business/095-partnerships.md](business/095-partnerships.md) | Only no-signature sources are realistic before launch; approach pollsters after a record exists | medium |
| [business/096-recent-news.md](business/096-recent-news.md) | Simile's $2B validates the category; new papers confirm collapse and flattening | medium |

### Lenses

| Lens | Verdict in one line |
| --- | --- |
| [lenses/ceo.md](lenses/ceo.md) | Launch one company: the hashed, market-scored population simulator; first hash by Oct 14 |
| [lenses/cto.md](lenses/cto.md) | Buildable only as a ledger plus segment-level engine; score five forecasters daily |
| [lenses/cpo.md](lenses/cpo.md) | Product is the daily question, receipts, fork card and a narrow API; globe is backdrop |
| [lenses/cro.md](lenses/cro.md) | First money is a $7.5k insights-team pilot; 3 signed pilots for YC |
| [lenses/cfo.md](lenses/cfo.md) | LLM bill is small; free forks, ensembles, the panel and prompt size are the risks |
| [lenses/vc.md](lenses/vc.md) | Small SAFE only with a running ledger, a swarm-vs-LLM measurement and one written buyer |
| [lenses/red-team.md](lenses/red-team.md) | Fails on licensing, an empty headline metric and an unproven swarm, not engineering |
