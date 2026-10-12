# A self-improving forecast loop that cannot fool itself on small n

- Date: 2026-10-12
- Area: engineering
- Confidence: medium. Four sources were opened and agree on the direction: a one- or two-parameter recalibration map is the safe first knob, isotonic maps overfit below a few hundred cases, and a holdout reused for many adaptive choices stops being a fair test. None of them studied a daily loop over a few dozen resolved questions, so the thresholds below are judgments to be checked by E008, not measurements.

## Answer

Real World can improve its own forecasts without a person in the loop only by tuning a short allowlist of parameters against its own resolved outcomes, and only when the evidence is strong enough that the change is unlikely to be noise. The first knob should be a Platt map (slope and intercept in logit) over the raw `sim` probability, fitted on older resolved questions and tested on the most recent ones that the incumbent has never seen, promoted only when it beats the incumbent by a fixed Brier margin with a day-block bootstrap interval wholly below zero, and recorded forward-only as a hashed ledger entry. Below a minimum number of resolved questions the loop must do nothing. Isotonic maps, per-topic maps and knobs that need the simulation rerun (assimilation weights, prompt variants, sample sizes) wait until there is enough data and a budgeted replay path.

## Findings

**Temperature scaling, a one-parameter map, is a strong default.** Guo et al. found temperature scaling, "a single-parameter variant of Platt Scaling", surprisingly effective at calibrating modern neural network predictions on most datasets they tried, and recommend it as a simple recipe for practice ([arXiv 1706.04599, abstract](https://arxiv.org/abs/1706.04599)). Inference: a Platt map (temperature plus an intercept) is the smallest family that can fix both overconfidence and a constant lean, which are the two failures [019](../science/019-calibration-methods.md) reports for LLM output.

**Isotonic regression overfits small calibration sets.** Niculescu-Mizil and Caruana compared Platt scaling and isotonic regression over nine learning methods: when the calibration set is small, "less than about 200-1000 cases", Platt scaling beats isotonic regression with all nine; isotonic is more powerful only when there is enough data to prevent overfitting; and for methods that were already well calibrated, calibration "actually hurts performance when the calibration sets are small" ([ICML 2005 paper, PDF](https://www.cs.cornell.edu/~alexn/papers/calibration.icml05.crc.rev3.pdf)). Inference: with tens of resolved questions per month, isotonic is ruled out for now, and even a Platt map must be shrunk toward identity and must have to beat the incumbent on held-out data, since a calibrated forecaster can be made worse.

**Reusing one holdout for adaptive choices overfits it.** Dwork et al. show that when an analyst picks new hypotheses based on earlier results from the same holdout set, each reuse leaks information and the holdout stops predicting performance on new data, even with plenty of data ([arXiv 1506.02629, abstract](https://arxiv.org/abs/1506.02629)). Inference: a daily loop that tests a candidate on yesterday's holdout, then today's overlapping one, is exactly this. The cheapest guard is that each promotion is judged only on questions that resolved after the incumbent was chosen, so a holdout is never used to pick and then to confirm the same incumbent. Daily rejections still reuse overlapping holdouts; the margin and the interval rule are what keep false promotions rare, and E008 measures that rate.

**Selection on a noisy criterion overfits as much as the gap between methods.** Cawley and Talbot show that tuning by optimizing a criterion estimated from a finite sample can chase noise in the estimate; a low-variance criterion matters as much as an unbiased one, and the resulting bias can be as large as the differences between learning algorithms ([JMLR 11, abstract](https://jmlr.org/papers/v11/cawley10a.html)). Inference: the loop should compare one candidate family per day, not search a grid and promote the best, and the bar should be a margin plus an interval, not "lower mean Brier".

**Daily repeats are not independent questions.** The scoring protocol already counts n as distinct questions and bootstraps whole days because daily forecasts on one question are serially correlated ([030](../science/030-forecast-scoring.md), [`data/protocol.json`](../../data/protocol.json), [`score.py`](../../engine/rw/score.py)). Inference: the fit should weight each question equally, not each question-day, and the gate should count questions.

**The Jev contract bans distillation.** The fall_forward_labs vendor review (docs/adr/0011-typesafe-vendor-review.md in that repo, read 2026-10-12) quotes TypeSafe MCA §2.3(b): customers may not use the services or any output "to perform model distillation, train a model to imitate the output of the Services", and it lists as an open legal question whether training on our own outcome labels is allowed when the inputs were first routed by Jev. Inference: a two-parameter map from a Jev probability to our resolved outcomes does not imitate Jev's output, but the open question touches it, so it needs the same legal review before it runs on Jev probabilities in production. Nothing in this loop trains a model on Jev outputs as targets.

## What it means for Real World

- Self-improvement here means picking among a few named parameter values with a pre-registered rule, not learning a model. That keeps it honest, cheap and inside the vendor contract.
- The receipts page can show which engine configuration produced each forecast, because each promotion is a hashed leaf and every later forecast carries a config hash that names it.
- Early on the loop will report "insufficient n" every day. That is the correct output.

## Recommendations

1. Build the loop with one candidate family, a global Platt map shrunk toward identity, fitted with each question weighted equally. Owner: engineering.
2. Gate on at least 50 resolved training questions and 30 fresh holdout questions; promote only with a Brier improvement of at least 0.005 and a 95% day-block bootstrap interval wholly below zero. These are judgments; E008 tests the false-promotion rate they give.
3. Record every promotion as an append-only row and a hashed ledger leaf that applies from the next day; roll back by appending a row that re-pins an earlier version.
4. Keep the incumbent whenever scoring or evaluation cannot run or any number is not finite.
5. Before running on Jev probabilities in production, get the MCA §2.3(b) review recorded in the vendor ADR.
6. Later, once per-topic counts pass the same gate: per-topic maps. After a budgeted replay path exists: assimilation weights, prompt variants, sample sizes.

## Open questions

- What false-promotion rate do these thresholds give on a forecaster that is already calibrated? E008 measures it on synthetic data.
- How many resolved questions per month will the live lists produce? Unknown until the first approved list runs; it sets when the loop can first act.

## Sources

- [Guo et al., On Calibration of Modern Neural Networks, arXiv 1706.04599](https://arxiv.org/abs/1706.04599), accessed 2026-10-12 (abstract)
- [Niculescu-Mizil and Caruana, Predicting Good Probabilities With Supervised Learning, ICML 2005](https://www.cs.cornell.edu/~alexn/papers/calibration.icml05.crc.rev3.pdf), accessed 2026-10-12 (full text)
- [Dwork et al., Generalization in Adaptive Data Analysis and Holdout Reuse, arXiv 1506.02629](https://arxiv.org/abs/1506.02629), accessed 2026-10-12 (abstract)
- [Cawley and Talbot, On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation, JMLR 11](https://jmlr.org/papers/v11/cawley10a.html), accessed 2026-10-12 (abstract)
- fall_forward_labs docs/adr/0011-typesafe-vendor-review.md, MCA §2.3(b) row, accessed 2026-10-12
