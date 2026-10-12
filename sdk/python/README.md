# realworld

Python client for the Real World API, a forecast and simulation API with a public score: "Simulations with receipts." AI simulates how the world reacts to the news, and every forecast is sealed before the outcome and scored in public. Request a key with a dollar cap, expect every refusal as one sentence, and read every output as AI-simulated ([product/sdks.md](../../product/sdks.md)). Start the API with `make dev`, then run:

```python
from realworld import Client

rw = Client("http://localhost:8000")
event = rw.world().prefilled_events[0]
job = rw.simulate({"event": {"text": event.text, "countries": event.countries}})
result = rw.wait(job.id)
print(result.disclosure)
for s in result.top_shifts:
    print(f"{s.segment} {s.topic}: {s.shift_p50:.3f}")
for topic, out in result.outputs.items():
    print(f"{topic}: p10 {out.final.p10:.3f}, p90 {out.final.p90:.3f}")
```

## Authentication

No key is needed. With an API key, `Client("http://localhost:8000", api_key="rw_...")` sends it as `Authorization: Bearer`, and forks count against the key's dollar cap instead of the per-address daily count.

## Result

`result` is a typed `SimulateResult`. Shares are numbers from 0 to 1. The spread is the p10-p90 range across ensemble members; it is raw and uncalibrated, not a confidence interval.

## Methods

The method names and what they do match the TypeScript client.

| Method | What it does |
| --- | --- |
| `simulate(request, idempotency_key=None)` | Starts a fork of today's world with one event and returns its job. Generates an `Idempotency-Key` when none is given. |
| `estimate(request)` | Estimates the cost of a fork without running it. |
| `get_simulation(id)` | Returns a fork's job, with its result once it has succeeded. |
| `wait(id, timeout=120, interval=0.5)` | Polls until the fork finishes and returns its result, or fails if the fork failed or `timeout` seconds pass. |
| `events(id, last_event_id=None)` | Yields the fork's progress events until it finishes, reconnecting once with `Last-Event-ID` if the connection drops. |
| `world()` | Returns today's world: countries, coverage tiers, topic shares and prefilled fork events. |
| `population()` | Returns the simulated population: every country, segment and topic with its calibration and spread. |
| `agent(id)` | Returns one simulated agent: its traits, beliefs and what moved them. |
| `agent_why(id)` | Returns a short model-written account of what moved one agent, labelled simulated. |
| `daily(player_id=None)` | Returns today's question, with the reveal once this player has answered. |
| `answer_daily(question_id, player_id, probability)` | Answers today's question once and returns the reveal. |
| `receipts()` | Lists every day record with its root and record hash. |
| `receipt_day(date)` | Returns one day record with each receipt's entry, salt and leaf hash. |
| `question(id)` | Returns one question with every committed forecast by day and forecaster. |
| `scores()` | Returns the skill of the simulation against each baseline. |

## Errors

An error status raises `ApiError`, with `status`, `body` (parsed as JSON when it is JSON), `detail` and `code`. A connection error is retried once. Pass `transport=` to replace the transport.

## Generated types

Models in `realworld/generated/` are generated from `api/openapi.json` by `make sdk`; see [sdk/CLAUDE.md](../CLAUDE.md).
