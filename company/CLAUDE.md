# company/

How the company runs: the north-star metric, the plan, risks, cadence, and the decisions only the founder can make. These files steer every other folder, so they must stay current and sourced.

## A great contribution

- It changes the plan because something was learned, and links what was learned: a result, a research note, a buyer call, a missed gate.
- Every metric names its definition, where it is computed from, its current value with date, and its target. "Not measured yet" is a valid value; a guess is not.
- Every risk has one owner seat, a mitigation with a date, and the signal that tells us it is happening.
- A gate in `plan-to-nov-2.md` is marked passed, failed or slipped with evidence. A failed gate triggers its kill criterion, written down in the same PR.
- An item leaves `decisions-needed.md` only when the founder has decided, and the PR links the decision record that holds it.

## What gets rejected

- Moving a gate date or loosening a kill criterion without saying which gate failed and why.
- Deciding an item in `decisions-needed.md` on the founder's behalf.
- Metrics without a source of truth, or vanity metrics that cannot fall.
- Adding work to the plan that a lens cut, without a decision record.
- Silent edits to a past daily or weekly entry. Correct with a new dated entry.
