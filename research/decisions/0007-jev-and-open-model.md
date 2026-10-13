# 0007: Jev for typed decisions, an open model for text, no Anthropic

- Date: 2026-10-12
- Status: proposed
- Rests on: [engineering/103-jev-decision-model](../engineering/103-jev-decision-model.md), [engineering/062-llm-cost-choices](../engineering/062-llm-cost-choices.md), [engineering/063-typed-probabilities](../engineering/063-typed-probabilities.md), [CTO lens](../lenses/cto.md)

## Decision

`engine/rw/llm.py` keeps two entry points and no Anthropic provider. `decide(purpose, state, questions, budget)` sends typed questions to TypeSafe's Jev, pinned to `jev-1.13.0` (or `typesafe/jev-1.13` through OpenRouter), and returns Jev's raw answers with their probabilities and confidence; a response from any other version is refused as a failed call. The sim forecast, the plain forecast and the news and fork signals use it. `complete_json(purpose, prompt, schema, budget)` sends a JSON-schema request to Mistral Small 3.2 24B Instruct through an OpenAI-compatible API (OpenRouter, or a local server such as Ollama); the acceptable-use screen and the agent account use it. Both keep the memo, the fail-closed budget and one `llm_calls` row per call; Jev is billed on input tokens only. Without a key both answer from the fake model. The Jev path writes scored forecasts on real questions only after [E007](../../experiments/E007/PREREG.md) passes.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Stay on Claude Haiku 5.5 for everything ([062](../engineering/062-llm-cost-choices.md)) | Measured nowhere worse; one vendor already wired | The founder chose to move off Anthropic; about 2.5x the fixture-run cost of the Jev path ([103](../engineering/103-jev-decision-model.md)) |
| Jev for decisions, open model for text | Typed probabilities and confidence from the decision model; cheapest measured; text calls run keyless on Ollama | One small vendor with no SLA under the forecasts; calibration on our questions unmeasured |
| Open model for everything | One open provider, self-hostable | Probabilities come back as generated numbers, not distributions ([063](../engineering/063-typed-probabilities.md)); no cost gain over Jev for decisions |
| gpt-oss-120b instead of Mistral Small 3.2 for text | Stronger on reasoning tasks | A reasoning model spends the 100-token screen budget on thinking |

## Why this one

The three decision call sites ask exactly what Jev's primitives return, a probability, a pick between options or an ordered level, so Jev answers them with a distribution instead of a number the model typed. The fixture run costs $0.0119 against $0.0298 on Haiku ([103](../engineering/103-jev-decision-model.md)). The screen needs an exact quote and the account needs prose, which Jev cannot produce; Mistral Small 3.2 is Apache-2.0, follows a JSON schema on every OpenRouter host that serves it, and runs locally. Vendor risk is bounded by sending only public text and by keeping a fake path that runs everything keyless.

## What would make us revisit it

- E007's kill criterion triggers.
- TypeSafe retires `jev-1.13.0` or changes the MCA; a pin bump is its own PR after E007 is rerun on the new version.
- Jev's observed availability on our nightly runs drops below 99% in a month.
- A legal read of MCA §2.3(b) forbids the calibration layer planned on Jev's outputs.
