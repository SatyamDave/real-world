# Data assimilation for agent-based models and social systems

- Date: 2026-10-11
- Area: science
- Confidence: medium. The ABM papers are opened and cited. The social-belief application is our own extrapolation, since nobody has published it at this scale. Search budget ran out before I could open two further papers (listed under Open questions).

## Answer

Data assimilation has been made to work on agent-based models, but only on small systems or on aggregate state, and no one has done it for belief states of 100,000 LLM agents. Real World should not filter individual agents. It should assimilate a small vector of segment-level belief aggregates and shock parameters with an ensemble filter, then push the result back into agents as a nudge. The ensemble must run on a cheap aggregate model, because an ensemble of LLM worlds costs too much.

## Findings

**Ensemble Kalman filter (EnKF) on an ABM works, with small ensembles.** Ward, Evans and Malleson (Leeds, Royal Society Open Science 2016) calibrate a footfall ABM of Leeds city centre with an EnKF. They estimate both the state (people on the street) and rate parameters. Ensemble size N=100 gave a forecast RMSE of 549.2. N=10 gave 1141. N=1000 gave 457.3. They state this is an advantage over particle filtering: small ensembles give reasonable results. The EnKF assumes Gaussian observation noise and a linear observation operator. They had to model the counts in log space to satisfy that. They stress that you must understand the statistics of the data first. [Ward et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4852637), full text read via Europe PMC.

