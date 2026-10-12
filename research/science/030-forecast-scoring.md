# Scoring and evaluating probabilistic forecasts

- Date: 2026-10-11
- Area: science
- Confidence: medium. The scoring theory is settled and the commit-reveal papers were opened. The Metaculus formulas, the Polymarket and ForecastBench numbers, and the Gneiting-Raftery text could not be read (403s, a spent search budget), so those parts rest on summaries or on general knowledge, marked below.

## Answer

Use three proper scores and keep them separate. Brier (headline) and log score for yes/no questions, CRPS for numeric distributions. Report skill as a paired difference against the market price at the moment we committed, with a confidence interval. The track record has to be forward-only and hashed, and it must say plainly that anchoring proves integrity, not that the forecast came first. With 22 days to launch we will have a few dozen resolved questions at most, so the honest launch claim is "this record cannot be backfilled", not "we beat the market".

## Findings

**Proper scores.** A proper score rewards reporting your true belief; a strictly proper one makes that the only best report. Gneiting and Raftery (2007, JASA 102:359-378) is the standard reference. CRPS is for forecasts given as a predictive CDF and generalizes absolute error. It is strictly proper when the forecast has a finite first moment, which matters for heavy-tailed outcomes like prices ([search summary of the paper](https://apps.dtic.mil/sti/tr/pdf/ADA459827.pdf), the PDF itself returned 403; [loo docs](https://mc-stan.org/loo/reference/crps.html)). From ensemble samples, CRPS is the mean of |member - outcome| minus half the mean of |member_i - member_j| (standard form, from memory, not re-verified on a page I opened).

**Log score.** The log of the probability given to what happened. Perfect is 0, and 0% on the true outcome is minus infinity. It punishes confident misses far more than it rewards confident hits: going from 99% to 99.9% on a correct call gains about 0.009, a wrong call costs about 2.3 more ([Metaculus Scores FAQ, via search summary](https://www.metaculus.com/help/scores-faq/); direct fetch returned 403).

**Metaculus scores.** Metaculus moved to Baseline and Peer scores in November 2023. Both are built on the log score. Baseline compares you to chance, and Peer compares you to other forecasters on the same question (average Peer score on a question is 0). Baseline Accuracy is summed over questions, Peer Accuracy is averaged ([Metaculus announcement](https://forum.effectivealtruism.org/posts/FodvZaiKftDCHPTub/metaculus-introduces-new-forecast-scores-new-leaderboard-and), opened). A secondary source gives Baseline as 100 times log2(p/q), q being 0.5 for binary. I could not confirm that on the official page. The pattern is what we want: a skill score is a score difference against a named reference.

**Brier skill score is biased on small samples.** The Brier score itself is an unbiased estimate of accuracy. The skill score against a reference is a ratio and is biased, and small samples can push it negative for a forecaster with real skill. The classic Murphy split into reliability, resolution and uncertainty is biased too: reliability is overestimated and uncertainty underestimated, and the bias does not vanish at large n. Serial correlation makes naive confidence intervals too narrow ([Ferro and Fricker 2012 and Bradley et al. 2008, via search summary](https://ore.exeter.ac.uk/repository/handle/10871/8503)). Our daily questions are serially correlated, so this applies.

**Ensembles.** The plain ensemble CRPS is biased by ensemble size. Ferro (2014) gave a "fair" version that is unbiased when members are exchangeable, independent draws. It breaks when members are coupled, for example by post-processing that shares information between them ([Roberts, ECMWF, arXiv 2602.15830](https://arxiv.org/html/2602.15830v1), opened). Our 7-day ensembles share one assimilated world state, so members are only conditionally independent. Treat fair CRPS as a good default, not a guarantee. ECMWF reports about 3% worse CRPS going from 50 to 20 members (search summary only, not opened).

**Continuous calibration.** Arnold, Walz, Ziegel and Gneiting split mean CRPS into miscalibration, discrimination and uncertainty using isotonic regression, with non-negative components ([arXiv 2311.14122](https://arxiv.org/abs/2311.14122), abstract opened, body not readable). It is recent and I found no ready package.

**Tools.** `scoringrules` is Apache-2.0, 105 stars, numpy (numba), JAX and PyTorch, Python 3.12+. It covers Brier, log, RPS, CRPS, energy, variogram, Dawid-Sebastiani and threshold-weighted CRPS. The page shows no releases and does not mention fair CRPS ([repo](https://github.com/frazane/scoringrules)). `properscoring` (Apache-2.0, 188 stars) was archived read-only on 4 Sep 2026, so do not depend on it ([repo](https://github.com/TheClimateCorporation/properscoring)).

**Commit-reveal in practice.** The Axial Seamount volcano experiment hashes each forecast with SHA-256 before it is public and withholds the document until after the next eruption. It copies the Financial Bubble Experiment: digital authentication, timestamped archive, delayed disclosure ([arXiv 2511.06128](https://arxiv.org/abs/2511.06128), abstract opened). A 2026 F1000Research paper hashes each forecast, collects digests in a manifest, and anchors the manifest on Bitcoin with OpenTimestamps. It states the limit bluntly: the anchor proves the bytes have not changed since the block, not that the text existed before the event. Anteriority rests on platform timestamps and archives, and some of its events were anchored after they resolved. It also reports a Brier of 0.0958 over 92 graded calls, but its grading used partial credit (0.5 for NEAR or PARTIAL) and wording mapped to probability bands, which is exactly the softness we should avoid ([F1000Research 15-1322](https://f1000research.com/articles/15-1322)). OpenTimestamps needs no account or API key, and the free calendar servers pay the fees ([opentimestamps.org](https://opentimestamps.org/)). You must publish the .ots proof file with the document.

## What it means for Real World

- For the product: The receipts page should show, per question, the sealed hash, the stamp, the market price at commit time, our probability, the outcome, and the score difference. Show confidence intervals and the count of resolved questions on every aggregate. Counterfactual forks ("a chip shortage doubles phone prices") have no outcome and cannot be scored. Never put them in the track record, and say so on the page.
- For the engineering: One small scoring module with Brier, log and CRPS, about 50 lines, no dependency. Use `scoringrules` only as a test oracle in Python. Freeze everything at commit: question text, resolution source and rule, our distribution or probability, market price and venue, model version, data cutoff.
- For the business: Markets are a hard baseline and we should expect to lose to them at first on questions where a liquid market exists. The defensible claim is the unbackfillable record and the questions markets do not cover. Aaru's 2024 miss is the cautionary case for claiming accuracy early.

## Recommendations

1. Headline metric: mean Brier difference and mean log-score difference versus the market price snapshot taken at commit time, per question, with a block bootstrap by day. Do not headline Brier skill score ratios or Murphy components below roughly 100 questions (our rule of thumb, not from a source).
2. Clip probabilities to [0.01, 0.99] before the log score, and publish the clip rule. State it up front so nobody thinks we hid a miss.
3. Numeric questions: submit 21 or more quantiles or at least 50 samples, score with fair CRPS, and also report coverage of the 50% and 90% intervals. Coverage is the plain check for variance collapse. A calibrated-looking mean with narrow intervals fails here.
4. Only create questions with a fixed resolution source and a yes/no or numeric outcome. No partial-credit grading.
5. Daily commit: write all forecasts to one JSON file, hash each entry with a per-entry random salt, build a Merkle root, include the previous day's root, publish the root on a public page and stamp it with OpenTimestamps the same hour. Reveal salts at resolution. Publish the .ots files.
6. Label every backtest "retrospective" and keep it out of the scored record. LLMs have seen the past, so only forward scores count.
7. Score by region and segment as well as pooled. A pooled number can hide Western flattening. Expect wide intervals there.

## Open questions

- Which official Metaculus formulas apply (the Scores FAQ returned 403)? Read it from a browser and confirm the Baseline and Peer definitions.
- How good is the market baseline, and where does it fail (favorite-longshot, thin markets)? The Polymarket calibration search was not run because the search budget ran out. Run it next.
- ForecastBench's method and its human, market and LLM baselines. The homepage had no numbers. Read its docs and paper.
- Does `scoringrules` expose fair CRPS? Check its docs and code before relying on it.
- How many questions per day can we resolve? This sets the power, and I only estimate a few dozen by launch. Count the actual list.

## Sources

- [Strictly proper scoring rules, prediction, and estimation (Gneiting and Raftery), DTIC copy](https://apps.dtic.mil/sti/tr/pdf/ADA459827.pdf), accessed 2026-10-11 (403, summary only)
- [loo: CRPS reference](https://mc-stan.org/loo/reference/crps.html), accessed 2026-10-11 (search summary)
- [Metaculus Scores FAQ](https://www.metaculus.com/help/scores-faq/), accessed 2026-10-11 (403, summary only)
- [Metaculus introduces new forecast scores](https://forum.effectivealtruism.org/posts/FodvZaiKftDCHPTub/metaculus-introduces-new-forecast-scores-new-leaderboard-and), accessed 2026-10-11
- [Ferro, bias-corrected decomposition of the Brier score](https://ore.exeter.ac.uk/repository/handle/10871/8503), accessed 2026-10-11 (search summary)
- [Roberts, ensemble-size dependence and fair scores, arXiv 2602.15830](https://arxiv.org/html/2602.15830v1), accessed 2026-10-11
- [Arnold et al., Decompositions of the mean CRPS, arXiv 2311.14122](https://arxiv.org/abs/2311.14122), accessed 2026-10-11
- [scoringrules](https://github.com/frazane/scoringrules), accessed 2026-10-11
- [properscoring](https://github.com/TheClimateCorporation/properscoring), accessed 2026-10-11
- [Axial Seamount Eruption Forecasting Experiment, arXiv 2511.06128](https://arxiv.org/abs/2511.06128), accessed 2026-10-11
- [F1000Research 15-1322, hashed and anchored forecasts](https://f1000research.com/articles/15-1322), accessed 2026-10-11
- [OpenTimestamps](https://opentimestamps.org/), accessed 2026-10-11
