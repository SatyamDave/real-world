# @real-world/sdk

TypeScript client for the Real World Simulate API ([product/sdks.md](../../product/sdks.md)). Start the API with `make dev`, then:

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

`result` is a typed `SimulateResult`. The band is the p10-p90 range across simulated runs, not a confidence interval.

## Methods

The method names match the Python client.

| Method | Call |
| --- | --- |
| `simulate(request, idempotency_key?)` | `POST /v1/simulate`; generates an `Idempotency-Key` when none is given |
| `estimate(request)` | `POST /v1/simulate/estimate` |
| `get_simulation(id)` | `GET /v1/simulations/{id}` |
| `wait(id, timeout = 120)` | polls `get_simulation` and resolves to the result; rejects if the job failed or `timeout` seconds pass |
| `events(id)` | async iterator over the job's server-sent events, reconnecting once with `Last-Event-ID` |
| `world()`, `agent(id)`, `agent_why(id)` | the world, one agent, and its labelled simulated account |
| `daily(player_id?)`, `answer_daily(question_id, player_id, probability)` | the daily question and its reveal |
| `receipts()`, `receipt_day(date)`, `scores()` | the ledger and the scores |

Every request sends `Real-World-Version`. An error status rejects with the status and response body. Pass a `fetch` as the second constructor argument to replace the transport.

Types in `src/generated/schema.d.ts` are generated from `api/openapi.json` by `make sdk`; see [sdk/CLAUDE.md](../CLAUDE.md).
