# LLM inference, structured output and per-agent answer distributions

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Vendor docs and repo pages were opened and quoted. The web search budget ran out mid-session, so there are no benchmark comparisons, no check of vLLM's logprob docs, and no check of OpenAI logprob support on current models.

## Answer

Structured output is a solved problem: every serious engine, hosted or self-hosted, can force an agent to answer with one of N options. Getting a probability distribution per agent is not solved on Anthropic, because Haiku 5.5 has no logprobs and rejects any temperature other than 1. For launch, run each agent once per question and treat the 100,000 agents as the sample. That gives a population distribution at the price of one cheap call per agent. Keep logprobs from an open-weights model on vLLM as a second path for the per-agent "why" view and for calibration, not as the main one.

## Findings

**Constrained decoding is commodity.**
- XGrammar is Apache-2.0, about 2.0k GitHub stars. Its README says it is the default structured-generation backend for vLLM, SGLang, TensorRT-LLM and MLC-LLM. [xgrammar repo](https://github.com/mlc-ai/xgrammar)
- The paper (Dong et al., MLSys '25, v3 May 2025) claims "up to 100x speedup over existing solutions" and near-zero end-to-end overhead. That is the authors' number, not an independent one. [arXiv 2411.15100](https://arxiv.org/abs/2411.15100)
- llguidance is MIT, 887 stars. It claims about 50 microseconds of CPU per token for a 128k vocabulary. It says OpenAI uses it for JSON Schema Structured Outputs. It is also integrated into vLLM, SGLang and llama.cpp. [llguidance repo](https://github.com/guidance-ai/llguidance)
- Outlines is Apache-2.0, about 15.9k stars, maintained by the company .txt, which also sells licensed enterprise libraries. It runs on vLLM, transformers, llama.cpp and hosted APIs. It is no longer the fast path inside the big engines. [outlines repo](https://github.com/dottxt-ai/outlines)

**Self-hosted engines.**
- vLLM is Apache-2.0, 93.6k stars. It has continuous batching, chunked prefill and prefix caching. [vllm repo](https://github.com/vllm-project/vllm)
- Prefix caching skips recomputing a shared prompt prefix. It does not speed up decoding. The docs page tells you to set `enable_prefix_caching=True`. It does not state the default. [vLLM prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html)
- vLLM structured outputs offer `choice`, `regex`, `json`, `grammar` and `structural_tag`, passed under `structured_outputs`. The backend defaults to `auto`. The old `guided_*` fields were removed in v0.12.0. [vLLM structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html)
- SGLang is Apache-2.0, 37.0k stars. XGrammar is its default backend. Outlines and llguidance are selectable. Each request takes one constraint only. There is no `choice` parameter, so you write a regex like `(A|B|C)`. [SGLang repo](https://github.com/sgl-project/sglang), [SGLang structured outputs](https://docs.sglang.io/advanced_features/structured_outputs.html)
- Neither docs page explains how logprobs interact with constrained decoding. I did not verify this and it must be tested.

**Hosted APIs.**
- Anthropic Haiku 5.5 costs $0.10 per million input tokens and $0.50 per million output tokens for prompts up to 100k. Cache hits cost $0.01. The Batch API takes 50% off. [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- The same text counts as about 30% more tokens than on Haiku 4.5. Prompts over 100k tokens cost 5x more per input token. [Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide)
- On Haiku 5.5, `temperature` must be 1 and `top_p` must be 0.99. Any `top_k` returns a 400 error. Prefill is rejected. Adaptive thinking is on by default, so you must lower effort or force a tool call to avoid paying for thinking tokens. A forced `tool_choice` gives a response with no thinking block. [migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide)
- Anthropic structured outputs (`output_config.format`, or `strict: true` tools) are GA on Haiku 5.5 on the Claude API. Enums are supported, but numeric and string-length constraints are not. Enum casing may change, so compare case-insensitively. A refusal can break the schema and is still billed. [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- I found no logprobs parameter in the Messages API parameter list I read. The page is 1.2M characters and I read only the first 100k, so treat "Anthropic has no logprobs" as likely, not proven. [Messages API](https://platform.claude.com/docs/en/api/messages)
- OpenAI chat completions: `top_logprobs` accepts 0 to 20 and needs `logprobs: true`. The docs say parameter support differs for reasoning models, with no list. Structured Outputs works on GPT-4o and later. The current flagship `gpt-6-astra` is $10 input and $50 output per million tokens, with Batch at half price, and its page does not list logprobs. [OpenAI chat create](https://developers.openai.com/api/docs/api-reference/chat/create), [structured outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs), [gpt-6-astra](https://developers.openai.com/api/docs/models/gpt-6-astra)

**Why a raw option distribution is not the answer.**
- Dominguez-Olmedo et al. (NeurIPS 2024) tested 43 models on American Community Survey questions. Answers depended heavily on option order and labels. After randomizing order, responses trended toward uniformly random. Apparent subgroup alignment may just mean those groups' statistics were near uniform. [arXiv 2306.07951](https://arxiv.org/abs/2306.07951)
- Santurkar et al. found large misalignment with 60 US demographic groups, and it persisted when models were steered toward a group. [arXiv 2303.17548](https://arxiv.org/abs/2303.17548)
- Park et al. grounded agents in 1,052 people. Interview-based agents reached 83% of participants' own test-retest consistency on GSS items. Demographics-only agents reached 74%. [arXiv 2411.10109](https://arxiv.org/abs/2411.10109)
- Argyle et al. coined "algorithmic fidelity", but on GPT-3 and US samples only. [arXiv 2209.06899](https://arxiv.org/abs/2209.06899)
- None of these tests non-US populations. Expect it to be worse there.

**Cost arithmetic (my estimate, not a measurement).** Per question, per night, 100k agents on Haiku 5.5: shared world-state prefix of 2,000 tokens, cached ($0.01 per million, about $2). A unique persona of 500 tokens uncached (about $5). An enum answer of 20 output tokens (about $1). That is roughly $8 per question, about $4 on Batch. Ten questions is $40 to $80 before the 30% tokenizer inflation, which matches the $15 to $60 planning figure. The risk is thinking tokens on output, which could multiply the output line by 10x or more.

## What it means for Real World

- For the product: the "ask any agent why" feature needs a free-text rationale, and the population chart needs a distribution. These are two different calls. Do not promise per-agent probabilities; promise segment-level distributions with ensemble spread.
- For the engineering: one function, `answer(agent, question, options) -> option`, behind one interface. Backend A is Haiku 5.5 with a forced enum tool and low effort. Backend B is open weights on vLLM with `choice` and logprobs. Randomize option order per agent. Never let the constraint library leak into callers.
- For the business: the cost line is safe on Haiku 5.5 with batch and caching. The nightly deadline is the constraint, since batch is asynchronous. Open-weights hosting only pays off if the question count grows past roughly 20 a night. That is a guess; price a GPU quote before deciding.

## Recommendations

1. Build `answer()` on Haiku 5.5 first, using a strict tool with an `enum`, `tool_choice` forced, effort low. Measure real output tokens per call on 1,000 agents before projecting nightly cost.
2. Put the world state and question first in the prompt and the persona last, so the cache covers the long shared part. Log cache hit rate.
3. Randomize option order and labels per agent. Without it, the Dominguez-Olmedo result says you are measuring bias, not opinion.
4. Run a one-day spike on vLLM with a ~8B open-weights model: `choice` plus logprobs, 100 agents, one question. Confirm that logprobs come back under constrained decoding. Compare its distribution with 100 Haiku samples on the same agents.
5. Treat raw distributions as uncalibrated. The assimilation step should fit a per-segment correction (temperature or bias) against polls, and the receipts page should report the uncorrected score too.
6. Use Anthropic Batch for the nightly run and the synchronous API only for fork-and-run simulations.
7. Do not adopt outlines. Use whatever XGrammar or llguidance your engine ships.

## Open questions

- Does Anthropic expose any token probabilities on current models? Read the rest of the Messages API reference and ask support.
- Do logprobs come back correctly from vLLM and SGLang with `choice` or regex constraints? Test in the spike.
- Do OpenAI reasoning models return logprobs at all? Send one request.
- How many output tokens does Haiku 5.5 spend at low effort with a forced tool? Measure.
- Does an open 8B model give a better or worse match to non-US polls than Haiku 5.5? Needs a WVS holdout test.
- Independent benchmarks of XGrammar versus llguidance on our enum schemas. Not found; the searches were cut off.

## Sources

- [xgrammar repo](https://github.com/mlc-ai/xgrammar), accessed 2026-10-11
- [XGrammar paper, arXiv 2411.15100](https://arxiv.org/abs/2411.15100), accessed 2026-10-11
- [llguidance repo](https://github.com/guidance-ai/llguidance), accessed 2026-10-11
- [outlines repo](https://github.com/dottxt-ai/outlines), accessed 2026-10-11
- [vLLM repo](https://github.com/vllm-project/vllm), accessed 2026-10-11
- [vLLM structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html), accessed 2026-10-11
- [vLLM prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html), accessed 2026-10-11
- [SGLang repo](https://github.com/sgl-project/sglang), accessed 2026-10-11
- [SGLang structured outputs](https://docs.sglang.io/advanced_features/structured_outputs.html), accessed 2026-10-11
- [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), accessed 2026-10-11
- [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), accessed 2026-10-11
- [Claude Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide), accessed 2026-10-11
- [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages), accessed 2026-10-11 (first 100k characters only)
- [OpenAI chat completions reference](https://developers.openai.com/api/docs/api-reference/chat/create), accessed 2026-10-11
- [OpenAI structured outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs), accessed 2026-10-11
- [OpenAI gpt-6-astra](https://developers.openai.com/api/docs/models/gpt-6-astra), accessed 2026-10-11
- [Questioning the Survey Responses of LLMs, arXiv 2306.07951](https://arxiv.org/abs/2306.07951), accessed 2026-10-11
- [Whose Opinions Do Language Models Reflect, arXiv 2303.17548](https://arxiv.org/abs/2303.17548), accessed 2026-10-11
- [LLM Agents Grounded in Self-Reports, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Out of One, Many, arXiv 2209.06899](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
