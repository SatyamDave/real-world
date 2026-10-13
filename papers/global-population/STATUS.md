# global-population

- **Claim:** A global LLM agent population can be built from a synthetic survey-derived skeleton (GLOPOP-S, post-stratified to UN WPP 2024) and donor-matched attitude surveys, with per-attribute provenance, an exhaustive population-tier rule and a per-country confidence score fixed before evaluation; whether the score predicts noise-corrected error is tested, not assumed.
- **Stage:** internal review (Stage-1 registered report; no empirical results)
- **Target venue:** a venue that accepts Stage-1 registered reports (or a workshop). A datasets track only once v0 exists, licences are resolved, and Croissant/datasheet metadata can be produced.
- **Build:** `cd papers/global-population && tectonic paper.tex` (compiles; no undefined citations or references; final pass has no overfull or underfull boxes; all 90 bib entries cited)

## Design changes from the brief

- The brief named IPUMS International as the agent source. Its terms prohibit commercial use and redistribution, so the skeleton comes from GLOPOP-S and IPUMS is an aggregate-only validator if IPUMS grants written permission.
- GLOPOP-S's upstreams (LIS, DHS, Global Data Lab) and the WVS trend-file conditions all restrict commercial use or redistribution. The build fails closed on `licenses.csv`; agent-level attitude vectors are never released.

## Pending results and the artifacts that will produce them

| Result | Future artifact |
| --- | --- |
| Registry of frozen elements (hash committed before any run) | `artifacts/global-population/v0/registry.json` |
| Country list, n_k, m_k, tiers, score components, q_lang distribution, X distributions, collapse shares, set P candidates and release dates, evaluable units | `artifacts/global-population/v0/coverage.csv` |
| Fallback donor map (committed before any eval run) | `artifacts/global-population/v0/fallback_map.csv` |
| License status per source and use (written answers) | `artifacts/global-population/v0/licenses.csv` |
| Power simulation (human data only, before any eval) | `artifacts/global-population/v0/power.json` |
| Frechet bound widths | `artifacts/global-population/v0/frechet.csv` |
| Disclosure test for every displayed/released format | `artifacts/global-population/v0/disclosure.json` |
| H1 cohort shift vs plain skeleton at census year (paired, switching rule) | `artifacts/global-population/v0/eval/h1_skeleton.json` |
| H2 matching: share of severely attenuated hidden-variable associations (incl. region) | `artifacts/global-population/v0/eval/h2_matching.json` |
| H3 items with no donor answer (set P) vs baselines B3-B6 | `artifacts/global-population/v0/eval/h3_heldout.json` |
| H4 confidence vs noise-corrected error, real builds primary; simulated borrowing secondary | `artifacts/global-population/v0/eval/h4_confidence.json` |
| H5 flattening (corrected slope, rho_B, rho_W, delta) | `artifacts/global-population/v0/eval/h5_flattening.json` |
| H6 native-language 2x2, 20 countries, tokens | `artifacts/global-population/v0/eval/h6_language.json` |
| H7 staleness (same program, same mode, 3+ waves) | `artifacts/global-population/v0/eval/h7_staleness.json` |
| H8 released object: non-inferiority vs donor surveys against Gallup/Pew toplines | `artifacts/global-population/v0/eval/h8_release.json` |

## Open blockers outside the code

- Written licence answers: WVS/EVS (non-profit only as read), Afrobarometer, Arab Barometer, Latinobarometro, Pew, Gallup; counsel and the GLOPOP-S authors on the CC BY label given LIS, DHS and GDL upstream terms; IPUMS permission for validation. Alternative: an academic collaborator runs the protocol under their own licences, aggregate outputs only.
- WPP 2024 licence confirmed only on a WPP 2024 policy brief (CC BY 3.0 IGO), not on the data download page.
- Independent ethics review (committee and submission date to be recorded in the registry; no ingestion before approval), GDPR lawful basis and DPIA before any EU-origin donor file is ingested.
- Academic-collaborator route only with each custodian's written confirmation that a run benefiting a commercial company is within its licence.
- Set P feasibility: Claude Haiku 5.5 training cutoff June 2026, retirement not before 2027-10-07; data cutoff T_D = 2027-07-07. If registered minima are not met, H3-H6 are downgraded to exploratory.
- Named authors are needed before any venue submission.
- Registry elements still to freeze (rules fixed in the paper; content is not covered by Stage-1 acceptance): education crosswalk, H1 census cell crosswalk, common item set and cross-program crosswalk, referent classes, post-cutoff target list, primary model snapshot id and thinking/temperature setting, replication model, prompt templates, H6 country list, q_lang item set, compute budget, ethics committee and date, seeds.

