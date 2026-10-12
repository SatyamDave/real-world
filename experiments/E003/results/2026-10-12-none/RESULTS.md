# E003 results: Belief assimilation converges on a synthetic ground-truth world

- Command: `python -m rw.experiments run E003`
- Commit: `b6957bed1957a251d55a46731fa640f71ac0f566`
- PREREG.md sha256: `13b0279a0d5f87d5b4f48fb652dd327c3cea4368a86b4476b69cc2794b5d7171` (matches REGISTRY.md)
- Engine 0.1.0, provider none, model none, cost $0.000000
- n = 50; raw rows in `rows.csv`, every number in `results.json`

## Pre-registered metrics

- Primary, day-30 RMSE in logit, nudging minus no assimilation, paired by seed: -0.4449 (95% interval -0.4497 to -0.4401, n = 50). Verdict: supported; nudging wins only if the whole interval is below zero.
- Same, cells never observed by day 30: +0.0000 (95% interval +0.0000 to +0.0000, n = 32) (n counts seeds with at least one such cell).
- Day-30 RMSE, nudging minus persistence: +0.2353 (95% interval +0.2288 to +0.2419, n = 50).
- ETKF arm: not run. The engine has no ETKF, so the DAPPER check could not run and the arm is dropped, as the PREREG baseline section allows.
- Spread-skill ratio: not computed. The nudging arm is one member with no ensemble spread.
- Zero-evidence property (variance does not shrink with no observations): pass, smallest variance ratio 1.000000.
- Mean RMSE in logit by day (none / nudge / persistence): day 1: 0.583 / 0.546 / 0.529; day 6: 0.594 / 0.419 / 0.356; day 11: 0.783 / 0.567 / 0.484; day 16: 0.792 / 0.478 / 0.333; day 21: 0.941 / 0.619 / 0.477; day 26: 0.947 / 0.542 / 0.327; day 30: 0.953 / 0.508 / 0.273. Every day is in results.json.

## Deviations from the pre-registration

- Segments are population.py's country x age band x education segments present in a 2000-agent world (137 on seed 0), not 200, and topics are the first 5 in data/topics.csv.
- The noisy market aggregate is not generated: market prices never enter assimilation (engine/CLAUDE.md).
- The ETKF arm and the spread-skill ratio are not computed, for the reasons above.
