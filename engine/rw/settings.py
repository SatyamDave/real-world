"""Every tunable number in the engine. Change a value here, not in the module that reads it."""

import os
from datetime import date
from pathlib import Path

# Decision 0007. Prices are (input, output) USD per million tokens. Jev bills input only
# (docs.typesafe.ai/models). The text price is the dearest OpenRouter host of the model on
# 2026-10-12, so the budget never undercounts whichever host answers.
JEV_MODEL = "jev-1.13.0"
JEV_OPENROUTER_MODEL = "typesafe/jev-1.13"
JEV_PRICES = (0.042, 0.0)
TEXT_MODEL = "mistralai/mistral-small-3.2-24b-instruct"
TEXT_PRICES = (0.10, 0.30)
TYPESAFE_BASE_URL = "https://api.typesafe.ai"
OPENROUTER_JEV_BASE_URL = "https://openrouter.ai/api"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_TIMEOUT_S = 30

NIGHTLY_BUDGET_USD = 25.0
FORK_MAX_COST_USD_DEFAULT = 0.50
FORK_MAX_COST_USD_LIMIT = 5.00
# Public spend per UTC day (forks, their screens and agent accounts), kept apart from
# NIGHTLY_BUDGET_USD so forks never starve the daily run. Both this and FORK_ANON_PER_DAY are
# provisional until the founder decides the free fork allowance (company/decisions-needed.md, 7).
FORK_DAILY_BUDGET_USD = 10.0
FORK_ANON_PER_DAY = 20

WORLD_AGENTS = 10000
WORLD_SEED = 20261011

FORK_AGENTS_DEFAULT = 200
FORK_AGENTS_MAX = 5000
FORK_DAYS_DEFAULT = 7
FORK_DAYS_MAX = 14
FORK_MEMBERS_DEFAULT = 5
FORK_MEMBERS_MAX = 20
# A segment is reported as a top shift only when it holds at least this share of the sample:
# the segment-size floor from research/product/082-icp-political.md.
TOP_SHIFT_MIN_SHARE = 0.05

DAILY_FORECAST_MEMBERS = 5
PLAIN_LLM_SAMPLES = 5
HEADLINES_PER_QUESTION = 8
# Keeps logit finite when the model answers exactly 0 or 1.
P_EPS = 1e-4

STEP_CAP_LOGIT = 0.5
ANCHOR_PULL = 0.05
NUDGE_CAP_LOGIT = 0.3
# Decision 0005 and experiments/E006 results. The walk SD equals the E003 generator's and the
# prior SD is a judgment: neither is measured on real polls yet.
ASSIMILATION = "kalman"
KALMAN_WALK_SD_LOGIT = 0.05
KALMAN_PRIOR_SD_LOGIT = 1.0
POLL_ERROR_FACTOR = 2.0
SPREAD_BAND = (0.8, 1.2)
ATTENTION_HALF_LIFE_DAYS = 1.0

# Decision 0006 and experiments/E007. Judgments, not measurements: E007 tests the false promotion
# rate they give on a calibrated forecaster.
IMPROVE_MIN_TRAIN_QUESTIONS = 50
IMPROVE_HOLDOUT_QUESTIONS = 30
IMPROVE_MARGIN_BRIER = 0.005
IMPROVE_L2 = 0.01

GDELT_TIMEOUT_S = 60
NEWS_TITLES_PER_THEME = 5

EVENT_TEXT_MAX_CHARS = 500
LLM_MAX_OUTPUT_TOKENS = 300
TRACE_AGENTS = 10

SCREEN_MAX_COST_USD = 0.01
SCREEN_MAX_OUTPUT_TOKENS = 100
# US midterms 2026-11-03: from 7 days before (research/engineering/074, recommendation 6) through
# the day after, so late counts are covered. Both ends inclusive, in UTC.
ELECTION_WINDOW = (date(2026, 10, 27), date(2026, 11, 4))

TSA_URL = "https://freetsa.org/tsr"
OTS_CALENDAR_URL = "https://a.pool.opentimestamps.org"
ANCHOR_TIMEOUT_S = 30

ENGINE_VERSION = "0.1.0"
API_VERSION = "2026-10-27"


def rw_home() -> Path:
    return Path(os.environ.get("RW_HOME", "var"))