**Particle filter on individual agents does not scale.** Malleson et al. (JASSS 23(3), 2020, CC BY 4.0) run a bootstrap particle filter on StationSim, a toy pedestrian model. They tested 2 to 40 agents and 1 to 10,000 particles. With 10 agents, 10 particles suffice. With 40 agents, 10 particles miss some agents entirely. About 10,000 particles brings 40 agents to the error level of the 10-agent runs. The authors say the particle count grows exponentially with agent count, and extrapolate that hundreds of agents would need millions of particles. That extrapolation is not tested. The filter also got extra help: it knew each agent's entry time, speed and destination, and observed every agent's location. They name untested remedies: aggregate the state, resample by component, divide and conquer. [arXiv 1909.09397](https://arxiv.org/abs/1909.09397), [White Rose record](https://eprints.whiterose.ac.uk/159617).

**Aggregate observations plus latent parameters scale much further.** Makinoshima and Oishi (Scientific Reports 2022) use a particle filter where each particle is a whole simulation with different latent behaviour parameters. They observe only aggregate crowd density and handle a 5000-person evacuation scenario. They report reasonable forecasts even with limited information on movements. This is the pattern we need: particles are worlds, not agents. [Europe PMC record](https://europepmc.org/article/PMC/PMC9249888) (abstract and method section read via the Europe PMC API; I did not get the particle count).

**A social-science ABM with categorical state: particle filter helps, modestly.** Oswald, Malleson and Suchak (JASSS 27(2), 2024) model countries adopting COVID policies by peer mimicry. They chose a particle filter because it handles categorical variables and is cheap for this model. The model alone fit fairly well with an ensemble of at least 100 runs. The filter's improvement was reliable from 500 runs. Filtering more often gave better predictions. [White Rose record](https://eprints.whiterose.ac.uk/214951). The result is for one model with country-level agents, not individuals.

**Approximate Bayesian computation (ABC) and neural simulation-based inference fit parameters, not daily state.** Dignum, Choudhary and Lees (ICCS 2025) compare ABC with neural posterior and ratio estimation on Schelling's segregation model, one parameter, budgets of 500, 1000 and 2000 simulations. Both neural methods generally beat ABC. Both still need hand-chosen summary statistics, and extra summary information can hurt. ABC keeps only 10% of samples. [Paper PDF](https://www.iccs-meeting.org/archive/iccs2025/papers/159080233.pdf). Note it is a one-parameter toy. Nothing here shows it works on a 100k-agent LLM world.

**Pedestrian particle filters can fail on real people.** A search snippet (not opened) reports that a 2022 Grand Central Terminal study found the particle filter performed badly because of unpredictable behaviour and because it does not optimise categorical agent parameters. Treat as unverified.

**Background knowledge, not from the pages above.** EnKF is from Evensen (1994). Known failure modes are ensemble collapse (spread shrinks, filter ignores data), fixed by variance inflation, and spurious long-range correlation with small ensembles, fixed by localization. Both matter to us because variance collapse is already on our risk list.

## What it means for Real World

- For the product: the "daily assimilation" claim is defensible if it means "segment-level belief aggregates are corrected toward polls, markets and news signals each morning". It is not defensible as "every agent matches reality". Ensemble spread in the API output is a natural fit: the filter produces it by construction. Do not promise assimilation for countries with no polls. Unobserved regions will drift to the prior, which is the Western-flattening risk in another form.
- For the engineering: separate two models. (1) A cheap aggregate belief model: segment x topic cells, logit-transformed beliefs, a few dozen to a few thousand state variables, runs in milliseconds, supports ensembles of 100 to 500. (2) The LLM agents, run once per night. The EnKF acts on model (1). The analysis increment per cell is then applied to agents in that cell, for example as a prompt-level belief anchor or a shift in their stored belief score. Particle filtering is reserved for a handful of categorical or regime parameters (which event is active, which trust regime applies). Use inflation and localization (by topic and country) from day one.
- For the business: the hashed daily forecast is where assimilation pays off. Scoring against market price is the proof. Cost matters: the budget is $15 to 60 per night for one LLM update on Haiku 5.5. An ensemble of 100 LLM worlds would be roughly 100 times that. Keep LLM ensembles to 3 to 5 members for the demo fork feature at most.

## Recommendations

1. Build the aggregate belief model first, with a one-page spec stating state vector, observation operator and noise. An engineer and a PM can both read a table of "cell, topic, observed by, noise". Owner: engineering. Ship by Oct 20.
2. Implement the EnKF with perturbed observations as in Ward et al., around 100 members, with inflation and localization. Roughly 100 lines of numpy. Do not adopt a data-assimilation framework for this.
3. Transform bounded beliefs (shares, probabilities) with logit before filtering, because the EnKF assumes Gaussian noise and a linear observation operator. Ward et al. needed the same trick for counts.
4. Run a hindcast: assimilate poll and market data for the past 90 days, forecast the next 7, and compare with a no-assimilation baseline and a naive persistence baseline, as Ward et al. did with hourly means. Publish the number. If assimilation does not beat persistence, say so.
5. Report ensemble spread as a first-class API field. Check calibration of the spread weekly, since collapse shows up there first.
6. Use ABC or neural posterior estimation only offline, to fit a few global parameters (opinion-shift rate, trust weights), never in the nightly loop.
7. Do not build a per-agent particle filter. The evidence is against it.

## Open questions

- Does the aggregate belief model track what the LLM agents actually do? Test by running the aggregate model against one LLM world over 7 days and measuring the gap per cell.
- How should an increment on a cell become an agent-level nudge without making agents incoherent with their own history? Needs a small experiment.
- Not read: the full Grand Central 2022 paper (Springer fetch was redirected, search budget exhausted) and Makinoshima's particle count. Next step: open both.
- Sparse observation: for most countries there may be one poll a month. How slowly should the filter move there? Needs real data from the WVS and Gallup coverage research slices.
- Operator error: market prices and news tone are not belief measurements. We need an explicit, estimated bias term per source.

## Sources

- [Dynamic calibration of agent-based models using data assimilation (Ward, Evans, Malleson, 2016)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4852637), accessed 2026-10-11
- [Simulating Crowds in Real Time with Agent-Based Modelling and a Particle Filter (arXiv 1909.09397)](https://arxiv.org/abs/1909.09397), accessed 2026-10-11
- [Same paper, White Rose record, JASSS 23(3) 2020](https://eprints.whiterose.ac.uk/159617), accessed 2026-10-11
- [Crowd flow forecasting via agent-based simulations with sequential latent parameter estimation (Makinoshima, Oishi, 2022)](https://europepmc.org/article/PMC/PMC9249888), accessed 2026-10-11
- [An ABM of the 2020 International Policy Diffusion with Particle Filter (Oswald, Malleson, Suchak, 2024)](https://eprints.whiterose.ac.uk/214951), accessed 2026-10-11
- [Simulation-based inference in agent-based models using spatio-temporal summary statistics (Dignum, Choudhary, Lees, ICCS 2025)](https://www.iccs-meeting.org/archive/iccs2025/papers/159080233.pdf), accessed 2026-10-11
