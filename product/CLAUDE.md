# product/

`product/README.md` fixes the five questions every spec answers. This file adds what a session must do here.

## Scope

- One spec per surface: `product/<surface>.md`. The launch surfaces are the daily question, the receipts page, the fork card and `POST /v1/simulate`; see `research/lenses/cpo.md`. A new surface needs a decision record first.
- A field, endpoint or event is defined once, in the JSON Schema the code generates from. Specs link it; they never restate it in prose.
- A term is defined once. Before using a word like agent-step, world snapshot, fork, ensemble member, receipt, skill or coverage tier, check how the existing specs define it, and reuse that definition.

## A great spec

- "What it does" is written for the user, in words they would use.
- User-facing copy is written out literally, including empty, loading, refused and error states.
- "How we know it works" is one measurable outcome and the automated check that proves it, by name.
- "What it is not" names the cuts the lenses made for this surface.
- Every claim about users, cost or accuracy links a research note or a committed result.
- Every output shows ensemble spread and coverage tier, never a bare point estimate, and every simulated output is labelled as simulated.
- Spend paths name their cap and say they fail closed when the cap cannot be checked.

## What gets rejected

- A spec for a surface the lenses cut before Nov 2, without a decision record reversing the cut.
- A code PR that changes a surface's behavior without changing its spec in the same PR.
- Copy that makes a claim `gtm/messaging.md` does not allow.
- A "works" line that cannot be checked automatically.
- UI for a state that only exists when something broke. Fix the cause instead.
