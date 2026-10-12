.DEFAULT_GOAL := help
.PHONY: help setup dev test lint typecheck check experiment daily daily-fixtures openapi sdk e2e

help: ## list every target
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-15s %s\n", $$1, $$2}'

setup: ## install Python and TypeScript dependencies from the lockfiles
	uv sync --all-packages --locked
	pnpm install --frozen-lockfile

dev: ## seed the fixture days if var/ is empty, then run the API on :8000 and the web app on :5173
	@test -d "$${RW_HOME:-var}/snapshots" || uv run python -m rw.daily --fixtures
	trap 'kill 0' EXIT; uv run uvicorn rw_api.app:app --port 8000 & pnpm --filter web dev

test: ## run pytest and every package's Vitest suite
	uv run pytest -q
	pnpm -r test

lint: ## ruff check, ruff format --check, biome check, markdown links
	uv run ruff check .
	uv run ruff format --check .
	pnpm exec biome check .
	uv run python scripts/check_links.py

typecheck: ## pyright and tsc --noEmit
	uv run pyright
	pnpm -r typecheck

check: lint typecheck test e2e ## lint, typecheck, test, SDK drift and e2e, as CI runs it
	$(MAKE) sdk
	git diff --exit-code sdk/

experiment: ## run one experiment: make experiment ID=E001
	@test -n "$(ID)" || { echo "usage: make experiment ID=E001"; exit 2; }
	uv run python -m rw.experiments run $(ID)

daily: ## run the daily cycle for one day: make daily DATE=2026-10-01
	@test -n "$(DATE)" || { echo "usage: make daily DATE=YYYY-MM-DD"; exit 2; }
	uv run python -m rw.daily --date $(DATE)

daily-fixtures: ## run the daily cycle over every fixture day; a rerun does no new work
	uv run python -m rw.daily --fixtures

openapi: ## rewrite api/openapi.json from the running app's schema
	uv run python -m rw_api.app > api/openapi.json
	pnpm exec biome format --write api/openapi.json

sdk: ## regenerate the SDK types in sdk/*/generated from api/openapi.json
	uv run datamodel-codegen --input api/openapi.json --input-file-type openapi \
		--output sdk/python/realworld/generated/models.py --output-model-type pydantic_v2.BaseModel \
		--target-python-version 3.12 --use-standard-collections --use-union-operator \
		--field-constraints --strict-nullable --disable-timestamp --formatters ruff-check ruff-format
	pnpm --filter @real-world/sdk exec openapi-typescript ../../api/openapi.json \
		-o src/generated/schema.d.ts --default-non-nullable false
	pnpm exec biome format --write sdk/typescript/src/generated

e2e: ## seed fixtures into a temp RW_HOME, serve the API on a free port, run both README quickstarts
	@set -e; unset ANTHROPIC_API_KEY; export RW_HOME=$$(mktemp -d); \
	port=$$(uv run python -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])'); \
	uv run python -m rw.daily --fixtures > /dev/null; \
	uv run uvicorn rw_api.app:app --host 127.0.0.1 --port $$port --log-level warning & pid=$$!; \
	trap 'kill $$pid; rm -rf "$$RW_HOME"' EXIT; \
	for i in $$(seq 100); do curl -sf http://127.0.0.1:$$port/healthz > /dev/null && break; sleep 0.2; done; \
	export RW_API_URL=http://127.0.0.1:$$port; \
	uv run pytest sdk/python/tests/test_quickstart.py -q; \
	pnpm --filter @real-world/sdk exec vitest run test/quickstart.test.ts
