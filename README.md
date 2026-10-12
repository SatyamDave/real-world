# Real World

A live simulation of the whole world. Every morning it takes in real news, polls and markets, corrects its simulated population against what was observed, and publishes hashed forecasts that are scored in public. Anyone can fork today's world, drop in an event, and watch how people react.

## Where things live

| Folder | What it holds | Who reads it first |
| --- | --- | --- |
| [`research/`](research/README.md) | Every piece of market, science, data and engineering research, and every decision we made from it. Start here. | Everyone |
| [`papers/`](papers/README.md) | Our public research papers. Every number in them comes from an artifact in this repo, and they are updated after every merged PR. | Researchers, investors, press |
| [`product/`](product/README.md) | One plain-language spec per product surface: what it does, who it is for, how we know it works, and which code owns it. | PMs, then engineers |
| [`experiments/`](experiments/README.md) | Pre-registered experiments, hashed into a registry before they run, and their committed results, misses included. Papers cite only these. | Researchers, engineers |
| [`gtm/`](gtm/README.md) | Who we sell to, pricing, the launch plan, the builders program, and the claims we may and may not make. | Founders, anyone writing public copy |
| [`company/`](company/README.md) | The north-star metric, the plan to Nov 2 with its gates, the risk register, the operating cadence, and decisions only the founder can make. | Everyone, weekly |
| Code folders | Added by the base scaffold; each one has a README that links back to its product spec. | Engineers |

## How we work

- Every human or Claude session starts with [CLAUDE.md](CLAUDE.md): the improvement loop, the definition of done, and the rules. Each folder has its own `CLAUDE.md` with the rules specific to it.
- Every change goes through a pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one.
- A feature PR names the research note or decision it rests on. If the research does not exist yet, write it first.
- Forecasts are published as hashes before their outcome exists. Nothing in this repo may rewrite a published forecast.
