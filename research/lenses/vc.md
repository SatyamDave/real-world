# VC lens: would a seed partner fund Real World?

- Date: 2026-10-11
- Seat: partner at a top seed fund
- Read in full: business/092, 089, 090; market/014; data/060; science/030. The digest covers the rest.

## Verdict

Not at a priced seed today. I would write a small check, about $250-500K on a post-money SAFE beside YC's standard $500K, only if specific proof exists by Nov 2. The idea is fundable because the category is proven: Simile went from $100M to $2B in five months, and Aaru priced a Series A at a $1B headline (market/002-simile.md, business/090-seed-comps.md). The pitch as written is not fundable. "A live simulation of the whole world with 100,000 agents" is the part competitors and reviewers will discount first. The part nobody else has is a public, hashed, market-scored forecast record, and on Nov 2 that record will be about three weeks old and statistically empty (business/092-moat-theory.md, science/030-forecast-scoring.md). I fund the receipts, not the globe. The cap is my judgment, since the notes found no 2026 pre-seed cap data (business/090-seed-comps.md): I would accept up to about $12-15M post only with a working daily ledger, a measured swarm-vs-baseline result, and one named buyer in writing. Without those I pass and check again at Demo Day.

## Evaluation

**Market.** The money is real but sits in market research, not in forecasting. Buyers pay for "test this message, price or product against an audience" out of an insights budget of more than $150B (market/014-who-buys.md, market/007-market-research-tam.md). No one in the notes pays for a whole-world forecast. Aaru, the closest comparable, reportedly has under $10M ARR after two years and sells through EY (market/001-aaru.md). Real World's wedge is therefore a scored simulation API for insights teams. The public daily world is marketing and proof, not the product. Founders who pitch the globe as the product will get passed on.

**Moat.** The brief lists five moat layers. Two hold.
- Public hashed track record: real, and the only asset that cannot be bought later. It is worth nothing until it has hundreds of resolved questions, and a rival can start one tomorrow (business/092-moat-theory.md).
- Daily human panel: the best proprietary data, but only if people return without pay and the data is not given away (business/092-moat-theory.md, product/077-daily-question-mechanics.md).
- Assimilation pipeline: cost of entry. GDELT is free for commercial use and the methods are published (data/050-gdelt.md, science/022-data-assimilation-abm.md).
- Opt-in twins: weak. Park et al. gain about 12 points over demographics-only on one US sample, and Columbia's mega-study puts twin-human r near 0.20 (science/017-generative-agents.md).
- Learn-from-misses: only an edge while it visibly improves the record.

The honest moat story is "we started the clock first and the panel compounds". That is thin but true, and it is better than claiming the agents are the moat.

**Science risk is the largest risk.** Persona panels reproduce group means and fail on spread, subgroups and change over time. Twin SD falls below human SD in 94% of 164 outcomes (science/018-failure-modes.md). One 2026 preprint found a no-persona "describe the population" baseline beat persona panels on 9 of 9 pairs (science/016-silicon-samples.md). ForecastBench found LLMs largely copy market prices (market/006-ai-forecasting-companies.md). If a frontier model with search, reading the same news, scores as well as the 100k-agent swarm, the agents are decoration and the company is a forecasting bot competing with Mantic. Nothing in the 100 notes tests that comparison. It is the first experiment I would ask for.

**Data rights could end the pitch.** IPUMS International bans commercial use and redistribution (data/046-ipums-international.md, data/060-data-licensing-legal.md). The headline "sampled from census microdata in 100+ countries" therefore fails the first diligence call. WVS, Pew, Gallup and the barometers have commercial terms that are unknown or excerpt-only (data/047-world-values-survey.md, data/048-gallup-pew-global.md, data/049-regional-barometers.md). GLOPOP-S under CC BY 4.0 is a workable substitute, pending the author's confirmation of commercial use (open-source/037-synthpop-tools.md, data/057-global-synthetic-population.md).

**Unit economics are fine if capped.** The nightly run costs about $7-55 on Haiku 5.5. A full 100k-agent, 7-day fork costs about $185, and 10,000 uncapped free forks would cost about $11,100 in a day (business/089-unit-economics.md). Margins on paid runs of 73-87% are credible, but they are margins on LLM cost only, and the human panel is not budgeted (market/008-polling-economics.md).

**Team.** The notes cannot judge the team. Simile has the method inventors. Real World needs an evaluation scientist and advisors who say yes in writing (business/094-team-and-advisors.md). In 22 days, scope discipline is the founder signal I look for.

## Top 10 demands, in priority order

1. **Start the hashed ledger today, anchored outside your control.** Use a salted Merkle root per day, chained to the previous day, with OpenTimestamps plus an RFC 3161 token and a public git mirror. Freeze question text, resolution source, market price and model version. Every day missed before Oct 27 is lost for good (engineering/070-commit-reveal-timestamping.md, science/030-forecast-scoring.md, business/088-yc-application.md).

