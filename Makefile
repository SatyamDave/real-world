.DEFAULT_GOAL := help
.PHONY: help setup dev test lint typecheck check experiment

help: ## list every target
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-11s %s\n", $$1, $$2}'

setup: ## install Python and TypeScript dependencies from the lockfiles
	uv sync --all-packages --locked
	pnpm install --frozen-lockfile

dev: ## run the API on :8000 and the web dev server on :5173 together
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
	@test -f engine/rw/experiments.py || { echo "rw.experiments does not exist yet; a later slice adds engine/rw/experiments.py"; exit 1; }
	uv run python -m rw.experiments run $(ID)
