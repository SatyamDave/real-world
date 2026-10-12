# silicon-samples-sok

- **Claim:** In a targeted corpus of 52 empirical studies (2022 to Oct 2026), LLM-simulated populations agree with human data on effect directions and rank orders more often than on levels, spreads or individual answers (partly a metric artifact; joint structure contested), and where a non-LLM baseline is fit the prompted LLM is not ahead. A four-axis taxonomy (conditioning source, elicitation contract, unit of claim, reference point) accounts for 5 of 11 cross-study conflicts and part of a sixth, a consistency check with little power to fail.
- **Stage:** internal review (2026-10-11, second revision)
- **Target venue:** ACM Computing Surveys; arXiv preprint first.
- **Build:** `cd papers/silicon-samples-sok && python3 data/counts.py && tectonic paper.tex` (compiles; no undefined citations or references; no overfull boxes; 34 pages with appendix). `python3 data/counts.py --check` fails if `data/counts.tex` or `data/matrix.tex` is stale.

## Committed artifacts

| File | Contents |
| --- | --- |
| `data/corpus.csv` | All 85 bib entries: role (56 included, 8 related, 21 context) with reason, peer-review status, single author, read level (fulltext / partial / abstract), first-public year, A1-A4 codes, baseline outcome with a written rule, spread result, out-of-training flag |
| `data/extraction.csv` | Every number in Tables 1-3 and 6 and in O2, with version, location, subset, date checked; panel sizes for Meister, Jang, Doudkin |
| `data/reconciliation.csv` | The 15 pairs first listed, with within-study flag, conflict definition, accounting axis, status, and whether the axis predicts the direction |
| `data/counts.py` | Generates `data/counts.tex` (every count in the text, the evidence-map rows, per-proposition counts, base rate, placebo, table read markers parsed from `paper.tex`) and `data/matrix.tex` (Appendix A) |

All coding is single-coder.

## Pending results

No number in the paper is our own empirical result; corpus counts come from the files above. The protocol is registration-ready, not registered.

| Result | Produced by (future artifact) |
| --- | --- |
| H1-H5 (variance, contract vs conditioning, leave-country-out baseline, Lin precision vs accuracy, distance) | `bench/silicon-sok/results/h1-h5/` |
| H6 post-cutoff degradation (DiD with recall-probe and stable-item contrasts) | `bench/silicon-sok/results/h6-degradation/` |
| H7 asker framing (directional) | `bench/silicon-sok/results/h7-asker-framing/` |
| H8 release stability (withheld canary list, salted hash, reveal date) | `bench/silicon-sok/results/h8-stability/` |
| H9 forward-dated wave (plaintext predictions + manifest before release) | `bench/silicon-sok/results/h9-forward/` |
| Double-coded, full-text extraction with Krippendorff alpha (required before submission) | `papers/silicon-samples-sok/data/extraction-double.csv` |

The protocol (Section 11), its analysis code and a synthetic dry run with simulated power per primary must be committed and deposited on OSF with the commit hash before any model call.

## Review log

### Round 2 (2026-10-11; methods, citation and skeptical reviews)

Corpus and coding:
- Peer-review status corrected from Crossref, ACL Anthology, OpenReview and arXiv records: Durmus (COLM 2024), Meister, Cao, Sun (NAACL 2025), Tjuatja (TACL), Park 2023 (BRM), Beck (EACL 2024), Moon (EMNLP 2024), Hu & Collier (ACL 2024), Krsteski (ACL 2026), Liu (AAAI 2026), Ku (IEEE IRI 2026), Toubia (Marketing Science), Peng (Science Advances); Horton coded as EC'24 extended abstract. Empirical peer-reviewed count 19 -> 34 of 52; P3, P4, P5 peer counts and the Limitations framing updated.
- Published versions cited: Peng (Science Advances; every quoted number re-checked in the Europe PMC full text), Mou (ACM CSUR, positioned against in Related Work), Toubia, Meister, Ku, Liu, Kambhatla (DOI); the superseded Buskirk working paper replaced by von der Heyde et al.'s full review. Bib venues/years fixed for CoMPosT, Roettger, Wang, Chuang, Tjuatja, Beck; Argyle author name.
- Added and verified: Kozlowski et al. (out-of-time; O1 now 4 studies), Boelaert et al. (SMR; spread 9 of 9), PPI / DSL / Mixed Subjects Design / Ludwig et al. (rectification foundation), Lin 1989 (H4), Sarstedt, Agnew, Chu, OASIS, PNNL SocialSim package (O2).
- Read levels recorded per study (12 full, 9 partial, 31 abstract); every vote count reports its full-text subset; Table rows re-marked (19 of 32 full text).
- P3 baseline count re-read in full text for 8 of 10 studies and recoded three-way with a written rule per study: baseline ahead 4, level 1, mixed 3 (Kim & Cho, Lukauskas, Kim & Lee), LLM ahead 2 (both use human data beyond a prompt).
- A4 "none" given an operational definition; Santurkar -> other human, Peng -> sample-size equivalence + random responses, Lee -> n=40 human reference, Lukauskas adds ceiling; Jang country US; Kim & Cho A1 c.
- Evidence-map caption states the per-study A4 assumption and how many studies it affects.

