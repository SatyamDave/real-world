# Jev as the engine's decision model, and an open model for text

- Date: 2026-10-12
- Area: engineering
- Confidence: medium. The API shape, prices and terms were read on TypeSafe's own pages; Jev's calibration on our questions is unmeasured, and no live call has run because no TypeSafe key exists and the OpenRouter account has no credits.

## Answer

Three of the engine's five model-call kinds are typed decisions that Jev answers natively: the sim forecast (a `choice` between yes and no, read as the group's yes share), the plain forecast (a `noul`), and the news signal (one 5-level `score` per topic plus a `noul` for salience). The other two need generated text: the acceptable-use screen must quote the words that break the rule, and the agent account is prose. Route the first three to Jev pinned at `jev-1.13.0`, the other two to Mistral Small 3.2 24B (Apache-2.0) behind an OpenAI-compatible API, and remove Anthropic. On the fixture run this cuts the estimated model cost by about 60%. Gate the scored nightly run on [E007](../../experiments/E007/PREREG.md).

## Findings

**Call sites** (`git grep complete_json` at `ea5b41f`):

| Purpose | Module | Asks for | Class |
| --- | --- | --- | --- |
| `forecast_sim` | `engine/rw/forecast.py` | yes and no shares for one group | Jev `choice` |
| `forecast_plain` | `engine/rw/forecast.py` | probability of yes | Jev `noul` |
| `signal`, `fork_signal` | `engine/rw/news.py` | push in [-1, 1] per topic, salience in [0, 1] | Jev `score` per topic, `noul` |
| `screen` | `engine/rw/policy.py` | a rule plus the exact quote that breaks it | open model: the quote is generated text |
| `why` | `api/rw_api/app.py` | two or three first-person sentences | open model: prose |

**Jev.** `POST https://api.typesafe.ai/v1/systemone` with `state`, `model` and a map of questions; `noul` returns a probability, `choice` (up to 255 options) and `score` (2 to 10 ordered levels) return `probabilities` and `confidence`; text input only; 64k tokens per request, 32k for the state plus the longest question; $0.042 per million input tokens, output free; `jev-latest` and `jev-preview` are aliases that move ([API](https://docs.typesafe.ai/api), [models](https://docs.typesafe.ai/models), accessed 2026-10-12). OpenRouter now lists `typesafe/jev-1.13` served by TypeSafe at the same price, with 32,000 prompt tokens ([endpoint listing](https://openrouter.ai/api/v1/models/typesafe/jev-1.13/endpoints), accessed 2026-10-12); a call to `https://openrouter.ai/api/v1/systemone` returned 402 "Insufficient credits", where a wrong path returns 404.

**Vendor risk**, from the review done for another project ([fall_forward_labs ADR-0011](https://github.com/SatyamDave/fall_forward_labs/blob/main/docs/adr/0011-typesafe-vendor-review.md), a private repository; its facts were read on TypeSafe pages on 2026-09-27, and the ADR was opened 2026-10-12): no uptime commitment and liability capped at the greater of 12 months of fees and $50 (MCA §3, §9.3, §12.2); MCA §2.3(b) forbids using any output "to perform model distillation, train a model to imitate the output of the Services"; no fixed retention period, a perpetual licence to derive telemetry, zero retention for enterprise customers only, US hosting; observed uptime 99.827%. Everything we send is already public (headlines, question text, segment labels), so retention matters less here than there.

**Open model.** Mistral Small 3.2 24B Instruct is Apache-2.0 and "better at following precise instructions" than 3.1 ([model card](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506), accessed 2026-10-12). OpenRouter serves it from four hosts, all supporting structured outputs, at $0.075-$0.10 input and $0.20-$0.30 output per million ([endpoints](https://openrouter.ai/api/v1/models/mistralai/mistral-small-3.2-24b-instruct/endpoints), accessed 2026-10-12). Ollama ships it as `mistral-small3.2`, 15 GB ([library](https://ollama.com/library/mistral-small3.2), accessed 2026-10-12), so the text calls run keyless on a laptop. It is not a reasoning model, so `max_tokens` bounds the answer itself; a reasoning model such as gpt-oss-120b would spend the 100-token screen budget on thinking.

**Cost.** Measured on the five fixture days with the fake model, which counts characters / 4 as tokens (Jev's tokenizer is unpublished), 928 calls each:

| | Haiku 5.5 at `ea5b41f` | Jev at PR 2 |
| --- | --- | --- |
| Fixture run, all calls | $0.0298 | $0.0119 |
| Per 1,000 `forecast_sim` calls | $0.0247 (177 in, 14 out) | $0.0090 (213 in) |
| Per 1,000 `signal` calls | $0.0754 (311 in, 88 out) | $0.0352 (839 in) |

One call is one segment-step, so these are also the cost per 1,000 agent-steps of a group. The Jev signal request is longer because each topic carries its five level descriptions. Inference: Haiku's thinking tokens, which bill as output ([062](062-llm-cost-choices.md)), are not in the Haiku column, so the real saving is larger.

## What it means for Real World

- For the product: forks and the daily run cost less; the screen and the account keep their behavior on a different model.
- For the engineering: two providers instead of one; Jev returns probabilities and confidence that a calibration layer can use directly.
- For the business: a single small vendor with no SLA sits under the scored forecasts.

## Recommendations

1. Pin `jev-1.13.0` (direct) or `typesafe/jev-1.13` (OpenRouter) and refuse any response from another version.
2. Bill Jev on input tokens only and keep the existing fail-closed budget check.
3. Register and run E007 before the Jev path writes scored forecasts on real questions.
4. Get a legal read of MCA §2.3(b) before any model is trained or fitted on Jev's outputs.

## Open questions

- Jev's calibration on population-share questions: E007 measures it.
- Whether OpenRouter's `systemone` route reports `jev-1.13.0` or `typesafe/jev-1.13` in the response `model` field: the first funded call shows it.
- Jev's latency: unpublished; the first live run measures it.

## Sources

- [TypeSafe API reference](https://docs.typesafe.ai/api), accessed 2026-10-12
- [TypeSafe models](https://docs.typesafe.ai/models), accessed 2026-10-12
- [OpenRouter Jev 1.13 endpoints](https://openrouter.ai/api/v1/models/typesafe/jev-1.13/endpoints), accessed 2026-10-12
- [OpenRouter Mistral Small 3.2 endpoints](https://openrouter.ai/api/v1/models/mistralai/mistral-small-3.2-24b-instruct/endpoints), accessed 2026-10-12
- [Mistral Small 3.2 model card](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506), accessed 2026-10-12
- [Ollama mistral-small3.2](https://ollama.com/library/mistral-small3.2), accessed 2026-10-12
- fall_forward_labs `docs/adr/0011-typesafe-vendor-review.md` and `docs/adr/0010-decision-layer.md`, local copies opened 2026-10-12
