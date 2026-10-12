# Ensemble design for social simulation

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. The principles come from opened primary pages. The cost and size numbers are my own arithmetic on the brief's figures, not measured. The web search budget ran out mid-task, so I could only fetch known pages, and I did not open the Funhouse Mirrors paper.

## Answer

Raw ensemble spread from LLM agents is not an uncertainty estimate. LLM populations are too uniform (variance collapse), so spread will be too narrow, and 100,000 agents make sampling noise tiny anyway. Real World should run a small ensemble (20 members for the daily forecast, 5 for user forks) that perturbs the world state and the model, not just the random seed. It should then publish intervals that are corrected against its own scored track record, not the raw spread.

## Findings

**Weather practice is the template, and it perturbs two things.** ECMWF's ensemble runs 51 forecasts: one control plus 50 perturbed members. The members vary both the initial conditions and the model itself. ECMWF says a good ensemble must be reliable, not only sharp: a "70%" forecast should come true about 70% of the time. Source: [ECMWF fact sheet](https://www.ecmwf.int/en/about/media-centre/focus/2017/fact-sheet-ensemble-weather-forecasting).

**Ensembles can be tiny relative to the state.** In ensemble Kalman filtering, state variables number in the millions while members are "typically less than a hundred." That makes the covariance rank deficient, with spurious long-range terms, which is why people taper (localize) it. Source: [Wikipedia, EnKF](https://en.wikipedia.org/wiki/Ensemble_Kalman_filter). The page does not cover inflation, which I know from the literature but did not verify here. Lesson for us: do not assimilate news into all 100,000 agents independently from 20 members. Nudge at the segment level (country x age x attitude cluster), not per agent.

**Deep ensembles are the cheap, proven recipe.** Independently trained members, no special machinery, calibrated uncertainty "as good or better than approximate Bayesian NNs", and higher uncertainty on out-of-distribution inputs. Source: [Lakshminarayanan et al.](https://arxiv.org/abs/1612.01474). The abstract does not state the ensemble size. The analogy is model mixtures: different LLMs act as different members.

**LLM populations are flat.** Wang, Morgenstern and Dickerson show, with 3,200 human participants, 16 identities and 4 LLMs, that LLMs misportray groups and flatten within-group differences. Inference-time fixes reduce this but do not remove it. Source: [arXiv 2402.01908](https://arxiv.org/abs/2402.01908). Diversity-prompting helps somewhat: Verbalized Sampling gives 1.6 to 2.1 times more diversity in creative writing, but that is creative writing, not belief distributions. Source: [arXiv 2510.01171](https://arxiv.org/abs/2510.01171). Conditioning on demographics can reproduce subgroup distributions in the US ([Argyle et al.](https://arxiv.org/abs/2209.06899)), but that is a US-only claim and says nothing about the rest of the world.

**Better grounding beats more randomness.** Interview-grounded agents reach 83% of a person's own test-retest consistency, survey-only agents 82%, combined 86%, and demographics-only 74% (1,052 Americans). Source: [Park et al.](https://arxiv.org/abs/2411.10109). Our default agents are demographics-only, so they sit at the weak end.

**Scoring rules reward honest spread.** Brier, CRPS and log score are strictly proper: the forecaster scores best in expectation by reporting their true distribution. CRPS for a single point forecast equals mean absolute error. Source: [Wikipedia, Scoring rule](https://en.wikipedia.org/wiki/Scoring_rule). Use CRPS for numeric outputs and Brier or log score for yes/no questions.

**Conformal prediction gives a coverage guarantee without model assumptions.** Sets contain the truth at a chosen level such as 90%, with non-asymptotic guarantees. The guarantee assumes calibration data are exchangeable with future data, which is a stretch for a drifting world. Source: [Angelopoulos and Bates](https://arxiv.org/abs/2107.07511).

**Derived, not sourced.** For a share p estimated from N agents, standard error is about sqrt(p(1-p)/N). At N=100,000 and p=0.5 that is 0.16 points. At N=5,000 it is 0.7 points. Either way, seed noise is far smaller than the real uncertainty (wrong beliefs, wrong model, wrong event impact). Cost scales linearly in members: if one nightly update costs $15-60 (brief), a 20-member full-population forecast would cost $300-1,200 per night. That does not work.

## What it means for Real World

- For the product: show "likely range" and "how much to trust it" as separate things. Label ranges as calibrated against our track record, and say when a question type has too few resolved forecasts to calibrate. Never show raw ensemble spread as a probability.
- For the engineering: use three perturbation layers, in this order of value. (1) Initial state: sample the assimilated belief state from its uncertainty (survey margins of error, news-signal weights). (2) Event interpretation: for forks, have several LLM readings of "a chip shortage doubles phone prices" and run each. (3) Model mixture: run different model families on a subsample. Seeds alone are the weakest layer. To control cost, run members on a stratified subsample of 3,000-5,000 agents with post-stratification weights, and cache the daily agent responses that do not change. This is my design; it needs a pilot.
- For the business: the cost line is the ensemble. Budget it explicitly: 20 members x 5,000 agents is about one full-population pass of 100,000 agents, so roughly the $15-60 nightly figure, not 20x it. User forks at 5 members should be a metered or capped feature.

## Recommendations

1. Set the default to K=20 for the daily forecast and K=5 for forks, each member on a 5,000-agent stratified subsample. Measure the real cost in the first week and adjust K, not agent count, first.
2. Build the three perturbation layers (initial state, event reading, model mixture) as separate flags in the simulate config. Log which layer produced how much of the spread, so a PM can see where uncertainty comes from.
3. Assimilate at segment level, not per agent, to avoid the rank-deficiency trap that EnKF localization exists to fix.
4. Store every member's output with the hashed forecast. Publish the ensemble quantiles and a separately labelled calibrated interval.
5. Calibrate by scoring: track CRPS and Brier per question type and a spread-skill ratio (spread against actual error). Once there are about 100 resolved forecasts, fit a spread inflation factor and add a split-conformal band. Until then, ship intervals widened by a fixed factor and say so.
6. Add a collapse alarm: compare simulated within-segment variance against survey variance for the same item (WVS, Gallup). If the ratio is under about 0.5 for a segment, widen its spread and flag it. The threshold is a guess to tune.
7. Do not treat the 100,000-agent count as precision. Say in the API docs that sampling error is negligible and structural error dominates.

## Open questions

- How collapsed are non-Western agents? We found no non-US evidence on variance. Test: simulate WVS items for 10 countries and compare variance to survey variance.
- Is a mixture of model families worth its cost over one model with varied prompts? Test: a one-week pilot, scored with CRPS.
- How many resolved forecasts do we need before conformal bands are meaningful, given drift and exchangeability? Simulate on the first 30 days of record.
- Funhouse Mirrors and the EnKF inflation literature were not opened here. Read both before fixing the design.

## Sources

- [ECMWF, ensemble weather forecasting fact sheet](https://www.ecmwf.int/en/about/media-centre/focus/2017/fact-sheet-ensemble-weather-forecasting), accessed 2026-10-11
- [Wikipedia, Ensemble Kalman filter](https://en.wikipedia.org/wiki/Ensemble_Kalman_filter), accessed 2026-10-11
- [Lakshminarayanan et al., Deep Ensembles (arXiv 1612.01474)](https://arxiv.org/abs/1612.01474), accessed 2026-10-11
- [Wang et al., LLMs can misportray and flatten identity groups (arXiv 2402.01908)](https://arxiv.org/abs/2402.01908), accessed 2026-10-11
- [Zhang et al., Verbalized Sampling (arXiv 2510.01171)](https://arxiv.org/abs/2510.01171), accessed 2026-10-11
- [Argyle et al., Out of One, Many (arXiv 2209.06899)](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [Park et al., LLM Agents Grounded in Self-Reports (arXiv 2411.10109)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Wikipedia, Scoring rule](https://en.wikipedia.org/wiki/Scoring_rule), accessed 2026-10-11
- [Angelopoulos and Bates, Gentle Introduction to Conformal Prediction (arXiv 2107.07511)](https://arxiv.org/abs/2107.07511), accessed 2026-10-11
