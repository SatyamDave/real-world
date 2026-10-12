# Real World: operating manual

Read this file before any change. Then read the `CLAUDE.md` in every folder you touch; it holds only that folder's rules.

## Mission

Real World is a live simulation of the world's population that takes in each morning's news, polls and markets, corrects itself, and publishes hashed forecasts that are scored in public, misses included. Our job is to make that record honest and hard to beat, and to make every change here leave it better than we found it.

## Folder map

| Folder | Holds | Rules |
| --- | --- | --- |
| `research/` | Sourced notes by area, seat lenses, and the decision records in `research/decisions/` | `research/CLAUDE.md`, `research/decisions/CLAUDE.md` |
| `product/` | One spec per user-facing surface | `product/CLAUDE.md` |
| `experiments/` | Pre-registered experiments, their hashes in `REGISTRY.md`, and committed results | `experiments/CLAUDE.md` |
| `papers/` | Public papers built only from committed artifacts | `papers/CLAUDE.md` |
| `gtm/` | Launch plan, customers, pricing, builders program, messaging and allowed claims | `gtm/CLAUDE.md` |
| `company/` | North-star metric, the plan to Nov 2, risks, cadence, and decisions only the founder can make | `company/CLAUDE.md` |
| `.claude/commands/` | Slash commands that walk a session through each loop step | this file |
| `scripts/` | Repo checks, such as `check_links.py` | this file |
| `.github/` | PR template, PR quality check, papers workflow, Claude review | this file |
| Code folders | Added by the engine and app scaffold; each README links its product spec | the folder's own `CLAUDE.md` once it exists |

## The improvement loop

Every change is one step of this loop, in this order:

1. **Research note** in `research/<area>/`: what is true, with sources. Use `/new-research`.
2. **Decision record** in `research/decisions/`: what we chose and why, resting on notes. Use `/new-decision`.
3. **Product spec** in `product/`: what the user sees and how we know it works.
4. **Pre-registered experiment** in `experiments/`: hypothesis, metric and kill criterion, hashed before any run. Use `/new-experiment`.
5. **Code**, with the check that proves it.
6. **Paper update**: the `papers` workflow opens it after merge. Review it like code.

Each step links the step before it. A step may be skipped only as this table allows:

| Kind of change | Required steps | May skip |
| --- | --- | --- |
| New research or a corrected fact | 1 | 2-6 |
| Hard-to-reverse choice: hash format, scoring rule, update operator, meter unit, data source, public claim | 1, 2 | 3-6 until built |
| New or changed user-visible surface or API contract | 1 or an existing note, 2 if hard to reverse, 3, 5 | 4 unless it makes an accuracy, calibration or cost claim |
| Change to how the engine forecasts, samples, calibrates or assimilates | 1, 2, 4, 5 | none; step 6 follows from the results |
| Bug fix with a reproducible check | 5, linking the failing check | 1-4 |
| Refactor or performance change with no behavior change | 5, plus a benchmark for performance; link an engineering note in "Why" (CI requires a `research/` path for `feat`, `perf` and `refactor`) | 2-4 |
| CI, tooling, docs | 5 or the doc itself | 1-4, unless the doc states a fact, which then links a note |
| `gtm/` or `company/` change | the doc, with every fact linked to a note | 2-5 |

If the step you need first does not exist, write it in its own PR before the code.

## Every session leaves the product measurably better

- Start by naming the one thing this session will improve and how you will show it improved: a test that now passes, a metric that moved, a claim that is now sourced.
- Do only what was asked. Do not add features, options, abstractions, files or refactors nobody requested. If you see other work worth doing, list it in the PR body under "Follow-ups" or in `company/decisions-needed.md`; do not do it.
- Cut before you add. Deleting a dead path or a wrong claim counts as an improvement.
- Read the lenses in `research/lenses/` before changing scope. They record what the company refuses to build before Nov 2.
- Never leave the repo worse: no failing checks, no broken links, no unrelated files in the diff.

