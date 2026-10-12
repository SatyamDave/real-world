# variance-correction: status

- **Claim:** Reading LLM respondents as typed per-agent probability vectors, correcting them with a question-agnostic log-probability map that has separate slopes for the country centre, between-cell and within-cell differences (plus an ordinal response style), and post-stratifying, should bring simulated poll distributions closer to polls fielded after commitment than committed persona panels; the paper pre-registers that test, including the two baselines most likely to beat it (a fitted non-LLM demographic model and a describe-the-population call given the same calibration), a test-retest guard against matching by noise, and a feasibility rule that decides before commitment whether confirmatory tests can run.
- **Stage:** internal review
- **Target venue:** ACL/EMNLP (main or Findings); ICWSM as alternative.
- **Compile:** `cd papers/papers/variance-correction && tectonic paper.tex` (succeeds; no undefined citations, no overfull boxes; all 59 bib entries cited).

## Pending results (none exist yet; no number in the paper is our result)

| Result | Produced by (future artifact) |
| --- | --- |
| Feasibility census: shadow-window counts of eligible items, polls and subgroup items per source | `artifacts/variance-correction/feasibility/census.json` |
| Parameter-recovery simulation; decides which map parameters are free in the primary specification | `artifacts/variance-correction/recovery/results.json` |
| Pilot variance (max of 2x WVS-7 leave-question-family-out and the retrospective split), n*, measured tokens per call, pre-commitment branch | `artifacts/variance-correction/pilot/results.json` |
| Fitted parameters per stratum, theta_global, cross-validated gamma, calibration loss of identity vs fit | `artifacts/variance-correction/calibration/theta.json` |
| Test-retest guard on Twin-2K-500 retest items | `artifacts/variance-correction/guard/retest.json` |
| Retrospective split (published after T_c, before F), non-confirmatory | `artifacts/variance-correction/retrospective/results.json` |
| Manipulation check H1, confirmatory H2-H5, exploratory H6, secondary S1-S16, deviations log, per-arm cost | `artifacts/variance-correction/prospective/results.json` |
| Protocol hash commitment (defines F) | hashed protocol file via the Receipts Protocol log |

All artifacts come from the evaluation harness at `evals/variance_correction/`, which is not written yet.

## Open items

