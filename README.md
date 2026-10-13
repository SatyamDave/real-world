# Real World

**Simulations with receipts.**

Know how a post will land before you post it, and call the news against an AI that seals its calls first ([decision 0012](research/decisions/0012-will-it-land-and-call-it.md)).

Under both runs the engine: simulated populations of 16 countries that take in each morning's news, polls and markets, a typed decision per segment, and a ledger that seals every forecast before its outcome and scores it in public, misses included. Every result carries a coverage tier and the label AI-simulated.

## How people use it

| Who | Starts at | What they get |
| --- | --- | --- |
| Person about to post | `/` or `/simulate`, "Test a post" | Paste a post, pick an audience, record your gut, and get the landing chance, the reaction mix, the best and worst audiences, two simulated accounts and a rewrite. Signed in, the test is sealed and marked "Landed" or "Flopped" later on `/record`. |
| Person calling the news | `/call` Call it | Today's question against the AI, whose call is sealed before you answer; then you, visitors, the AI and the market side by side, and your record against the AI. |
| Skeptic | `/scores`, `/receipts` | The AI's public record: every forecast hashed before its outcome, verified in the browser, and its skill with n and an interval. |

The app is a ledger desk ([decision 0014](research/decisions/0014-ledger-desk.md)): a top bar and a one-line ledger tape on every page; `/` asks "Will this land?" beside today's simulated populations and lists use cases by who they serve; `/simulate` runs a post test (and the retrospective check) or a fork (drawn per topic and day). Routes: `/call` the daily question; `/record` your sealed tests (sign-in); `/sign-in`; `/scores`; `/receipts`; `/questions/{id}`; `/acceptable-use`, `/privacy`, `/terms`. The engine's forks API (`POST /v1/simulate`) stays for builders but is not an app surface. Specs: [product/README.md](product/README.md).

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
3. The web app opens on "Will this land?". Paste a post and click "Test it", or pick a use case; on `/simulate` pick your gut and click "Test it": on the fake model the result appears within a second, with up to 24 audience segments spread across the chosen countries, the reaction mix, the best and worst audiences, and placeholder text (`fake-…`) where a real model writes the two accounts and the rewrite. "Check it on posts you already published" runs the retrospective check.
4. To seal tests, open "Sign in", type any email, and read the six-digit code from the API's log (`sign-in email written to …: link …, code 123456`) or `$RW_HOME/outbox/`; no email key is needed on localhost. Each test you run is then sealed; `/record` lists them with "Landed" and "Flopped", the engine, baseline and gut Brier and "Check seal".
5. "Call it" shows today's question with "The AI's call is sealed" and its leaf hash. Move the slider and click "Call it": the reveal shows you, visitors, the AI and the market, your streak and your record against the AI. On fixtures the page stays answerable until 2026-10-28, the last fixture question's `closes`; after that the daily cycle must run on a later day.
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
| [`gtm/`](gtm/README.md) | Who uses Real World first, pricing, the launch plan, and the claims we may and may not make; B2B material marked paused. | n/a |
| [`company/`](company/README.md) | The north-star metric, the plan to Nov 2 with its gates, the risk register, the operating cadence, and decisions only the founder can make. | n/a |
| [`engine/`](engine/README.md) | The Python package `rw`: settings, the model gateway, the licence gate, the population, beliefs, news, forecasts, the ledger, scoring, forks, post tests (`reaction.py`) and the daily cycle. | [will it land](product/will-it-land.md), [world](product/world.md), [benchmark](product/benchmark.md), [receipts](product/receipts.md) |
| [`api/`](api/README.md) | The FastAPI app `rw_api`: every `/v1` endpoint, sign-in, sealed post tests, fork jobs, idempotency, server-sent events and the committed `openapi.json`. | [will it land](product/will-it-land.md), [call it](product/daily-question.md), [accounts](product/accounts.md), [simulate API](product/simulate-api.md) |
| [`sdk/`](sdk/CLAUDE.md) | The [Python](sdk/python/README.md) and [TypeScript](sdk/typescript/README.md) clients, generated from `api/openapi.json`, each README opening with its quickstart. | [SDKs](product/sdks.md) |
| [`data/`](data/README.md) | The licence table, the country and topic vocabularies, bundled sample data and fixtures. | [world](product/world.md) |
| [`web/`](web/README.md) | The Vite + React web app: Will this land?, Call it, your record and the proof pages. | [web app](product/web-app.md) |

The layout and module boundaries come from [decision 0001](research/decisions/0001-architecture.md).

## How we work

- Every human or Claude session starts with [CLAUDE.md](CLAUDE.md): the improvement loop, the definition of done, and the rules. Each folder has its own `CLAUDE.md` with the rules specific to it.
- Every change goes through a pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one.
- A feature PR names the research note or decision it rests on. If the research does not exist yet, write it first.
- Forecasts are published as hashes before their outcome exists. Nothing in this repo may rewrite a published forecast.
