# Don't Ask a Model, Ask a World

- **Claim:** A population model calibrated to published marginals, whose segment beliefs are corrected every morning against polls, and whose forecasts are hash-committed before outcomes exist, will forecast better than an LLM given the same observation bundle, models and compute. This is a pre-registered hypothesis, not a result, and the protocol also tests the opposite (equivalence within 0.01 Brier).
- **Stage:** internal review
- **Target venue:** arXiv cs.AI preprint, then a NeurIPS-style venue (position/systems track).
- **Build:** `cd papers/ask-a-world && tectonic paper.tex`
- **Scored system:** the public build. Its population comes from GLOPOP-S plus published survey aggregates, not IPUMS International. The primary forecaster W never sees a market price.

## Pending results

No forecast result exists. Each hypothesis is pre-registered (Section 6, Appendix A) and waits on a future artifact; none of these paths exists yet. The only Real World numbers in the paper are the synthetic checks E003 and E006 of the assimilation operator (new Section 7), which are not forecast skill.

| Hypothesis | What it tests | Produced by |
| --- | --- | --- |
| H1 (primary) | Market-blind W vs matched B1 (same bundle, model mixture, K calls), raw Brier. Superiority / equivalence / inferiority / inconclusive | `eval/ask-a-world/h1_w_vs_model.json` |
| H2 | W−B0 by liquidity tercile, estimation only | `eval/ask-a-world/h2_w_vs_market.json` |
| H3 | W vs A1–A3, poll-only filter P, lookup L, B2, B2q, B3 on attitude questions | `eval/ask-a-world/h3_assimilation.json` |
| H4 | SD ratio (ordinal items) and prequential coverage TOST | `eval/ask-a-world/h4_dispersion.json` |
| H5 | Fork contrast sign vs observed poll change (separate research track) | `eval/ask-a-world/h5_forks.json` |
| H6 | Coherence violation rate, W vs B1 | `eval/ask-a-world/h6_coherence.json` |
| Cost | Cost per forecast, every arm | `eval/ask-a-world/cost.json` |
| All | Hashed daily forecast ledger | `ledger/YYYY-MM-DD/root.json` |

## Before the first scored day

- Fill the manifest: the topic list, model identifiers, venue list, entity and event-family tables, and the class/topic lookup.
- Run the pre-period fits (λ, q, house-effect variance, v, γ, δ) with held-out countries excluded.
- Hash Sections 6 and Appendix A into the ledger and file them on OSF.
- Confirm in writing the licence terms for GLOPOP-S (commercial use), the attitude sources and the market data. A source with unknown terms stays blocked.

## Review log (internal review, 2026-10-11)

Three reviews: methods/statistics (4/10), citation audit (6/10), reviewer #2 (4/10). Fixed:

- **H1 now compares equal information.** B1 is matched to W on the observation bundle, the model mixture and the number of calls. Both arms are scored raw in the primary analysis and calibrated by an identical rule as a secondary. With-markets arms (W_m, B1_m) are secondary only.
- **The primary W is market-blind.** R3 now uses event-cluster exclusion (a hashed rule) instead of "logically equivalent". Markets are never assimilated into the state, since there is no operator for them.
- **The response model and observation operator are defined.** The agent's belief is the segment position plus a fixed offset, answers follow a logistic or ordered-logit model, and the poll operator h_F is computed over the agents (it is nonlinear and handles the Jensen gap). House effects are augmented state. Polls enter once, on release, with an age penalty.
- **The forecast model is consistent with the analysis.** The push is a pure shift, so within-segment variance is preserved. δ caps news forcing only. Exposure is per story. The model is described as an anchored forced AR(1) with no social term. λ decay is discussed, fitted, and given a λ=0 sensitivity arm.
- **The filter is specified.** It is an iterated EKF with diagonal cross-segment covariance, so "relaxes to prior" is consistent. The gain is renamed G. The identifiability limit is stated. ETKF with localization and inflation is an upgrade path that would start a new version.
- **The question-to-state mapping is defined.** Class P questions (population-decided) are computed analytically from the state, with no LLM setting the number. Class C questions use a state summary given to the same LLM mixture. The population-weighted lay-belief pathway for events is dropped. Results are split by class and by mapped topics.
- **New baselines and ablations:** the poll-only Kalman filter P (Linzer-style), the non-LLM marginal lookup L, the no-persona prevalence query B2q, the B1+market blend B4, and A3 (no individual agents). A1 keeps news forcing. A1–A3 are H1 secondaries.
- **Statistical plan:**
  - The unit of analysis is the first commit.
  - Brier is the primary metric; the log score is secondary and is the only metric that is clipped.
  - Inference uses a cluster bootstrap by event cluster (B=10,000), with Diebold–Mariano/HAC as a robustness check.
  - The decision rule uses a 90% two-sided interval, with SESOI 0.01 and TOST equivalence.
  - Sample size: n_min=300, n_req from the day-30 σ and design effect (variance only), a 365-day cap, and an "underpowered" label if the cap is reached.
  - Illustrative power arithmetic is included and labelled as illustrative.
