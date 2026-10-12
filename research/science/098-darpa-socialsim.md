# DARPA SocialSim: what it did and what transfers

- Date: 2026-10-11
- Area: science
- Confidence: low-medium. The program's own pages are thin and the web search budget ran out before I could open the performer papers. Facts below marked "verified" come from pages I opened. Facts marked "recollection" come from memory and need checking.

## Answer

SocialSim was a DARPA program (2017 to about 2020, by recollection) that scored simulators of online behavior against held-out real data on GitHub, Reddit and Twitter. The useful part for us is not the agent models. It is the evaluation design: forecast a future window, compare to ground truth with fixed metrics, and beat a dumb baseline built from recent history. Real World should copy that scoring discipline and skip the rest.

## Findings

**The program (verified).** DARPA's page is titled "Computational Simulation of Online Social Behavior (SocialSim)", sits under the Information Processing Techniques Office, and says the program "is now complete" and is no longer maintained. The stated goal was high-fidelity simulation of how information spreads and changes online. The stated motivation was that government analysis relied on small expert teams whose accuracy was unknown and whose coverage was a fraction of the real world. Uses named: analyzing adversary disinformation and delivering information to populations in disaster relief. The page contrasts top-down models (scale, but inaccurate when populations vary) with bottom-up models (more accurate, do not scale). It lists no dates, performers or results. ([DARPA](https://www.darpa.mil/program/computational-simulation-of-online-social-behavior))

**The evaluation harness (verified).** PNNL ran the evaluation and published the scoring code. `pnnl/socialsim` is BSD-2-Clause, 20 stars, with a change log from 9 Oct to 2 Nov 2018 and a "December Challenge". It defines six measurement classes: baseline, network (one per platform: GitHub, Reddit, Twitter), single-cascade and cascade-collection. Metrics are Jensen-Shannon divergence, RMSE and R-squared between simulated and ground-truth measurements. Missing values are forward-filled for cumulative series and zero-filled otherwise. Measurements are tagged by scenario (1, 2, 3) and by scale (user, community, population). ([pnnl/socialsim](https://github.com/pnnl/socialsim))

**The later package (verified).** `pnnl/socialsim_package` is archived ("no longer maintained"), has a custom Battelle license (GitHub reports NOASSERTION; redistribution and modification are allowed with notice), and has config files for checkpoints CP1 and CP2 plus scoring notebooks for CP3 and CP4. Input is JSON lines with a header (`identifier`, `team`, `scenario`) then per-action records (`nodeID`, `nodeUserID`, `actionType`, `nodeTime`, `platform`). So the task was event-stream simulation: emit the actions users will take. ([socialsim_package](https://github.com/pnnl/socialsim_package), [LICENSE](https://github.com/pnnl/socialsim_package/blob/master/LICENSE))

**The baseline (verified).** The CP4 script builds baselines by resampling the actual data from the window just before the simulation period, of equal length (the example uses weekly Venezuela-topic Twitter files from Jan to Feb 2019), generating `n_runs` samples per period. This is a persistence baseline: next week looks like last week. ([baselines README](https://github.com/pnnl/socialsim_package/tree/master/baselines))

**A performer framework (verified, partial).** `SocialSim/SimulatorCore` (SocialCube, "multiscale modeling and simulation framework for social streams") has a time-based simulator core, an Agent Builder, Agent and Behavior models where a behavior is "how an agent should behave given certain probability", and an offline Analysis Library that fits statistics from a dataset. It is a statistical agent model, no neural text generation. The README names no team or results. ([SimulatorCore](https://github.com/SocialSim/SimulatorCore))

**Recollection, unverified.** Performers included university and contractor teams (I recall USC and Leidos among them; I could not confirm). Reported lessons, as I remember them: simple statistical and persistence baselines were hard to beat on population-level counts; agent-level fidelity was much weaker than aggregate fidelity; models fit to one topic or platform transferred poorly. Treat these as hypotheses to check in the performers' papers.

**Why it ended.** I found no primary statement. DARPA says only that it is complete. Programs of this type end on schedule at the end of their phases, so "ended" does not mean "failed". I have no evidence either way.

## What it means for Real World

- For the product: The receipts page is a SocialSim-style scoreboard. Show each forecast against the persistence baseline (yesterday's value), not only against market price. A forecast that beats the market but not persistence is not news.
- For the engineering: Pre-register the metric set before launch and freeze it. Use SocialSim's split: one distribution metric (JS divergence), one error metric (RMSE), and a scale label (agent, segment, population). Report the agent-level score separately from the aggregate. Expect the agent-level score to be bad.
- For the business: For YC, the claim "DARPA spent years and built the same kind of scoring harness, and it is archived" is a point for us: the harness is public and BSD-licensed, so we can borrow it, but nobody runs it daily on the whole world. Do not claim the program proves LLM agents work. It predates them.

## Recommendations

1. Implement a persistence baseline (last 7 days resampled, as in the CP4 script) for every published forecast. One engineer, half a day.
2. Adopt JS divergence plus RMSE plus a scale tag as the fixed metric trio on the receipts page, alongside Brier vs market. Write the definitions in one README a PM can read.
3. Read the pnnl/socialsim `Metrics.py` and the CP3/CP4 notebooks, and port only the metric functions to our scoring module. Check the Battelle license terms for the package before copying any code (the `socialsim` repo is plain BSD-2-Clause).
4. Report aggregate and agent-level accuracy as separate numbers. Never show an agent-level claim without its score.
5. Before the YC application, spend two hours reading the performer papers (I could not open them) and replace every "recollection" item above with a cited result.

## Open questions

- Who the performers were, what each team's method was, and the actual scores versus baseline. Find out by reading the SocialSim performer papers and the PNNL wiki, which the README points to but I could not open.
- Why the program ended and whether a follow-on exists. Ask via DARPA public releases or the PNNL authors.
- Whether the agent-level versus population-level gap I recall is real. Check the CP3/CP4 results in the scoring notebooks.
- Whether the Battelle license in `socialsim_package` allows reuse of code in a commercial product. Read the full text with counsel.

## Sources

- [DARPA: Computational Simulation of Online Social Behavior](https://www.darpa.mil/program/computational-simulation-of-online-social-behavior), accessed 2026-10-11
- [pnnl/socialsim (BSD-2-Clause)](https://github.com/pnnl/socialsim), accessed 2026-10-11
- [pnnl/socialsim_package (archived)](https://github.com/pnnl/socialsim_package), accessed 2026-10-11
- [socialsim_package LICENSE](https://github.com/pnnl/socialsim_package/blob/master/LICENSE), accessed 2026-10-11
- [socialsim_package baselines](https://github.com/pnnl/socialsim_package/tree/master/baselines), accessed 2026-10-11
- [SocialSim/SimulatorCore](https://github.com/SocialSim/SimulatorCore), accessed 2026-10-11
