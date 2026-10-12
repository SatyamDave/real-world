.DEFAULT_GOAL := help
.PHONY: help setup dev test lint typecheck check experiment daily daily-fixtures openapi

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

check: lint typecheck test ## lint, typecheck and test, as CI runs it

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
