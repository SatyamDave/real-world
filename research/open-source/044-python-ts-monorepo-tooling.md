# Python + TypeScript monorepo tooling for a small team

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Every claim below comes from a primary docs or repo page I opened. The web search budget ran out before I could run searches, so I found no release notes, no version numbers and no independent benchmarks.

## Answer

Use uv for Python, pnpm for TypeScript, ruff for Python lint and format, Biome for TS lint and format, pytest for tests, and one root Makefile (or `just`) that a PM can run with `make setup`, `make check` and `make dev`. Skip Turborepo for now. Treat `ty` as an optional, non-blocking check and use pyright as the gate.

## Findings

**uv workspaces fit our shape.** A root `[tool.uv.workspace]` table with `members = ["packages/*"]` makes one repo with one shared `uv.lock`. Members depend on each other with `{ workspace = true }` and install editable. `uv run --package <name>` runs a command in one member from anywhere. The docs list two limits. The workspace has a single `requires-python`, the intersection of all members. And uv cannot stop one member from importing another's undeclared dependency. Source: [uv workspaces docs](https://docs.astral.sh/uv/concepts/projects/workspaces/). That is fine for us: one team, one Python version.

**Ruff replaces the old lint stack.** It is a Rust linter and formatter that replaces Flake8 and its plugins, Black, isort, pydocstyle, pyupgrade and autoflake. It ships over 900 rules. The project claims 10-100x faster than Flake8 and Black. The page I opened did not state the license or a version. Source: [Ruff docs](https://docs.astral.sh/ruff/). The speed claim is the vendor's own and I did not verify it. It does not matter at our size anyway.

**`ty` is still beta.** Astral's type checker uses `0.0.x` versions and says it "does not yet have a stable API". It is MIT licensed, has about 19.8k stars and 923 open issues, and claims 10-100x faster than mypy and pyright on a no-cache home-assistant run. Python 3.10+ is the supported target. Source: [ty repo](https://github.com/astral-sh/ty). Breaking changes between versions are explicitly possible. I did not open pyright or mypy pages, so I cannot give their current versions or compare error coverage.

**pytest** documents support for Python 3.10+ and PyPy 3. The page showed a `pytest-9.x.y` placeholder, so I have no exact version. Source: [pytest docs](https://docs.pytest.org/en/stable/). It needs no setup beyond `uv run pytest`.

**Biome covers the TS side in one tool.** It formats and lints JavaScript, TypeScript, JSX, JSON, CSS, GraphQL, Markdown, YAML and SCSS. It has over 500 lint rules and claims 97% Prettier compatibility. It is dual licensed Apache-2.0 and MIT, with about 25.9k stars. The page does not mention type-aware linting, and HTML is not on the supported list. Source: [Biome repo](https://github.com/biomejs/biome). Gap to expect: rules that need TypeScript type information, which typescript-eslint offers, may not be there. I did not confirm either way. The Mythwork repo already uses Biome, so the team has it in muscle memory.

**pnpm workspaces** need a `pnpm-workspace.yaml` listing package globs. The `workspace:*` protocol links local packages and fails if the package does not exist. Source: [pnpm workspaces](https://pnpm.io/workspaces). I did not find a page on Bun as an alternative, so I make no claim about it.

**Turborepo** is an MIT-licensed Rust build system with about 31.2k stars. It adds parallel task scheduling and a remote cache on top of `package.json` scripts and one `turbo.json`. Its docs say it also helps single-package workspaces. The docs describe only JS and TS. I found nothing about Python tasks. Sources: [Turborepo docs](https://turborepo.dev/docs), [Turborepo repo](https://github.com/vercel/turborepo). Its value is caching repeated work in CI, and our repo will have a handful of packages and minutes-long CI at most.

**What I could not confirm:** current versions of uv, ruff, Biome and Turborepo; Bun as a pnpm replacement; whether pyright or mypy is faster or more complete today; any Python-side task runner beyond Make.

## What it means for Real World

- For the product: nothing user-facing. This choice is about how fast two people can change the repo without breaking each other. The API, SDKs and web app share one repo, so a contract change lands in one PR.
- For the engineering: two package managers, two lockfiles (`uv.lock`, `pnpm-lock.yaml`), one entrypoint. Python packages under `packages/` (simulation core, API, Python SDK), TS packages under the same tree (web app, TS SDK). A shared typed schema is the only coupling that matters: generate TS types from the API's OpenAPI spec so the two sides cannot drift. Do not add a build orchestrator before CI is actually slow.
- For the business: tooling cost is zero (all MIT or Apache). The real cost is the 22-day clock. Every extra tool is a thing that breaks the week before launch and that a PM cannot debug.

## Recommendations

1. Root layout: `pyproject.toml` (uv workspace root), `pnpm-workspace.yaml`, `biome.json`, `Makefile`, `README.md`. Python members in `packages/py-*`, TS members in `packages/ts-*` or `apps/`. One owner per package listed in the README.
2. Makefile targets, and nothing else: `setup` (`uv sync` and `pnpm install`), `dev`, `test` (`uv run pytest` and `pnpm -r test`), `lint` (`ruff check`, `ruff format --check`, `biome check`), `typecheck`, `check` (lint, typecheck, test). A PM runs `make setup && make dev`. CI runs only `make check`. Skip `just` unless Make's syntax bites.
3. Gate Python types with pyright in CI. Add `ty` as a separate non-blocking CI job and revisit when it leaves `0.0.x`. Reason: beta with a stated unstable API should not block merges.
4. Pin tool versions: commit `uv.lock` and `pnpm-lock.yaml`, set `packageManager` in the root `package.json`, and pin Python in `.python-version`. Engineers and PMs then get the same toolchain.
5. Do not adopt Turborepo until CI exceeds roughly 5 minutes or a second TS app exists. Plain `pnpm -r` handles ordering. Revisit after launch.
6. Tests: pytest for Python (one `tests/` dir per package), Vitest or `node --test` for TS (not researched here, pick whichever the web app's framework defaults to). Add one end-to-end smoke test that calls `POST /v1/simulate` against a seeded fixture world, so a PM can see "it works" with one command.
7. Add a pre-commit hook that runs ruff and Biome on staged files only. Keep it under five seconds or people will bypass it.

## Open questions

- Current versions and release cadence of uv, ruff, Biome, pyright and `ty`. Find out: read each project's GitHub releases page directly; I could not search.
- Does Biome's lack of type-aware rules matter for the web app? Find out: run Biome on the first real TS code and see what slips through.
- Is Bun worth using instead of pnpm for speed? Not researched. Default to pnpm unless a measured install or test time says otherwise.
- Does `ty` give usable output on a numpy and pandas heavy codebase? Find out: run it on the simulation package once it exists.

## Sources

- [uv workspaces](https://docs.astral.sh/uv/concepts/projects/workspaces/), accessed 2026-10-11
- [Ruff documentation](https://docs.astral.sh/ruff/), accessed 2026-10-11
- [astral-sh/ty](https://github.com/astral-sh/ty), accessed 2026-10-11
- [biomejs/biome](https://github.com/biomejs/biome), accessed 2026-10-11
- [pnpm workspaces](https://pnpm.io/workspaces), accessed 2026-10-11
- [pytest documentation](https://docs.pytest.org/en/stable/), accessed 2026-10-11
- [Turborepo documentation](https://turborepo.dev/docs), accessed 2026-10-11
- [vercel/turborepo](https://github.com/vercel/turborepo), accessed 2026-10-11
