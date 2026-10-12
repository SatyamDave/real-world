# 0002: Forecast receipts, scoring and pre-registration

- Date: 2026-10-11
- Status: proposed
- Rests on: [science/030](../science/030-forecast-scoring.md), [science/097](../science/097-benchmark-design.md), [science/098](../science/098-darpa-socialsim.md), [engineering/070](../engineering/070-commit-reveal-timestamping.md), [engineering/072](../engineering/072-replay-and-caching.md), [market/005](../market/005-prediction-markets-landscape.md), [data/051](../data/051-prediction-market-apis.md), [data/059](../data/059-resolvable-events-calendar.md), [science/021](../science/021-llm-forecasting.md), [product/087](../product/087-trust-and-explainability.md), [lenses/red-team.md](../lenses/red-team.md), [0001](0001-architecture.md)

## Decision

Every forecast is a leaf in a daily Merkle tree. A leaf is the SHA-256 of a salted, canonical JSON entry. The day's root is chained to the previous day's root and stored in an append-only ledger that the database itself refuses to update or delete. The question set and the scoring protocol are hashed and committed before any forecast that uses them. We score binary questions with Brier (headline) and log score, and we report skill only as a paired difference against the market price at commit time and against a plain-LLM baseline, with n and a day-block bootstrap interval. The scored simulation forecast never sees market prices. No comparative claim is made below 100 resolved questions.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| A. Salted leaves, daily Merkle root chained to yesterday, append-only table; anchors (OpenTimestamps, RFC 3161, public git) added on top (chosen) | About 100 lines, verifiable with `sha256sum` and a browser; leaves can be embargoed later without a format change | Needs external anchors before the record proves time to an outsider |
| B. Hash each forecast separately, no tree | Simplest | One anchor per forecast; no proof a day's set is complete (a dropped leaf goes unnoticed) |
| C. Rekor or a witnessed transparency log | Third-party witness | Operational cost, no witnesses exist yet ([070](../engineering/070-commit-reveal-timestamping.md)) |
| D. Score the assimilated forecast against market price | One forecast, simpler | Assimilating market moves then scoring against markets is circular ([red-team](../lenses/red-team.md)) |
| E. Headline Brier skill score ratio or accuracy % | Familiar | Unstable below about 100 questions; "% accuracy" is what discredited vendors publish ([003](../market/003-synthetic-research-vendors.md)) |

## Why this one

The record is the product and the moat ([092](../business/092-moat-theory.md)). It must be cheap enough to ship this week, verifiable by anyone without our code, and impossible for us to quietly edit. Option A gives that, and its format does not change when anchors are added.

### The receipt format

**Entry** (one per forecaster per question per day). Every value is a string so Python and JavaScript produce identical bytes; probabilities have exactly four decimals.

```json
{
  "kind": "forecast",
  "date": "2026-10-14",
  "question_id": "fed-2026-10-28-cut",
  "question_hash": "<sha256 of the question's canonical JSON>",
  "forecaster": "sim",
  "probability": "0.6250",
  "market_price_at_commit": "0.7100",
  "market_source": "kalshi:FED-26OCT-T4.25",
  "committed_at": "2026-10-14T06:00:00Z",
  "model": "claude-haiku-5-5",
  "engine_version": "0.1.0",
  "config_hash": "<sha256 of engine/rw/settings.py values as canonical JSON>",
  "snapshot_sha256": "<sha256 of var/snapshots/2026-10-14/agents.parquet>",
  "supersedes": ""
}
```

`forecaster` is one of `sim`, `plain_llm`, `market`. Other entry kinds use the same leaf rule: `question_set` (the frozen list for a horizon, with its hash), `protocol` (the hash of `data/protocol.json`), `correction` (a new entry whose `supersedes` names the leaf hash it corrects; the old leaf stays).

**Canonical JSON.** Keys sorted, no whitespace, UTF-8, no floats (strings only). In Python: `json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()`. A shared test vector in `data/fixtures/receipts_test_vector.json` is checked by both the Python and TypeScript tests.

**Leaf.** `salt` is 16 random bytes, hex. `leaf_hash = sha256(0x00 || canonical(entry + {"salt": salt}))`. Salts are published with the entry when the entry is public; the salt exists so a future embargoed entry (for example a vote-share forecast on election day, [074](../engineering/074-abuse-and-safety.md)) can be committed as a bare hash and revealed later with no format change.

