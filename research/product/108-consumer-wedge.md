# The consumer wedge: what makes people use and believe a simulation

- Date: 2026-10-13
- Area: product
- Confidence: medium. The TypeSafe, MiroFish and Rally facts were read on primary or first-hand pages; prediction-market user counts conflict across sources, though the sports-led trend agrees; the fit of the two products below is an inference to test with users.

## Answer

People do not adopt "a simulation of the world"; they adopt a fast answer to their own decision, and they believe it after watching it be right about something they care about. Real World should sell two jobs on the existing engine: "Will this land?" (test a post on a simulated audience before publishing, then mark how it did) and "Call it" (call today's question against the AI, whose forecast is sealed first). Each person's sealed calls become their own proof, and onboarding proves the engine on posts they already published before asking them to trust a new one.

## Findings

**TypeSafe sold an engine through proof and distribution, not a consumer app.** Jev is a developer API ("System One models"), launched 15 Sep 2026 with demos that prove the claim in seconds (a Doom bot at about 10 decisions a second for about $7 an hour, Wikiracing, Pong) ([TypeSafe blog](https://typesafe.ai/blog/introducing-system-one-models-and-jev)). Vercel, Cloudflare, LangChain and Langfuse integrated it within three days, and about 13% of Vercel's paid teams used it by hour 24 ([Startup Fortune](https://startupfortune.com/typesafe-ais-decision-model-jev-becomes-vercels-fastest-adopted-launch/)). New accounts got $5 of credit ([The Rundown](https://www.therundown.ai/news/typesafe-jev-ai-decisions-software)). Detail on Jev itself: [market/004](../market/004-jev-typesafe.md).

**A generic "simulate any scenario" app does not hold users.** MiroFish, an iPhone app that turns a headline or scenario into a simulated report, charges $4.99 a week or $39.99 a year and shows 34 ratings; its one written review says it has "zero ability to even understand most scenarios" ([App Store](https://apps.apple.com/us/app/mirofish-ai-simulation-engine/id6763250301), read 2026-10-13).

**A specific decision with visible reasons converts people.** On Every's podcast, Rally's roughly 100 AI personas tested headline options; Dan Shipper changed his choice after reading the personas' reasons. No accuracy validation or user count was reported ([Every](https://every.to/podcast/100-ai-personas-said-you-d-click-this)).

**Testing a post on a simulated audience is a live category, mostly B2B.** Artificial Societies' Reach predicts LinkedIn post performance and reports over 80% accuracy in its own comparison against 62.5% for other LLMs, a vendor figure ([aiworld](https://aiworld.eu/story/artificial-societies-simulates-human-audiences-for-pre-launch-testing)). Synthetiq lets creators test posts on a simulated audience and is described as early ([Product Hunt](https://www.producthunt.com/posts/synthetiq)).

**Mass demand is for "what happens next" on things people care about.** Across six apps Apptopia studied, daily users in June 2026 were nearly four times the prior June, with Kalshi at 38% of that audience and Polymarket at 13% ([DeFi Rate](https://defirate.com/?p=15627)); sports drove about 80% of Kalshi's volume ([pm.wiki](https://pm.wiki/data/volume-index)). Gen Z and Millennials know the markets better than older adults ([Decrypt](https://decrypt.co/es/356087/generacion-z-apuesta-mercados-prediccion-polymarket-kalshi)). User counts disagree between sources.

**Trust in AI answers is middling and younger people trust more.** 13% completely trust AI responses, 36% somewhat, 30% are neutral and 21% distrust; Millennials and Gen Z are over 75% more likely than baby boomers to completely trust AI ([Klaviyo](https://www.klaviyo.com/de/marketing-resources/ai-consumer-trends-2026)). Method not stated.

**AI forecasts beat the public, not experts.** In 2025 the best model scored a Brier of 0.101 against superforecasters' 0.081, and the median public forecast fell from second to 22nd on the leaderboard ([FRI](https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark), [ForecastBench](https://arxiv.org/pdf/2409.19839)).

**Spectators are not retained; people with a stake are.** Smallville spread through one surprising story, Polis kept participants who had a stake and a sponsor, and no simulation product we found retained people who only watched ([product/076](076-viral-simulations.md)).

## What it means for Real World

- For the product: one job per screen. "Will this land?" is frequent and personal, and its outcome is known within days, so each test can be sealed and later marked. "Call it" reuses the daily question and the sealed `sim` forecast as an opponent. A free-form "what if" box repeats MiroFish's failure, so forks stay in the engine and API.
- For the engineering: the engine already models segments of real populations, extracts a typed signal per segment through one decision call and writes agent accounts in the open text model. A post test is one decision call per segment plus a few short accounts; sealing is a SHA-256 over the canonical call at the moment it is made.
- For the business: creators pay for a tool they use before every post; the free Call it game and the public record carry acquisition and trust. The B2B pilot and builders program wait.

## Recommendations

1. Ship "Will this land?" as the home: paste a post, pick an audience, record your gut, get the simulated reaction, best and worst segments, two simulated accounts and one rewrite; seal the call.
2. Let a person mark each sealed post test "landed" or "flopped" once, and show their record: hits, Brier, and their gut against the engine.
3. Onboard with a retrospective check on up to five posts the person already published, labelled "Retrospective: not on your record".
4. Reframe the daily question as "Call it" against the AI, with the AI's sealed leaf hash shown before the person answers and a running you-against-the-AI record after.
5. Keep the receipts and scores pages open as the public proof, linked from every result.

## Open questions

- Does "landed" need a number (likes against the person's median) rather than their own judgment? Test with ten creators.
- Which audience presets do creators want first (countries, ages)? Ask the same ten.
- Does the engine's segment reaction track real engagement at all? Measure on the first 100 marked post tests, against the person's gut as the baseline.

## Sources

- https://typesafe.ai/blog/introducing-system-one-models-and-jev
- https://startupfortune.com/typesafe-ais-decision-model-jev-becomes-vercels-fastest-adopted-launch/
- https://www.therundown.ai/news/typesafe-jev-ai-decisions-software
- https://apps.apple.com/us/app/mirofish-ai-simulation-engine/id6763250301
- https://every.to/podcast/100-ai-personas-said-you-d-click-this
- https://aiworld.eu/story/artificial-societies-simulates-human-audiences-for-pre-launch-testing
- https://www.producthunt.com/posts/synthetiq
- https://defirate.com/?p=15627
- https://pm.wiki/data/volume-index
- https://decrypt.co/es/356087/generacion-z-apuesta-mercados-prediccion-polymarket-kalshi
- https://www.klaviyo.com/de/marketing-resources/ai-consumer-trends-2026
- https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark
- https://arxiv.org/pdf/2409.19839