- **Rules added:** missing forecasts are scored 0.5 and counted; voided, 50-50, Too Early and disputed contracts are excluded but revealed; the eligibility rule follows the OTS attestation; only the frozen version counts; the calibration and interval warm-up rules are stated; B0 is defined (midpoint at c_t, defining venue, fallback rule); liquidity terciles are defined.
- **H2 is recast as estimation.** H4 is restricted to ordinal items, uses prequential coverage and TOST, and compares against day-0 W, L and persona sampling; its likely low power is stated. H5 is recast as a fork-contrast sign test on a separate track, with a post-event W comparator. H6 (coherence) is added, and the "coherent by construction" claim is limited to class P.
- **Receipts:** the question list, leaf count and leaf-to-question mapping are published in clear; every leaf is revealed, including voids; an RFC 3161 token is added. (Superseded by the portfolio edit below: values are revealed at the call time, as in *Receipts*.)
- **Scored build named:** the public build is GLOPOP-S plus published aggregates. "Census-Grounded" is removed from the title and abstract. Donor matching is no longer justified by Park et al.; the conditional-independence assumption is stated. The "negligible sampling noise" claims are replaced with per-segment arithmetic.
- **Companion papers** are marked "in preparation". Everything the protocol needs is now in Appendix A: the question rule, event clusters, the parameter table, the calibration rule and the interval correction.
- **Citations corrected:**
  - Prophet Arena: models saw market prices; retrospective set.
  - Bisbee: Table 1 affective polarization.
  - Doudkin: both caveats, single-author preprint.
  - Funhouse: grammar fixed; Twin-2K-500 checked in the full text.
  - Halawi: "in some settings surpasses", 0.146 blend.
  - Malleson: up to 40 agents.
  - Ward: footfall model, ensembles of 10, 100 and 1,000.
  - "None of these systems" narrowed to LLM-agent systems.
  - Weather framing softened.
- **Citations added**, each checked against the arXiv API, Crossref or DataCite, or by opening the page:
  - Data assimilation: Houtekamer–Mitchell, Anderson, Hunt.
  - Statistics and scoring: Diebold–Mariano, Künsch, Murphy, Ferro.
  - Assimilate-then-forecast and polls as state: Shaman–Karspeck, Kieu et al., Linzer, Park–Gelman–Bafumi.
  - Forecasting: Schoenegger et al.
  - Data: GLOPOP-S, WVS Wave 7 DOI, Leetaru–Schrodt.
  - Commit-reveal and timestamping: Financial Bubble Experiment, Axial Seamount EFE, RFC 3161, RFC 6962.
  - Survey simulation: SubPOP, Krsteski et al., PPI, Chuyao Wang, Xiao et al., Aher et al., Horton et al.
- **Previously uncited entries** (Hu, Ozkan, Ku) are now cited. Ozkan's over-dispersion result is cited in related work.
- **Venue and metadata updates:** Santurkar (ICML 2023), Park 2023 (UIST) and Angelopoulos–Bates (FnT ML) were updated to their verified venues. Dominguez-Olmedo, Ryan, Wang and Jang have their venues noted from arXiv comments, and Park 2024 is noted as v3.
- **Removed:** lakshminarayanan2017deep (the loose analogy), hegselmann2002opinion (no bounded-confidence gate in v1) and the WVS homepage entry.
- **Ethics expanded:** re-identification, Tier D labelling, election blackout, fork misuse, reflexivity and user data.
- **Cosmetic:** fixed the underfull and overfull boxes in the title and the results table.

## Open issues

