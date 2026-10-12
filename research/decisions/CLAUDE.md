# research/decisions/

A decision record freezes a hard-to-reverse choice so nobody relitigates it by accident. Copy `_TEMPLATE.md`, or use `/new-decision`.

## Which choices need a record

Hash and ledger format, scoring rule, belief update and assimilation operator, meter unit and price, any data source entering the shipped pipeline, the API contract's breaking shape, the product name, and any public claim beyond `gtm/messaging.md`. A reversible implementation detail does not need one.

## File names and status

- `NNNN-slug.md`, four digits, next unused number. Numbers are never reused.
- Status moves only forward: `proposed`, then `accepted`, then `superseded by NNNN`.
- An accepted record is never rewritten. To change it, write a new record that supersedes it, and change only the old record's status line.

## A great record

- The decision fits in one paragraph and is testable: a reviewer can tell whether code follows it.
- "Rests on" links at least one research note or lens by repo path. A decision with no note behind it waits for the note.
- The options table holds the real alternatives the notes raised, including the one the lenses argued for if it lost.
- "Why this one" cites evidence, not preference.
- "What would make us revisit it" names an observable trigger: a metric crossing a threshold, a licence reply, a date.
- If it settles an item in `company/decisions-needed.md`, the same PR removes that item.

## What gets rejected

- A record that decides something only the founder can decide, without the founder's approval recorded in the PR.
- A record written after the code it justifies has merged.
- Two decisions in one file.
- Editing an accepted record's decision, options or reasoning.
