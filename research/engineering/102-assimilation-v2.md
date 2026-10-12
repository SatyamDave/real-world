# Why nudging loses to persistence, and what assimilation v2 should be

- Date: 2026-10-12
- Area: engineering
- Confidence: medium. The diagnosis follows from the E003 results and the operator code, both committed, plus arithmetic on their settings. The method rests on standard Kalman filter algebra (one opened source) and one opened source for innovation-based variance inflation. The observation-error factor for real polls comes from US election polls and is an estimate elsewhere. No v2 result exists yet; E006 tests it.

## Answer

Capped nudging loses to holding yesterday's poll because, below the cap, it adopts each poll whole (gain one, noise included), above the cap it moves too slowly, and the anchor pull then drags the correction back toward the biased prior between polls. It has no notion of how much it knows. Real World should replace it with a per-segment, per-topic scalar Kalman filter on segment mean beliefs: a random-walk forecast step that grows each cell's variance every day, a gain set by that variance against the poll's error variance, the increment applied to every agent in the segment and to a stored segment anchor offset so the pull does not undo it, and innovation-based inflation so a shock is absorbed in one poll. Switch the daily cycle to it only if a new pre-registered run on new seeds (E006) shows it beats persistence.

## Findings

**What E003 measured.** On the synthetic world, nudging beat no assimilation (day-30 logit RMSE difference -0.4449, 95% interval -0.4497 to -0.4401, n = 50 seeds) but lost to persistence by +0.2353 (95% interval +0.2288 to +0.2419, n = 50) ([E003 RESULTS.md](../../experiments/E003/results/2026-10-12-none/RESULTS.md), commit `b6957bed`). The mean RMSE curve shows the gap opening after each shock: day 9 nudge 0.368 vs persistence 0.297; day 10, the first shock, 0.592 vs 0.529; day 30, ten days after the second shock, 0.508 vs 0.273 ([results.json](../../experiments/E003/results/2026-10-12-none/results.json)).

**Mechanism 1: no noise averaging.** `beliefs.nudge` shifts a segment by `clip(logit(share) - mean, -cap, cap)` with `NUDGE_CAP_LOGIT = 0.3` ([beliefs.py](../../engine/rw/beliefs.py), [settings.py](../../engine/rw/settings.py)). Whenever the gap is under the cap, the segment lands exactly on the poll, so its error equals the poll's error. In E003 each poll carries noise of 0.2 logit (`E003_POLL_NOISE_LOGIT` in [experiments.py](../../engine/rw/experiments.py)). Persistence has the same property. Inference: under the cap, nudging can at best tie persistence; it never averages several polls to beat a single one.

**Mechanism 2: the cap slows recovery.** The E003 prior starts 0.5 logit off on average (bias 0.5 plus noise of SD 0.3) and each shock adds noise of SD 0.5 (`E003_PRIOR_BIAS_LOGIT`, `E003_SHOCK_SD_LOGIT`). A 0.5 gap needs two observations at a 0.3 cap. With 20% of cells observed per day, the expected wait between observations of a cell is 1/0.2 = 5 days, so closing a typical gap takes about ten days, while persistence closes it with the first poll. This matches the curve: nudging's deficit is largest right after days 10 and 20.

**Mechanism 3: the anchor pull reopens the gap.** Every day `update_beliefs` adds `ANCHOR_PULL * (B0 - B)` with `ANCHOR_PULL = 0.05`, and `B0` is the biased prior. Over a five-day wait between polls it removes 1 - 0.95^5, about 23%, of any correction (arithmetic on the setting). The belief-assimilation paper names this failure: without a segment anchor offset in the state, the pull undoes each analysis increment within about 1/rho days, so the gap is closed each morning and reopened each night; with the offset, a persistent gap becomes a shift of where the segment reverts to, while each agent's anchor stays put ([paper.tex, section on parameters](../../papers/belief-assimilation/paper.tex)).

**Mechanism 4: no uncertainty.** Nudging uses the same gain on day 1 and day 30, for a cell polled yesterday and one unpolled for two weeks, and for a precise and a noisy poll. The Kalman filter instead carries a variance P per cell: predict P = F P F' + Q, then gain K = P H' S^-1 with S = H P H' + R, and update P = (I - K H) P. If the process and measurement covariances are known and mean is zero, it is the best possible linear estimator in the minimum mean-square-error sense, Gaussian or not ([Wikipedia: Kalman filter](https://en.wikipedia.org/wiki/Kalman_filter)). Persistence is the special case K = 1. Inference: with Q and R near the truth, the filter cannot do worse than persistence in expectation on observed cells.

**Shocks break a fixed Q.** A filter tuned to the daily walk (SD 0.05 in E003) has a small gain and recovers from an SD 0.5 shock as slowly as the cap does. Covariance matching, one of the classical adaptive approaches, checks that the sample covariance of the innovations is consistent with its theoretical value S = H P H' + R and increases the process noise when it is much larger; convergence has never been proved for this method ([Zhang et al. 2020, IEEE Access](https://pmc.ncbi.nlm.nih.gov/articles/PMC8638515/)). The one-observation form is to raise P to the squared innovation minus R when that is larger, before computing the gain. Inference: a shocked cell then gets a gain near one, like persistence, and a quiet cell keeps averaging. The cost of a one-sample estimate is that ordinary poll noise sometimes triggers it too, so a quiet, densely polled cell forgets earlier polls sooner than a filter with the right fixed Q would. In exchange the gain depends less on the walk SD, which we have not measured. A jump-mixture filter (two process variances weighted by how likely a shock is) avoids the trade but needs a shock rate we do not have.

