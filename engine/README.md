# engine

The Python package `rw`: the simulation engine behind the daily cycle, forks and the receipts ledger. What it must do is specified in [product/world.md](../product/world.md), [product/benchmark.md](../product/benchmark.md) and [product/receipts.md](../product/receipts.md); how it is split into modules is in [decision 0001](../research/decisions/0001-architecture.md).

## Modules so far

| Module | What it does |
| --- | --- |
| `rw/settings.py` | Every tunable number (model, prices, budgets, caps, sizes) in one file. `rw_home()` is where local state lives: `var/`, or `$RW_HOME`. |
| `rw/db.py` | `connect()` opens `$RW_HOME/rw.sqlite` with foreign keys on and applies every `rw/sql/*.sql` in name order. `apply(conn, path)` applies another schema file. |
| `rw/llm.py` | The only way to call a model. `complete_json(purpose, prompt, schema, budget, max_tokens)` returns a dict that matches the JSON schema. |
| `rw/sources.py` | `require(source_id)` refuses any data source in `data/sources.csv` that is not cleared for commercial use, unless it is a fixture. |
| `rw/policy.py` | `screen(text, conn, today)` checks a fork event against [product/acceptable-use.md](../product/acceptable-use.md): a regex rule pass, then one `screen` classification through `complete_json` with its own `SCREEN_MAX_COST_USD` budget. Returns a `PolicyRefused(code, detail)` or `None`; a classifier that cannot run raises. A classifier refusal counts only when its quote appears in the event, so the fake model never refuses. |
| `rw/beliefs.py` | The only operators that change agent beliefs: `update_beliefs`, `nudge`, `kalman_update`, `spread_audit`. Pure numpy, no model calls. |

## The model gateway

- Two entry points, one per kind of call ([decision 0007](../research/decisions/0007-jev-and-open-model.md)). `decide(purpose, state, questions, budget)` asks Jev typed questions (`noul`, `choice`, `score`) and returns its raw answers, probabilities and confidence included; forecasts and news signals use it. `complete_json(purpose, prompt, schema, budget, max_tokens)` asks an open-weight model for JSON that matches a schema; the acceptable-use screen and the agent account use it.
- `decide` goes to Jev pinned at `settings.JEV_MODEL` with `TYPESAFE_API_KEY`, or to `settings.JEV_OPENROUTER_MODEL` through OpenRouter with `OPENROUTER_API_KEY`. A response from any other model version is refused. Jev bills input tokens only.
- `complete_json` goes to `settings.TEXT_MODEL` on OpenRouter with `OPENROUTER_API_KEY`, or to any OpenAI-compatible server at `RW_TEXT_BASE_URL` (for example Ollama at `http://localhost:11434/v1` with `RW_TEXT_MODEL=mistral-small3.2`, no key).
- Without a key, `FakeLLM` answers both. It fills the schema or the questions from a random generator seeded by the SHA-256 of the prompt, so the same prompt always gets the same answer and tests never need a network.
- Every provider call writes one `llm_calls` row: prompt, output, tokens and cost. A call whose provider, model, schema and prompt match an earlier row returns the stored answer and writes nothing, which makes reruns free.
- A `Budget(limit_usd, spent_usd)` is checked before every provider call. If the spend plus the estimate (prompt characters / 4 input tokens, plus `max_tokens` output, at the settings prices of the model it calls) would cross the limit, it raises `BudgetExceeded` and nothing is written. A zero, negative or NaN limit always refuses.
- `spent_today()` sums today's (UTC) recorded cost.

## Beliefs

Beliefs are logits in an `(n_agents, n_topics)` array `B`; `B0` is each agent's fixed anchor and `s` its stubbornness in [0, 1]. Each operator returns a new array.

