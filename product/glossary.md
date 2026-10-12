# Glossary

One definition per term. Specs, code comments and UI copy use these words with these meanings and do not redefine them. User-facing surfaces never use a word in the last column; `scripts/check_glossary.py` (in `make lint`) fails on one.

| Term | Meaning | Do not write |
| --- | --- | --- |
| Agent | One simulated person: a row of fixed traits (country, age band, sex, education, urban) and a belief per topic. Agents are numbers; the model is not called per agent. | persona, respondent, cohort |
| Segment | Agents sharing country, age band and education. The model is called once per segment, and agents draw from the segment's answer with their own offset. | subpopulation |
| Topic | One belief every agent holds, listed in `data/topics.csv` (for example `inflation_worry`). Stored on a logit scale, shown as a share from 0 to 1. | |
| World snapshot | The full agent table for one date, `var/snapshots/YYYY-MM-DD/agents.parquet`. Its id is the date. "Today's world" is the latest committed snapshot. | |
| Daily cycle | The seven steps that produce a snapshot and the day's forecasts: ingest, assimilate, forecast, publish, anchor, score, learn. | |
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
