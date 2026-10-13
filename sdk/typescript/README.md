# @real-world/sdk

TypeScript client for the Real World API, a forecast and simulation API with a public score: "Simulations with receipts." AI simulates how the world reacts to the news, and every forecast is sealed before the outcome and scored in public. Request a key with a dollar cap, expect every refusal as one sentence, and read every output as AI-simulated ([product/sdks.md](../../product/sdks.md)). Start the API with `make dev`, save this as `quickstart.mts` in a workspace package that lists `"@real-world/sdk": "workspace:*"`, and run `node quickstart.mts` (Node 22.18 or newer, which runs TypeScript as is):

```ts
import { Client } from "@real-world/sdk";

const rw = new Client("http://localhost:8000");
const [event] = (await rw.world()).prefilled_events;
const job = await rw.simulate({ event: { text: event.text, countries: event.countries } });
const result = await rw.wait(job.id);
console.log(result.disclosure);
for (const s of result.top_shifts) console.log(`${s.segment} ${s.topic}: ${s.shift_p50.toFixed(3)}`);
for (const [topic, out] of Object.entries(result.outputs)) {
  console.log(`${topic}: p10 ${out.final.p10.toFixed(3)}, p90 ${out.final.p90.toFixed(3)}`);
}
```

## Authentication

No key is needed. With an API key, `new Client("http://localhost:8000", { apiKey: "rw_..." })` sends it as `Authorization: Bearer`, and forks count against the key's dollar cap instead of the per-address daily count.

## Result

`result` is a typed `SimulateResult`. Shares are numbers from 0 to 1. The spread is the p10-p90 range across ensemble members; it is raw and uncalibrated, not a confidence interval.

## Methods

The method names and what they do match the Python client.

| Method | What it does |
| --- | --- |
| `simulate(request, idempotency_key?)` | Starts a fork of today's world with one event and returns its job. Generates an `Idempotency-Key` when none is given. |
| `estimate(request)` | Estimates the cost of a fork without running it. |
| `get_simulation(id)` | Returns a fork's job, with its result once it has succeeded. |
| `wait(id, timeout = 120, interval = 0.5)` | Polls until the fork finishes and returns its result, or fails if the fork failed or `timeout` seconds pass. |
| `events(id, last_event_id?)` | Yields the fork's progress events until it finishes, reconnecting once with `Last-Event-ID` if the connection drops. |
| `world()` | Returns today's world: countries, coverage tiers, topic shares and prefilled fork events. |
| `population()` | Returns the simulated population: every country, segment and topic with its calibration and spread. |
| `agent(id)` | Returns one simulated agent: its traits, beliefs and what moved them. |
| `agent_why(id)` | Returns a short model-written account of what moved one agent, labelled simulated. |
| `daily(player_id?)` | Returns today's question, with the reveal once this player has answered. |
| `answer_daily(question_id, player_id, probability)` | Answers today's question once and returns the reveal. |
| `receipts()` | Lists every day record with its root and record hash. |
| `receipt_day(date)` | Returns one day record with each receipt's entry, salt and leaf hash. |
| `question(id)` | Returns one question with every committed forecast by day and forecaster. |
| `scores()` | Returns the skill of the simulation against each baseline. |

## Errors

An error status rejects with `ApiError`, with `status`, `body` (parsed as JSON when it is JSON), `detail` and `code`. A connection error is retried once. Pass `{ fetch }` as the second constructor argument to replace the transport.

## Generated types

Types in `src/generated/schema.d.ts` are generated from `api/openapi.json` by `make sdk`; see [sdk/CLAUDE.md](../CLAUDE.md).