- Some venue upgrades are still unverified, so these entries remain arXiv @misc: Halawi (NeurIPS 2024), Karger (ICLR 2025), Chopra (AAMAS 2025) and Prophet Arena.
- DARPA SocialSim is not cited. Its program page does not describe its forward-window evaluation, and we did not open the performer papers.
- The v1 parameter values in Table A.1 (K=20, M=5, n_min=100, cap 20/day, SESOI 0.01) are proposed design settings. The team must confirm them before the hash. The corpus disagrees on K (20 vs 3–5).
- There is no architecture figure. Standard packages only, so a TikZ figure is not used; a figure needs an image asset.
- H4 needs resolving-survey microdata whose terms allow it. Without such microdata, H4 cannot run.
- No protocol dry run on synthetic data yet (reviewer nice-to-have). This would need a committed script.

## Portfolio edit (2026-10-11)

Cross-paper consistency pass (see `../INDEX.md`): Companion titles; "evidence tier" renamed coverage tier and mapped to the population tiers of *Unequally Known*; B0 is the market price at the scheduled call time T* as *Receipts* defines it (was: at the cutoff c_t), and the market price left the leaf; reveal timing follows *Receipts* (clear at T*, embargo by category), replacing hide-until-resolution; eligibility = resolves at least 24 h after T*; comparisons with B0 use the *Receipts* abstention rule; H2 defers the confirmatory market test to *Receipts* H6; W_m called market-aware; *Belief Assimilation* named as the filter upgrade; fork rules point to *Governing*; interval factor renamed φ_t (it clashed with the cutoff c_t) and starts as a committed inflation factor, provisional until 100 resolved. Compiles with tectonic: no errors, no undefined references, no overfull boxes.

## Review log, second pass (2026-10-11)

Rechecked every must-fix item of the three reviews against the revised text. Closed the remaining gaps:

- Filter forecast step stated: an aggregate model on (z, β) with variance (1−λ)²Pᵃ+q; agents enter only through h_F (R1 #6, R3 #20).
- Malleson softened to "scale poorly; the authors extrapolate exponential growth" (R3 #24).
- B0 at T* sees information after c_t; stated as favouring the market, with the mid at c_t as a sensitivity (R1 #10).
- H5: added "B1 told the realized outcome" as a comparator and the expected n (a handful per year; descriptive until 20 resolve) (R1 #14, R3 #17).
- Ozkan now also cited in the variance-collapse and unequal-coverage limitations (R3 #13).
- All tables use ragged-right columns; no underfull boxes remain in the body.
- Citations re-verified in bulk: all 35 arXiv IDs match their titles through the arXiv API, all 35 DOIs resolve to matching titles through doi.org, and the 4 web-only entries (IPUMS, GDELT data page, OpenTimestamps, Leetaru–Schrodt PDF) return HTTP 200. Abstract numbers rechecked for Schoenegger, Ozkan, Chuyao Wang, Xiao and Axial EFE. No entry needed removal.

Compiles with tectonic: no errors, no undefined citations or references; one cosmetic underfull line inside the bibliography.

## Update for PRs #6-#38 (2026-10-12)

The engine now exists (version 0.1.0, `engine/rw/`, through commit ad95a99). New Section 7, "What Is Built, and Synthetic Checks":

- Table 3 lists where engine 0.1.0 differs from the design: illustrative fixture marginals instead of GLOPOP-S (10,000 agents, 16 countries); per-agent news step scaled by stubbornness (not a pure segment shift); a scalar Kalman update per (country, topic) with an anchor offset (decision 0005) instead of the iterated EKF with h_F and house effects; one LLM call per segment for every question (no class P/C split); a same-feed LLM not matched on calls; the pre-genesis decision 0002 ledger and day-block bootstrap; forks without a paired no-event arm; the 29-question list still proposed and unhashed.
- E003 and E006 reported with every pre-registered metric, n and 95% interval as their committed results give them (`experiments/E003/results/2026-10-12-none/results.json`, run at b6957be; `experiments/E006/results/2026-10-12-none/RESULTS.md`, run at 3163def), including E003's loss to persistence, the dropped ETKF arm and E006's filter understating its error (RMSE/filter SD 1.367). Labelled synthetic and retrospective, not forecast skill.
- Abstract, author line, Section 3.5 (pointer to the built operator) and the limitations on validation and cost updated to match.

What produces the pending results is unchanged. Before any of them can run: an approved and hashed question list, real poll ingestion, the Receipts v1 ledger, and W built to this paper's design (or the paper revised to the built system before its hash).
