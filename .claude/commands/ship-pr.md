---
description: Check the current branch against the definition of done and open a draft PR
argument-hint: [optional PR title]
---

Get the current branch ready to merge, then open a draft pull request. Title hint: $ARGUMENTS

1. Read the root `CLAUDE.md`. Run `git diff --name-only origin/main...HEAD` and read the `CLAUDE.md` of every folder the diff touches, and of each parent folder.
2. Check the diff is one concern. If the description would need "also", stop and propose how to split it.
3. Check the loop: which step of the improvement loop is this, and does it link the step before it? Use the table in the root `CLAUDE.md` to confirm any skipped step is allowed.
4. Check each folder's rules against the diff, file by file. Fix what fails.
5. Check numbers and claims: every number traces to a committed artifact or a linked note; no claim on the forbidden list in `gtm/messaging.md`; no published forecast, hash, question list or registered `PREREG.md` changed (`git diff origin/main...HEAD -- experiments/*/PREREG.md` shows only new files).
6. Run the checks and keep their output for the PR body:
   - `python3 scripts/check_links.py`
   - `find . -name CLAUDE.md -not -path './node_modules/*' | sort`
   - for registered experiments, `shasum -a 256 experiments/E*/PREREG.md` matches `experiments/REGISTRY.md`
   - the code's own checks once they exist (`make check`)
7. If the diff touches `web/`, `landing/`, `api/`, `sdk/`, `README.md`, `product/` or `gtm/`, run the `consistency-reviewer` agent (`.claude/agents/consistency-reviewer.md`) on it, with the 390 and 1440 px screenshots for a UI change, and fix every `changes needed` line before going on.
8. Check `git status` shows no unrelated or untracked files.
9. Write the PR body with every section of `.github/pull_request_template.md` filled: why (link the note or decision under `research/`), every change named, the commands run and what they showed, risk and rollback, product impact.
10. Use a conventional-commit title, e.g. `feat(engine): ...`, `research: ...`, `docs(gtm): ...`.
11. Open it as a draft: `gh pr create --draft --title "<title>" --body-file <file>`. Never use `--fill`. Mark it ready for review only when the checks pass; that triggers the Claude review.
12. Merge only with `scripts/merge_pr.sh <N>`, which waits until every required check has reported and passed; never `gh pr merge` by hand [#8, #9].
