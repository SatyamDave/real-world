.DEFAULT_GOAL := help
.PHONY: help keycheck setup dev test lint typecheck check experiment daily daily-fixtures mirror openapi sdk e2e web-build-refuses-fixtures

help: ## list every target
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-15s %s\n", $$1, $$2}'

setup: ## install Python and TypeScript dependencies from the lockfiles
	uv sync --all-packages --locked
	pnpm install --frozen-lockfile

API_PORT ?= 8000
WEB_PORT ?= 5173

dev: ## seed the fixture days if var/ is empty, then run the API on $(API_PORT) and the web app on $(WEB_PORT)
	@test -d "$${RW_HOME:-var}/snapshots" || uv run python -m rw.daily --fixtures
	trap 'kill 0' EXIT; uv run uvicorn rw_api.app:app --port $(API_PORT) & \
		VITE_API_URL=http://localhost:$(API_PORT) pnpm --filter web dev --port $(WEB_PORT)

keycheck: ## check OPENROUTER_API_KEY: key and account balance, and that the Jev and text models are listed (free calls)
	uv run python scripts/keycheck.py

test: ## run pytest and every package's Vitest suite
	uv run pytest -q
	pnpm -r test

lint: ## ruff check, ruff format --check, biome check, markdown links, design tokens, glossary, SDK parity, licence fields
	uv run ruff check .
	uv run ruff format --check .
	pnpm exec biome check .
	uv run python scripts/check_links.py
	uv run python scripts/check_design.py
	uv run python scripts/check_glossary.py
	uv run python scripts/check_sdk_parity.py
	uv run python scripts/check_licence.py

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

mirror: ## push $RW_HOME/receipts/*.json to RECEIPTS_MIRROR_REMOTE; says the mirror is off when unset
	scripts/mirror_receipts.sh

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
	@set -e; unset TYPESAFE_API_KEY OPENROUTER_API_KEY RW_TEXT_BASE_URL; export RW_HOME=$$(mktemp -d); \
	port=$$(uv run python -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])'); \
	uv run python -m rw.daily --fixtures > /dev/null; \
	uv run uvicorn rw_api.app:app --host 127.0.0.1 --port $$port --log-level warning & pid=$$!; \
	trap 'kill $$pid; rm -rf "$$RW_HOME"' EXIT; \
	for i in $$(seq 100); do curl -sf http://127.0.0.1:$$port/healthz > /dev/null && break; sleep 0.2; done; \
	export RW_API_URL=http://127.0.0.1:$$port; \
	uv run pytest sdk/python/tests/test_quickstart.py -q; \
	pnpm --filter @real-world/sdk exec vitest run test/quickstart.test.ts; \
	$(MAKE) web-build-refuses-fixtures RW_API_URL=$$RW_API_URL

web-build-refuses-fixtures: ## a production web build against an API serving fixture questions fails; a fixtures-mode build passes
	@set -e; out=$$(mktemp -d); trap 'rm -rf "$$out"' EXIT; \
	VITE_API_URL=$(RW_API_URL) pnpm --filter web exec vite build --mode fixtures --outDir "$$out/fixtures" > /dev/null 2>&1; \
	if log=$$(VITE_API_URL=$(RW_API_URL) VITE_PUBLIC_ORIGIN=https://rw.example pnpm --filter web exec vite build --outDir "$$out/prod" 2>&1); then \
		echo "a production web build shipped the fixture questions served at $(RW_API_URL)"; exit 1; fi; \
	echo "$$log" | grep -q "fixture id" || { echo "$$log"; exit 1; }; \
	echo "Production web build refused the fixture questions at $(RW_API_URL)."
