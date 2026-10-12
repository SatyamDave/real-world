# Receipts

## What it does

A public page and API that list every forecast we committed, before its outcome existed, with proof it has not been changed since. Each row shows the question, which forecaster made it (our simulation, a plain LLM reading the same news, the market), the probability, the market price at the moment we committed, the commit time, the hash, the outcome once known, and the Brier score. Anyone can press "verify" and their browser recomputes every hash and the chain back to the first day, without trusting our server.

## Who it is for

Skeptics: HN readers, forecasting researchers, YC partners and pilot buyers who want to know whether this works. It is the page we link when someone asks "how accurate is it?".

## How we know it works

- Format and rules: [decision 0002](../research/decisions/0002-benchmark-and-receipts.md). Contract: `GET /v1/receipts` (days, newest first, each with root, previous root, leaf count and anchor status) and `GET /v1/receipts/{date}` (the day record plus every entry, its salt and its leaf hash, its anchor status and every stored timestamp proof). A forecast entry also carries `question` (text, resolution source, resolves by) from the committed question set, so the page can show what was forecast and that it was committed before the resolution date.
- Anchoring: `python -m rw.ledger anchor --date D` sends the day's record hash to FreeTSA for an RFC 3161 token and to an OpenTimestamps calendar for a pending proof, and stores each reply in an append-only table. A day is `anchored` only when a stored token's message imprint equals its record hash, rechecked on every read; `pending` when it has only an OpenTimestamps calendar proof; otherwise `not_anchored`. `verify` fails on a token that vouches for any other hash. Tests replay recorded FreeTSA and calendar replies (`engine/tests/test_ledger.py`, `api/tests/test_api.py`).
- `python -m rw.ledger verify --date D` and the browser verifier both pass on fixture days and both fail when one entry byte, one leaf or one chain link is changed; the shared test vector proves Python and TypeScript hash identically.
- The database refuses UPDATE and DELETE on ledger tables (test).
- Every open question in a committed question set has one leaf per forecaster per day; the verifier reports any gap.
- The page states that a constant 50% scores 0.25, and shows each day's anchor status as one of: "anchored 2026-10-12 17:19:19 UTC by freetsa.org (RFC 3161 token)" with the token as a download, "anchor pending: OpenTimestamps proof awaits a Bitcoin block", or "not yet anchored" (`web/src/App.test.tsx`).
- Anyone can check a token without our code: `openssl ts -reply -in D.tsr -text` prints the message data, which must equal the day's record hash; `openssl ts -verify` with FreeTSA's published certificates checks the signature ([engineering/070](../research/engineering/070-commit-reveal-timestamping.md)).

## What it is not

- Not a leaderboard of accuracy claims. No percentage, no "beats the market" (see [benchmark](benchmark.md)).
- No edits or deletions, ever. A correction is a new entry that names the one it corrects.
- No fork results: counterfactuals cannot be scored.
- No public git mirror of the day records yet; that needs the founder.
- Our own check of a token stops at its message imprint. The token's signature and certificate chain, and the upgrade of a pending OpenTimestamps proof to a Bitcoin attestation, are follow-ups.

## Where the code lives

- `engine/rw/ledger.py`, the receipts endpoints in `api/rw_api/`, the page and verifier in `web/`.
- Research: [engineering/070](../research/engineering/070-commit-reveal-timestamping.md), [science/030](../research/science/030-forecast-scoring.md), [product/087](../research/product/087-trust-and-explainability.md), [business/092](../research/business/092-moat-theory.md).
