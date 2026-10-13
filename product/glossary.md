# Glossary

One definition per term. Specs, code comments and UI copy use these words with these meanings and do not redefine them. User-facing surfaces never use a word in the last column; `scripts/check_glossary.py` (in `make lint`) fails on one.

| Term | Meaning | Do not write |
| --- | --- | --- |
| Agent | One simulated person: a row of fixed traits (country, age band, sex, education, urban) and a belief per topic. Agents are numbers; the model is not called per agent. | persona, respondent, cohort |
| Segment | Agents sharing country, age band and education, in the public record's engine. The model is called once per segment, and agents draw from the segment's answer with their own offset. | subpopulation |
| Customer segment | One of the 27 kinds of the founder's ideal customer in a message test: attitude to new products x price sensitivity x familiarity with the category, equally weighted ([message test](will-it-land.md)). | |
| Ideal customer | The founder's plain-words description of who buys, expanded into the 27 customer segments. | |
| Baseline | One plain Jev call per test with no segments, returned as `baseline_intent` and scored beside the engine. | |
| Topic | One belief every agent holds, listed in `data/topics.csv` (for example `inflation_worry`). Stored on a logit scale, shown as a share from 0 to 1. | |
| World snapshot | The full agent table for one date, `var/snapshots/YYYY-MM-DD/agents.parquet`. Its id is the date. "Today's world" is the latest committed snapshot. | |
| Daily cycle | The eight steps that produce a snapshot and the day's forecasts: ingest, assimilate, forecast, publish, anchor, score, learn, improve. | |
| Engine config version | One promoted set of tuned parameters (today, the recalibration map over `sim`), identified by the SHA-256 of its record and in force from a stated date ([decision 0008](../research/decisions/0008-self-improving-loop.md)). | |
| Signal | A signed push on one or more topics, extracted once from a news cluster or a fork event. | |
| Assimilation nudge | The per-segment shift that moves simulated beliefs toward an observed poll, sized by a Kalman gain since [decision 0005](../research/decisions/0005-assimilation-v2.md). Stored per segment, topic and day. | |
| Fork | A simulation that starts from a world snapshot, adds one event and runs forward N days. In the API a fork is a simulation job. | scenario, what-if |
| Ensemble member | One run of a fork with its own agent subsample and noise. Spread across members is the band we show. | |
| Spread | The p10-p90 range across ensemble members. Raw and uncalibrated until about 100 forecasts resolve; labelled that way. | |
| Coverage tier | A-D grade per country from the 0-100 rubric in [research/data/099](../research/data/099-country-coverage-tiers.md). Shown on every country, agent, forecast and result. | |
| Forecaster | A source of a probability for a question: `sim` (our population, blind to markets), `plain_llm` (one model reading the same news), `market` (price at commit). | |
| Receipt | A committed forecast: the entry, its salt, its leaf hash, and the day record it belongs to. | commitment |
| Day record | The date, the Merkle root of that day's leaves, the previous day's root and the protocol hash. | |
| Skill | Mean Brier difference between `sim` and one baseline over resolved questions, with n and an interval. Negative is better. | |
| Agent-day | One agent simulated for one day. Fork cost is shown in dollars; agent-days are its unit of work. | |
| Inclusion proof | The sibling hashes from one leaf up to the day's Merkle root; verifying it shows the leaf is in the day record. | |
| Reliability diagram | Forecasts binned by stated probability against the share that resolved yes; the diagonal is perfect calibration. | |
| Run log | The recorded steps, model calls, tokens and cost of one daily cycle, from `stage_runs` and `llm_calls`. | |
| Account | A person's free sign-in, made by email, holding their sessions and sealed message tests ([accounts](accounts.md)). | |
| Record | One account's sealed message tests with their marks, scored engine against baseline and gut ([track record](track-record.md)). | |
| Track record | The public hashed forecasts, receipts and scores the engine makes about real events every day; the proof behind the product, not the product. | |
| Backtest | Up to 10 messages a founder already shipped, each with what really happened, predicted by the engine and the baseline; labelled "Backtest: not on your record" and stored nowhere. | |
| Use case | A prepared simulator input for one real decision, in `web/src/usecases.ts`, grouped by who it serves. | |
| Message | What a founder tests: a launch post, a price line, a headline or an ad line, up to 500 characters. The user-facing word; the API keeps its field names (`text`, `posts`). | |
| Post test | One run of a message through the engine; on screen "Message test" for the ideal customer: would act across 27 customer segments, the baseline, objections, best and worst segments and a rewrite ([message test](will-it-land.md)). | |
| Would act | The share of simulated ideal customers that would sign up, try or buy because of a message, with its spread across the 27 customer segments. Uncalibrated until 100 marked tests. | |
| Seal | The SHA-256 of a stored post test's canonical JSON, made when the test is made; the database refuses changes to a sealed test. | |
| Gut | The person's own call on a post, "lands" or "flops", recorded before the result shows; the baseline the engine is scored against. | |
| Mark | The person's one-time, immutable record of how a sealed test really did: "landed" or "flopped", with an optional real metric and note. | |
| Call | A visitor's answer to the daily question, set against the AI's sealed `sim` forecast ([daily question](daily-question.md)). | |
| Anonymous allowance | Forks a visitor without an account may start per address per UTC day (`FORK_ANON_PER_DAY`). | |
| Replay | Re-running a step on the recorded model outputs in `llm_calls`; a differing result is shown as a diff. | |