## One product, one look

Every surface (the landing page in `landing/`, the app in `web/`, share images, ads) is one product and looks like it. The design source is `landing/design/` (direction A, "Commit Slip"); the tokens are `styles/tokens.css`.

- Before any UI work, run `gh pr list --repo SatyamDave/real-world --state open` and read the open PRs on the same surface or on the design. Build on them or agree with their author first; never start a second look in parallel.
- Colours and typefaces come only from `styles/tokens*.css` and `styles/fonts.css`. `scripts/check_design.py` (in `make lint`) fails on a raw hex colour or literal `font-family` anywhere else, and on any difference between the `web/` and `landing/` tokens.
- A change to the look (tokens, type scale, a motif) lands in the design source first, in its own PR, then in each surface.
- A PR that changes `web/src` or `landing/src` UI includes screenshots at 390 and 1440 px wide. `pr-quality.yml` refuses one without them.

## Definition of done for a PR

A PR is done when all of these hold:

1. It does one thing. If the description needs "also", split it.
2. Every section of `.github/pull_request_template.md` is filled, and "What changed" names every change.
3. It links the loop step it rests on, and skips only what the table above allows.
4. It includes the check that proves it: a test, a benchmark run, or a recorded command and its output.
5. It follows the `CLAUDE.md` of every folder it touches.
6. If it changes what a surface does, its `product/` spec changes in the same PR.
7. Every number traces to a committed artifact or a linked research note. Every link resolves.
8. No published forecast, hash, salt, question list or registered pre-registration changed.
9. CI is green, including the Claude review. It is under about 400 changed lines outside docs, or says why it cannot be split.
10. A reviewer can judge it without asking the author anything.

Use `/ship-pr` to walk through this list before opening the PR.

## Forecasts are append-only

- A published forecast, its salt, its hash, the daily Merkle root and the timestamp proofs are never edited or deleted.
- The list of scored questions, their resolution sources and the scoring rule are committed and hashed before any forecast on them. Do not choose which questions to publish after seeing how they go.
- A correction is a new record that references the old one. A miss stays on the record.
- Nothing backfills the record. A backtest is labelled "retrospective" and never enters the scored record.
- Code that writes to the ledger only appends. A PR that adds an update or delete path to it is rejected.

## No fabricated numbers

- Every number in this repo comes from a committed artifact (cite its path and commit) or a research note (link it).
- An estimate says it is an estimate and links what it was built from. Prefer a measured number; replace estimates as soon as a measurement exists.
- If a number is unknown, write "unknown" and how we would find out. Never fill the gap with a plausible figure.
- Never invent a citation, a quote, a customer, a result or a date. Cite only pages someone opened.
- Report results with their n and interval, including the ones that make us look bad.
- Public claims follow `gtm/messaging.md`. If a claim is not on its allowed list, do not make it.

## Zeroshot for bounded implementation work

Use Zeroshot for any bounded implementation task that a separate worker can do and a verifier can judge: a feature slice, a bug fix with a reproducible check, a hardening pass, a test backfill. Do not use it for research, one-line edits, or anything waiting on a founder decision.

1. Write the brief as one paragraph in `task.json` as `{"task": "..."}`: the desired behavior, the observable success, the constraints (folder rules, frozen contracts, "no push" when asked), and the exact check commands.
2. Run from a worktree on a branch cut from `origin/main`, never from the primary checkout:
   `zeroshot run --title "<title>" --profile local:opus-change --input task.json --validate-only`, then the same command without `--validate-only`.
3. A run succeeds when both verifiers accept, not when a commit exists. Report the run id, the final state, the verifier verdicts and the commits.
4. Review the diff yourself against this file before opening a PR. Keep `task.json` outside the checkout; never commit it.
5. A worker already inside a Zeroshot run does its own work and never starts another run.

## Writing style for everything here

Plain, specific, short sentences. Imperative for rules. No hype, no emoji, no capitals for emphasis. Link the evidence instead of describing it.
