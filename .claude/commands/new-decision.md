---
description: Record a hard-to-reverse decision in research/decisions/ from the template
argument-hint: <the choice to decide>
---

Write one decision record for: $ARGUMENTS

1. Read `research/decisions/CLAUDE.md` and `research/decisions/_TEMPLATE.md`.
2. Confirm the choice needs a record (the list is in `research/decisions/CLAUDE.md`). If it is reversible, stop and say so.
3. Find the evidence: the research notes and lenses that bear on it. If no note covers it, stop and run `/new-research` first.
4. If the choice is listed in `company/decisions-needed.md` or is otherwise the founder's to make, do not decide it yourself. Draft the record with status `proposed`, lay out the options, and ask the founder. Mark it `accepted` only with the founder's approval recorded in the PR.
5. Take the next unused four-digit number: `ls research/decisions/[0-9][0-9][0-9][0-9]-*.md | sort | tail -1`. Name the file `research/decisions/NNNN-slug.md`.
6. Fill the template. The decision is one testable paragraph. "Rests on" links notes by repo path. The options table includes the alternatives the lenses argued for. "What would make us revisit it" names an observable trigger.
7. If it supersedes an accepted record, change only the old record's status line to `superseded by NNNN`.
8. If it settles an item in `company/decisions-needed.md`, remove that item in the same PR.
9. Run `python3 scripts/check_links.py`, then finish with `/ship-pr`.
