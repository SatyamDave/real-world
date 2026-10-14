# Contributing

Real World is open source under the [Apache License 2.0](LICENSE). By opening a pull request you agree that your contribution is licensed under the same terms.

Every change lands through a pull request that a reviewer can judge without asking the author anything. The full operating manual is [CLAUDE.md](CLAUDE.md); read it and the `CLAUDE.md` of every folder you touch.

## Before you open a PR

1. **Find the research.** Feature and architecture PRs link the note in `research/` or the decision in `research/decisions/` they rest on. If none exists, write it first, in its own PR (`/new-research`, `/new-decision`).
   Any change that makes or supports an accuracy, calibration or cost claim also links an experiment pre-registered in `experiments/` (`/new-experiment`).
2. **One concern per PR.** If the description needs the word "also", it is two PRs.
3. **Prove it.** Every PR that changes behavior includes the check that proves it works: a test, a benchmark run, or a recorded command and its output.

## The PR description

The template asks five things. CI refuses a PR that leaves any of them empty.

- **Why**: the problem, and the research or decision it rests on.
- **What changed**: every change in the PR, named.
- **How it was verified**: the commands you ran and what they showed.
- **Risk and rollback**: what could break, and how to undo it.
- **Product impact**: which spec in `product/` this touches, or "none".

## The flow

1. Branch from `origin/main` in a worktree, never in the primary checkout:
   `git fetch && git worktree add ../real-world-wt/<task> -b <type>/<task> origin/main`, then `make setup` there.
2. Commit with a conventional title (see [Titles](#titles)). Before pushing, `git fetch && git rebase origin/main` and run `make check`; it runs exactly what CI runs.
3. Push and open the PR as a draft with a body file that fills the template: `gh pr create --draft --title "<title>" --body-file <file>`. Never use `--fill`; it skips the template. `/ship-pr` walks the definition of done and opens the draft for you.
4. Mark it ready with `gh pr ready <N>` once `make check` passes. The `Claude review` workflow then reviews it against the `CLAUDE.md` files of every folder it touches and posts one comment.
5. Merge only with `scripts/merge_pr.sh <N>`. It waits until the CI and PR quality checks have reported and passed, then merges with a merge commit, never a squash. `gh pr checks --watch` and `gh pr merge` on their own return before a late check exists, which is how #8 and #9 merged with no check reported. On a failure, `gh run view <run-id> --log-failed` shows why; fix, push, run the script again.
6. If another PR merged first and conflicts, rebase on `origin/main`, rerun `make check`, push and wait again.
7. After the merge, remove the worktree and delete the branch.

## Public claims

Anything public (site copy, posts, the YC application, papers) makes only the claims allowed in [gtm/messaging.md](gtm/messaging.md).

## Titles

Use a plain conventional-commit title: `feat(engine): sample agents from census microdata`, `fix(api): reject forks without a base world`, `research: GDELT access and cost`. No taglines.

## Size

Keep PRs under about 400 changed lines, excluding lockfiles, generated files, papers, experiment results and research notes. CI refuses a larger PR unless its description says why it could not be split (20 of the first 32 PRs were over, 9 with no reason given).

## Forecasts are append-only

Nothing may edit or delete a published forecast or its hash. A correction is a new record that references the old one. The same holds for a registered experiment: its `PREREG.md` is frozen once its hash is in `experiments/REGISTRY.md` on `main`.

## Papers

After your PR merges, the `papers` workflow may open a follow-up PR updating `papers/`. Review it like code: every number must point to a committed artifact, and every citation must be real. See [papers/README.md](papers/README.md).
