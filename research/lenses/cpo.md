# CPO lens: what Real World ships on Oct 27, and what it does not

- Date: 2026-10-11
- Seat: CPO (users, first 60 seconds, retention loop, API ergonomics, cuts, PM/engineer specs)
- Confidence: medium. The notes agree on the product shape. The weak spots are untested: whether people return daily to a forecast with a delayed payoff, and what a fork really costs per run.

## Verdict

The product on Oct 27 is three things: a daily question you can answer in two seconds, a receipts page that proves we published before outcomes existed, and a fork button that returns a shareable card. The globe, the 100k agents and the "whole world" claim are the backdrop, not the product. Every note that looked at trust, virality or launch reached the same answer independently. People trust a public record scored against a baseline, not agent chat (product/087). People share a one-sentence setup with a surprising result, not scale (product/076). Show HN rewards one live question with no signup and ignores methodology (product/084). We have 16 days. If a feature does not serve the daily question, the receipts page, the fork card or `POST /v1/simulate`, it does not ship. The engine can stay rough behind those four surfaces. The surfaces cannot.

## Evaluation

**Users.** Three user types will show up in the first two weeks, and only one pays. Curious visitors from HN and X arrive first. They want something to do in under a minute, and they leave if they hit a signup wall or a spinner. Forecasting and market-data builders come next (Metaculus bot builders, ForecastBench entrants, quants who are curious). They judge us on the API quickstart and the receipts. Paying buyers are insights teams at brands and agencies who run message, price and concept tests (market/014, product/080). They will not convert inside 22 days. For them, the record and the API shape are the sales material. Policy units, campaigns and game studios are out (product/081, product/082, market/010, product/083). Newsrooms are a free distribution partner, not a customer.

**The first 60 seconds.** The plan as written opens on a live globe of 100k dots. That is the wrong first screen. At world zoom 100k points blur into a blob (open-source/041), a globe asks nothing of the visitor, and Project Sid showed that spectacle without participation does not hold anyone (product/076). The first screen should be today's question with a slider, before any number is shown. After submit, the visitor sees an instant reveal within one second: you vs the human crowd vs the simulated world vs the market price (product/077). Below that is a strip of the last ten receipts, each with a hash, the time it was committed, our probability, the market price and the outcome. Below that is "Fork today's world" with three prefilled events, all cached, so the first fork returns in seconds. The globe renders behind all of this as aggregated country or hex cells. Clicking a cell opens one agent.

**Daily retention loop.** This is the only retention mechanism in the plan. It needs a fast reward (the reveal) and a slow one (the score). For the first month, questions must resolve in 1-7 days, or nobody sees a score before they churn (product/077). The streak counts days submitted, not days scored well, with one freeze a week. It is derived from forecast rows and never stored as a counter. Every submission also feeds the human panel, which is the one data asset that compounds (business/092). Treat the panel as the moat metric, not as an engagement vanity number.

**API ergonomics.** The research converges on a narrow async job: 202 plus a job id, poll or a resumable SSE stream, an Idempotency-Key, a date-pinned version header, and one JSON Schema contract that generates both SDKs (engineering/069, open-source/045, product/078). The ergonomic risk is cost surprise, not shape. A 7-day ensemble over the full population costs hundreds of dollars (market/013, engineering/061), so every call must show its price before it runs and fail closed above a cap.

**Where the plan is weakest from my seat.** "Click any agent to ask why" is presented as a trust feature. The evidence says the opposite: model self-explanations often misstate the real cause, and fluent explanations inflate confidence (product/087). It stays, but rebuilt as described in decision 4 below. The "whole world" claim is the other weak spot. Most countries have stale census data, no markets and translated-only news (data/099), and every model tested flattens toward Western values (science/027). The UI has to show this or the first critic will.

## Top 10 decisions, in priority order

1. **Receipts page first, and it is the home page for skeptics.** Each row shows the question, hash, commit time, our probability, the market price at commit, the outcome, Brier, and running skill vs market with n. It also shows the persistence and plain-LLM baselines next to ours. State that a constant 50% scores 0.25. Never show one pooled number. The first hashed forecast goes out this week, because the record cannot be backfilled (product/087, science/030, engineering/070, business/093, product/084).

2. **The daily question is the core loop.** One question, a 0-100 slider, the instant four-way reveal, a share grid of 7 squares plus a receipt link, and streaks by submission. It is free and needs no sign-in to answer. Sign-in is asked for only to keep a streak. Each question freezes its resolution source and tie-break rule in the hash before it is published (product/077, product/076, business/092).

3. **The fork card is the share artifact, and its design comes before the globe's.** It carries one setup sentence, the top three segment shifts, the ensemble band with a one-line meaning, and a stable replay URL with a server-rendered OG image. The three prefilled forks are precomputed nightly. The first fork result appears in under 30 seconds, and in under 5 for prefilled ones (product/076, engineering/071, engineering/072).

