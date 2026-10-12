# Real World

A live simulation of the whole world. Every morning it takes in real news, polls and markets, corrects its simulated population against what was observed, and publishes hashed forecasts that are scored in public. Anyone can fork today's world, drop in an event, and watch how people react.

## Run it

You need [uv](https://docs.astral.sh/uv/), [pnpm](https://pnpm.io/) and Node 22 or later. No API key is needed: without `ANTHROPIC_API_KEY` every model call goes to a deterministic fake model.

| Command | What it does |
| --- | --- |
| `make setup` | Installs Python (uv) and TypeScript (pnpm) dependencies from the lockfiles. |
| `make dev` | Starts the web app dev server; open the URL it prints. |
| `make check` | Runs lint, type checks and every test, exactly as CI does. |
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
