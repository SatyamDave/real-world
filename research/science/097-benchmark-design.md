# Designing a hard-to-break benchmark

- Date: 2026-10-11
- Area: science
- Confidence: medium. Design rules come from pages I opened (ForecastBench, Metaculus, Polymarket, OSF). The web-search budget ran out mid-task, so I could not open the "Funhouse Mirrors" paper or any prior-art on Western flattening. Those claims are from the brief, not verified here.

## Answer

The only benchmark a reviewer cannot dismiss is forward-only: forecasts are committed and hashed before the outcome exists, questions come from a frozen auto-generator, and scores are against a market price on the same questions. Copy ForecastBench's structure (nightly resolution, difficulty-adjusted Brier, human baseline) and add what it does not do: public hash commits and a separate, pre-registered track for survey-distribution accuracy. Do not claim "beats the market" until there are enough resolved questions to say so; say "calibrated, with a track record that cannot be backfilled" instead.

## Findings

**Forward-only is the accepted standard.** ForecastBench (Karger et al., ICLR 2025) asks only about events with no known answer at submission, to prevent training-set leakage. It starts from 1,000 auto-generated questions, scored on a random 200 subset for humans. Expert forecasters beat the best LLM, p < 0.001 ([arXiv 2409.19839](https://arxiv.org/abs/2409.19839)). The repo is MIT licensed, 89 stars, so it is small and borrowable ([GitHub](https://github.com/forecastingresearch/forecastbench)).

**Its machinery is boring and copyable.** Data is pulled nightly per source, in `<source>_questions.jsonl` files. Market questions carry open, close and resolution datetimes. Question sets are cut on day D-10 before the forecast due date. Each question has a list of forecast horizons in days. An LLM step validates questions before sampling. Resolution runs at 00:00 UTC. Every two weeks it samples 500 questions for LLMs and 200 for humans. The human set is uploaded only after all forecasts are in. Question files are not public because of data-source licenses ([wiki](https://github.com/forecastingresearch/forecastbench/wiki/How-does-ForecastBench-work%3F), [docs](https://www.forecastbench.org/docs/)).

**Scoring must handle different question sets.** ForecastBench uses a difficulty-adjusted Brier score so forecasters who answered different questions can be ranked. Its report says rankings stabilize within 50 days of a model joining. Its public page lists a Superforecaster-LLM tournament on 2026-10-25, two days before our launch ([site](https://www.forecastbench.org/)).

**Retrieval forecasting needs a post-cutoff test set.** Halawi et al. built their test set from questions published after the models' knowledge cutoffs, and their system nears the crowd aggregate of competitive forecasters ([arXiv 2402.18563](https://arxiv.org/abs/2402.18563)). The lesson: contamination control is a date rule, not a trust claim. Every model we use has a cutoff, and a question must open after it.

**Metaculus shows what a small question count costs.** Its bot tournaments run 300-500 questions per season; MiniBench rounds have about 60. Metaculus says 60 questions separates best from worst bots but not good from slightly better. Rankings swing late because most questions resolve at the end. Peer score uses only the last forecast before close. Spring 2026 pros "only narrowly retain their lead" ([Metaculus AIB](https://www.metaculus.com/notebooks/38928/q2-ai-benchmark-results/)).

**Markets are good question sources with real resolution risk.** Polymarket resolves via UMA: a bond (typically $750), a 2-hour challenge window, and disputes that take 4-6 days. Outcomes can be "Too Early" or 50-50. Resolution follows the rules text, not the title, and clarifications can be added after trading starts ([Polymarket docs](https://docs.polymarket.com/developers/resolution/UMA)). A benchmark that scores against these markets must drop or flag non-binary and disputed outcomes.

**Pre-registration needs a timestamp we control.** OSF registrations cannot be freely edited once finalized; changes go in a new registration or a visible changes document. Embargo is allowed up to 4 years ([COS](https://www.cos.io/initiatives/prereg)). OSF suits the protocol (question rules, scoring, exclusions). It does not suit daily forecasts. Those need our own hash commit.

**The survey-fidelity claims are weaker than they look.** Argyle et al. argue GPT-3 "silicon samples" reproduce subgroup response patterns ([arXiv 2209.06899](https://arxiv.org/abs/2209.06899)). Dominguez-Olmedo et al. tested 43 models on the American Community Survey. After randomizing answer order, nearly all gave close to uniform responses, and apparent subgroup alignment often just reflects subgroups whose answers are near uniform ([arXiv 2306.07951](https://arxiv.org/abs/2306.07951)). Reviewers will cite this. Any held-out poll score must beat a uniform baseline and a demographics-only marginal baseline, not just "looks plausible."

**Interview grounding is the strongest published result.** Park et al. built agents for 1,052 Americans. On held-out GSS items, interview agents reached 83% of each person's own two-week test-retest consistency, survey agents 82%, combined 86%, demographics-only 74%. It is US-only ([arXiv 2411.10109](https://arxiv.org/abs/2411.10109)). Note the normalization: accuracy is relative to human self-consistency. We should report the same ceiling.

## What it means for Real World

- For the product: Receipts page shows each forecast's hash time, question text, our probability, market price at commit, outcome, and Brier for both. Mark every score "forecast-only" so nobody reads backtests as track record. Show the count of resolved questions next to every headline number.
- For the engineering: Build three tracks, kept separate in the schema. (1) Market track: questions auto-generated from open markets. (2) Poll track: held-out survey waves not seen by the assimilation step. (3) Event track: GDELT-derived or dataset questions with numeric resolution. Store `question_id`, `opened_at`, `commit_hash`, `committed_at`, `model_version`, `cutoff_date`, `resolution_source`, `market_price_at_commit`. Run the resolver nightly at 00:00 UTC like ForecastBench.
- For the business: The YC story on Nov 2 is a small, honest, growing record, not a win claim. With 22 days, we will have about 3 weeks of resolved questions at best. Aaru's 2024 miss is the foil: our pitch is that failure is visible and timestamped.

## Recommendations

1. Publish a one-page protocol before launch: question sources, filters, horizons, scoring (Brier plus difficulty adjustment), exclusion rules, baselines. Register it on OSF with a short embargo or none. Freeze it; changes go in a public changelog.
2. Hash-commit every forecast daily: SHA-256 of the canonical JSON, posted to a public append-only log (a git repo with signed commits works; add an external timestamp such as OpenTimestamps if cheap). Include the market price at commit time. Commit before the question's data window opens.
3. Auto-generate market questions with strict filters: binary only, open after the simulation model's cutoff, resolution within 7-30 days, resolution rules parsed and stored, drop anything "Too Early", 50-50 or disputed, and tag oracle type. Mirror ForecastBench's LLM validity check, then a human spot check of 10%.
4. Set three baselines per track: market price at commit, base rate or uniform, and plain LLM prompt with no simulation. Claim lift only against the last. For polls, add a demographics-only marginal baseline and report relative to test-retest ceiling where we have panel data.
5. Hold out polls by wave and by country. The assimilation step may only see surveys released before the commit date. Keep one country set (say five non-Western countries) out of all tuning, and report per-region scores so Western flattening shows up in the numbers instead of in a reviewer's email.
6. Report uncertainty honestly: bootstrap confidence intervals on Brier difference, minimum 100 resolved questions before any "beats market" sentence, and state ensemble spread calibration (does 80% interval cover 80%).
7. Do not use backtests on past events in marketing. If we run them for debugging, label them contaminated and keep them off the receipts page.

## Open questions

- What does ForecastBench do about contamination beyond the post-cutoff date rule? The wiki does not say. Read the ICLR paper's method section.
- What is the "Funhouse Mirrors" variance-collapse result exactly, and what metric detects it? I could not open it. Find the paper and add its metric to the poll track.
- How many resolved market questions can we get by Nov 2? Estimate from Polymarket and Metaculus open questions with close dates before Oct 30; needs a quick count script.
- Which global survey waves release on a schedule we can predict (WVS, Gallup, Pew, barometers)? Most are annual or multi-year, so poll-track resolution will be thin in 22 days.
- Will Polymarket and Metaculus data terms allow republishing question text on the receipts page? ForecastBench withholds files for license reasons. Check terms.

## Sources

- [ForecastBench paper, arXiv 2409.19839](https://arxiv.org/abs/2409.19839), accessed 2026-10-11
- [ForecastBench site](https://www.forecastbench.org/), accessed 2026-10-11
- [ForecastBench docs](https://www.forecastbench.org/docs/), accessed 2026-10-11
- [ForecastBench GitHub repo](https://github.com/forecastingresearch/forecastbench), accessed 2026-10-11
- [ForecastBench wiki, How does ForecastBench work?](https://github.com/forecastingresearch/forecastbench/wiki/How-does-ForecastBench-work%3F), accessed 2026-10-11
- [Halawi et al., Approaching human-level forecasting, arXiv 2402.18563](https://arxiv.org/abs/2402.18563), accessed 2026-10-11
- [Metaculus AI benchmark results notebook](https://www.metaculus.com/notebooks/38928/q2-ai-benchmark-results/), accessed 2026-10-11
- [Polymarket UMA resolution docs](https://docs.polymarket.com/developers/resolution/UMA), accessed 2026-10-11
- [COS preregistration page](https://www.cos.io/initiatives/prereg), accessed 2026-10-11
- [Argyle et al., Out of One, Many, arXiv 2209.06899](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [Dominguez-Olmedo et al., Questioning the Survey Responses of LLMs, arXiv 2306.07951](https://arxiv.org/abs/2306.07951), accessed 2026-10-11
- [Park et al., Generative Agent Simulations of 1,000 People, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
