# CEO lens: what we build, what we refuse, and the one story

- Date: 2026-10-11
- Seat: CEO (vision, focus, sequence, the launch and YC story)
- Confidence: medium. It rests on the 100 notes in this folder, and most of those were written with a spent search budget. Every licensing conclusion here is unverified until someone gets a reply in writing.

## Verdict

The plan as written is three companies: a world simulator, a forecasting shop, and a synthetic-research vendor. We have 22 days and can launch one. The one we launch is the only population simulator whose forecasts are hashed before the outcome exists and scored in public against the market price. Simile ($2B) and Aaru (about $1B headline) sell simulations that nobody can check. Everything else, including the globe, the 100,000 agents, forks and "ask why", is there to make that record interesting to look at. Two facts in the research change the plan. First, IPUMS International bans commercial use, so "sampled from census microdata" cannot be our claim on Oct 27. Second, our record will be statistically empty at launch, so the claim is "a record nobody can backfill, started on <date>", never "beats the market". The first hash goes out this week, because every day before launch is lead that no competitor can buy back.

## Evaluation

**What is genuinely new.** No funded competitor publishes a forward, hashed, scored track record (`market/001-aaru.md`, `market/002-simile.md`, `market/003-synthetic-research-vendors.md`, `engineering/100-world-model-sota.md`). Funded AI forecasters score one question at a time, and none of them simulates a population (`market/006-ai-forecasting-companies.md`). The open space is the assimilate, hash and score loop applied to a population. Agent count is not what sets us apart.

**What is not a moat.** The pipeline, the GDELT ingest and twins can all be copied. GDELT is free for any commercial use, and twins gain about 12 points over demographics-only agents on one US sample (`business/092-moat-theory.md`). The record is time-locked but thin. The daily question, if people answer it, turns into a panel that improves the forecast, and that is the only loop that compounds. We pitch the pipeline as the cost of entry, and the record and panel as the moat.

**Where the science fights us.** Variance collapse is measured and large: twin SD sits below human SD in 94% of 164 outcomes (`science/018-failure-modes.md`). A no-persona "describe the population" baseline beat persona panels on 9 of 9 pairs (`science/016-silicon-samples.md`). LLMs largely copy the market price (`science/021-llm-forecasting.md`). The honest framing follows from this. The swarm has to beat a plain LLM with news and the market price, or it is decoration. We will measure that gap daily and publish it.

**Where the law fights us.** IPUMS International bans commercial use and redistribution. Terms for WVS, Pew, Gallup and the barometers are unclear. We have not read the Kalshi and Polymarket terms (`data/060-data-licensing-legal.md`, `data/046-ipums-international.md`). GLOPOP-S (CC BY 4.0, 7.3B synthetic people) and GDELT are the clean foundation we have today (`open-source/037-synthpop-tools.md`, `data/057-global-synthetic-population.md`).

**Where cost could kill us.** The nightly run itself is cheap, about $7-28 on Haiku 5.5 batch. Multiplication is the danger: ensembles, 7-day horizons and free forks. A full 100k x 7-day x 5-member fork costs $350-600 (`business/089-unit-economics.md`, `engineering/061-system-architecture.md`, `market/013-api-pricing-benchmarks.md`).

**The buyer.** The real money sits with consumer-brand and agency insights teams testing messages, prices and concepts (`market/014-who-buys.md`, `market/007-market-research-tam.md`). For YC we tell the infrastructure story and name insights teams as the first paying API user.

## The single story

For launch and YC: "Every morning Real World simulates how the world's population will react to today's news and publishes its forecasts as hashes before anything resolves. Then it scores itself against the prediction markets, in public, including the misses. Simile and Aaru sell simulations you have to trust. Ours come with receipts." The demo is receipts, then one fork, then one agent's "why".

## Top 10 decisions, in priority order

1. **The hashed ledger ships first, and the first hash goes out by Oct 14.** We commit a daily salted Merkle root chained to the previous day, stamp it with OpenTimestamps and FreeTSA, and mirror it to a public git repo. Each entry freezes the question text, resolution source, market price, model version and data cutoff. No backfill, ever. The Brazil runoff, Serbia and Bulgaria all vote on Oct 25, so forecasts hashed this week resolve on launch weekend. (`science/030-forecast-scoring.md`, `engineering/070-commit-reveal-timestamping.md`, `business/088-yc-application.md`, `business/092-moat-theory.md`, `data/059-resolvable-events-calendar.md`)

