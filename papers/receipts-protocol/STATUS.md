# receipts-protocol

**Claim:** A forecast record whose questions are selected from reconstructible venue attributes with a public beacon seed and committed before forecasts, whose every forecaster-by-question cell is a salted positional Merkle leaf in a signed, hash-chained daily record that must carry RFC 3161 tokens from two of three named authorities, an OpenTimestamps Bitcoin attestation and a public transparency-log entry by a scheduled call time (the git mirror carries no trust), whose unrevealed, abstained or uncheckable cells score maximum loss, and whose baseline is a windowed market midpoint at that scheduled call time makes each modelled operator action impossible, charged, logged or detectable, while not proving accuracy and leaving hidden reruns (detectable only in aggregate) and Sybil records.

- **Stage:** internal review
- **Target venue:** International Journal of Forecasting; arXiv preprint
- **Title:** Receipts: A Tamper-Evident, Pre-Registered, Forward-Only Protocol for Scoring Forecasts Against the Market at Call Time

## Pending results

No component of Receipts v1 has run, so every result is a pre-registered hypothesis (paper Section 7, Table 2). The engine that exists (0.1.0) implements only the pre-genesis decision 0002 ledger, which the paper excludes from every Receipts claim.

| Hypothesis | What it measures | Produced by (future artifact) |
| --- | --- | --- |
| H1 integrity | Verifier rejects every mutation class, accepts unmodified records; scripted operator strategies scored as specified | `artifacts/receipts/integrity/report.json`, written by `engine/tests/test_ledger.py` |
| H2 reimplementation + rerun audit | Independent verifier agrees with reference on window 1; reruns test whether committed `rw-blind` forecasts were selected toward the market | `artifacts/receipts/reimpl/agreement.json` |
| H3 operations | Timely days (2 of 3 TSAs, Bitcoin, log entry), anchoring delays, snapshot mismatches | `artifacts/receipts/ops/anchoring.csv` |
| H4 retrieval leakage | LLM-only: live date-filtered search rerun vs cached-document rerun (forward run as noise reference) | `artifacts/receipts/contamination-gap/results.json` |
| H5 call-time sensitivity | Score vs market at cutoff, at T*, at each day's Bitcoin bound; window widths 1/15/60 min | `artifacts/receipts/calltime/results.json` |
| H6 confirmatory | `rw-blind` vs Kalshi market at scheduled T*, window 1; two-sided test plus TOST at ±0.01 Brier | `artifacts/receipts/window-1/scores.json`, `artifacts/receipts/window-1/questions.csv` |

## Before submission

- Genesis record (protocol constants, registry, selection rule, this analysis plan) committed and announced before the first scored forecast.
- Pilot window run to estimate variance and design effect (reported as achieved MDE only; it does not change N1); pilot excluded from window 1.
- Venue terms for redistributing prices read (open item from research note 051).
- Decision 0002 and BUILD_PLAN updated to match spec v1 (positional leaves, empty-day records, no correction entries, baseline from snapshot not leaf, wild cluster bootstrap-t, three TSAs, Rekor entry); genesis names the pre-genesis launch ledger.
- Independent implementer and three TSAs chosen and named; drand chain and external news API for H4 chosen.
- Named authors (IJF will not accept a corporate byline).

## Portfolio edit (2026-10-11)