**Tree.** RFC 6962 style: `node = sha256(0x01 || left || right)`; leaves sorted by leaf hash; an odd node is carried up unpaired. An empty day is not allowed: a day with no forecasts is not committed.

**Day record.**

```json
{
  "date": "2026-10-14",
  "prev_root": "<root of the previous committed day, or 64 zeros for the first>",
  "root": "<Merkle root>",
  "leaf_count": "37",
  "protocol_hash": "<sha256 of data/protocol.json>",
  "engine_version": "0.1.0"
}
```

`record_hash = sha256(canonical(day_record))`. This is the value we anchor (OpenTimestamps, one RFC 3161 token, the public git mirror) once those land. Until then the receipts page says "not yet anchored".

**Append-only.** `ledger_leaves` and `ledger_days` have `BEFORE UPDATE` and `BEFORE DELETE` triggers that abort. Committing a day twice is a no-op if the entries match and an error if they differ. Verification (`python -m rw.ledger verify --date D`, and the receipts page in the browser) recomputes every leaf, the root and the chain back to genesis, and fails on any modified entry, dropped leaf or broken link.

**What it proves.** That these exact bytes existed no later than the anchor time. It does not prove the forecast was made without hindsight, and it does not prove we published every forecast we made. The second gap is closed by committing the question set first: every question in a committed set must get a forecast from every forecaster on every day it is open, and the verifier reports any missing pair.

### Scoring

All rules live in `data/protocol.json` and its hash is in every day record. Changing a rule means a new protocol file, a new hash and a public changelog line; scores are always reported under the protocol they were committed with.

| Rule | Value |
| --- | --- |
| Questions | Binary only in the base build. Fixed resolution source and tie-break rule stored in the question entry. Resolves in 1-30 days. |
| Headline score | Brier: `(p - o)^2`, `o` in {0, 1}. Coin flip reference: 0.25, shown next to every score. |
| Second score | Log score with `p` clipped to [0.01, 0.99]; the clip is published. |
| Market baseline | The market price snapshot taken at commit time, stored inside the leaf. Never a later price. |
| Plain-LLM baseline | Same news context, no population, 5 samples, trimmed mean (drop min and max). |
| Skill | Per question, `d = Brier(sim) - Brier(baseline)`; report mean `d`, n, and a 95% interval from a block bootstrap that resamples whole commit days (1,000 resamples, fixed seed). Negative is better. Reported against `market` and against `plain_llm` separately; never pooled into one number. |
| Breakdowns | By coverage tier and by region, each with its own n. |
| Claims | Below 100 resolved questions the receipts page and API return `claim: "insufficient_n"` and show no "beats" language. |
| Which forecast | The scored `sim` forecast is blind: no market price reaches its prompts or its assimilation. A test enforces this. |
| Exclusions | A question is voided only if its resolution source never publishes; voids are listed, not dropped. |
| Backtests | Never on the receipts page. Any retrospective run is labelled "retrospective" and kept out of the ledger. |

### Pre-registration

1. `data/protocol.json` is committed as a `protocol` leaf on the first day and whenever it changes.
2. The question set for a horizon is committed as a `question_set` leaf on or before the first day any of its questions is forecast. Its hash appears in every forecast leaf through `question_hash` lineage.
3. Every open question in a committed set gets one leaf per forecaster per day. A missing leaf is a verification failure, not a silent gap.
4. Outcomes are recorded in `resolutions` with the source URL and the date read; a resolution is itself a new row, never an edit.
5. Before launch, the protocol text in [product/benchmark.md](../../product/benchmark.md) is registered on OSF (no embargo) and linked from the receipts page.

## What would make us revisit it

- Market price feeds turn out not to be displayable under Kalshi or Polymarket terms ([051](../data/051-prediction-market-apis.md)): keep the price inside the leaf, show only our score difference and a link.
- We need numeric questions: add fair CRPS and interval coverage as a new protocol version, not an edit.
- An outside party offers to witness the log: add a witness signature next to the record hash.
- A reviewer shows the bootstrap is too narrow for correlated questions: widen the block (by week) in a new protocol version.