Claims:
- Title: "Systematization ... Replicates" -> "Targeted Survey ... Compare with Human Data"; "replicate" -> "agree with human data"; contamination caveat for textbook experiments.
- Reconciliation reframed as a consistency check: conflict defined (post hoc); within-study pairs 6-8 and same-verdict pair 10 removed; 5 of 11 accounted for plus one partial; base rate (97% of study pairs differ on some axis), placebo axis (year differs in 10 of 11), directional prediction (2 of 5). "9 of 15" removed from abstract.
- Joint structure restated as contested (Lee r=0.70-0.73, Lukauskas directions, Williams, Argyle); O5 and conclusion corrected.
- P1 states that correlations vs absolute errors are not comparable and that a trivial predictor can rank well (Wang's neighbor average).
- Finite-sample noise applied to the literature (Meister 30-sample panels within noise; Jang 100-persona gap well beyond; Doudkin has a floor analysis); abstract caveated.
- Tao 71-81% scoped to GPT-4, GPT-4-turbo, GPT-4o; SimBench 130 countries and mean-of-ratios reading; Ashokkumar megastudy forecaster comparison; Bulte support marked indirect; Pew leads with 11.3.
- Absence claims corrected: Chopra archetype Table 1 now in the mitigation ledger; O2 cites OASIS, Chopra, Chu and SocialSim and narrows the gap to survey-distribution change after events; inclusion criteria narrowed to survey/experimental answers.
- Companion-work paragraph removed.

Protocol (renamed "registration-ready"):
- S reinterpreted (S=1 = as close as the true population; second sample scores below 1); raw distance primary for same-item contrasts; S as ratio of sums with a denominator exclusion; pooled-marginal anchor added; Toubia normalized 0.56 as a worked example.
- Per-persona floor = oracle panel of the 300 sampled respondents; PPS sampling with equal-weight aggregation; Q defined as a mixture for persona contracts; matched-n primary, debiasing sensitivity.
- One three-way decision rule (supported / refuted / inconclusive) with SESOI for every primary; Bonferroni 98.75% intervals over 8 tested primaries (H1 estimation-only); pooled across families; H5 power recomputed at alpha/8 (0.69 at 60 countries, 0.45 at 40, 73 needed for 0.8); dry run must report simulated power per primary.
- H2 redefined (difference of two marginal means per factor, raw matched-n TV, scope stated, (iv) excluded and noted); H3 primary baselines use no target-country labels, supervised same-country baselines secondary with a learning curve; H4 uses Lin's precision vs accuracy terms with a carry-forward comparator and a U3 secondary; H6 sign fixed, renamed post-cutoff degradation, recall-probe and stable-item contrasts, 240-event change-point cutoff probe, model and wave plan, >=3 models per group gate; H7 directional toward self-placed human groups, asker framing explicit; H8 privacy claim corrected, reveal date, like-with-like comparison, no-release rule; H9 plaintext predictions with a full manifest and a trend baseline.
- Decoding: temperature for every contract, seed meaning, 5-call rule only for country-level cells, reasoning budgets pinned; budget recomputed with H5 reuse (2,070,600 per version; 6.2-12.4M across families).
- Eligibility count unweighted; DK sensitivity pre-specified for H5; design-effect inflation; Galton's problem, mediators and the F_ST proxy noted; no-permission rule.
- Systematic extraction adds full-text coding of every study and a blind conflict rebuild with placebo and base rate.

Ethics: competing interest names the product (public forks, non-Western coverage, archetype-plus-distribution design that P2 and the mitigation conclusion favor) and says the product has not adopted the recommendations; IRB route stated.

Tooling: `counts.py` now writes macros the paper inputs (counts cannot drift) and parses the table read markers from `paper.tex`.

### Round 1 (2026-10-11)

Number corrections (SimBench, Bisbee, Meister, Toubia, Ozkan, Kim & Cho, Pew, Wang, others), corpus defined, coded matrix and evidence map, reconciliation table, denominators for cross-study patterns, related work, 23 bib entries, protocol rewrite, ethics rewrite. Details are in the git history of this file.

## Open issues (not fixable without people, permissions or more reading)

- Double coding by a second coder, with Krippendorff alpha, and full-text coding of the 31 abstract-only studies are required before submission; the logged search has not been run.
- Named authors and a formal funding statement must replace the corporate byline (ACM CSUR will not accept it).
- No written data-use permission from WVS, ESS, Afrobarometer or Latinobarometro; ESS terms not read.
- The paper still contains both a survey and a registration-ready protocol; reviewers suggest splitting them, which is a product decision.
- Venues not confirmed and left as preprints: Kozlowski et al., Karger et al., Zhang et al. (VS), Chopra et al.; Boelaert country and model codes are "?" (abstract only).
- Panel sizes and finite-sample corrections are extracted for three studies only.
- Model training cutoffs for Pew's models are unreported, so Pew counts as "likely" out-of-training.
- The preamble uses geometry, array and longtable (standard LaTeX, also used by the sibling papers) beyond the four packages the README names; confirm they are acceptable.
- Remaining underfull boxes are in two paragraphs with long file paths and in the bibliography.

## Update for PRs #6-#38 (2026-10-12)

- Competing-interest paragraph corrected: it said the product's population "is built from" GLOPOP-S and survey aggregates. Engine 0.1.0 (`engine/rw/population.py`, `engine/rw/forecast.py`) samples from illustrative marginals in `data/sample/` and asks the model once per segment for a yes share; the paragraph now says so and marks GLOPOP-S and daily poll correction as the design. No survey result or count changed; `python3 data/counts.py --check` exits 0.
