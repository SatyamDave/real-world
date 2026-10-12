# Receipts

## What it does

A public page and API that list every forecast we committed, before its outcome existed, with proof it has not been changed since. Each row shows the question, which forecaster made it (our simulation, a plain LLM reading the same news, the market), the probability, the market price at the moment we committed, the commit time, the hash, the outcome once known, and the Brier score. Anyone can press "verify" and their browser recomputes every hash and the chain back to the first day, without trusting our server.

## Who it is for

Skeptics: HN readers, forecasting researchers, YC partners and pilot buyers who want to know whether this works. It is the page we link when someone asks "how accurate is it?".

## How we know it works

- Format and rules: [decision 0002](../research/decisions/0002-benchmark-and-receipts.md). Contract: `GET /v1/receipts` (days, newest first, each with root, previous root, leaf count, anchored or not) and `GET /v1/receipts/{date}` (the day record plus every entry, its salt and its leaf hash).
- `python -m rw.ledger verify --date D` and the browser verifier both pass on fixture days and both fail when one entry byte, one leaf or one chain link is changed; the shared test vector proves Python and TypeScript hash identically.
- The database refuses UPDATE and DELETE on ledger tables (test).
- Every open question in a committed question set has one leaf per forecaster per day; the verifier reports any gap.
- The page states that a constant 50% scores 0.25, and shows "not yet anchored" until timestamping lands.

## What it is not

- Not a leaderboard of accuracy claims. No percentage, no "beats the market" (see [benchmark](benchmark.md)).
- No edits or deletions, ever. A correction is a new entry that names the one it corrects.
- No fork results: counterfactuals cannot be scored.
- External anchoring (OpenTimestamps, RFC 3161 token, public git mirror) is a follow-up slice, not in the base build.

## Where the code lives

- `engine/rw/ledger.py`, the receipts endpoints in `api/rw_api/`, the page and verifier in `web/`.
- Research: [engineering/070](../research/engineering/070-commit-reveal-timestamping.md), [science/030](../research/science/030-forecast-scoring.md), [product/087](../research/product/087-trust-and-explainability.md), [business/092](../research/business/092-moat-theory.md).