Cross-paper consistency pass (see `../INDEX.md`): System description corrected; `rw-assim` renamed `rw-aware` (market prices among inputs); `llm-only` labelled a same-feed LLM; registry admits slots other papers pre-register (e.g. the matched baseline of *Don't Ask a Model*); publication policy points to *Governing*. Compiles with tectonic: no errors, no undefined references, no overfull boxes.

## Review log (2026-10-11, internal review round 1)

Three reviews (methods/statistics, citation audit, reviewer #2). Fixed:

- Selection seed now from a drand beacon round fixed by the schedule, not from H(R_{d-1}); salt grinding added as M16. Selection uses only reconstructible venue attributes (no price or volume criteria); fetch time and published response no longer matter.
- Abstention scores the maximum loss in every slot (no market price enters `rw-blind`); abstention cap kill switch removed; H6 runs whatever the abstention rate. "Dominated in expectation" removed.
- Market-blindness: committed news keyword filter (M19), beacon-derived seeds, input manifest hash in each leaf, H2 rerun audit for hidden best-of-k runs (M18); operator-run pipeline test stated as trusted.
- Rules, constants, `rw-blind` definition, filter, cluster/category rules frozen from W1 start to analysis date.
- Clusters = venue event id (Kalshi `event_ticker`); categories and reveal modes are lookups. H6 is Kalshi-only (Polymarket descriptive).
- W1: 8 new questions/day, min 21 / max 90 days, N1 counts H6-eligible questions (known at T*), closing-day tie rule, fixed analysis date, bound for unresolved questions.
- Inference: wild cluster bootstrap-t (Rademacher, 9,999), not tested below 30 clusters; matches Benchmark; day-block bootstrap of decision 0002 not used.
- H6: TOST margin 0.01 Brier and pre-registered wording per outcome; fixed-sequence direction stated; sigma_Delta derived from Delta=(p-m)(p+m-2y); "few dozen" projection dropped.
- Clock: three TSAs, two needed; M1 status split; H5 reports headlines against market at t_BTC; t_c stated as unenforceable.
- H4 redesigned as three arms (forward, cached-doc rerun, live external search) with MDE formula; three-hour buckets for the exploratory companion.
- Baseline: 15-candle median of Kalshi mids ending at T* (end_period_ts), usable-candle, spread and volume floors, width sensitivity (M17 marking the close); official figure always from S_d, mismatch scores maximum loss.
- Clear-mode reveal moved to T*+delta_S, after the snapshot.
- Logged mode: genesis signing key on every record; Rekor entry by T* is part of timeliness; equivocation rule; Wayback/Software Heritage captures. M11/M14 now detectable in logged mode.
- Early determination defined from Kalshi fields; sensitivity excluding early-determined cells; asymmetry noted; cross-paper rule stated.
- Proposition 2 restated against an explicit operator action model; venue-authenticity assumption stated; abstract and contributions no longer claim completeness.
- Pre-genesis launch ledger (decision 0002) named in genesis and excluded from every Receipts claim; spec version stated.
- Confirmatory ownership across papers stated; H6 framed as a product test, H1-H3 + rerun audit as protocol tests.
- Ethics: excluded selection categories, conflict-of-interest statement, trading ban marked unverifiable.
- Citations: Irving & Holden retraction reworded and the notice and referee report cited; wolfers2004/yang2025prophet split; Bitcoin wiki replaced by Bitcoin Core source and BIP 113; Snowberg claim weakened; Sainz wording; arnold key renamed; C2SP release tag noted; Prophet Arena intervals labelled as bootstrapped 95% CIs. Added (each opened and checked 2026-10-11): Atanasov 2017, Dai et al. 2025, Glasserman & Lin 2023, He et al. 2025, Chuat et al. 2015, Cameron et al. 2008, Schuirmann 1987, NIST IR 8213, drand docs, Bitcoin Core chain.h, BIP 113, Gipp et al. 2015, Schoenegger et al. 2024, Rekor OpenAPI spec, Kalshi Get Market docs, Irving & Holden retraction notice, Knottenbelt referee report. The citation audit verified the 55 earlier entries.
- Nice-to-haves done: horizon buckets, variance-weighted sensitivity, clipping incidence, RPS unnormalised, M14 gain formula, backtest disclosure at genesis, H2 pass criterion and implementer named at genesis, H1 artifact path aligned with BUILD_PLAN.

Not done: machine-checked protocol model (noted as future work); Halawi NeurIPS DOI (not verified); market-rank-of-24 detail from Prophet Arena (not verified).

Compiles with tectonic: no errors, no undefined citations or references, no overfull boxes; underfull hbox warnings in the bibliography only.

## Update for PRs #6-#38 (2026-10-12)

- The pre-genesis ledger is now code (`engine/rw/ledger.py`, PR #10; anchoring PR #29; scoring `engine/rw/score.py`, PR #9). The "Pre-genesis records" paragraph now describes what it does: hash-sorted leaves, no empty-day records, market price in the leaf, a fixed question list instead of beacon selection, no signature or transparency-log entry, one RFC 3161 token from freetsa.org (imprint and genTime read; CMS signature and certificate chain not checked), an OpenTimestamps calendar proof pending until Bitcoin, and a day-block bootstrap. The earlier text said it had no anchors.
- H1: `engine/tests/test_ledger.py` exists but tests only the pre-genesis format; the v1 mutation catalogue and strategy simulations still have to be added.
- Still open before genesis: positional leaves, empty-day records, signed records, three TSAs with certificate checks, Rekor entries, beacon selection, the snapshot record at T*, and the wild cluster bootstrap-t in `score.py`.

## Update for PRs #39-#46 (2026-10-12)

- "Pre-genesis records" now says what PR #42 and PR #46 built (repository commit `bff759c`): the daily cycle anchors each live day right after `publish` (FreeTSA token plus OpenTimestamps calendar proof; fixture days never sent); a day is anchored once a stored token's imprint equals its record hash; a failed or pending anchor is recorded in `stage_runs` and retried without stopping scoring; `publish` writes `var/receipts/<date>.json` with every entry and salt but no anchor proofs, so values are revealed at commit, not after a call time; `make mirror` (`scripts/mirror_receipts.sh`) pushes those files to a public git repo without force, refuses to change a mirrored day, skips fixture days, and is off until `RECEIPTS_MIRROR_REMOTE` is set. The mirror carries no trust, as in P4.
- Unchanged and still open: token signature and certificate chain unchecked; OpenTimestamps proofs not upgraded to a Bitcoin attestation; no live day anchored (no approved live question list); every other pre-genesis difference listed above. No result changes; H1-H6 stay pending.
