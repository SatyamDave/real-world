# Contributing

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

## Review

Open the PR as a draft. Run `/ship-pr` to check it against the definition of done. When you mark it ready for review, the `Claude review` workflow reviews it against the `CLAUDE.md` files of every folder it touches and posts one comment.

## Public claims

Anything public (site copy, posts, the YC application, papers) makes only the claims allowed in [gtm/messaging.md](gtm/messaging.md).

## Titles

Use a plain conventional-commit title: `feat(engine): sample agents from census microdata`, `fix(api): reject forks without a base world`, `research: GDELT access and cost`. No taglines.

## Size

Keep PRs under about 400 changed lines, excluding lockfiles, generated files and research notes. CI warns above that. A larger PR says in its description why it could not be split.

## Forecasts are append-only

Nothing may edit or delete a published forecast or its hash. A correction is a new record that references the old one. The same holds for a registered experiment: its `PREREG.md` is frozen once its hash is in `experiments/REGISTRY.md` on `main`.

## Papers

After your PR merges, the `papers` workflow may open a follow-up PR updating `papers/`. Review it like code: every number must point to a committed artifact, and every citation must be real. See [papers/README.md](papers/README.md).
