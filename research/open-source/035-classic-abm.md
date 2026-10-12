# Classical ABM frameworks (Mesa, mesa-llm, Repast, NetLogo, Agents.jl, FLAME GPU, JAX/torch ABM)

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Versions, licenses and star counts come from the repo and doc pages I opened. Absolute speeds do not: the only benchmark is relative, and the web search budget ran out after zero searches, so I fetched known primary pages only and did not find a JAX ABM framework to cite.

## Answer

None of these frameworks should be the core of Real World. The nightly job is bounded by LLM calls and by assimilation, not by agent-loop speed, so a classical ABM engine buys us little. If we want a library, Mesa 3 (Apache-2.0, Python) is the only one that fits a Python team. Use at most its model/agent/data-collector skeleton, and keep the agent state in plain arrays and a database so we can drop Mesa without a rewrite. Skip mesa-llm, FLAME GPU, Repast and Agents.jl.

## Findings

**Mesa (Python).**
- Apache-2.0, about 3.9k stars. Latest stable I could see is v3.5.1, with 4.0 alpha 0 out as a pre-release that removes `batch_run`, `mesa.space` and the Simulator classes ([releases](https://github.com/projectmesa/mesa/releases)). The page omits years; the sequence implies early 2026.
- v3.4.0 requires Python 3.12+. v3.4.2 fixed a memory leak that kept model instances alive. The API is still moving: 3.5 deprecated the `seed` kwarg and 4.0 removes it. Expect churn.
- Design: `Model`, `Agent`, an `AgentSet` with `do`, `shuffle_do`, `groupby`, grids and networks, an event scheduler, and a pandas `DataCollector` ([overview](https://mesa.readthedocs.io/latest/overview.html)). It has no geography, no globe, no population microdata concept. Those are ours to build either way.
- Agents are Python objects stepped one at a time in one process. Nothing in the docs I read covers vectorization or async.

**Speed.** The Agents.jl authors' comparison ran Agents.jl 6.2.10 against Mesa 3.2.0, NetLogo 6.4.0 and MASON 22.0 ([ABMFrameworksComparison](https://github.com/JuliaDynamics/ABMFrameworksComparison)). Mesa took 3.3x to 9.4x as long on WolfSheep, 26x to 30x on Schelling, and 59x to 159x on Flocking. NetLogo took 4.8x to 19x. MASON was 0.6x to 7.8x. The page gives ratios only, no seconds, no date, and it is a competitor's benchmark. Read it as "Mesa is slow on tight spatial loops," not as an absolute cost. Our agents will not run tight loops.

**mesa-llm.** Apache-2.0, about 75 stars, 30 open issues. The README says it is under active development, the API "may change significantly," and the first release is "coming soon" ([repo](https://github.com/projectmesa/mesa-llm)). The docs landing page lists eight providers (OpenAI, Anthropic, xAI, Hugging Face, Ollama, OpenRouter, Novita, Gemini) and says nothing on batching, async calls, caching or scale ([docs](https://mesa-llm.readthedocs.io/en/latest/)). I found no evidence it works past hundreds of agents. For 100,000 agents it is a prototype, not a base.

**Repast.** Suite of three: Simphony 2.11.0 (Java, July 2024), HPC 2.3.1 (C++, 2021) and repast4py 1.3.0 ([site](https://repast.github.io/)). Repast4Py is BSD-3, about 75 stars, and the default build needs MPI plus mpi4py ([repo](https://github.com/Repast/repast4py)). It is built for cluster-scale rule-based agents. That is the wrong shape for a job that spends its time waiting on HTTP calls.

**NetLogo.** GPL-2.0, about 1.2k stars ([repo](https://github.com/NetLogo/NetLogo)). It is a teaching tool with its own language, and the GPL is a bad fit for a hosted API. Slow in the benchmark above. No reason to use it.

**Agents.jl.** MIT, about 920 stars, latest v7.1.0 ([repo](https://github.com/JuliaDynamics/Agents.jl), [releases](https://github.com/JuliaDynamics/Agents.jl/releases)). Fastest in the benchmark, but it is Julia. Adopting it means a second language, a second hiring pool and a bridge to the LLM and data stack. Not worth it for an LLM-bound job.

**FLAME GPU 2.** Dual license: AGPL-3.0 or a paid commercial license. About 157 stars. Latest is 2.0.0-rc.4, a pre-release from November 2025. Needs an NVIDIA GPU and CUDA 12+; Python bindings need Python 3.10+ and wheels are not manylinux ([repo](https://github.com/FLAMEGPU/FLAMEGPU2), [releases](https://github.com/FLAMEGPU/FLAMEGPU2/releases)). Native Python agent functions are experimental. The page offers no benchmarks. AGPL plus a GPU dependency plus release-candidate status rules it out.

**AgentTorch.** The closest thing to a "large population model" in torch. AGPL-3.0, about 653 stars, PyPI v0.6.0, no GitHub releases, claims millions of agents on GPU and composition with LLMs ([repo](https://github.com/AgentTorch/AgentTorch)). AGPL is the problem for a hosted API. I did not find a JAX-based ABM framework worth citing in the time available.

**LLM-native frameworks, for contrast.**
- OASIS (camel-ai): Apache-2.0, about 5.3k stars, claims up to one million agents on Twitter/Reddit-style simulations. Its own reference run, 100 agents for one step at activation probability 1, used 335,600 input and 16,750 output tokens, about 3.4k input tokens per agent-step ([repo](https://github.com/camel-ai/oasis)).
- AgentSociety: Apache-2.0 (commercial folder excepted), about 1.3k stars, Ray-based ([repo](https://github.com/tsinghua-fib-lab/agentsociety)).
- Concordia (DeepMind): Apache-2.0, about 1.8k stars, Game Master pattern, no scale claims ([repo](https://github.com/google-deepmind/concordia)).

**The cost fact that decides it.** OASIS's 3.4k input tokens per agent-step, if we paid it for 100,000 agents, is about 340M input tokens a night. That is far above our $15-60 budget at Haiku-class prices. So we cannot make every agent think every night. Most agents must run on cheap state updates (arrays, small models), with an LLM only for a sampled few. That design makes the ABM framework's per-agent loop nearly irrelevant.

## What it means for Real World

- For the product: "click any agent to ask why" needs a stored, readable per-agent state and a trace, not a framework's scheduler. The user-facing simulation is a belief-state update plus an event, which no classical ABM package models for us.
- For the engineering: write a thin engine ourselves. Population as columnar arrays (numpy/Arrow/Parquet), one vectorized update per day per cohort, LLM calls through a plain async client with batching and caching. Mesa is optional glue for the model/data-collector shape and is not required. Do not build on mesa-llm. Do not adopt GPL, AGPL or Julia dependencies on the hot path.
- For the business: the license matters because we serve an API. AGPL (FLAME GPU, AgentTorch) forces source disclosure or a commercial deal. GPL-2.0 (NetLogo) is a risk. Apache/MIT/BSD (Mesa, mesa-llm, Agents.jl, repast4py, OASIS) are safe. The moat is the assimilation pipeline and the hashed record, not the simulator, so spend no time here.

## Recommendations

1. Do not adopt any classical ABM framework as the engine. Write a ~300-line Python engine over arrays with a typed `Agent state` schema; a PM can read the schema and an engineer can change the update rules.
2. If a team member wants a familiar skeleton, pin Mesa 3.5.x (not 4.0 alpha) behind our own `Engine` interface so replacing it is a one-file change.
3. Do not use mesa-llm until it has a tagged release and a documented async/batching path. Revisit after launch.
4. Make a cost model first: tokens per LLM-stepped agent times sampled agents per night, against the $15-60 target. Decide the LLM-stepped fraction from that number, not from a framework default.
5. Run one measurement this week: 100,000 agents, one vectorized daily update in numpy, and the same loop in Mesa, in seconds. That replaces the relative-only benchmark above with our own.
6. Reject AGPL and GPL dependencies in code review for the API path (FLAME GPU, AgentTorch, NetLogo).

## Open questions

- Absolute Mesa speed at 100,000 agents with our update rule. Find out with recommendation 5.
- Whether a JAX ABM library exists that is maintained and permissively licensed. Search budget ran out before I could check; a follow-up search should cover it.
- Mesa release years and exact current version. The releases page omits years; confirm on PyPI (the PyPI page failed to load for me).
- How mesa-llm actually calls models (sync or async). Needs a read of its source.
- Whether AgentTorch's AGPL has a commercial option, if its GPU population approach is worth a second look.

## Sources

- [Mesa repo](https://github.com/projectmesa/mesa), accessed 2026-10-11
- [Mesa releases](https://github.com/projectmesa/mesa/releases), accessed 2026-10-11
- [Mesa overview docs](https://mesa.readthedocs.io/latest/overview.html), accessed 2026-10-11
- [mesa-llm repo](https://github.com/projectmesa/mesa-llm), accessed 2026-10-11
- [mesa-llm docs](https://mesa-llm.readthedocs.io/en/latest/), accessed 2026-10-11
- [Agents.jl repo](https://github.com/JuliaDynamics/Agents.jl), accessed 2026-10-11
- [Agents.jl releases](https://github.com/JuliaDynamics/Agents.jl/releases), accessed 2026-10-11
- [ABMFrameworksComparison](https://github.com/JuliaDynamics/ABMFrameworksComparison), accessed 2026-10-11
- [Repast suite](https://repast.github.io/), accessed 2026-10-11
- [repast4py repo](https://github.com/Repast/repast4py), accessed 2026-10-11
- [NetLogo repo](https://github.com/NetLogo/NetLogo), accessed 2026-10-11
- [FLAME GPU 2 repo](https://github.com/FLAMEGPU/FLAMEGPU2), accessed 2026-10-11
- [FLAME GPU 2 releases](https://github.com/FLAMEGPU/FLAMEGPU2/releases), accessed 2026-10-11
- [AgentTorch repo](https://github.com/AgentTorch/AgentTorch), accessed 2026-10-11
- [OASIS repo](https://github.com/camel-ai/oasis), accessed 2026-10-11
- [AgentSociety repo](https://github.com/tsinghua-fib-lab/agentsociety), accessed 2026-10-11
- [Concordia repo](https://github.com/google-deepmind/concordia), accessed 2026-10-11