4. **"Ask why" becomes two labelled panels.** "What moved this agent" is built from our structured trace: belief deltas, the news items that reached this agent, and segment nudges. "In its own words" is model text, labelled "simulated account, not the cause". The trace is stored as data and the narrative is generated from it, never the reverse (product/087, science/018, engineering/065).

5. **Ensemble spread is the default visual everywhere, including the API.** There is never a bare point estimate. Each band carries one sentence of meaning. Every output also carries a confidence class from past error by topic and region, which reads "no track record yet" while n is small (market/001, market/002, engineering/066, science/022).

6. **Coverage tier on every country, agent and forecast.** Use the 0-100 rubric with tiers A-D. Headline claims are made only for tiers A and B. Tiers C and D are labelled prior-driven, with wider bands. Per-tier Brier goes on the receipts page so the claim can be checked (data/099, science/027, open-source/037).

7. **`POST /v1/simulate` v1 is frozen by Oct 20.** It is async 202, with poll plus SSE, Idempotency-Key, `Real-World-Version`, and one JSON Schema 2020-12 contract that generates Pydantic and zod types with a CI drift check. Every result carries `simulated: true`, `world_snapshot_id`, model, seed, ensemble size, coverage tier, sources, cost and a content hash. There are no webhooks and no batch endpoint (engineering/069, open-source/045, engineering/074, business/091, data/060).

8. **One meter, pay as you go, fail closed.** Meter agent-days times ensemble members, shown as credits. There is a no-card monthly free credit, an `estimate` endpoint, a `max_cost` field on every call, and a refusal when the estimate exceeds the cap or the balance. Anonymous visitors get only the cached prefilled forks. A free custom fork is capped by our dollar cost (about $0.50) and the engine sizes the sample to fit, so the cap is set in money and not in agent count. There are no subscription tiers until we have usage data. This settles the conflict between the $49 Pro plan (product/079) and pay-as-you-go (market/013, product/078) in favour of pay-as-you-go (business/089, engineering/062).

9. **The launch is Show HN pointing at the live daily page with no signup.** Use a plain title, have a founder on the thread for hours, and never ask for upvotes. Ten hand-picked builders each ship one demo by Oct 25. Python and TS SDKs, OpenAPI and `llms.txt` ship on day one. After launch, do one named post a week for four weeks (product/084, product/086, product/078).

10. **One spec format that PM and engineer share.** Each surface (daily question, receipts, fork, simulate API) gets one `specs/<surface>.md` with five fixed headings: user and job, what they see (copy literally), the contract (a link to the JSON Schema or table, never prose), what "works" means as a checkable test, and what is out of scope. The JSON Schema is the single source of truth for fields. The PM owns the copy and the "works" line, and the engineer owns the contract. A glossary of about ten terms (agent-day, world snapshot, fork, ensemble member, receipt, skill, coverage tier, assimilation nudge) lives in one file, and no spec may redefine a term. Hard-to-reverse choices (hash format, scoring rule, meter unit) go to `decisions/`. The PR template asks what changed, why, how we know it works, and the risk to the nightly run and to published forecasts, and CI enforces it (engineering/075, market/009, open-source/044).

## What to cut

- **Opt-in twins.** Consent, deletion and GDPR Art. 9 work for a US-only gain of about 9 points. Write the waitlist copy only (science/017, business/091).
- **A raw 100k-dot globe as the first screen.** Show aggregated cells, with one agent fetched on click (open-source/041).
- **Native-language agent prompting.** Keep a `prompt_lang` field and run the A/B after launch (engineering/073).
- **The `concept_test` output type.** Hold it until the buyer interviews say it is worth building (product/080).
- **The hosted MCP endpoint, webhooks, batch endpoints, teams and seats, the dashboard, and the Pro subscription** (product/078, engineering/069).
- **Leagues, friend streaks and push notifications.** Add them only after a week of streak data (product/077).
- **Any game-studio, campaign or policy sales motion.** The acceptable use policy goes up instead (market/010, product/082).
- **Every accuracy percentage and every "beats the market" claim.** We publish skill vs market with n and nothing else (market/003, science/021).
- **The 100+ languages claim.** GDELT translates 65, so say 65 (open-source/042).
- **The "Real World" bare name in anything permanent.** Keep the display name and base URL in one config until the trademark check clears (product/085).

## The three numbers I will watch

1. **First-minute activation:** the share of new visitors who submit the daily question or open a fork card within 60 seconds of landing. Below 30% means the first screen is wrong, and nothing else matters until it is fixed.
2. **Day-7 return of daily-question players:** the share of people who submitted on day 0 and submit again on any of days 6-8. This number tells us whether the panel moat exists. It also tells us whether the delayed payoff kills the habit (business/092, product/077).
3. **Resolved hashed forecasts, with skill vs market and its interval:** one number with its n beside it, refreshed daily. This is what goes in the YC application. It must be honest even when the skill is negative (science/030, product/087).
