# API design for POST /v1/simulate

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. The vendor docs below were opened and read, and the numbers are exact. The web search budget ran out, so I did not survey more APIs, and I did not read the full text of the IETF idempotency draft.

## Answer

POST /v1/simulate should be an async job, not a long-held request. It returns 202 with a job id at once. Clients then poll GET, or read an SSE progress stream that can resume from a cursor. Idempotency keys, a date-pinned version header and a JSON Schema 2020-12 output contract should all be in v1 on day one. They are cheap now and cannot be added later without breaking users.

## Findings

**Async is the norm for long work.** A 7-day, ensemble run over a 100,000-agent world will take minutes. OpenAI's Responses API handles this with `background: true`. The call returns a response whose status is `queued` or `in_progress`. The client polls GET `/v1/responses/{id}` until the status is terminal. Cancel is POST `/v1/responses/{id}/cancel`, and repeated cancels are idempotent ([OpenAI background mode](https://developers.openai.com/api/docs/guides/background)). Anthropic's Message Batches work the same way: `processing_status` goes `in_progress` then `ended`. A batch holds at most 100,000 requests or 256 MB. Results stay available 29 days, and per-request results are `succeeded`, `errored`, `canceled` or `expired` ([Anthropic batch docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)). Google's AIP-151 formalizes the pattern: an Operation with `name`, `metadata`, `done`, and either `response` or `error`. It suggests keeping finished operations about 30 days ([AIP-151](https://google.aip.dev/151)).

**Streaming needs a cursor, and OpenAI's is a caveat to copy.** OpenAI lets you set `background` and `stream` together. Each event has a `sequence_number`. After a dropped connection you resume with `?stream=true&starting_after=N`. You can only stream a background response that was created with `stream=true`. Time to first token is higher than for synchronous calls, and some SDKs lack resume support. Background results are stored only about 10 minutes unless `store=true`. That short window is a trap for a nightly-style product, so we should not copy it.

**SSE already has resume built in.** The spec defines an `id` field and a `Last-Event-ID` header sent on reconnect. It also defines `retry` in milliseconds, and `text/event-stream` as the only content type. A 204 tells the client to stop reconnecting. A non-200 status or wrong content type closes the stream with no retry ([WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)). The browser `EventSource` object is, from my own knowledge and not from the page I read, GET-only and cannot set custom headers such as an auth header. So the stream should be GET `/v1/jobs/{id}/events`, with the job id as the resource and `Last-Event-ID` as the cursor.

**Idempotency has one clear precedent.** Stripe takes an `Idempotency-Key` header on all POSTs, up to 255 characters, V4 UUIDs suggested. It saves the status and body of the first request that reached execution, including 500s. Keys can be pruned after 24 hours. Reusing a key with different parameters returns an error. Requests that fail validation or hit a concurrent in-flight request are not saved, so they can be retried ([Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)). The IETF `Idempotency-Key` header draft is at revision 07 (2025-10-15) and is expired, not an RFC ([IETF datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)). Copy Stripe's behavior and treat the draft as a naming hint only.

**Versioning: date-based and pinned.** Stripe sends a `Stripe-Version` header. Since 2024-09-30 it ships monthly versions with no breaking changes and two major releases a year. The current one is 2026-09-30.endive. Unspecified requests use the account's pinned default. Its SDKs from the last few years pin to the version current at SDK release ([Stripe versioning](https://docs.stripe.com/api/versioning)). That pinning is what keeps old integrations working.

