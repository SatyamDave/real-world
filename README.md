# Real World

Message testing for consumer founders. Write what you are building in one line, paste a message, and see how your ideal customer reacts before you ship it ([decision 0016](research/decisions/0016-icp-audiences.md)).

A test simulates your ideal consumer customer, not a country. The engine expands your description into 27 segments (attitude to new products x price sensitivity x familiarity with the category), asks each one a typed decision call from Jev, and returns who would sign up, try or buy, who would not, and the objection that stops them. Every test also runs a plain Jev baseline with no segments, so you can see whether the segments add anything. Every result is labelled AI-simulated. It is free while in beta; enterprise on request.

## How people use it

| Who | Starts at | What they get |
| --- | --- | --- |
| Consumer founder | `/` | Describe the product in one line and the ideal customer in plain words, paste a message, record your gut, and get the share who would act across 27 segments, the objections, the baseline's answer and a rewrite. Signed in, the test is sealed and later marked Landed or Flopped, with an optional real metric and a note; a mark cannot change. |
| Consumer founder with past messages | `/simulate`, Backtest | Up to 10 messages you already shipped, each with what really happened. The engine and the baseline predict every one; the result shows hits, Brier and a calibration table for both. Labelled "Backtest: not on your record". |
| Skeptic | `/scores`, `/receipts` | The track record: every daily forecast the engine made about real events, hashed before its outcome, verified in the browser and scored with n and an interval, misses included. |

The track record is the evidence behind the product, not the product. The engine forecasts real events every day and seals each forecast before the outcome ([decision 0012](research/decisions/0012-will-it-land-and-call-it.md)); the web app links it as one "Public record" and explains it on "How it works". Marked tests score the engine against the baseline and against your gut on your own messages ([E010](experiments/E010/PREREG.md)). Routes: `/` and `/simulate` message tests, `/record` your sealed tests (sign-in), `/sign-in`, `/scores`, `/receipts`, `/questions/{id}`, `/acceptable-use`, `/privacy`, `/terms`. The engine's forks API (`POST /v1/simulate`) and the daily question stay as the track record's interface, not as product surfaces. Specs: [product/README.md](product/README.md).

## Run it