| Operator or knob | What it does |
| --- | --- |
| `update_beliefs(B, B0, s, signal, exposed)` | One day: exposed agents move by `clip(signal * (1 - s), ±STEP_CAP_LOGIT)`, then every agent moves `ANCHOR_PULL * (B0 - B)` back toward its anchor. |
| `nudge(B, group_ids, targets, cap)` | For each `(group, topic) -> observed share`, shifts the whole group by `logit(share) - group mean logit`, capped at `cap`, and returns a `Nudge(group_id, topic_index, wanted, applied)` record per nudge. |
| `kalman_update(B, C, P, group_ids, targets, walk_sd)` | Assimilation v2 ([decision 0005](../research/decisions/0005-assimilation-v2.md)): for each `(group, topic) -> (observed share, error SD in logit)`, a scalar Kalman update of the group mean. `P` grows by `walk_sd**2` each day and is raised to `innovation**2 - R` when that is larger; the whole group and its anchor offset `C` move by `K * innovation` with `K = P / (P + R)`. Returns the same `Nudge` records, with `applied` the increment. |
| `spread_audit(B, country_ids, survey_sd)` | For each `(country, topic) -> survey SD`, returns `AuditRow(country, topic_index, sim_sd, survey_sd, ratio, in_band)`; a collapsed country has ratio 0 and is out of band. |
| `STEP_CAP_LOGIT` (0.5) | Largest move one day of news can cause on one topic, so one headline cannot flip an agent. |
| `ANCHOR_PULL` (0.05) | Share of the gap to the anchor closed each day; with no news an agent's distance to its anchor shrinks by `(1 - 0.05)^7`, about 0.70, per week. |
| `ASSIMILATION` (`kalman`) | Which operator the daily cycle uses, `kalman` or `nudge`; `kalman` beat persistence in [E006](../experiments/E006/results/2026-10-12-none/RESULTS.md). |
| `KALMAN_WALK_SD_LOGIT` (0.05), `KALMAN_PRIOR_SD_LOGIT` (1.0) | Daily random-walk SD of a group mean and the starting SD; neither is measured on real polls ([note 102](../research/engineering/102-assimilation-v2.md)). |
| `POLL_ERROR_FACTOR` (2.0) | A poll's logit error SD is this times its sampling SD, from US election polls ([note 102](../research/engineering/102-assimilation-v2.md)). |
| `NUDGE_CAP_LOGIT` (0.3) | Largest shift one poll can apply to a group's mean in one day, when `ASSIMILATION` is `nudge`. |
| `SPREAD_BAND` (0.8, 1.2) | Allowed range of simulated SD over survey SD; outside it the country is marked experimental. |

## Daily cycle runbook

`rw/daily.py` is the only place the day's steps are composed. Each step records `(date, step, status, started_at, finished_at, detail)` in `stage_runs` and is skipped once it is `ok`, so rerunning a day is free and a crashed run resumes at the step that failed. A `stage_runs` made before the `anchor` step has a `CHECK` on `step` that refuses it; `run` rebuilds that table once, keeping its rows.

| Step | What it does |
| --- | --- |
| `ingest` | `news.ingest_day`: polls become observations, each news cluster becomes one signal call. With `--news live`, the news is the day's GDELT GKG instead of the fixture and no fixture polls are read (see below). |
| `assimilate` | Loads the previous day's snapshot (or samples a fresh `WORLD_AGENTS` world on the first day), applies the day's signals through `news.exposure` and `beliefs.update_beliefs` with the anchor `b0 + c`, moves each polled country toward the day's polls with `beliefs.kalman_update` (or `beliefs.nudge`), writes `var/snapshots/<date>/agents.parquet` with the offset `c_<topic>` and variance `p_<topic>` columns, and records each move in `nudges`. No market price is read. |
| `forecast` | `forecast.forecast_day`: sim, plain-LLM and market forecasts for every open question. |
| `publish` | `ledger.commit_day` with a `protocol` entry when the protocol hash is new, a `question_set` entry when the question file hash is new, and one 0002-format `forecast` entry per forecast row, carrying `snapshot_sha256` and the `config_hash` of `settings.py`, then writes the day's export to `var/receipts/<date>.json` with `ledger.export_day`. |
| `anchor` | Sends the day's record hash to `settings.TSA_URL` and `settings.OTS_CALENDAR_URL` through `ledger.anchor_day` and stores each proof. It only records what already happened, so a failure marks the step `failed` with the reason and the run goes on to `score` and `learn`; a rerun retries it, and a day already `anchored` sends nothing. A fixture day (`ledger.is_fixture`, the rule in [product/world.md](../product/world.md)) is not sent, whatever the flags: the step is `ok` with `skipped` in `detail`. `scripts/mirror_receipts.sh` asks the same rule through `python -m rw.ledger fixture <receipts>`. |
| `score` | Records outcomes resolved on or before the date in `resolutions`, then scores every committed forecast entry on a resolved question into `scores`. |
| `learn` | Spread audit against the survey SD in `data/sample/attitudes.csv` into `audits`, one `country_status` row per country (experimental when any topic is outside `SPREAD_BAND`), and the five biggest sim misses in the step's `detail`. |

