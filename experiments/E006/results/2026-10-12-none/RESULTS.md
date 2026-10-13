# E006 results: Assimilation v2 vs persistence on the E003 synthetic world

- Command: `python -m rw.experiments run E006`
- Commit: `3163defe77750a8bed4c0e199f1c82697014f36b`
- PREREG.md sha256: `ad372cad8f2a3d2a00641b9205cdb97afa87d87e151c88c7e3e47593b8bc450d` (matches REGISTRY.md)
- Engine 0.1.0, provider none, model none, cost $0.000000
- n = 50; raw rows in `rows.csv`, every number in `results.json`

## Pre-registered metrics

- Primary, day-30 RMSE in logit, v2 minus persistence, paired by seed: -0.0182 (95% interval -0.0190 to -0.0174, n = 50). Verdict: supported; v2 wins only if the whole interval is below zero.
- day30 rmse v2 minus nudge: -0.2608 (95% interval -0.2675 to -0.2543, n = 50).
- day30 rmse v2 minus none: -0.7118 (95% interval -0.7197 to -0.7038, n = 50).
- never observed day30 rmse v2 minus none: +0.0000 (95% interval +0.0000 to +0.0000, n = 33).
- day30 rmse v2 walk half minus persistence: -0.0174 (95% interval -0.0182 to -0.0165, n = 50).
- day30 rmse v2 walk double minus persistence: -0.0190 (95% interval -0.0197 to -0.0183, n = 50).
- Day-30 RMSE over v2's own predicted SD (1 is calibrated): mean 1.367, range 1.198 to 1.612, n = 50.
- Largest change in within-segment SD under v2 by day 30: 9.13e-13 logit.
- Zero-evidence property (variance does not shrink with no observations): pass, smallest variance ratio 1.000000.
- Mean RMSE in logit by day (none / nudge / persistence / v2 / v2_walk_half / v2_walk_double): day 1: 0.587 / 0.549 / 0.532 / 0.531 / 0.531 / 0.531; day 6: 0.596 / 0.420 / 0.357 / 0.349 / 0.349 / 0.349; day 11: 0.792 / 0.576 / 0.489 / 0.483 / 0.483 / 0.483; day 16: 0.800 / 0.482 / 0.334 / 0.322 / 0.323 / 0.321; day 21: 0.956 / 0.630 / 0.482 / 0.475 / 0.476 / 0.475; day 26: 0.963 / 0.554 / 0.333 / 0.321 / 0.322 / 0.320; day 30: 0.967 / 0.516 / 0.274 / 0.256 / 0.256 / 0.255. Every day is in results.json.
- Decision 0005: the daily default switches to v2 ('kalman').

## Deviations from the pre-registration

- None from the E006 plan. As in E003, segments are those present in a 2000-agent world (135 on seed 1000), and the market aggregate is not generated.