2. **The receipts page is the product, and it sits above the globe.** Each row shows hash, commit time, our probability, the market price, a plain LLM baseline, a persistence baseline, the outcome, Brier, and n. We show skill against the market with a confidence interval and print the resolved count beside it. We make no ranking claim below about 100 resolved questions. Results are split by region and tier, never as one pooled number. (`product/087-trust-and-explainability.md`, `business/093-precedents-and-failures.md`, `science/098-darpa-socialsim.md`, `science/097-benchmark-design.md`, `market/009-abm-commercial.md`)

3. **IPUMS is out of anything we ship.** The population comes from GLOPOP-S demographics, aged forward to 2026 using WPP, with attitudes attached from WVS and the barometers by donor matching on aggregates. The method label is "calibrated to published marginals". `data/SOURCES.md` records the licence for every source, and a source marked "unknown" cannot run in the nightly job. This week we send written requests to IPUMS, WVS, Pew, Afrobarometer, Gallup and GLOPOP-S's author, and we book one hour with a data-licensing lawyer before Oct 27. (`data/060-data-licensing-legal.md`, `open-source/037-synthpop-tools.md`, `science/026-population-synthesis.md`, `data/049-regional-barometers.md`)

4. **One small Python engine, built distribution-first.** We group the population into about 500-2,000 archetypes by country, age, income and attitude cluster. Each archetype gets one Haiku 5.5 batch call that returns a verbalized distribution with the option order randomized, and agent answers are sampled from it. Each agent carries a persistent latent offset. Assimilation is capped per-segment nudging in logit space, not an EnKF. The engine is one module with stages ingest, assimilate, forecast, publish and score. A cron job triggers it, with a Postgres stage table, Parquet on R2, and no orchestrator. Before any cost number is quoted, we measure real token use on 1,000 agents. (`science/028-large-scale-llm-sims.md`, `open-source/033-agenttorch.md`, `science/019-calibration-methods.md`, `engineering/065-belief-update-operators.md`, `engineering/061-system-architecture.md`, `engineering/067-orchestration.md`)

5. **The LLM-only baseline is live by Oct 20 and scored every day beside the swarm.** It uses a frontier model, search, 5-8 samples and a trimmed mean, with the market blend logged as a separate step. We publish three Brier numbers: market, baseline and swarm. If the swarm does not beat the baseline, we say so and find out why. We also submit the baseline to ForecastBench and Metaculus MiniBench, so we have a rank that we did not grade ourselves. (`science/021-llm-forecasting.md`, `open-source/040-forecasting-tools.md`, `market/005-prediction-markets-landscape.md`)

6. **A nightly spread audit that can fail the run.** Per country, we log modal share, entropy and the SD ratio against survey spread. Any segment outside 0.8-1.2 gets flagged and its intervals widened. No output ever shows a bare point estimate, and ensemble spread is the default visual. (`science/018-failure-modes.md`, `engineering/066-ensembles.md`, `science/016-silicon-samples.md`)

7. **Country tiers on everything, with only Tier A and B in headlines.** Each country gets a 0-100 rubric score covering population, attitudes, markets, news and ground truth. The tier appears on every agent, forecast and API response; Tier C and D are labelled prior-driven, and Brier is published by tier. (`data/099-country-coverage-tiers.md`, `science/027-cross-cultural-llm-bias.md`)

8. **The API contract is frozen by Oct 16 and changes in no breaking way after Oct 20.** POST /v1/simulate is an async job that returns 202. It requires an Idempotency-Key and uses a date version header. The result is JSON Schema 2020-12 with segments, ensemble spread, trace, tier, world_snapshot_id, model, seed, `simulated: true`, `sources`, `cost` and `max_cost`. The Python and TS SDKs are generated from the spec, and CI fails if they drift. Pricing has one meter, agent-steps, at roughly $1 per 1,000, plus a no-card free credit. (`engineering/069-api-design.md`, `open-source/045-sdk-generation.md`, `market/013-api-pricing-benchmarks.md`, `business/091-regulation.md`)

9. **Forks are capped, cached and fail closed.** A free fork is signed-in only, 3 a day, 200 agents and one ensemble member, cached by input hash. Paid forks run on at most 2,000-5,000 sampled agents. A per-user and per-night spend counter refuses work when it cannot verify the budget. The acceptable-use policy goes up by Oct 20: no named people, no voter targeting, no ranking of persuasion variants. (`business/089-unit-economics.md`, `product/076-viral-simulations.md`, `engineering/074-abuse-and-safety.md`, `product/082-icp-political.md`)

