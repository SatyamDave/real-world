---
description: Write a new sourced research note in research/<area>/ from the template
argument-hint: <area> <question the note answers>
---

Write one research note answering: $ARGUMENTS

1. Read `research/README.md`, `research/CLAUDE.md` and `research/_TEMPLATE.md`.
2. Check whether a note already answers this. List `research/*/` and search for the topic. If one exists, stop and say which note, or add a dated "Update" section to it as `research/CLAUDE.md` describes.
3. Pick the area from the folders in `research/README.md`. Take the next unused three-digit number across all areas: `ls research/*/[0-9][0-9][0-9]-*.md | sort | tail -1`. Name the file `research/<area>/NNN-slug.md`.
4. Research the question. Open every source you cite and record the access date. If you cannot open a page, the fact does not go in. Never fill a gap from memory; write it under "Open questions".
5. Copy the template and fill every section. Lead with the answer. State confidence and why. Label your own inferences. Link related notes and lenses by repo path, and name any note this one conflicts with.
6. If the note changes what the company should do, say which decision record, spec or item in `company/decisions-needed.md` it affects. Do not make that change in this PR.
7. Run `python3 scripts/check_links.py` and fix any broken link.
8. Finish with `/ship-pr`. Title: `research: <topic>`.
