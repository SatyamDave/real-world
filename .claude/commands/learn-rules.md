---
description: Learn from merged PRs and turn repeated mistakes into rules and checks
argument-hint: [optional first PR number to read from]
---

Read what went wrong in recently merged PRs and make it impossible, or at least written down, so it does not happen again. Start from: $ARGUMENTS

1. Find the range. Read `company/rules-log.md`; its last row names the last PR already learned from. Read every PR merged after it (or from the argument): `gh pr list --repo SatyamDave/real-world --state merged --limit 100 --json number,title,mergedAt`.
2. For each PR collect the evidence of a mistake, not opinions:
   - fix-up commits on the branch after the first push (`gh pr view N --json commits`), and later PRs whose title or body says they fix it;
   - failed CI runs on the branch (`gh run list --repo SatyamDave/real-world --branch <head> --json conclusion,displayTitle`) and the failing step;
   - review comments and Claude review output (`gh pr view N --comments`);
   - "Deviations", "Not fixed", "still open" or "follow-up" sections in the PR body;
   - reverts, and critic or verification reports that name the PR.
3. Group the evidence into failure classes ("merged before CI ran", "fixture copy shown to users", "fake model reported as a real one", "two looks for one product"). Keep a class only if it happened in two or more PRs, or once with a user-visible or record-breaking effect.
4. For each class, add the strongest guard that fits, in this order:
   1. A mechanical check: a test, a script under `scripts/` run by `make lint` or `make check`, or a rule in `.github/workflows/pr-quality.yml`. Show it fails on the old mistake and passes on `main`.
   2. For a consistency failure (two looks, two words for one thing, two error shapes, an SDK gap), extend the guard that owns it instead of writing a new one: a rule in `scripts/check_design.py`, a `Do not write` entry in `product/glossary.md`, a case in `api/tests/test_error_shape.py`, `scripts/check_sdk_parity.py`, or a line in `product/design.md` and the `consistency-reviewer` agent.
   3. Otherwise one line in the `CLAUDE.md` of the folder where the mistake happens (root `CLAUDE.md` only when it spans folders), written as an instruction, with the evidence PRs in brackets, e.g. `[#8, #9]`.
5. Do not add a rule without evidence. Do not weaken or delete a check. Merge a new rule into an existing one when they say the same thing; delete a rule that the evidence shows is wrong, and say why.
6. Append one row per class to `company/rules-log.md`: date, class, evidence PRs, the guard added (path), and whether it is mechanical. Update the "Last PR learned from" line.
7. Run `make check`. Open one PR titled `chore(rules): learn from #A-#B` on a branch starting `rules/`, with every section of `.github/pull_request_template.md` filled; "Why" lists each class with its evidence.
