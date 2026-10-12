# research/

Notes here are the evidence every other folder cites. A wrong note spreads into specs, papers and pitches, so the bar is a careful reviewer who opens every link.

## File names

- A note is `research/<area>/NNN-slug.md`. `NNN` is the next unused three-digit number across all areas, not per area.
- Areas are the folders listed in `README.md`. Do not create a new area without a decision record.
- Seat reviews are `research/lenses/<seat>.md`. A lens is rewritten in place only by its seat, with a new date.

## A great note

- Its first paragraph answers the question and says what Real World should do. A reader who stops there acts correctly.
- Every fact links the page someone opened, with the access date. Numbers keep their units, sample and source.
- It states its confidence and why, including "search budget ran out" or "terms not read" when true.
- It separates what the source says from the author's inference, and labels the inference.
- It ends with recommendations a PM or engineer can pick up without asking.
- It names the notes it agrees or conflicts with by repo path.

## What gets rejected

- A fact with no link, or a link to a search result, a snippet or a page nobody opened.
- A number rounded, converted or extrapolated without saying so.
- A note that argues for a conclusion and omits the evidence against it.
- Licence or terms claims that were not read on the licensor's own page. Write "unread" instead.
- Edits that change an existing note's conclusion silently. Change the conclusion in a new dated section that says what changed and why, and update the date.
- Notes copied from model memory. If you cannot open a source, the fact does not go in.

## Updating notes

- Fix a broken link or a typo in place.
- New evidence that changes an answer: add a dated "Update" section at the top of the note and say which decisions and specs it affects.
- When notes conflict, do not pick a winner in a note. Open a decision record or add the conflict to `company/decisions-needed.md`.

## Before you open the PR

- Run the link check from `/ship-pr`.
- Title it `research: <topic>`.
