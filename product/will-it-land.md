# Message test (was "Will this land?")

## What it does

The message test of the [simulator](playground.md) (`/simulate`, or the message box on `/`), for founders who sell to consumers (decision [0016](../research/decisions/0016-icp-audiences.md)). You say what you are building in one line, describe your ideal customer in plain words, paste a message of up to 500 characters (a launch post, a price change, a headline, an announcement), and say what your gut expects: "It lands" or "It flops". "Test my message" returns, in a few seconds:

- **Would act**: the share of simulated ideal customers who would sign up, try or buy because of it, with its spread across the 27 segments (p10 to p90) and "Uncalibrated: simulated from your description, not real customers".
- **A plain baseline**: what one prompt with no segments says, so the two can be compared.
- **Reaction mix**: ignore, read, like, share, as shares that add to 100%.
- **Objections**: what stops them (price, trust, no clear need, bad timing, switching cost, unclear message, none), as shares.
- **Segments**: 27, every combination of attitude to new products, price sensitivity and familiarity with the category; the three most and least likely to act.
- **What people say** (two simulated customers): one sentence each from the best and the worst segment, stamped "Simulated customer".
- **One rewrite**, with "Test this version", which fills the box with it.
- How many simulated consumers ran, the cost, and "AI-simulated. Simulated from your description, not real customers." No coverage tier: that stays on country results.

Signed in, the test is sealed when it is made: the page shows "Sealed <time> · <first 12 characters of the hash>". The test then appears in [your tests](track-record.md), where the person marks it "Landed" or "Flopped", with a real number if they have one. Signed out, the result shows with "Sign in to seal this test and keep your record." and nothing is stored.

The backtest takes up to 10 messages the founder already shipped, each with Landed or Flopped, a real metric (name, value, unit), or both, and the same idea and ideal customer. The engine and the baseline each predict every message; it shows hits and Brier for both on messages with Landed or Flopped, a calibration table by predicted range, and the rank agreement (Spearman) with any metric given on three or more messages. A metric alone is never turned into Landed or Flopped. It is stamped "Backtest: not on your record" and stores nothing.

States, written out:

- Empty box: "Test my message" is disabled.
- Running: "Running the simulation".
- Refused: the API's `detail` sentence as sent.
- Error: "Could not test the post. The server did not respond." with "Try again".

## Who it is for

Founders who sell to consumers, deciding between versions of a launch, a price, a headline or an announcement before they ship it. Businesses and enterprise are on request only, not in the product (decision [0016](../research/decisions/0016-icp-audiences.md)).

## How we know it works

- Contract: `POST /v1/tests` takes `{text, idea, icp, gut?}` and returns the result; with a live session it also returns `seal` (`sha256`, `sealed_at`, `id`). `POST /v1/tests/backtest` takes `{idea, icp, messages: [{text, outcome?, metric?}]}` (one to ten messages, each with an outcome, a metric or both) and stores nothing. Fields are in `api/openapi.json`.
- The seal is SHA-256 over the canonical JSON of the stored test (text, idea, icp, gut, result, sealed time). The database refuses an update to any sealed column (`api/rw_api/sql/tests.sql` triggers). Tests in `api/tests/test_tests.py`: `test_a_signed_in_test_is_sealed_and_the_seal_recomputes`, `test_a_sealed_test_cannot_be_changed`, `test_a_signed_out_test_is_not_stored`, `test_the_backtest_stores_nothing`.
- Every test and backtest is checked against a cost cap before any model call and against the day's shared budget (`TEST_MAX_COST_USD`, `FORK_DAILY_BUDGET_USD` in `engine/rw/settings.py`), and against a per-address daily count (`TEST_ANON_PER_DAY`) when signed out; a check that cannot be read refuses the test. Test: `test_a_test_over_its_cap_is_refused_and_spends_nothing`.
- Engine: `engine/rw/reaction.py` asks `RW_AGENTS` simulated consumers (default 1,080, a multiple of 27 up to 10,800; any other value stops the API at startup), split evenly over the 27 segments, one Jev call each with at most `RW_AGENT_WORKERS` in flight, and one baseline call with no segments. Segments are equally weighted. Tests in `engine/tests/test_reaction.py`: the grid, the agent cap, the aggregation, the baseline, and the backtest math on a hand-checked example.
- Measured after launch: share of signed-in people who mark at least three tests within 14 days, and the engine's Brier against the baseline's and the people's gut on marked tests ([E010](../experiments/E010/PREREG.md)).

## What it is not

- Not a survey of real people and not a model of the founder's real customer mix: segments are equally weighted.
- No scheduling, posting or platform sign-in.
- No accuracy claim before 100 marked tests, and then only the number the record computes.

## Where the code lives

- `engine/rw/reaction.py`; `api/rw_api/routes_tests.py`; `web/src/WillItLand.tsx`.
- Decisions: [0012](../research/decisions/0012-will-it-land-and-call-it.md), [0016](../research/decisions/0016-icp-audiences.md). Research: [product/108](../research/product/108-consumer-wedge.md), [product/087](../research/product/087-trust-and-explainability.md).
