# 0006: The product makes its engine visible through seven surfaces

- Date: 2026-10-12
- Status: accepted
- Rests on: [gtm/messaging](../../gtm/messaging.md), [CPO lens](../lenses/cpo.md), [red-team lens](../lenses/red-team.md), [product/087-trust-and-explainability](../product/087-trust-and-explainability.md), [science/030-forecast-scoring](../science/030-forecast-scoring.md), [engineering/070-commit-reveal-timestamping](../engineering/070-commit-reveal-timestamping.md)

## Decision

The founder decided that the web app shows its engine and lets a visitor inspect it, through seven surfaces: `/world`, `/cycle`, `/questions/{id}`, `/scores`, a deeper `/receipts`, a deeper fork card and `/research`. The home headline is "Simulations with receipts." Every surface shows its method (the formula and parameters as used, linked to the source file and paper), its provenance (run, model, data source), the API call that returns the same data, and its uncertainty (bands, spreads and "not enough data" states, never a bare point estimate). Every number on a surface comes from the API; the fixture days power all of them without a key. Claims stay inside the allowed list in `gtm/messaging.md`.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep the toy surface: question, receipts strip, fork box | Smallest; already built | A visitor cannot tell a simulation with receipts from a chat answer; the trust note ([087](../product/087-trust-and-explainability.md)) says explainability is the product |
| Expose the engine in the app (chosen) | One product, one record, one set of numbers; every surface proves part of "sealed before the outcome, scored in public" | Seven surfaces to keep honest, each with a spec, a route and a test |
| A separate "lab" site for the engine | Keeps the app simple | Two looks and two sources of truth, which `CLAUDE.md` forbids; the proof sits away from the claim |

## Why this one

The red-team lens attacks the claim "scored in public" first; the answer is a record a stranger can open, recompute and replay, not a page that asserts it ([070](../engineering/070-commit-reveal-timestamping.md), [030](../science/030-forecast-scoring.md)). The CPO lens asks for one clear next action per page, which the journey daily question, world, question page, fork, API docs gives.

## What would make us revisit it

- After 30 days live, fewer than 5% of visitors who reach `/world` open a second surface.
- A surface cannot be kept to its spec: a number on it stops tracing to the API for two releases running.
- A claim on any surface needs wording outside `gtm/messaging.md` to stay readable.