10. **Ten buyer calls before Oct 27, and the YC application in by Oct 30.** We call ten consumer-brand and agency insights teams and ask which budget line the spend would come from and what study it would replace. In parallel we recruit five to ten hand-picked builders from the Metaculus and Manifold bot communities. On Oct 27 we post a plain Show HN that points at the live receipts page, with no signup required. We submit to YC on Oct 30, with the known-flaws section written from measured numbers. (`market/014-who-buys.md`, `product/086-builders-program.md`, `product/084-launch-channels.md`, `business/088-yc-application.md`)

## The 22-day sequence

- **Oct 11-14:** licence emails go out, the event schema is agreed, and the first hashed forecasts cover the Brazil, Serbia, Bulgaria and Israel votes and the central-bank decisions. The receipts page goes up in rough form. The 1,000-agent token pilot runs.
- **Oct 15-20:** we freeze the API spec (Oct 16), generate the SDKs, run the engine end to end on GLOPOP-S plus WVS aggregates, start the spread audit, put the LLM baseline live, publish the AUP, re-verify election dates, and freeze the API (Oct 20).
- **Oct 21-24:** the fork flow and share card ship. The globe shows server-aggregated hexes, and clicking one fetches a single agent. Builders test, and we fix the top five confusing moments. We freeze the demo path on Oct 24.
- **Oct 25-27:** about 25 forecasts are hashed. Brazil resolves in public on Oct 25, and we launch on Oct 27.
- **Oct 28-30:** the central banks resolve. We record the demo from the live product and submit to YC.

## What to cut

- Opt-in twins until after the YC application. GDPR special-category consent is not ready, and the evidence for twins is thin. (`science/017-generative-agents.md`, `business/091-regulation.md`)
- A paid daily human panel at $1.5-3k a day. The daily question is our panel for now. A small Prolific pilot is allowed only to measure retention. (`market/008-polling-economics.md`, `product/077-daily-question-mechanics.md`)
- EnKF, particle filters, a social graph, and LLM-driven neighbor talk. Nudging and a broadcast exposure rule come first, and a graph gets built only if a backtest shows we need it. (`science/022-data-assimilation-abm.md`, `science/023-opinion-dynamics.md`, `science/025-news-exposure-diffusion.md`)
- Framework dependencies: OASIS, Concordia, Mesa, AgentSociety and DA libraries. Nothing AGPL goes near the API. (`open-source/031-oasis.md` through `open-source/038-data-assimilation-libs.md`)
- Native-language agent prompts, X, Reddit, scraping Google Trends, and Baidu, Yandex and Naver. GDELT and Wikipedia pageviews are the launch inputs. (`engineering/073-multilingual-agents.md`, `data/055-social-media-data.md`, `data/052-search-and-attention.md`)
- Game studios, campaigns, finance and government as customers. Subscriptions and enterprise plans. Fine-tuning any model. (`market/010-game-npc-ai.md`, `product/082-icp-political.md`, `market/015-alt-data-finance.md`, `science/029-human-behavior-models.md`)
- These claims: "100+ languages" (GDELT translates 65), "sampled from IPUMS", "world model", "beats the market", "X% accurate", and "100k agents" as the headline. (`data/050-gdelt.md`, `market/012-funding-landscape-2026.md`)
- The bare name "Real World". We launch under a qualified brand, and the name lives in one config field. (`product/085-naming-trademark.md`)

## The 3 numbers I will watch

1. **Unbroken days of hashed record, and the resolved-question count.** The target is the first hash by Oct 14, no missed days after that, at least 25 pre-registered forecasts by Oct 26, and at least 12 resolved by Nov 7. A missed day costs more than a smaller cohort.
2. **The swarm's Brier score minus the plain LLM baseline's, with a CI, shown next to the market.** If the gap is not negative and does not trend negative by January, the population simulation adds nothing to the forecast, and we change the pitch.
3. **The median SD ratio for Tier A and B countries against survey spread, with a target band of 0.8-1.2.** This is the number that tells us whether the agents are a population or a single voice repeated 100,000 times.

Cost is a guardrail, not a watched number: $25 nightly ceiling, alert at $60, fail closed.
