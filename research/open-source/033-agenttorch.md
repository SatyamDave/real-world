# AgentTorch (MIT Media Lab): LLM archetypes and differentiable agent-based models

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo, license, PyPI and the AAMAS paper were all opened and read. The web search budget ran out, so there is no independent third-party review of AgentTorch, and I did not run the code.

## Answer

AgentTorch is a real, GPU-based agent-based model (ABM) framework, but it is a US-centric epidemiology and labor-market tool with one maintainer and an AGPL license. Do not build on its code. Do steal one idea: "LLM archetypes", where you ask the LLM about a few hundred representative profiles and sample many agents from the answers. That idea is what makes 100,000 agents cost dollars instead of thousands of dollars, and we can reimplement it in about a day. We must also fix its weakness: archetypes can flatten variance, which is one of our named risks.

## Findings

**Maturity and license**
- The repo `AgentTorch/AgentTorch` has 653 stars, 100 forks, 589 commits and 8 contributors. It was created 2023-06-22. The last push was 2026-09-12 ([GitHub](https://github.com/AgentTorch/AgentTorch), GitHub API).
- The last three commits are all by Ayush Chopra, and two of them (2026-09-12) only reword the license text and add a `NOTICE.md`. The commit before that is a readme edit on 2026-08-01. Development is slow and single-person.
- There are no GitHub releases. The latest PyPI version is 0.6.0, released 2025-03-21, and earlier versions 0.1.0, 0.2.0 and 0.2.1 are yanked ([PyPI](https://pypi.org/project/agent-torch/)).
- 10 open issues. One from 2025-01 asks how to contribute and has no maintainer answer I could see. One from 2026-04 adds a "retail submodule".
- The license is AGPL-3.0, "or any later version" per `NOTICE.md`. The README says anyone providing a network service must publish their source, and offers a commercial license by email to the author. The PyPI sidebar and `pyproject.toml` still say MIT, which is stale and wrong. Trust the `LICENSE` file and `NOTICE.md` ([NOTICE.md](https://github.com/AgentTorch/AgentTorch/blob/main/NOTICE.md), [readme](https://github.com/AgentTorch/AgentTorch/blob/main/readme.md)).
- Dependencies are heavy: `torch>=2.1.2`, `torch_geometric`, `langchain`, `langchain-openai`, `dspy`, `dask`, `networkx` ([pyproject.toml](https://github.com/AgentTorch/AgentTorch/blob/main/pyproject.toml)). The install doc says large runs used Titan X and V100 GPUs and was tested on Ubuntu 22.04 ([install.md](https://github.com/AgentTorch/AgentTorch/blob/main/docs/install.md)).
- The only bundled populations are NYC, Astoria (a Queens neighborhood), NZ and mock sets. There is nothing for IPUMS International or any non-US survey.

**LLM archetypes (the useful part)**
- Paper: "On the limits of agency in agent-based models", Chopra, Kumar, Kuru, Raskar, AAMAS 2025, arXiv v3 of 10 Nov 2024 ([arXiv HTML](https://arxiv.org/html/2409.10568)).
- Method: group agents by binned attributes (age, gender, income, region) plus a shared prompt context. Ask the LLM a yes/no question once per group, with M samples per group (they use M=3). Turn the answers into a Bernoulli probability per archetype. Sample each agent's action from it.
- Scale: about 400 LLM queries per weekly decision for 8.4 million NYC agents, using GPT-3.5. A per-agent LLM would need millions of calls.
- Runtime: archetypes use 95% less run-time than LLM-as-agent and marginally more than plain heuristic agents (Figure 4 of the paper). No dollar cost is reported.
- Accuracy: the LLM-as-agent baseline was limited to 300 agents (a 300-query-per-step budget) and scaled up. Forecast mean-square error, from Table 1:
  - Archetype: unemployment 24.59, infection 95.17.
  - Heuristic: unemployment 41.05, infection 2914.73.
  - LLM-as-agent: unemployment 56.98, infection 4311.70.
- Validation is thin. Behavior only correlates positively with Bureau of Labor Statistics data "for 3 of 5 boroughs". The authors list as limitations: LLM bias, archetypes that may not capture heterogeneity, simple yes/no actions only, and data contamination (the LLM may know the future). They say individual-level accuracy cannot be verified.
- Sensitivity: results change with model (GPT-3.5 vs GPT-4o) and with M. More samples per archetype helped GPT-3.5, which the authors link to LLM bias. This is evidence that single answers are biased and noisy.

**Differentiable ABM and calibration**
- AgentTorch uses smoothing and reparameterization so gradients flow through discrete stochastic simulation. The paper says it handles "tens of millions of agents on consumer-grade GPUs".
- Calibration means gradient descent on structural parameters (for example effective contact rate) against historical time series (cases, unemployment). The LLM output enters as a sampled action; there is no gradient through the LLM.
- This is classic parameter fitting for a mechanistic model. It is not belief assimilation of news, polls or markets into agent opinions, which is what Real World does every morning. There is no code in the repo that does anything like that.
- The change log mentions `agent_torch/core/llm` (archetype, behavior, prompt template, optimizer-style "Variable" slots) and issue 54 added `GroupArchetype` (2025-04). Tests exist (`test_behavior.py`, `test_executor.py`), but I did not run them.

## What it means for Real World

- For the product: the archetype pattern fits "fork the world, drop in an event, run 7 days". Cost per run stays low because calls scale with the number of archetypes, not agents. But click-an-agent-and-ask-why gets weaker: an agent's "reason" is really its archetype's answer. Say that honestly in the trace, or call an LLM on demand for that one agent. Do not claim a unique mind behind each dot.
- For the engineering: do not import AgentTorch. The AGPL network clause would pull our API server code (`POST /v1/simulate`) under AGPL, or force us to buy a commercial license. The dependency stack (torch_geometric, langchain, dspy) is also far larger than our need. We do not need GPUs or gradients for a 100k agent opinion-dynamics model; numpy on one CPU box handles state updates, and the LLM is the only real cost. The archetype step is small: cluster agents on census and survey attributes, query the LLM per cluster with M samples, sample agents from the resulting distribution. Write it ourselves from the paper (ideas are not covered by the license; do not copy their files).
- For the business: the paper gives us a citable result that archetype sampling beats per-agent LLMs on forecast error at equal query budget. That helps the YC story on cost. It is a weak result for a "world model" claim, since it covers one city, one epidemic, GPT-3.5 and a thin validation. Also note the MIT lab maintainer offers commercial licensing, so a competitor could use it freely only by open-sourcing their stack. This is not a moat for anyone.

## Recommendations

1. Do not add `agent-torch` as a dependency. Record the AGPL decision in the repo's decisions log and note that PyPI metadata says MIT but the repo says AGPL-3.0.
2. Build our own archetype sampler, about 100 lines. Archetype key = country, region, age band, gender, income band, education, plus survey-derived attitude bins. Query the LLM M=3 to 5 times per archetype per day, and store the probabilities, not just samples.
3. Fix variance collapse on purpose. Give each agent a persistent random trait offset (a latent z-score drawn once) added before sampling, so agents in one archetype differ and stay consistent across days. AgentTorch gets heterogeneity only from Bernoulli draws, which is the exact failure the "Funhouse Mirrors" paper warns about. Test: the spread of agent opinions after 7 days must match the survey's within-group spread.
4. Budget a size for 100k agents: a few thousand archetypes, not 100k. Measure query count and token cost on one night and compare to the $15 to 60 per night estimate before promising numbers. I did not find a published dollar cost in the paper, so do not quote one.
5. Use their experiment design as a baseline for our own scoring: the same budget, three agent types (heuristic, archetype, per-agent LLM), forecast error on held-out weeks. This gives us a public, honest ablation on the receipts page.
6. Put time-bounding in the spec. The paper names contamination as unsolved; our hashed daily forecasts only help if the model cannot have seen the outcome. Pick models with a known cutoff before the questions' dates.
7. If we ever want the differentiable-calibration feature (fit interaction parameters by gradient), write to Ayush Chopra about a commercial license first. Do not start with the code.

## Open questions

- What does a run cost in dollars and wall-clock time? The paper gives query counts and relative runtime only. Find out by running `docs/tutorials/creating_archetypes` on the NYC data with a small model; needs a GPU box and one afternoon.
- Does archetype sampling preserve variance? The paper reports mean-square error on aggregates, not distribution spread. Test on WVS items by comparing simulated within-group variance to survey variance.
- Does it work outside the US? Untested. Archetype keys rely on binned census attributes; whether IPUMS International harmonized variables supply enough bins across 100+ countries is a data-team question.
- Is the AGPL line really as strict for an API? Ask a lawyer. Our plan sidesteps it by not using the code.
- Maintainer risk: one person, slow cadence, 2025-04 to 2026-09 changes mostly docs and license text. Check again before any partnership approach.

## Sources

- [AgentTorch GitHub repository](https://github.com/AgentTorch/AgentTorch), accessed 2026-10-11 (stars, commits, GitHub API for push dates, issues, contributors, file tree)
- [AgentTorch README](https://github.com/AgentTorch/AgentTorch/blob/main/readme.md), accessed 2026-10-11
- [AgentTorch NOTICE.md (AGPL-3.0-or-later, commercial license note)](https://github.com/AgentTorch/AgentTorch/blob/main/NOTICE.md), accessed 2026-10-11
- [AgentTorch pyproject.toml](https://github.com/AgentTorch/AgentTorch/blob/main/pyproject.toml), accessed 2026-10-11
- [AgentTorch install guide](https://github.com/AgentTorch/AgentTorch/blob/main/docs/install.md), accessed 2026-10-11
- [agent-torch on PyPI](https://pypi.org/project/agent-torch/), accessed 2026-10-11
- [On the limits of agency in agent-based models (arXiv abstract)](https://arxiv.org/abs/2409.10568), accessed 2026-10-11
- [On the limits of agency in agent-based models (arXiv HTML full text)](https://arxiv.org/html/2409.10568), accessed 2026-10-11