```
make daily DATE=2026-10-01                               # one day, every step not yet ok
uv run python -m rw.daily --date 2026-10-01 --step learn # one step
make daily-fixtures                                      # the five fixture days in order
```

### Live news

```
uv run python -m rw.daily --date 2026-10-11 --news live  # a past UTC day's real news
RW_LIVE_TESTS=1 uv run pytest engine/tests/test_news_live.py -k live  # fetch yesterday once
```

- `news.fetch_gdelt_day(date)` passes `sources.require("gdelt")`, then downloads the 96 fifteen-minute GKG 2.1 files of that UTC day from `data.gdeltproject.org` with stdlib `urllib` (`GDELT_TIMEOUT_S` per file).
- It keeps an article when its locations name one of the 16 countries (GKG uses FIPS codes, mapped in `news.FIPS_TO_ISO3`) and its themes include one of `news.GKG_THEMES`. No AI theme appeared in six GKG files sampled from 2026-10-11, so `TECH_AUTOMATION` stands in for the fixture's `TECH_AI`; the fixture's `TAX_FNCACT` is dropped because GKG tags actor roles with it in almost every article.
- Articles with the same title are one row: `num_sources` counts distinct outlets, `tone` is the mean GKG tone. Each country and theme keeps its `NEWS_TITLES_PER_THEME` most-sourced titles.
- It writes `var/news/<date>.csv` in the fixture columns, all at once, and ingest reuses that file on a rerun.
- A missing slot, an HTTP or network error, or a day with no kept rows raises `news.NewsUnavailable`: the `ingest` step fails, nothing forecasts, and the CLI exits 1.
- A run for 2026-10-11 on 2026-10-12 took 21 s and kept 672 rows across all 16 countries (36 to 45 rows each), 48 clusters.

### Live questions

```
uv run python -m rw.daily --date 2026-10-14 --questions live  # the approved lists in data/questions
```

- `forecast.question_sets("live")` reads every `data/questions/*.json` and raises `forecast.ListNotApproved` unless each file is an object with `"status": "approved"`; an empty folder is refused too. The CLI checks this before any step runs and exits 1 (lifecycle in [data/questions/README.md](../data/questions/README.md)).
- `publish` commits one `question_set` entry per list, hashed over the file's bytes, the first day that hash appears.
- Fixtures stay the default, and `--fixtures` refuses `--questions live`.
- The live lists carry no market price (`market_source` is empty), so `forecast` stops at the market lookup until a forecast path without one is decided ([decisions-needed](../company/decisions-needed.md) item 4).

Each day prints five lines: the steps that ran; model calls, forecasts committed and the day's root hash; the cost (`fake model, nothing spent` on a keyless run, with the estimate); questions scored and countries marked experimental; and the anchor status: `Anchored <time> UTC by freetsa.org`, `Anchor pending: OpenTimestamps proof awaits a Bitcoin block` or `Not anchored: <reason>`. Fixture days always print `Not anchored: fixture days are not sent to public timestamp servers`, and `python -m rw.ledger anchor` refuses them too.

- The nightly budget is `NIGHTLY_BUDGET_USD` minus `llm.spent_today()`. `BudgetExceeded`, or any other error outside `anchor`, marks the step `failed` and stops the run; the CLI exits 1. Rerun the same command once the cause is fixed.
- To see what happened: `SELECT * FROM stage_runs WHERE date = '2026-10-01'` in `var/rw.sqlite`; `detail` holds the step's counts or its error.
- To check a day's receipts: `uv run python -m rw.ledger verify --date 2026-10-01`.
- To anchor a committed live day by hand: `uv run python -m rw.ledger anchor --date 2026-10-01`, or `uv run python -m rw.daily --date 2026-10-14 --step anchor`. It sends only the day's record hash to `settings.TSA_URL` and `settings.OTS_CALENDAR_URL`, prints `anchored <time>`, `pending` or `not_anchored`, and exits 1 if either service failed; rerun it to retry the one that failed.

## Test

```
uv run pytest engine/tests -q
```

Tests run with the fake model and a temporary `RW_HOME`.
