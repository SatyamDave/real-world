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

# Email sign-in and sessions (product/accounts.md, research/engineering/106).
SIGN_IN_TTL_MINUTES = 15
SIGN_IN_CODE_ATTEMPTS = 5
SIGN_IN_PER_EMAIL_PER_HOUR = 5
SIGN_IN_PER_ADDRESS_PER_HOUR = 20
SIGN_IN_WRONG_CODES_PER_ADDRESS_PER_HOUR = 20
SESSION_DAYS = 30
EMAIL_TIMEOUT_S = 10

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

# Decision 0008 and experiments/E008. Judgments, not measurements: E008 tests the false promotion
# rate they give on a calibrated forecaster.
IMPROVE_MIN_TRAIN_QUESTIONS = 50
IMPROVE_HOLDOUT_QUESTIONS = 30
IMPROVE_MARGIN_BRIER = 0.005
IMPROVE_L2 = 0.01

GDELT_TIMEOUT_S = 60
NEWS_TITLES_PER_THEME = 5

EVENT_TEXT_MAX_CHARS = 500

# Message tests (product/will-it-land.md). Provisional caps until decisions-needed item 7.
# TEST_MAX_COST_USD holds one test at TEST_AGENTS_MAX, or a backtest of TEST_BACKTEST_MAX
# messages at TEST_AGENTS_DEFAULT, with every text at its longest, on Jev prices (under $0.00002
# a call); anything dearer is refused before any call.
TEST_MAX_COST_USD = 0.25
TEST_SEGMENTS = 27
TEST_AGENTS_DEFAULT = 1080
TEST_AGENTS_MAX = 10_800
TEST_AGENT_WORKERS_DEFAULT = 32


def test_agents() -> int:
    """Simulated consumers per test, from RW_AGENTS: a multiple of TEST_SEGMENTS up to
    TEST_AGENTS_MAX, split evenly over the segments. Anything else raises, so a bad setting stops
    the API at startup instead of running a different panel."""
    raw = os.environ.get("RW_AGENTS", str(TEST_AGENTS_DEFAULT))
    n = int(raw) if raw.strip().isdigit() else -1
    if not (TEST_SEGMENTS <= n <= TEST_AGENTS_MAX and n % TEST_SEGMENTS == 0):
        raise ValueError(
            f"RW_AGENTS={raw!r}: use a multiple of {TEST_SEGMENTS} from {TEST_SEGMENTS}"
            f" to {TEST_AGENTS_MAX:,}"
        )
    return n


def test_agent_workers() -> int:
    """Jev calls in flight at once, from RW_AGENT_WORKERS (1 to 256)."""
    raw = os.environ.get("RW_AGENT_WORKERS", str(TEST_AGENT_WORKERS_DEFAULT))
    n = int(raw) if raw.strip().isdigit() else -1
    if not 1 <= n <= 256:
        raise ValueError(f"RW_AGENT_WORKERS={raw!r}: use 1 to 256")
    return n


TEST_ANON_PER_DAY = 20
TEST_BACKTEST_MAX = 10
TEST_BACKTEST_BUCKETS = 5
TEST_BACKTEST_RANK_MIN = 3
TEST_VOICE_MAX_OUTPUT_TOKENS = 80
TEST_REWRITE_MAX_OUTPUT_TOKENS = 120
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