2. **Score four lines on every question: market price, persistence, LLM-only baseline, and the swarm.** If the swarm does not beat the LLM-only baseline, say so and rework the engine before scaling it. This number decides whether the company exists (science/021-llm-forecasting.md, science/016-silicon-samples.md, business/093-precedents-and-failures.md, science/098-darpa-socialsim.md).

3. **Remove IPUMS from the product and the pitch now.** Build on GLOPOP-S aged forward with WPP, label the result "calibrated to published marginals", send the IPUMS, WVS, Pew and Gallup emails this week, and block any source whose licence is unknown (data/046-ipums-international.md, data/060-data-licensing-legal.md, data/057-global-synthetic-population.md).

4. **Rename the category.** Call it "a forecast and simulation API with a public score", not a world model or an ABM platform. Lead the page and the application with receipts above the globe (market/009-abm-commercial.md, market/012-funding-landscape-2026.md, engineering/100-world-model-sota.md).

5. **Pick one buyer and get one written commitment.** Choose consumer-brand and agency insights teams, run 10 calls, and bring an LOI or paid pilot from a named design partner other than Gallup to the application (market/014-who-buys.md, market/080-icp-product-teams.md, business/090-seed-comps.md).

6. **Make the engine archetype-first and distribution-first, with a spread audit that fails the run.** Hold the 100k agents as cheap state, make one LLM call per segment cell, and fail the run when the SD ratio against survey data leaves about 0.8-1.2. Do not make 100k independent persona calls (science/028-large-scale-llm-sims.md, science/019-calibration-methods.md, science/018-failure-modes.md).

7. **Get an external score you did not grade yourself.** Submit a baseline to ForecastBench and Metaculus MiniBench before Oct 27, for under $150 (market/006-ai-forecasting-companies.md, open-source/040-forecasting-tools.md).

8. **Make the daily question the panel engine.** Use a two-second vote with an instant reveal and log every answer with a timestamp and country. Measure day-7 return, and decide before launch what panel data stays proprietary (business/092-moat-theory.md, product/077-daily-question-mechanics.md).

9. **Set cost caps that fail closed.** Keep a per-call cost ledger. Free forks are signed-in only, with 200 agents and one member, cached by input hash. Add `max_cost` to `/v1/simulate` (business/089-unit-economics.md, market/013-api-pricing-benchmarks.md, engineering/074-abuse-and-safety.md).

10. **Publish a country tier on every output and headline only Tier A/B.** "Whole world" is credible only if you show where you are guessing (data/099-country-coverage-tiers.md, science/027-cross-cultural-llm-bias.md).

## What to cut before Nov 2

- **Opt-in twins.** They bring GDPR special-category exposure and evidence from one US sample (business/091-regulation.md, science/017-generative-agents.md).
- **The "100,000 agents" and "100+ languages" headlines.** GDELT translates 65 languages, and agent count is not the differentiator (data/050-gdelt.md, engineering/100-world-model-sota.md).
- **LLM-driven neighbour talk.** Keep a numeric rule, and drop it entirely unless it beats a no-neighbour null (science/023-opinion-dynamics.md).
- **A per-agent particle filter or EnKF.** Assimilate at segment level only (science/022-data-assimilation-abm.md).
- **Concordia, OASIS and AgentSociety as dependencies, and any AGPL code** (open-source/034-concordia.md, open-source/033-agenttorch.md).
- **Games, policy, campaigns and finance as revenue targets** (market/010-game-npc-ai.md, product/082-icp-political.md, market/015-alt-data-finance.md).
- **A native-language prompting rollout.** Run it as an A/B arm at most (engineering/073-multilingual-agents.md).
- **Subscription tiers and Product Hunt theatre.** Launch pay-as-you-go plus one Show HN pointing at a page that works without sign-up (product/084-launch-channels.md).
- **Any "beats the market" or "% accuracy" claim** (science/030-forecast-scoring.md, market/003-synthetic-research-vendors.md).

## What kills it

- The swarm never beats a plain LLM with search. The product then becomes a forecasting bot, against Mantic's lead.
- Simile or Aaru starts publishing a hashed record. Their brand plus a two-month-old record beats our three-week-old one.
- Data licences close and the population has to be described as "prior-driven" almost everywhere.
- No buyer pays for a forecast and the insights buyer chooses Simile's enterprise sales motion.
- A viral free-fork day without caps.
- The name. "Real World" is weak, and the notes did not verify the trademark (product/085-naming-trademark.md).

## The 3 numbers I will watch

1. **Swarm Brier minus LLM-only-baseline Brier, and minus market Brier, with n resolved and a day-block bootstrap CI.** By Nov 2 I expect a few dozen questions, which is too few to rank. I want the direction and an honest interval. The rough threshold for a claim is 100 or more resolved questions (science/030-forecast-scoring.md).
2. **Daily panel: unique respondents per day, country count, and day-7 retention without payment.** This is the only number that compounds into a moat (business/092-moat-theory.md).
3. **Buyers with a written commitment (LOI or paid pilot).** Zero on Nov 2 means this is a research project with a nice page.
