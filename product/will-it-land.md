# Will this land?

## What it does

The Reaction primitive of the [playground](playground.md) (`/playground`). A person pastes a post of up to 500 characters (a tweet, a caption, a headline, a hook), picks who should see it (every simulated country by default, or some countries and age bands), and says what their gut expects: "It lands" or "It flops". "Test it" returns, in a few seconds on a real model:

- **Landing chance**: the share of that audience who would like or share it, shown as a percentage with its spread across segments (p10 to p90) and the line "Uncalibrated until 100 marked tests".
- **Reaction mix**: scroll past, read, like, share, as shares that add to 100%.
- **Best and worst audiences**: the three segments most and least likely to like or share it, each with its coverage tier.
- **Two simulated accounts**: one sentence each from someone in the best and the worst segment, stamped "Simulated account".
- **One rewrite**, with "Test this version", which fills the box with it.
- Cost, and "AI-simulated. Not a poll or a prediction of a real person".

Signed in, the test is sealed when it is made: the page shows "Sealed <time> · <first 12 characters of the hash>". The test then appears in [your record](track-record.md), where the person marks it "Landed" or "Flopped" once they know. Signed out, the result shows with "Sign in to seal this test and keep your record." and nothing is stored.

Under the box, "Check it on posts you already published" opens the retrospective check: up to five past posts, each marked "landed" or "flopped" by the person, run through the same engine. It shows "The engine would have called <k> of <n>" and each post's landing chance, stamped "Retrospective: not on your record".

States, written out:

- Empty box: "Test it" is disabled.
- Running: "Asking <n> audiences".
- Refused: the API's `detail` sentence as sent.
- Error: "Could not test the post. The server did not respond." with "Try again".

## Who it is for

Creators, founders and anyone about to post something they care about, deciding between versions in the minute before publishing ([product/108](../research/product/108-consumer-wedge.md)).

## How we know it works

- Contract: `POST /v1/tests` takes `{text, countries?, age_bands?, gut?}` and returns the result; with a live session it also returns `seal` (`sha256`, `sealed_at`, `id`). `POST /v1/tests/retrospective` takes `{posts: [{text, outcome}], countries?, age_bands?}` (one to five posts) and stores nothing. Fields are in `api/openapi.json`.
- The seal is SHA-256 over the canonical JSON of the stored test (text, audience, gut, result, sealed time). The database refuses an update to any sealed column (`api/rw_api/sql/tests.sql` triggers). Tests in `api/tests/test_tests.py`: `test_a_signed_in_test_is_sealed_and_the_seal_recomputes`, `test_a_sealed_test_cannot_be_changed`, `test_a_signed_out_test_is_not_stored`, `test_the_retrospective_check_stores_nothing`.
- Every test is checked against a cost cap before it runs and against the day's shared budget (`TEST_MAX_COST_USD`, `FORK_DAILY_BUDGET_USD` in `engine/rw/settings.py`), and against a per-address daily count (`TEST_ANON_PER_DAY`) when signed out; a check that cannot be read refuses the test. Test: `test_a_test_over_its_cap_is_refused_and_spends_nothing`.
- Engine: `engine/rw/reaction.py` asks one decision call per segment of the chosen audience (up to `TEST_SEGMENTS`, the most populous first) and weights segments by their share of the world snapshot. Test: `engine/tests/test_reaction.py`.
- Measured after launch: share of signed-in people who mark at least three tests within 14 days, and the engine's Brier against the people's gut on marked tests ([0012](../research/decisions/0012-will-it-land-and-call-it.md)).

## What it is not

- Not a prediction of likes or followers: the engine models country populations, not a platform's followers.
- No scheduling, posting or platform sign-in.
- No accuracy claim before 100 marked tests, and then only the number the record computes.

## Where the code lives

- `engine/rw/reaction.py`; `api/rw_api/routes_tests.py`; `web/src/WillItLand.tsx`.
- Decision: [0012](../research/decisions/0012-will-it-land-and-call-it.md). Research: [product/108](../research/product/108-consumer-wedge.md), [product/087](../research/product/087-trust-and-explainability.md).