- Write and hash-commit the protocol file (exact prompt strings, item-selection and item-identity code, embedding model id, analysis code). Appendix A-C of the paper fix the constants and rules; the file holds the exact strings.
- Run the feasibility census before F. If the census or pilot puts the design on branch 3 or 4 of the pre-commitment rule, the abstract and hypothesis table must be updated before commitment.
- License review: SimBench and GlobalOpinionQA (non-commercial), WVS, Twin-2K-500, Pew datasets and redistribution, Eurobarometer, and GLOPOP-S commercial status (derived from LIS/DHS). A deployed map must be refitted on commercially usable sources.
- Confirm Standard Eurobarometer report lag and whether its socio-demographic tables are published in time (Table 2 marks this "to be confirmed").
- Unreviewed 2026 preprints, numbers checked against arXiv abstracts only (some also checked in full text by the citation reviewer): 2607.18310 (Ozkan), 2607.25292 (Jang), 2609.07305 (Doudkin), 2607.26348 (Chen), 2601.15755 (Williams), 2609.16395 (Wang), 2609.32638 (Lee and Wang Yue; second author's surname order unconfirmed). Unreviewed grey literature: Pew 2026 reports (AI, China methodology, midterms, Data Labs silicon samples methodology), Ipsos tracker page, Eurobarometer 104.1 dataset record, Anthropic documentation pages.
- Cross-paper: `../INDEX.md` row for this paper still lists the old hypothesis set (H1-H7, S1-S5) and stage "Draft"; update it in the next portfolio pass. The paper now states that the public build uses GLOPOP-S and never IPUMS International, and that the IPUMS description in the company brief refers only to the separately licensed research build of *Don't Ask a Model*; the brief should be corrected.

## Review log (2026-10-11, internal review round 1)

Three reviews (methods 4/10, citation audit 7/10, skeptical 4/10). Every must-fix item was addressed:

- **Scope:** abstract, introduction and a scope paragraph say the public build never calls the model per agent, name what a pass licenses (population-level model readouts; a future per-agent build) and what it does not (published forecasts, individual agents, priors for countries without surveys). Present-tense description of a running system and the nightly "collapse alarm" removed. The "agents the product voices on request" use case removed. Per-agent cost arithmetic for 100k agents added, labelled as a planning figure.
- **Map reparametrised** (Eq. 2): l' = a u_k + b v_c + w d_i + beta_f, so the single 1/tau no longer scales every term; tau shown as the special case a=b=w. beta_f restricted to ordinal families and keyed to canonical option index.
- **Identification:** Proposition 1 with proof sketch (w, and b from toplines, enter only through softmax curvature; a and beta first order; beta vs a separated only by pooling questions), plus a pre-registered parameter-recovery simulation that decides which parameters are free. Contribution claim narrowed to the local result.
- **Matching by noise:** primary fixes w=1 with the justification, bounds a >= 0.5, and makes a Twin-2K-500 test-retest guard part of H3's success criterion.
- **Elicitation:** Stage 1 asks for probabilities and a reason only (no answer field); A3 is a separate single-answer call; ordinal scales presented in canonical or reversed order, nominal permuted; epsilon fixed at 0.005 with sensitivity at 0.001 and 0.01; refusals and missing data rule pre-specified.
- **Fitted = evaluated estimator:** partial pooling and kappa removed; equal allocation of 20 agents per cell; theta fitted through the full pipeline; optimiser, multistart, theta_global, gamma grid and leave-question-family-out CV specified; survey weights used; Tier 4 = theta_global stated; identity claim qualified for gamma>0 and non-convexity.
- **Feasibility and inference:** Pew spring 2026 moved out of the prospective split (fieldwork before T_c = June 2026); window redefined by publication date; feasibility table; Ipsos What Worries the World excluded (pick-three multi-select); vote intention descriptive only; minimum 30 items / 10 polls (20 subgroup items for H5); item identity across waves and pollsters; two-stage item-then-instance cluster bootstrap with poll-level sensitivity; feasibility census and a four-step pre-commitment fallback; MDE on item clusters with WVS pilot variance inflated.
- **Integrity:** run-once rule with hash logging at run time; mechanical selection rules in Appendix C; event-dependent vs value items classified by coders blind to arm outputs (moderator, not exclusion); trend vs novel items analysed separately; persona inputs are demographics only; no tools; assimilated arm inputs end before fieldwork and exclude the test item's waves.
- **Baselines:** A2c (A2 plus the same fitted map) added and H4 is now A6 vs A1 and A2c; A1 uses the latest wave before fieldwork with an algorithmic matching rule and neighbouring-country fallback; A1-pre and A1-lookup secondary; persistence arm P on trend items; call-matched A2; per-arm cost logging.
- **Metrics:** one-sample human floor primary (replication floor alongside, Suh et al. precedent); binary Brier dropped; multiclass Brier described as an affine function of squared error, RPS added; gap ratio replaced by gap error on within-country pairs with observed gap > 2 SE, between-country gaps descriptive; W1 and TV never averaged (nominal items secondary); SimBench comparability claim replaced by a SimBench-style TVD skill.
- **Hypotheses:** H1 moved out of the Holm family as a manipulation check with 0.8 justified; smallest effects of interest stated; intersection-union tests stated; H4 (old post-stratification test) moved to secondary S3 with its expected difference; S3 coverage dropped; abstract counts corrected.
- **Model:** pinned to `claude-haiku-5-5`, training cutoff June 2026; effort, thinking, max_tokens fixed; docs state dateless IDs are pinned snapshots, and a weekly canary still checks drift.
- **Citations:** Toubia no longer cited for weak twin correlations; Wu, Durmus, Lee, Chen and Kambhatla claims reworded to match sources; Doudkin's multiselect scope and the 5.34 vs 6.27 / 4-of-9 result reported; Turkey named for Ozkan; logprob claim cited to Meister et al. (Appendix A.9); schema-bounds and refusal claims cited to the structured-outputs page; Ipsos online-mode claim removed and bib title fixed; IPUMS statement reconciled with the paper set and the GLOPOP-S source named; wang2024flatten updated to Nature Machine Intelligence.
- **New citations, each opened on 2026-10-11:** Cao et al. NAACL 2025, Boelaert et al. 2025, Murthy et al. NAACL 2025, Kirk et al., Tjuatja et al., Zhao et al., Zheng et al., Hu and Collier, Egami et al., Epstein 1969, Gelman and Little 1997, GLOPOP-S, WPP 2024, Pew Data Labs silicon samples methodology, Pew China methodology 2026, Pew midterms report 2026, Eurobarometer 104.1 dataset, Anthropic structured outputs and models overview. No citation was removed: the citation audit verified all 38 original entries.
- **Ethics:** substitution for polling, manufactured consensus and political sensitivity discussed; deployment licensing separated from research use.
- **Not done (nice-to-have):** archival venues for tian2023justask, xiong2023uncertainty, guo2017calibration, sclar2023spurious, kirk2023rlhf, zheng2023selectors and zhao2021calibrate not checked (cited as arXiv); the additional non-US related work suggested by the citation reviewer (von der Heyde et al., Bulte and Rigouts Terryn, Rystrom et al., Kim and Cho, Ku et al.), Sorensen et al. and Anthis et al. not added.

## Update for PRs #6-#38 (2026-10-12)

- Introduction corrected: "None of it is built yet" was no longer true. Engine 0.1.0 exists and has published no forecast; it reads a model answer as a population share in one place (one call per segment per question, `engine/rw/forecast.py`), and its only dispersion check is a per-country SD-ratio band of 0.8 to 1.2 against illustrative survey spreads (`engine/rw/beliefs.py`, `spread_audit`), which says nothing about real populations yet.
- E002 (variance-collapse correction) is registered in `experiments/REGISTRY.md` but has not run. No method or result of this paper is implemented; every pending artifact is unchanged.
