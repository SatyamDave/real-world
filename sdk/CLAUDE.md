# sdk/

The Python (`realworld`, `sdk/python/`) and TypeScript (`@real-world/sdk`, `sdk/typescript/`) clients for the Simulate API. Each README opens with the quickstart a builder copies.

## Specs and research

- Product: [product/sdks.md](../product/sdks.md), [product/simulate-api.md](../product/simulate-api.md)
- Decision: [0001-architecture](../research/decisions/0001-architecture.md)
- Research: [open-source/045](../research/open-source/045-sdk-generation.md), [product/078](../research/product/078-api-launch-playbooks.md), [market/004](../research/market/004-jev-typesafe.md)

## Generated and hand-written code

- Generated from `api/openapi.json` by `make sdk`, never edited by hand: `sdk/python/realworld/generated/models.py` (datamodel-code-generator, pydantic v2) and `sdk/typescript/src/generated/schema.d.ts` (openapi-typescript).
- Hand-written: `sdk/python/realworld/client.py` and `sdk/typescript/src/index.ts`, about 100 lines each, with the same method names in both.
- An API change lands as `make openapi`, then `make sdk`, in the same PR as the endpoint. `make check` regenerates and fails if `sdk/` differs from what is committed.
- `API_VERSION` in both clients equals `info.version` in `api/openapi.json`; a unit test in each SDK checks it.
- `scripts/check_sdk_parity.py` (in `make lint`) fails when the two clients differ in a method, a parameter or a default. Add an operation to both in the same commit. Docstrings and README copy use `product/glossary.md` terms; `scripts/check_glossary.py` scans them.
- The TypeScript SDK pins TypeScript 5 because openapi-typescript runs on the TypeScript 5 compiler API.

## Test

```
make sdk && git diff --exit-code sdk/
uv run pytest sdk/python -q
pnpm --filter @real-world/sdk test
make e2e
make check
```

Unit tests run over a fake transport (`httpx.MockTransport`, a fake `fetch`). `make e2e` seeds the fixture days into a temporary `RW_HOME`, starts the API on a free port with `TYPESAFE_API_KEY`, `OPENROUTER_API_KEY` and `RW_TEXT_BASE_URL` unset, and runs each README quickstart as written against it; outside `make e2e` those two tests skip.

## A reviewer rejects

- A hand edit under `generated/`, or a hand-written model that duplicates a generated one.
- A method in one SDK that the other lacks, or a different name for it.
- A README quickstart that the e2e test does not run as written.
- Retries beyond one reconnect on a connection error, an async Python client, or a CLI ([product/sdks.md](../product/sdks.md)).
- A dependency beyond httpx and pydantic (Python) or openapi-fetch (TypeScript) without a line saying why.
- A test that needs a network, a running server outside `make e2e`, or an API key.
