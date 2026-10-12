# Question

## What it does

One question's whole record in one call. For a question on the committed list it returns the question as committed (text, topic, countries with their coverage tier, open, close and resolution dates, resolution source, tie-break rule, market source, the question's hash and the hash of the list it is in), its outcome once known, and for each day it was forecast every committed forecast: `sim`, `plain_llm` and `market`, each with its probability, the `sim` spread (p10 to p90), the market price at commit, the commit time, the leaf hash and salt that match the day's receipt, and the Brier and log score once resolved. Each day also carries what the forecasts were made from: the headlines the models read, each segment's answer behind the `sim` forecast with the share that said yes before the model call, and each plain LLM sample.

The page `/questions/{id}`, reached from a question's text on the receipts page, shows the question with a "Pending" or "Resolved yes"/"Resolved no" stamp, its countries with their coverage tier, its dates and resolution source; the `sim` forecast by day with its p10 to p90 band; a table of every day's three forecasts with the Brier scores once resolved, each day linking its receipt and each probability carrying its leaf hash on hover; the latest day's segment answers, plain LLM samples and headlines; "How this is computed"; "Get this via API"; and the simulation disclaimer with coverage tiers. Copy for its states: "Loading the question", "No question <id> on the committed list." and "No forecast has been committed on this question yet." Its route follows [decision 0006](../research/decisions/0006-engine-visible-surfaces.md).

## Who it is for

Skeptics who want to follow one forecast from the news it read to its score, and builders who want one question's history without walking every day's receipt.

## How we know it works

- Contract: `GET /v1/questions/{question_id}` in [api/openapi.json](../api/openapi.json) (`QuestionPage`); `404` with one `detail` sentence for an id not on the list. Both SDKs call it `question(id)`.
- Every number comes from what was recorded: probabilities, leaf hashes and salts from the ledger leaves, spreads from the `forecasts` table, scores from the `scores` table, segment answers and plain LLM samples from `llm_calls`. Nothing is recomputed ([decision 0002](../research/decisions/0002-benchmark-and-receipts.md)).
- Tests in `api/tests/test_question_page.py` over the fixture days: each forecast's leaf hash, forecaster and probability match the day's receipt from `GET /v1/receipts/{date}`; only `sim` has a spread and it contains its probability; every score is null until the question resolves and then equals the Brier of its probability; each day lists the segment answers, one plain LLM sample per `PLAIN_LLM_SAMPLES` and the headlines; an unknown id returns `404`. `web/src/pages/questions.test.tsx` renders the page from a fixture of this response and the not-found copy.

## What it is not

- No forecasts that were not committed, no retrospective runs, and no recomputed scores.

## Where the code lives

- `api/rw_api/routes_questions.py` and `web/src/pages/questions.tsx`; the forecasts, scores and recorded model calls it reads are written by `engine/rw/forecast.py`, `engine/rw/score.py` and `engine/rw/ledger.py`.
- Research: [product/087](../research/product/087-trust-and-explainability.md), [science/030](../research/science/030-forecast-scoring.md), [engineering/070](../research/engineering/070-commit-reveal-timestamping.md).