## Review log (internal review, 2026-10-11)

Three reviews (methods/statistics, citation audit, skeptical reviewer) were addressed as follows.

- **Framing:** retitled (no "census microdata", no country count); recast as a Stage-1 registered report; abstract no longer says LLMs pull "every" population; country set now comes from a stated inclusion rule with C <= 237 and the floor's share stated; "honest" phrasing removed; the grounding/diversity sentence made conditional.
- **Licensing:** read and added DHS (no commercial venture, no redistribution), Global Data Lab (non-commercial; written permission for commercial use), WVS Conditions of Use (non-profit only, no redistribution), Afrobarometer policy (copyright notice, attribution; silent on commercial use), Arab Barometer policy (reprints only), WPP 2024 (CC BY 3.0 IGO on a WPP 2024 brief). The terms reading is no longer called a contribution and is marked "not legal advice"; the build fails closed. WorldPop dropped (not used).
- **Release/privacy:** stated that agent-level donor vectors are microdata redistribution; no agent-level attitude release; product displays never show full vectors; pre-registered k >= 5 disclosure test on every displayed or released format; Pew used only as aggregates.
- **H2:** primary test is now association recovery for survey variables hidden from the key (partial test of conditional independence) with Frechet coverage; cell-level comparison secondary; country-level tie with B1 acknowledged.
- **H3:** primary items are post-cutoff novel items scored on independent surveys; B1/B2 are oracle references, not competitors; added deployable non-LLM baselines B5 (nearest item) and B6 (leave-one-country-out MRP); "beat" and "most countries" defined; contamination probe added.
- **H4:** error measured against independent targets so staleness counts; simulated-borrowing arm makes Tier 3 evaluable and measures the borrowing penalty; noise ceiling and partial Spearman controlling for target n; component ablations and weight/tau sensitivity reported.
- **Noise and uncertainty:** human split-half noise ceiling under every error; survey weights throughout; cluster bootstrap over respondents, items and donor draws; country as the unit for country-level tests.
- **Elicitation:** sampling settings, option randomization, retries, refusals, don't-know handling, use of all five donor draws, primary model named (Claude Haiku 5.5, per the project's engine decision), replication model family required.
- **Scope of items:** split and evaluation apply to whichever program supplies donors; common item set with a committed one-to-one crosswalk for every cross-country statistic; scale and nominal-item rules stated.
- **Definitions:** one "eligible wave" definition; tiers as an ordered exhaustive decision list; WPP-only skeleton specified; Tier 4 builds no attitude block; fallback rule rewritten (M49 sub-region, skeleton-derived distance, tie-breaks) since GLOPOP-S fills from three countries.
- **Score:** validation-coverage component removed from c_k (evaluability is not error); q_lang language rule and measurement protocol specified, with worst-case fallback; zero handling stated.
- **Error control and power:** one primary test per hypothesis (Table 3), Holm across the eight, BH within per-country decision families; power simulation gate before the run; design arithmetic for H4 (about 68 units).
- **H5:** kappa replaced by a measurement-error-corrected between-country slope; variance ratios noise-corrected; delta renamed "default-ward shift" with the model's unconditioned answers as the primary reference.
- **H1:** validated at census year; SRMSE and cells defined; displacement rule fixed from WPP net migration; cohort-shift ablation.
- **Stage 1:** 10-year age bands and single-year split stated; agent frame tied to the donor survey frame (no 15-17 donors needed); weights use the frame population; post-stratification named as such; regions described as GDL subnational regions.
- **New H8:** tests the released population itself against Gallup/Pew toplines; Monte Carlo SEs shipped.
- **H6:** 2x2 factorial with interaction; official national-language questionnaires preferred; native language limited to the 20 registry countries; per-country BH.
- **H7:** within-country design with country random effects, same-mode waves, explicit tau-mismatch test.
- **Citations:** GLOPOP-S fill method corrected; Park et al. inference removed and restated as what H3 tests; Henrich/Atari attribution fixed (Atari re-opened via OSF API); Durmus wording aligned with the paper body; 15x attributed to Petrov only; WVS 115 vs 120 discrepancy reported; Pew study details (Opus 4.6, 71 typology variables, expert reflection, development wave) added; vendor multilingual model named (Haiku 4.5 with extended thinking). Added and verified Ku et al. 2026, Abels et al. 2026, Gallagher et al. 2018 (SPEW), Jang et al. 2026, Suh et al. 2025, Park, Gelman & Bafumi 2004, Smits & Permanyer 2019 (replacing the withdrawn GDL Area Database working paper), UN M49, GDPR Art. 9. Fixed metadata: borysov2019 published title, wang2024flatten (NMI), ahia2023 (EMNLP), ipums2025 author names, dorazio2006 DOI, pew2026silicon URL, kim2026korean pages/DOI, alkhamissi2024/ryan2024 DOIs and pages, gebru2021 (CACM), evs2022trend URL, haerpfer2022wvs title, rystrom2025 and liu2025 venues.
- **Ethics:** added conflict of interest, ethics review plan, consent vs custodian permission, GDPR Article 9 and DPIA, respondent safety and preference falsification, dual use; external-validity limitation added.
- **Self-contained:** commitment procedure defined here (registry hash) rather than relying on unpublished companion papers; relation to the project's segment-level engine and A-D product rating explained.
- **Layout:** table overfull/underfull boxes fixed; a datasheet skeleton added as an appendix.

