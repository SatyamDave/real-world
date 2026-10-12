# Real World

A live simulation of the whole world. Every morning it takes in real news, polls and markets, corrects its simulated population against what was observed, and publishes hashed forecasts that are scored in public. Anyone can fork today's world, drop in an event, and watch how people react.

## Run it

You need [uv](https://docs.astral.sh/uv/), [pnpm](https://pnpm.io/) and Node 22 or later. No API key is needed: without `ANTHROPIC_API_KEY` every model call goes to a deterministic fake model, so the numbers below test the pipeline, not the science.

```
make setup            # installs Python (uv) and TypeScript (pnpm) dependencies from the lockfiles
make daily-fixtures   # runs the daily cycle over the five fixture days (2026-10-01 to 10-05)
make dev              # API on http://localhost:8000, web app on http://localhost:5173
```

What you see at each step:

1. `make daily-fixtures` prints one block per day: the steps that ran, model calls and dollars, forecasts committed, the day's root hash, questions scored and countries marked experimental. The first run makes about 180-210 fake model calls per day; a second run prints `ran: nothing (all steps ok)` with `model calls 0` for every day. `make dev` seeds these days on its own when `var/` is empty.
2. `make dev` prints the web URL (Vite moves to the next port when 5173 is taken) and the API docs are at http://localhost:8000/docs. `curl localhost:8000/healthz` returns `{"ok":true}`.
3. The web app opens on today's question. Move the slider, submit, and the reveal shows you, visitors, the simulated world and the market, with your streak. A second visit shows the reveal straight away.
4. "All receipts and verify" lists every day's forecasts; "Verify in this browser" recomputes every leaf, root and chain link with WebCrypto and reports `Verified 5 days and N receipts back to the first day`. The same check from the terminal: `uv run python -m rw.ledger verify --date 2026-10-05` prints `OK`.
5. "Fork today's world": pick a prefilled event, read the estimate, run it. On the fake model the card appears within a second: top shifts, the p10-p90 band per topic, coverage tiers, cost, and a `/fork/{id}` link that reopens the card.
6. Click a country on the globe for one sampled agent: "What moved this agent" (the trace) and "In its own words" (labelled "Simulated account, not the cause").

From the terminal, a fork is one call with an idempotency key:

```
curl -s -X POST localhost:8000/v1/simulate -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"event": {"text": "A chip shortage doubles phone prices worldwide."}}'
```

It returns `202` with a job id; `GET /v1/simulations/{id}` has the result once `status` is `succeeded`, and `GET /v1/simulations/{id}/events` streams its progress. The same again with the same key returns the same job (`409` while it is still running). The SDK quickstarts in [sdk/python/README.md](sdk/python/README.md) and [sdk/typescript/README.md](sdk/typescript/README.md) do the same in ten lines; `make e2e` runs both against a local API.

| Command | What it does |
| --- | --- |
| `make check` | Runs lint, type checks, every test, the SDK drift check and `make e2e`, exactly as CI does. |
| `make experiment ID=E003` | Runs a registered experiment and writes `experiments/E003/results/`. |
| `make help` | Lists every target. |

Local state (the SQLite file, snapshots, receipts) goes to `var/`, or to `$RW_HOME` if set.

## Where things live

| Folder | What it holds | Product spec |
| --- | --- | --- |
| [`research/`](research/README.md) | Every piece of market, science, data and engineering research, and every decision we made from it. Start here. | n/a |
| [`papers/`](papers/README.md) | Our public research papers. Every number in them comes from an artifact in this repo, and they are updated after every merged PR. | n/a |
| [`product/`](product/README.md) | One plain-language spec per product surface: what it does, who it is for, how we know it works, and which code owns it. | n/a |
| [`experiments/`](experiments/README.md) | Pre-registered experiments, hashed into a registry before they run, and their committed results, misses included. Papers cite only these. | n/a |
| [`gtm/`](gtm/README.md) | Who we sell to, pricing, the launch plan, the builders program, and the claims we may and may not make. | n/a |
| [`company/`](company/README.md) | The north-star metric, the plan to Nov 2 with its gates, the risk register, the operating cadence, and decisions only the founder can make. | n/a |
| [`engine/`](engine/README.md) | The Python package `rw`: settings, the model gateway, the licence gate, and later the population, beliefs, forecasts, ledger and scoring. | [world](product/world.md), [benchmark](product/benchmark.md), [receipts](product/receipts.md) |
| [`data/`](data/README.md) | The licence table, the country and topic vocabularies, bundled sample data and fixtures. | [world](product/world.md) |
| [`web/`](web/README.md) | The Vite + React web app. | [web app](product/web-app.md) |

The layout and module boundaries come from [decision 0001](research/decisions/0001-architecture.md). The API and SDK folders arrive in later slices of the [build plan](research/decisions/BUILD_PLAN.md).

## How we work

- Every human or Claude session starts with [CLAUDE.md](CLAUDE.md): the improvement loop, the definition of done, and the rules. Each folder has its own `CLAUDE.md` with the rules specific to it.
- Every change goes through a pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one.
- A feature PR names the research note or decision it rests on. If the research does not exist yet, write it first.
- Forecasts are published as hashes before their outcome exists. Nothing in this repo may rewrite a published forecast.
