# Open-source data assimilation libraries for belief-state ensemble correction

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo and PyPI pages were opened and read. Web search was out of budget, so JAX/numpy EnKF repos were not surveyed, and the ETKF math below is from background knowledge, not a fetched page.

## Answer

Do not adopt a data assimilation library for the launch. The update we need is the ensemble transform Kalman filter (ETKF) on a small state vector, which is about 20 lines of numpy that we can test and explain. Use DAPPER (MIT, pip-installable) only offline, as a reference to check our implementation against. Skip filterpy, PDAF and OpenDA.

## Findings

- **DAPPER** is the closest fit. It implements stochastic EnKF, DEnKF, ETKF, EnKF-N, LETKF, iEnKS, ES-MDA and particle-type filters ([GitHub](https://github.com/nansencenter/DAPPER)). Latest PyPI release is 1.8.1, uploaded 2026-06-23, MIT license, requires Python >= 3.12 ([PyPI JSON](https://pypi.org/pypi/dapper/json)). The repo has 415 stars and 1,819 commits. The license file shows MIT, copyright Patrick Raanes, NERSC, 2016 ([LICENCE](https://raw.githubusercontent.com/nansencenter/DAPPER/master/LICENCE.txt)).
- DAPPER's own docs say it is "a set of templates, and not a framework". It is built for synthetic twin experiments in research and teaching, it is not suited to models above about 60k unknowns, it cannot handle non-uniform time sequences, and it comes with no support. For real-world use the docs point to DART, PDAF and JEDI ([docs](https://nansencenter.github.io/DAPPER/)).
- **filterpy** is MIT, 3.9k stars, but the last PyPI release is 1.4.5 from 2018-10-10 ([PyPI](https://pypi.org/project/filterpy/), [GitHub](https://github.com/rlabbe/filterpy)). It does have an `EnsembleKalmanFilter` (constructor `x, P, dim_z, dt, N, hx, fx`). It is a perturbed-observation EnKF. Its own docstring calls it a toy that is far too slow with large N. It uses dense covariance matrices and `np.linalg.inv`, and `N=1` breaks it ([source](https://raw.githubusercontent.com/rlabbe/filterpy/master/filterpy/kalman/ensemble_kalman_filter.py)). It has no ETKF, no inflation and no localization.
- **PDAF** is Fortran 2003, LGPL-3.0, 51 stars. It has ESTKF, ETKF, LETKF, LESTKF, NETF, particle filters and 3D-Var ([GitHub](https://github.com/PDAF/PDAF)). Use means writing user routines that couple it to your model, in online or offline mode, with BLAS/LAPACK/MPI builds that can fail ([PDAF wiki](https://pdaf.awi.de/trac/wiki/FirstSteps)). The Python wrapper pyPDAF is GPL-3.0, 18 stars, conda-first, and its page mentions no pip wheels ([GitHub](https://github.com/yumengch/pyPDAF)). GPL on a hosted API is probably fine, but it is a license question we do not need.
- **OpenDA** is LGPL-3.0, 104 stars, Java with C/C++/Fortran interfaces. It has EnKF, ensemble square-root KF, particle filter and 3DVar, plus calibration tools ([GitHub](https://github.com/OpenDA-Association/OpenDA)). It targets hydrology and ocean models with XML-configured model wrappers. A JVM toolchain for a Python/TS product is cost with no benefit.
- Not found: a maintained JAX EnKF package. I did not search for one, so absence here is not evidence.

## What it means for Real World

- For the product: the daily update is "nudge beliefs so the simulation matches observations." That is exactly an ensemble update, and the observation operator is simple: a poll is the weighted mean of agent beliefs in a segment, a market price is a mean of a belief about one event. We can show users the same thing in one sentence: ensemble mean moved from 41% to 46% because of poll X.
- For the engineering: keep the assimilation state small. Do not put 100,000 agents' belief vectors in the filter. Put segment-level aggregates there (country x topic, a few thousand numbers), then push the correction back to agents by shifting their beliefs toward the corrected segment mean. The ensemble members are whole-world runs, so N will be 20 to 50, limited by LLM cost. With N that small, the ETKF works in N x N space: cost is roughly n*N^2 + N^3, trivial for n in the thousands. The risks are not compute. They are sampling error and variance collapse, so multiplicative inflation and country-level localization (the idea behind LETKF) matter more than which package we pick. Distant countries should not update each other from spurious sample correlations.
- For the business: a hand-rolled ETKF avoids an LGPL/GPL review and a Fortran build in the deploy path. A PM can follow it, and an engineer can unit-test it against DAPPER's ETKF on a Lorenz-96 toy. The moat is the pipeline and the hashed track record, not the filter.

## Recommendations

1. Write `assimilate.py`: ETKF with multiplicative inflation, about 20 lines of numpy, inputs `ensemble (n x N)`, `obs`, `obs_operator`, `R`, `inflation`. One owner, one test file.
2. Add one test that runs the same Lorenz-96 twin experiment through our code and DAPPER's ETKF and asserts RMSE within a tolerance. Install DAPPER only in the dev/test extras (Python >= 3.12).
3. Define the state as segment aggregates, and write the agent back-projection (shift each agent's belief by its segment's correction, clipped to valid range) as a separate, separately tested step.
4. Add a spread guard: log ensemble spread per segment every morning, alert and raise inflation if spread falls below a floor. This is the direct check for variance collapse.
5. Add localization by country/region as a covariance taper only after the global version works. Defer it if time is short.
6. Treat PDAF as the upgrade path if we ever need LETKF at scale, and review its license then. Do not install pyPDAF now.

## Open questions

- Is a maintained JAX/numpy EnKF library worth using instead of hand-rolling? Find out with a GitHub search for `jax enkf`/`ensemble transform` and check last commit, license and tests. Not done here.
- How well does a Gaussian update fit bounded probabilities (0 to 1 beliefs)? Test a logit transform on the state against raw values using DAPPER on a toy problem.
- What N is affordable per night? It depends on the $15-60 per night cost estimate and decides how aggressive inflation must be.
- DAPPER's pages did not show release dates for 1.8.1 beyond PyPI, and PDAF's current version was not stated on pages I read.

## Sources

- [DAPPER GitHub](https://github.com/nansencenter/DAPPER), accessed 2026-10-11
- [DAPPER docs](https://nansencenter.github.io/DAPPER/), accessed 2026-10-11
- [DAPPER PyPI JSON](https://pypi.org/pypi/dapper/json), accessed 2026-10-11
- [DAPPER LICENCE.txt](https://raw.githubusercontent.com/nansencenter/DAPPER/master/LICENCE.txt), accessed 2026-10-11
- [filterpy GitHub](https://github.com/rlabbe/filterpy), accessed 2026-10-11
- [filterpy PyPI](https://pypi.org/project/filterpy/), accessed 2026-10-11
- [filterpy ensemble_kalman_filter.py](https://raw.githubusercontent.com/rlabbe/filterpy/master/filterpy/kalman/ensemble_kalman_filter.py), accessed 2026-10-11
- [PDAF GitHub](https://github.com/PDAF/PDAF), accessed 2026-10-11
- [PDAF First Steps wiki](https://pdaf.awi.de/trac/wiki/FirstSteps), accessed 2026-10-11
- [pyPDAF GitHub](https://github.com/yumengch/pyPDAF), accessed 2026-10-11
- [OpenDA GitHub](https://github.com/OpenDA-Association/OpenDA), accessed 2026-10-11