Not done (reviewer nice-to-haves left out): Croissant/RAI metadata (no dataset yet), SDR2 harmonized-survey source, Wendler/Etxaniz latent-English work, Doudkin and Chen marginal-only evaluation papers, Twin-2K-500, BLEnD. Venue-track rename claims were not verified and are not repeated.

## Portfolio edit (2026-10-11)

Cross-paper consistency pass (see `../INDEX.md`): Coverage tiers 1–4 renamed population tiers (the product's A–D coverage tier is defined in *Don't Ask a Model*); system description no longer says "100,000 LLM agents" assimilating markets; companion section states that the public build anchors on published aggregates until donor sources are cleared, and that the engine never calls the model per agent. Compiles with tectonic: no errors, no undefined references, no overfull boxes.

## Review log (second internal review, 2026-10-11)

Three reviews (methods/statistics 6/10, citation audit 7/10, skeptical reviewer 4/10) were addressed as follows.

- **H1:** primary is now the paired cohort-shift vs plain SRMSE comparison (Wilcoxon signed-rank) with a stated switching rule (Holm rejection and median relative reduction >= 5%); restricted to censuses in or after 2015 (cohort shift is forward-only); fill vs own demoted to descriptive. One single-year-of-age rule (WPP single-year within band) used everywhere. Young-cohort education adjustment stated with its bias direction. SRMSE cells fixed by a committed crosswalk (36 and 24 cells) so it is comparable across countries.
- **H2:** primary is a magnitude test (share of hidden-variable pairs with bias-corrected Cramer's V attenuation < 0.5, H0 share >= 0.5, cluster bootstrap over countries); Bergsma bias correction; Frechet coverage removed as a test (true by construction), widths descriptive. Region added to hidden variables and Frechet bounds, named in limitations, and region cross-tabs labelled when dominated.
- **Split:** 80/20 by whole PSUs; non-PSU countries flagged with a sensitivity analysis.
- **Uncertainty:** donor draws are proper imputations (PSU/replicate-weight bootstrap of the donor wave, then hot deck), combined by Rubin's rules; release ships a total standard error including donor sampling error; floor sentence corrected; "100,000 agents carry no more information than the donor files" stated. "Few hundred donors per cell" replaced by design arithmetic (about 7 per cell over 120 cells).
- **Set P:** redefined as post-cutoff targets with strata P_rep (repeated general items masked from donor vectors, usable cross-country) and P_new; Haiku 5.5 cutoff (June 2026) and retirement (not before 2027-10-07) cited; data cutoff T_D; registered minima, SESOIs and a pre-registered downgrade to exploratory (Table 4); contamination probe matched on items and labelled suggestive. Resolves the P vs J_c contradiction.
- **Referent classes:** country- and time-referential items dropped from borrowed vectors and dropped/flagged in stale vectors, classified before any run by two coders.
- **H3:** primary is a sign test on per-country point differences; per-country wins are a separate BH family with p-values; better-of-B5/B6 chosen on set I/W, not on P.
- **H4:** primary on real builds only, one outcome per country (item-centred error on P_rep), Freedman-Lane permutation, rule "upper bound < 0 and estimate <= -0.3"; power redone for that rule (about 55 countries at rho = -0.45, 44 at -0.5, 70 at -0.4; 50% cap at -0.3); c_k recency recomputed at target fieldwork; pooled real+simulated analysis secondary as a two-level model; n_k vs m_k notation split; target/donor size correlation reported.
- **q_lang:** removed from the primary score with reasons (English prompting, language rule, 14-language collapse); measured, distribution reported pre-run, used in a secondary variant c+ and in H6; MMMLU cited and added to Table 1.
- **Noise ceiling:** computed at each comparison's own sample structure (target vs arm, conservative for correlated draws, B3 noise-free); negatives kept; item-centred aggregation across countries; delta corrected the same way; Wasserstein-1 ordinal sensitivity; abstract claim limited to error metrics.
- **H5:** country-level paired bootstrap; items with lambda < 0.5 excluded (also guarantees a positive rho^B denominator).
- **H6:** machine-translated items excluded from primary; per-country p-values; BH sentence corrected (bounds false enablements among enabled countries).
- **H7:** fixed per-country item set; primary on donor-carried items, stated as measuring attitude change (what tau models), model-answered secondary; tau link assumption stated; non-rejection not confirmation; minimum 10 countries; cohort-aware matching variant.
- **H8:** frames aligned; primary is non-inferiority (margin 2 points) of release error vs the donor survey's own error against the topline, which cancels house/mode/wording effects; cluster bootstrap over countries; inter-survey discrepancy term in the secondary coverage analysis; model-answered stratum on a fixed 100-agent subsample.
- **Other protocol:** SESOIs and generative model for the power simulation; compute budget formula with random item-drop order; refusal-exclusion sensitivity analysis; deviation policy; Tier 3 anomaly named; borrowed-country frame defined; Tier 4 exclusion with renormalized aggregates and disclosed excluded share; simulated-borrowing selection bias stated; alternative fallback rule (cultural map) as a secondary comparison; X distributions reported per country; Holm note.
- **Disclosure:** fixed per-agent display set of at most 5 items tested as a union; k-anonymity threshold aligned to 10 for displays and tables (Sweeney cited).
- **Product gap:** "stricter test" and "inherits unchanged" removed; gap stated as a limitation; title now "synthetic population for LLM agents".
- **Ethics/licensing:** academic-collaborator route only with custodian written confirmation; ethics review recorded in the registry before freeze, no ingestion before approval, IPA conditional on it; dual-use gates restated here; how framing changes if H5 fails.
- **Citations fixed:** Pew headline 12.4 average (11.3/14.7/11.2) with the 11.4 methodology discrepancy and the GPT-5.1 vs Opus contrast; durmus2023 to COLM 2024; wang2023thanksgiving to ACL 2024; liu2025 to AAAI 2026; suh2025subpop pages and DOI; ku2026 to inproceedings; GDL Area Database quote moved to its own entry (gdlareadata); Atari's two findings separated; WVS sample-size claim limited to Gallup; Arab Barometer eight released waves; haerpfer2022wvs per DataCite (v4.0, 2024, "No commercial usage"); wpp2024brief number marked as from the URL; long URLs moved to url fields (no underfull boxes).
- **Citations added (each opened via Crossref, DataCite, arXiv API, Hugging Face API or the live page):** Claude models overview, MMMLU, Holm 1979, Benjamini-Hochberg 1995, ISCED 2011, Sweeney 2002, Rubin 1987, Andridge & Little 2010, Bergsma 2013, Freedman & Lane 1983, Rassler 2002, Ghitza & Gelman 2013, Nosek et al. 2018, Meister et al. 2025, Dominguez-Olmedo et al. 2024, Tjuatja et al. 2024, Cheng et al. (Dated Data), Doudkin 2026, Ozkan 2026, Taday Morocho et al. 2026, Moon et al. 2024, AgentSociety, Chopra et al. (limits of agency), Ge et al. (1B personas), Twin-2K-500, BLEnD. Added GLOPOP-S 15.7% fill share and Tao et al. Finland 0.20 to 2.43.

Remaining open: named authors; ethics committee and date; registry content (J_c, crosswalks, referent classes, P list) is outside Stage-1 review by construction; set P may be empty before the primary model retires; the H8 non-inferiority margin (2 points) and the H2 tolerance (0.5) are judgement; segment-level engine path is not evaluated; Croissant/RAI metadata not produced (no dataset yet).

## Update for PRs #6-#38 (2026-10-12)

- Status paragraph corrected: "the product code does not exist yet" is no longer true. Engine 0.1.0 exists (`engine/rw/population.py`, PR #6) but samples 10,000 agents in 16 countries from illustrative marginals in `data/sample/` (licence row `fixture_sample`), not GLOPOP-S or survey aggregates.
- Section 7 (relation to the rest of the system) now says the built engine uses neither donor vectors nor published aggregates yet, and that its coverage tier is a five-part rubric score in `data/countries.csv`; no population tier or confidence score from this paper is computed.
- No method or result of this paper is implemented; every pending artifact and what produces it is unchanged.
