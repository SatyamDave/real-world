# SDKs

## What it does

Two small client libraries, Python (`realworld`) and TypeScript (`@real-world/sdk`), that call the Simulate API with typed inputs and outputs. A builder writes three lines: create a client, call `simulate(...)`, wait for the typed result or iterate its progress events. The types are generated from `api/openapi.json`, so the SDKs cannot disagree with the API.

## Who it is for

Builders evaluating us from the quickstart: they decide in five minutes whether the result is useful. The web app uses the TypeScript SDK too, so every web feature exercises it.

## How we know it works

- Each SDK has a quickstart of about 10 lines in its README, and a test runs that exact code against a live local API seeded with fixtures (`make check` starts it).
- Methods, same names in both: `simulate(request)`, `estimate(request)`, `get_simulation(id)`, `wait(id)`, `events(id)`, `world()`, `agent(id)`, `agent_why(id)`, `daily()`, `answer_daily(...)`, `receipts()`, `receipt_day(date)`, `scores()`.
- `simulate` sends an `Idempotency-Key` (generated if not given) and the pinned `Real-World-Version`.
- An optional API key (`api_key` in Python, `apiKey` in TypeScript) is sent as `Authorization: Bearer`; without one the client is anonymous and the quickstarts run as written. Tests: `test_an_api_key_is_sent_as_a_bearer_token_and_no_key_sends_none` and "sends an api key as a bearer token, and none without one".
- CI regenerates the types from `api/openapi.json` and fails if the committed generated files differ.

## What it is not

- Not published to PyPI or npm in the base build; the package names wait for the trademark check ([research/product/085](../research/product/085-naming-trademark.md)).
- No Stainless, no hand-written models, no retries beyond one on connection errors, no async Python client.
- No CLI.

## Where the code lives

- `sdk/python/` and `sdk/typescript/`; generated code in a `generated/` folder in each, never edited by hand.
- Research: [open-source/045](../research/open-source/045-sdk-generation.md), [product/078](../research/product/078-api-launch-playbooks.md), [market/004](../research/market/004-jev-typesafe.md).
