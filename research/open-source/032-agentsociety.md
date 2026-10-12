# AgentSociety (Tsinghua FIB Lab): architecture, license, reuse fit

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo, release list and both arXiv pages were opened. The v1 paper was read to about the halfway point of its text, the v2 paper only its first third, the PyPI page and the `commercial` folder did not load, and no independent criticism was found because the search budget ran out.

## Answer

AgentSociety is a real, active, Apache-2.0 research framework, but it is built for city-scale social-science experiments with a few thousand agents, not for a daily whole-world assimilation loop. Real World should not adopt it as a dependency or a base. It is worth stealing three ideas (agent state schema, grouped agent execution, replay storage) and citing it as prior art. Our own simulator should stay small, flat and batch-oriented.

## Findings

**Repo and license.** The [GitHub repo](https://github.com/tsinghua-fib-lab/AgentSociety) shows about 1.3k stars, 217 forks, 953 commits, 24 open issues and 15 open PRs. The license is Apache-2.0 (copyright FIB Lab, Tsinghua), with an exception for the `packages/agentsociety/commercial` folder. I could not open that folder, so its terms are unknown. Python 3.11 or later is required. The repo holds two generations of code: `agentsociety` (v1, the original city simulator) and `agentsociety2` (v2, "recommended"), plus community agents, a benchmark package, a React frontend and a VS Code extension.

**Maturity.** The [releases page](https://github.com/tsinghua-fib-lab/AgentSociety/releases) lists only AgentSociety2 versions, from 2.7.0 (23 Jun) to 2.9.3 (24 Sep, latest). That is ten releases in about three months, so the project is alive. The page shows no year. The 2.8.1 notes are headed "2.8.2", which suggests sloppy release hygiene.

**Papers.** v1 ([arXiv 2502.08691](https://arxiv.org/abs/2502.08691), Feb 2025, revised Apr 2026, 16 authors, lead Yong Li) claims 10,000+ agents and about 5 million interactions. v2 ([arXiv 2607.11895](https://www.alphaxiv.org/abs/2607.11895.md), Jul 2026) repositions the project as a research environment where AI "social scientists" run the whole study workflow (literature, hypothesis, design, run, analysis, draft) with approval gates.

**v1 architecture** (from the [v1 paper](https://arxiv.org/html/2502.08691v1)):
- Agents have a profile (demographics, personality) and a status (mental state, economics, relationships). They carry six emotion scores (0 to 10), a Maslow-style needs hierarchy, topic attitudes (0 to 10) and a stream memory.
- Mobility uses a gravity model over places of interest, on OpenStreetMap roads and SafeGraph data. Driving uses IDM/MOBIL car-following models.
- The economy is simple: firms pay wages and set prices, a government applies progressive income tax, banks follow a Taylor rule, and a statistics bureau tracks real GDP. The authors admit there is no unemployment, no wage negotiation, no public spending, and that job change, debt and investment are future work.
- Social ties (family, friend, colleague, strength 0 to 100) interact online only. Offline meetups are future work. A "supervisor" layer can ban users or edges.
- The engine uses Ray actors (agent groups) with asyncio, MQTT (EMQX) messaging, PostgreSQL storage and mlflow metrics. LLMs go through OpenAI-compatible APIs or local vllm/ollama.

**v2 changes.** Per the v2 paper: behaviors are packaged as on-demand "skills", environments register through an `EnvBase` class with `@tool()` decorators, and lab games (Prisoner's Dilemma, Public Goods) and information-diffusion networks were added. Replay moved to a local database (the repo README says DuckDB, the paper excerpt says SQLite, so the two disagree). Claimed scale is 10,000 agents and 100 million interactions. Pre-generation and caching handle over 70% of routine requests and cut LLM calls by 66.5%. The authors report over 95% pattern reproduction, judged by themselves. The v2 install is `pip install agentsociety2` and needs only an LLM key, not Postgres or MQTT.

**Measured performance (v1, the only hard numbers).** On a 64-core machine with DeepSeek-V3 over an API, one interaction round for 10,000 agents took 54,000 LLM calls (about 430 input and 76 output tokens each). Wall time was 5,681 s with 8 groups, 1,422 s with 16, and 459 s with 32. Round time depends mostly on API latency and group count. The paper gives no dollar cost and no GPU count. Redis pub/sub outran MQTT in their test (81k vs 45k msg/s), but they picked MQTT for its GUI tools.

**Fidelity evidence is thin.** Hurricane Dorian (1,000 agents): daily trips follow the real trend but miss peak size and speed, with no error metric reported. UBI (Texas demographics, $1,000 a month): the sign of the effect on consumption and depression matches a published experiment, with no numeric comparison. The polarization and inflammatory-message experiments are not compared to real data at all. The v2 paper does report RMSE of 0.0073 to 0.0188 on disaster mobility.

## What it means for Real World

- For the product: AgentSociety simulates one city at a time, with geography, roads and an economy, and its agents are told a story about a place. We need agents whose beliefs move toward daily observed news, polls and market prices. Its UBI and polarization demos are the closest thing to our "drop in an event and run 7 days" feature, but they are one-shot academic runs, not forecasts scored against outcomes.
- For the engineering: the mobility, road and economy code is dead weight for a belief-forecasting product. The Ray, MQTT, Postgres stack (v1) is heavy for one engineer in 22 days. v2 is lighter but changes fast (2.7 to 2.9 in three months) and is organized around an AI-scientist workflow we do not need. There is no assimilation step, no ensemble support, no hashed forecast log, and no multilingual or non-US census grounding in what I read. Agents are built from US Census block groups and SafeGraph.
- For the business: Apache-2.0 allows commercial use, but the unexplained commercial-folder exception means we should never copy from that folder. Citing Tsinghua as prior art helps credibility. The "10k agents, 5M interactions" headline is the number our 100,000-agent claim will be compared with. Their 10,000-agent round at 54k calls shows our nightly cost and latency budget needs batching and caching from day one.

## Recommendations

1. Do not depend on `agentsociety` or `agentsociety2`. Keep the Real World simulator in our own repo as a small batch job (agents in a table, one LLM call per sampled agent group per day).
2. Copy the agent state shape as a design reference: profile, emotion and attitude scores on a 0 to 10 scale, short event memory. Write our own fields and keep the schema readable by a PM.
3. Copy the grouped-execution idea: agents partitioned into groups, groups run in parallel, round time scales with group count. Skip Ray, and use plain async workers or a queue.
4. Copy their v2 caching result as a target: pre-generate and cache routine agent responses to cut LLM calls by about two thirds, then check our own cost against the $15 to 60 a night estimate.
5. Cite both papers in the methodology page and in the YC application as prior art. State the difference plainly: they run closed experiments, we run daily assimilation with pre-registered, scored forecasts.
6. Pass the Real World UBI-style demo against the Texas result as a smoke test of whether our agents move in the right direction.

## Open questions

- What are the terms of the `packages/agentsociety/commercial` folder? Read the repo README license section and the folder's own LICENSE locally with a clone.
- What did the v2 runs cost, and on which models? The v2 paper was only partly read. Read the cost and limitations sections.
- Does any group critique AgentSociety's fidelity or reproducibility? My search budget ran out. Run a search on citing papers and Funhouse Mirrors-style variance critiques.
- Are the v1 and v2 numbers (10k agents, 100M interactions) reproducible on a laptop? Install `agentsociety2` in a scratch directory and time a 100-agent run with Haiku.
- Does the README say DuckDB while the paper says SQLite? Check the installed package.

## Sources

- [AgentSociety GitHub repository](https://github.com/tsinghua-fib-lab/AgentSociety), accessed 2026-10-11
- [AgentSociety releases](https://github.com/tsinghua-fib-lab/AgentSociety/releases), accessed 2026-10-11
- [AgentSociety LICENSE (Apache-2.0)](https://github.com/tsinghua-fib-lab/AgentSociety/blob/main/LICENSE), accessed 2026-10-11
- [AgentSociety: Large-Scale Simulation of LLM-Driven Generative Agents (arXiv 2502.08691 abstract)](https://arxiv.org/abs/2502.08691), accessed 2026-10-11
- [AgentSociety v1 full text (arXiv HTML)](https://arxiv.org/html/2502.08691v1), accessed 2026-10-11
- [AgentSociety 2 (arXiv 2607.11895, via alphaxiv markdown)](https://www.alphaxiv.org/abs/2607.11895.md), accessed 2026-10-11
