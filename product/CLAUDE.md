# product/

`product/README.md` fixes the five questions every spec answers. This file adds what a session must do here.

## Scope

- One spec per surface: `product/<surface>.md`. The product is the [message test](will-it-land.md) for consumer (B2C) founders, with its backtest, [your tests](track-record.md) and one "Public record" link to the proof (receipts, scores, question pages, the [daily question](daily-question.md)), per [decision 0016](../research/decisions/0016-icp-audiences.md). Forks, the world and `POST /v1/simulate` are the engine's interface, not product surfaces. No spec pitches businesses, enterprise, country populations, an Event tab, "Call it" or a ledger tape as the product. A new surface needs a decision record first.
- Every product screen does one job a person can finish in under a minute, proves itself with something sealed before the outcome, and never asks for trust it has not earned.
- A field, endpoint or event is defined once, in the JSON Schema the code generates from. Specs link it; they never restate it in prose.
- A term is defined once. Before using a word like agent-step, world snapshot, fork, ensemble member, receipt, skill or coverage tier, check how the existing specs define it, and reuse that definition.
- `glossary.md` is the one list of terms; its `Do not write` column names the synonyms `scripts/check_glossary.py` refuses on every user-facing surface. Add a synonym there when a surface used it, with the PR in the rules log.
- `design.md` is the one look; a spec's copy and states follow it and do not restate it.

## A great spec

- "What it does" is written for the user, in words they would use.
- User-facing copy is written out literally, including empty, loading, refused and error states.
- "How we know it works" is one measurable outcome and the automated check that proves it, by name.
- "What it is not" names the cuts the lenses made for this surface.
- Every claim about users, cost or accuracy links a research note or a committed result.
- Every output shows its spread (and the coverage tier on country results in the public record), never a bare point estimate, and every simulated output is labelled as simulated.
- Spend paths name their cap and say they fail closed when the cap cannot be checked.

## What gets rejected

- A spec for a surface the lenses cut before Nov 2, without a decision record reversing the cut.
- A code PR that changes a surface's behavior without changing its spec in the same PR.
- Copy that makes a claim `gtm/messaging.md` does not allow.
- A "works" line that cannot be checked automatically.
- UI for a state that only exists when something broke. Fix the cause instead.
