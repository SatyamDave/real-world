# realworld

Python client for the Real World Simulate API ([product/sdks.md](../../product/sdks.md)). Start the API with `make dev`, then:

```python
from realworld import Client

rw = Client("http://localhost:8000")
event = rw.world().prefilled_events[0]
job = rw.simulate({"event": {"text": event.text, "countries": event.countries}})
result = rw.wait(job.id)
print(result.disclosure)
for s in result.top_shifts:
    print(f"{s.segment} {s.topic}: {s.shift_p50:+.3f}")
for topic, out in result.outputs.items():
    print(f"{topic}: p10 {out.final.p10:.3f}, p90 {out.final.p90:.3f}")
```

No key is needed. With an API key, `Client("http://localhost:8000", api_key="rw_...")` sends it as `Authorization: Bearer`, and forks count against the key's dollar cap instead of the per-address daily count.

`result` is a typed `SimulateResult`. The band is the p10-p90 range across simulated runs, not a confidence interval.

## Methods

| Method | Call |
| --- | --- |
| `simulate(request, idempotency_key=None)` | `POST /v1/simulate`; generates an `Idempotency-Key` when none is given |
| `estimate(request)` | `POST /v1/simulate/estimate` |
| `get_simulation(id)` | `GET /v1/simulations/{id}` |
| `wait(id, timeout=120)` | polls `get_simulation` and returns the result; raises if the job failed or `timeout` seconds pass |
| `events(id)` | iterates the job's server-sent events, reconnecting once with `Last-Event-ID` |
| `world()`, `agent(id)`, `agent_why(id)` | the world, one agent, and its labelled simulated account |
| `daily(player_id=None)`, `answer_daily(question_id, player_id, probability)` | the daily question and its reveal |
| `receipts()`, `receipt_day(date)`, `scores()` | the ledger and the scores |

Every request sends `Real-World-Version`. An error status raises `httpx.HTTPStatusError` with the response body in its message.

Models in `realworld/generated/` are generated from `api/openapi.json` by `make sdk`; see [sdk/CLAUDE.md](../CLAUDE.md).