**What no operator can fix.** A cell not polled since the last shock carries that shock in every method, since nothing observes it. In E003, 0.8^10, about 11%, of cells go unobserved in the ten days after day 20 (arithmetic on the 20% daily observation rate). The E003 primary RMSE includes them, so the room for any method to beat persistence at day 30 is limited to cells polled since day 20. Expect a modest margin, not a repeat of the -0.44 against no assimilation.

**Real poll error is larger than sampling error.** Across 4,221 polls for 608 US state-level elections from 1998 to 2014, average survey error was about 3.5 percentage points, roughly twice what reported margins of error imply, and margins of error capture only sampling variability ([Shirani-Mehr et al. 2018, abstract on RePEc](https://ideas.repec.org/a/taf/jnlasa/v113y2018i522p607-614.html)). Inference: for the daily cycle, the poll error SD in logit should be about twice the sampling SD, which by the delta method is sqrt(1 / (n p (1 - p))) for a share p from n respondents. The factor two is from US election polls and is an estimate for other polls and countries.

**Ensemble filters are not needed for this state.** The notes recommend an ETKF on segment aggregates ([022](../science/022-data-assimilation-abm.md), [038](../open-source/038-data-assimilation-libs.md)). An ensemble filter estimates the covariance from members; when cells evolve independently and the observation of a segment is its mean, as in E003 and in the v1 daily cycle where each poll observes one country's mean, the covariance is diagonal and the scalar Kalman filter is exact. The paper states that for the v1 forecast model every agent moves by its segment's shift and the loading-shift lift with unit loadings is exact ([paper.tex, Forecast model](../../papers/belief-assimilation/paper.tex)). Inference: an ETKF adds sampling noise and an ensemble for no gain until observations couple cells, for example a national poll over many segments.

## What it means for Real World

- For the product: the morning correction would move a segment by an amount that depends on how sure we are, and every change is still stored per segment, topic and day. A shocked segment snaps to its first new poll; a quiet one averages. Countries with no poll are untouched, as now.
- For the engineering: one numpy function in `beliefs.py` beside `nudge`, plus two state arrays carried in the snapshot (the anchor offset and the variance per agent column). `update_beliefs` is unchanged; the daily cycle passes `b0 + offset` as its anchor. `b0` is never overwritten, per [065](065-belief-update-operators.md).
- For the business: E003 showed we lose to the simplest baseline a skeptic would pick. The receipts page shows persistence next to us ([CTO lens](../lenses/cto.md)), so this gap would be public. Closing it is worth one experiment.

## Recommendations

1. Record the operator choice in a decision record that makes the default switch conditional on E006 ([0005](../decisions/0005-assimilation-v2.md)).
2. Pre-register E006 on the E003 world with new seeds: v2 vs persistence (primary), vs nudging and no assimilation, plus arms with the walk SD halved and doubled, since the filter's walk SD equals the generator's ([E006](../../experiments/E006/PREREG.md)).
3. Implement `beliefs.kalman_update(B, C, P, group_ids, targets, walk_sd)`: random-walk forecast, covariance-matching inflation, scalar gain, unit-loading lift to agents and to the offset `C`. Test it against the textbook scalar update, the zero-evidence property, preserved within-segment spread, and recovery from a shock in one poll.
4. In the daily cycle, set each poll's error SD to `POLL_ERROR_FACTOR` (2.0) times its sampling SD, and use `b0 + C` as the anchor.
5. If E006 passes, switch the default in the same PR as the results and update `product/world.md`, which still says no Kalman filter before a hindcast. If it fails, keep nudging and publish the miss.

## Open questions

- The real daily walk SD of segment opinion is unknown. Estimate it from poll series (for example, the variance of differences between successive polls of the same population, net of sampling error) before trusting v2's gain on live data.
- The prior SD (how wrong the population synthesis is per segment) is unknown; the paper sets it from an anchor validation that has not run. v2 starts at 1.0 logit, a judgment that makes the first poll dominate.
- Does v2 beat persistence on real polls? Only a hindcast on post-cutoff poll series answers that ([022](../science/022-data-assimilation-abm.md), recommendation 4).
- When national polls observe many segments at once, cells couple and the scalar filter is no longer exact; that is the trigger for the ETKF in [038](../open-source/038-data-assimilation-libs.md).

## Sources

- [Kalman filter (Wikipedia)](https://en.wikipedia.org/wiki/Kalman_filter), accessed 2026-10-12
- [Zhang, Sidoti, Bienkowski, Pattipati, Bar-Shalom, Kleinman: On the Identification of Noise Covariances and Adaptive Kalman Filtering (IEEE Access 2020, PMC full text)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8638515/), accessed 2026-10-12
- [Shirani-Mehr, Rothschild, Goel, Gelman: Disentangling Bias and Variance in Election Polls (JASA 2018, RePEc abstract)](https://ideas.repec.org/a/taf/jnlasa/v113y2018i522p607-614.html), accessed 2026-10-12
- Committed: [E003 results](../../experiments/E003/results/2026-10-12-none/RESULTS.md), [engine/rw/beliefs.py](../../engine/rw/beliefs.py), [engine/rw/experiments.py](../../engine/rw/experiments.py), [papers/belief-assimilation](../../papers/belief-assimilation/paper.tex)