**Typed outputs: the schema contract is the easy half.** JSON Schema 2020-12 is the draft with `prefixItems` and `$dynamicRef` ([release notes](https://json-schema.org/draft/2020-12/release-notes)). Anthropic's structured outputs take a schema in `output_config.format`. They guarantee valid JSON matching it, but only for a subset. `minimum`, `maximum`, `minLength`, `maxLength`, recursive schemas and external `$ref` are rejected with a 400. `minItems` is limited to 0 or 1, and every object needs `additionalProperties: false`. Strict schemas also cap at 24 optional parameters and 16 `anyOf` parameters per request ([Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)). On refusal or `max_tokens` the output may not match the schema, and you are still billed.

**Cost context.** Batch pricing for Claude Haiku 5.5 is $0.05 per million input tokens and $0.25 per million output tokens for prompts up to 100,000 tokens ([Anthropic batch pricing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)). A batch-style nightly update matches our cost plan. Interactive forks cannot use batch latency, which is up to 24 hours.

**What does not work.** Holding one HTTP request open for minutes breaks behind proxies and mobile networks. Streaming without a cursor loses events on reconnect. Letting the LLM free-form the output and validating afterward fails often enough to need retries, which cost money.

## What it means for Real World

- For the product: the user sees a job that has states, progress and a final result. "Run 7 days" shows a live progress bar. "Why did this agent do that" reads the trace from the finished job, not from a live call.
- For the engineering: two layers of typing. The public contract is our own JSON Schema 2020-12 for the result: outputs, segments, ensemble spread, trace. Model calls inside the simulation use the narrow, provider-supported subset, and we validate the numeric constraints ourselves after the call. Because ranges like `minimum` and `maxLength` are not enforced by the provider, they must be enforced in our code.
- For the business: the API is the product for developers. Stable versions and safe retries are what make a team put it in a pipeline. A public hashed track record also depends on stable result shapes, so a schema change must not silently alter old forecasts.

## Recommendations

1. Make POST `/v1/simulate` return `202 Accepted` with `{id, status, links}`. Statuses: `queued`, `running`, `succeeded`, `failed`, `canceled`. Keep results at least 30 days, matching AIP-151 and Anthropic's 29 days. Do not use OpenAI's 10-minute window.
2. Add GET `/v1/simulations/{id}` for polling, POST `.../cancel` (idempotent), and GET `.../events` as SSE with `id:` per event and `Last-Event-ID` resume. Send heartbeat comments so proxies do not close idle streams. Skip WebSockets.
3. Require an `Idempotency-Key` header on POST, max 255 characters. Store key plus a hash of the body for 24 hours. Same key and same body returns the original response. Same key and different body returns 422. Same key while still running returns 409 with the existing job id.
4. Version by date with an `Real-World-Version: 2026-10-27` header. Pin each API key to the version it first used. Only add backward-compatible changes within a version. Ship the SDKs pinned to the current version.
5. Publish the result schema in JSON Schema 2020-12 at a stable URL, and generate the Python (Pydantic) and TypeScript (zod) types from it. Add a CI check that fails if the generated types drift from the schema.
6. Add the fields needed for the track record now: a `world_snapshot_id`, the model and seed, the ensemble size, and the content hash of the result. Adding these later breaks the "cannot be backfilled" claim.
7. Keep v1 small. Skip webhooks, batch endpoints and idempotent GET semantics until a real customer asks. Polling plus SSE covers the Oct 27 launch.

## Open questions

- Whether our median fork run finishes in seconds or minutes. This decides if the default client should poll or stream. Measure it on a real 100,000-agent run with a 5-run ensemble.
- Exact rules of the IETF idempotency draft (error codes, request fingerprint). I did not read the full text. Decide whether we need to match it or just match Stripe.
- Which other APIs are worth copying (Replicate predictions, Google Gemini, Cloudflare). Not researched, because the search budget ran out. A follow-up search can cover this.
- Rate limits and per-key spend caps per job. Related to the cost risk, and out of scope here.

## Sources

- [OpenAI: Background mode](https://developers.openai.com/api/docs/guides/background), accessed 2026-10-11
- [Anthropic: Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing), accessed 2026-10-11
- [Anthropic: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), accessed 2026-10-11
- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests), accessed 2026-10-11
- [Stripe: Versioning](https://docs.stripe.com/api/versioning), accessed 2026-10-11
- [Google AIP-151: Long-running operations](https://google.aip.dev/151), accessed 2026-10-11
- [IETF draft: Idempotency-Key header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), accessed 2026-10-11
- [WHATWG HTML: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html), accessed 2026-10-11
- [JSON Schema 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes), accessed 2026-10-11