You need [uv](https://docs.astral.sh/uv/), [pnpm](https://pnpm.io/) and Node 22 or later. No API key is needed: without `TYPESAFE_API_KEY` or `OPENROUTER_API_KEY` every model call goes to a fake model, so the numbers below test the pipeline, not the science.

```
make setup            # installs Python (uv) and TypeScript (pnpm) dependencies from the lockfiles
make daily-fixtures   # runs the daily cycle over the five fixture days (2026-10-01 to 10-05)
make dev              # API on http://localhost:8000, web app on http://localhost:5173
```

What you see at each step:

1. `make daily-fixtures` prints one block per day: the steps that ran, model calls and the dollars a real model would have cost (a keyless run spends nothing), forecasts committed, the day's root hash, questions scored, countries marked experimental, and the anchor status (`not anchored: fixture days are not sent to public timestamp servers` for every fixture day). The first run makes about 180-210 fake model calls per day; a second run prints `ran: nothing (all steps ok)` with `model calls 0` for every day. `make dev` seeds these days on its own when `var/` is empty.
2. `make dev` prints the web URL (Vite moves to the next port when 5173 is taken) and the API docs are at http://localhost:8000/docs. `curl localhost:8000/healthz` returns `{"ok":true}`. To run a second stack beside the first, pick other ports and another state folder: `RW_HOME=var2 make dev API_PORT=8001 WEB_PORT=5174`.
3. The web app opens on the message test. Describe the product in one line and your ideal customer, paste a message and click "Test my message": on the fake model the result appears within a second, with the 27 customer segments, the baseline, the objections, and placeholder text (`fake-…`) where a real model writes the accounts and the rewrite. "Backtest" runs up to 10 past messages against what really happened.
4. To seal tests, open "Sign in", type any email, and read the six-digit code from the API's log (`sign-in email written to …: link …, code 123456`) or `$RW_HOME/outbox/`; no email key is needed on localhost. Each test you run is then sealed; `/record` lists them with "Landed" and "Flopped", the engine, baseline and gut Brier and "Check seal".
5. "Public record" opens the track record: the daily question with "The AI's call is sealed" and its leaf hash. On fixtures the question stays answerable until 2026-10-28, the last fixture question's `closes`; after that the daily cycle must run on a later day.
6. "Receipts" opens the day records with their receipts; "Verify in this browser" recomputes every leaf, root and chain link with WebCrypto and reports `Verified 5 days and N receipts back to the first day`. The same check from the terminal: `uv run python -m rw.ledger verify --date 2026-10-05` prints `OK`.
From the terminal, a post test is one call from an allowed origin:

```
curl -s -X POST localhost:8000/v1/tests -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5173' \
  -d '{"text": "We cut our prices in half for students this week.", "gut": "lands"}'
```

The engine's fork is one call with an idempotency key:

```
curl -s -X POST localhost:8000/v1/simulate -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"event": {"text": "A chip shortage doubles phone prices worldwide."}}'
```

It returns `202` with a job id; `GET /v1/simulations/{id}` has the result once `status` is `succeeded`, and `GET /v1/simulations/{id}/events` streams its progress. The same again with the same key returns the same job (`409` while it is still running). The SDK quickstarts in [sdk/python/README.md](sdk/python/README.md) and [sdk/typescript/README.md](sdk/typescript/README.md) do the same in ten lines, printing shares as numbers from 0 to 1; `make e2e` runs both against a local API.

To fork with an API key instead of the anonymous limits, mint one with `uv run python -m rw_api.keys create --label me --cap-usd 100`, which prints the key once. Send it as `-H "Authorization: Bearer rw_..."`, or pass `api_key=` (Python) or `apiKey` (TypeScript) to the SDK client.

| Command | What it does |
| --- | --- |
| `make check` | Runs lint, type checks, every test, the SDK drift check and `make e2e`, exactly as CI does. |
| `make experiment ID=E003` | Runs a registered experiment and writes `experiments/E003/results/`. |
| `make help` | Lists every target. |

Local state (the SQLite file, snapshots, receipts) goes to `var/`, or to `$RW_HOME` if set.

## Switching on with secrets

Everything above runs with no secret. Each of these switches one thing on:

| Secret | Where | What it switches on |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | environment | Forecasts and news signals go to Jev (`settings.JEV_MODEL`) instead of the fake model, within `NIGHTLY_BUDGET_USD`, the fork caps and the post-test caps (`TEST_*`) in `engine/rw/settings.py`. |
| `OPENROUTER_API_KEY` | environment | The screen, agent accounts, post-test accounts and rewrites go to `settings.TEXT_MODEL` on OpenRouter; without `TYPESAFE_API_KEY`, Jev calls also go through OpenRouter (`settings.JEV_OPENROUTER_MODEL`). `RW_TEXT_BASE_URL` sends the text calls to a local OpenAI-compatible server such as Ollama instead. |
| `ANTHROPIC_API_KEY` | repository secret | `.github/workflows/papers.yml` opens a PR updating the affected papers after a PR outside `papers/` merges; `claude-review.yml` reviews each non-draft PR against the `CLAUDE.md` files and posts one comment; `learn-rules.yml` opens a daily PR that turns mistakes in recently merged PRs into rules and checks. Each skips itself with a warning when the secret is unset. |
| `RECEIPTS_MIRROR_REMOTE` | environment | `make mirror` pushes `var/receipts/*.json` to this git URL (token included); unset, it says the mirror is off ([receipts](product/receipts.md)). |
| `RW_ALLOWED_ORIGINS` | API environment | Comma-separated origins, like `https://host`, that may call the API from a browser besides localhost. A malformed entry stops the API at startup. |
| `RW_TRUSTED_PROXIES` | API environment | Comma-separated proxy addresses whose last `X-Forwarded-For` hop is taken as the caller for the signed-out fork and post-test limits; otherwise the peer address is used. |
| `RW_AGENTS`, `RW_AGENT_WORKERS` | API environment | Simulated consumers per message test (default 1,080, a multiple of 27 up to 10,800) and Jev calls in flight at once (default 32, up to 256). Any other value stops the API at startup; the per-test cost cap still refuses a test before any call ([message test](product/will-it-land.md)). |
| `RW_EMAIL_API_KEY`, `RW_EMAIL_FROM` | API environment | Sign-in emails go through the email provider instead of `$RW_HOME/outbox/`. Required when any allowed origin is not localhost; the API refuses to start without them ([accounts](product/accounts.md)). |

## Run with a real key

Export `OPENROUTER_API_KEY` (a dedicated key with its own limit; the account needs credit at https://openrouter.ai/settings/credits).
`make keycheck` prints the key's remaining limit, the account's remaining credit and whether the Jev and text models are listed, and exits non-zero when the key is missing or the balance is zero.
Then `make daily-fixtures` or `make dev` run on the real models.

## Where things live

| Folder | What it holds | Product spec |
| --- | --- | --- |
| [`research/`](research/README.md) | Every piece of market, science, data and engineering research, and every decision we made from it. Start here. | n/a |
| [`papers/`](papers/README.md) | Our public research papers. Every number in them comes from an artifact in this repo, and they are updated after every merged PR. | n/a |
| [`product/`](product/README.md) | One plain-language spec per product surface: what it does, who it is for, how we know it works, and which code owns it. | n/a |
| [`experiments/`](experiments/README.md) | Pre-registered experiments, hashed into a registry before they run, and their committed results, misses included. Papers cite only these. | n/a |
| [`gtm/`](gtm/README.md) | Who uses Real World first (consumer founders), pricing, the launch plan, and the claims we may and may not make. | n/a |
| [`company/`](company/README.md) | The north-star metric, the plan to Nov 2 with its gates, the risk register, the operating cadence, and decisions only the founder can make. | n/a |
| [`engine/`](engine/README.md) | The Python package `rw`: settings, the model gateway, the licence gate, the population, beliefs, news, forecasts, the ledger, scoring, forks, message tests (`reaction.py`) and the daily cycle. | [will it land](product/will-it-land.md), [world](product/world.md), [benchmark](product/benchmark.md), [receipts](product/receipts.md) |
| [`api/`](api/README.md) | The FastAPI app `rw_api`: every `/v1` endpoint, sign-in, sealed message tests, fork jobs, idempotency, server-sent events and the committed `openapi.json`. | [will it land](product/will-it-land.md), [daily question](product/daily-question.md), [accounts](product/accounts.md), [simulate API](product/simulate-api.md) |
| [`sdk/`](sdk/CLAUDE.md) | The [Python](sdk/python/README.md) and [TypeScript](sdk/typescript/README.md) clients, generated from `api/openapi.json`, each README opening with its quickstart. | [SDKs](product/sdks.md) |
| [`data/`](data/README.md) | The licence table, the country and topic vocabularies for the public record, bundled sample data and fixtures. | [world](product/world.md) |
| [`web/`](web/README.md) | The Vite + React web app: the message test, backtest, your tests and the public record pages. | [web app](product/web-app.md) |

The layout and module boundaries come from [decision 0001](research/decisions/0001-architecture.md).

## How we work

- Every human or Claude session starts with [CLAUDE.md](CLAUDE.md): the improvement loop, the definition of done, and the rules. Each folder has its own `CLAUDE.md` with the rules specific to it.
- Every change goes through a pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one.
- A feature PR names the research note or decision it rests on. If the research does not exist yet, write it first.
- Forecasts are published as hashes before their outcome exists. Nothing in this repo may rewrite a published forecast.

## Licence

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE); third-party components keep their own licences ([THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)). Decision: [0018](research/decisions/0018-apache-licence.md).
