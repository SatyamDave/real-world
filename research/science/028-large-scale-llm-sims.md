# Large-scale LLM agent simulations: OASIS, AgentSociety, AgentTorch, Project Sid, S3

- Date: 2026-10-11
- Area: science
- Confidence: medium. The scale and architecture claims are from the papers and READMEs I opened. None of the systems has independent replication or a published dollar cost, and some paper sections were truncated when fetched.

## Answer

Nobody runs 100,000 LLM calls per agent per day, and Real World should not either. Every "million agent" system uses activation sampling, archetypes or group agents, so only a small slice of the population calls a model each step. Real World should treat the 100k agents as cheap structured state, call the LLM for archetypes and a small active sample, and add an explicit step that restores the variance LLMs remove.

## Findings

**OASIS (CAMEL-AI).** Agents are LLM-driven, not rule-based. The paper used Llama-3-8B-Instruct served with vLLM. Each agent has a 24-hour activity vector, one time step is 3 minutes, and only the agents active in a step are called ([paper](https://arxiv.org/html/2411.11581v3)). The 1M-agent setting took 18.0 hours per step on 27 A100 GPUs, producing 48.5K new tweets and 97.1K new comments per step. At 100K agents a step took 3.0 hours on 5 A100s. At 10K it took 0.2 hours on 2 A100s. That is roughly 8K actions per hour for the whole cluster. The paper gives no dollar cost. Fidelity is mixed. Against 198 real Twitter cascades the normalized RMSE was about 30%, and simulated cascade depth was noticeably too low. Agents herded more than humans on down-voted Reddit comments. Larger populations (100 to 10,000 agents) produced stronger herd effects and more diverse opinions. The repo has 5.3k stars, Apache-2.0, `pip install camel-oasis`, and no formal release tag on the page ([repo](https://github.com/camel-ai/oasis)). Its README reference run is 100 agents at activation probability 1 for one step: 335,600 input and 16,750 output tokens. That is about 3.4K input tokens per agent-step.

**AgentSociety (Tsinghua FIB lab).** The paper reports over 10K agents and about 5 million interactions, with about 500 interactions per agent per day ([paper](https://arxiv.org/html/2502.08691v1)). Scaling comes from Ray actors, asyncio, grouping agents into shared processes, and MQTT messaging. The authors list their own limits. The economy is simplified, with no real labor market. Overall speed is bounded by the slowest agent group. LLM hallucinations can distort results, so physical and numeric constraints sit in the environment, not in the model. An ACL industry follow-up reports 30,000 agents on 24 A800 GPUs ([search summary](https://aclanthology.org/people/jinghua-piao/)). I did not open that paper. The repo has 1.3k stars and is Apache-2.0 except a `commercial` folder. v2 is `pip install agentsociety2`, needs Python 3.11 and any litellm-supported model ([repo](https://github.com/tsinghua-fib-lab/AgentSociety)).

**AgentTorch LLM archetypes (MIT Media Lab).** This is the cheapest and closest match to our design. Agents are grouped by traits such as age, sex, income and occupation. The LLM is queried once per archetype and action, with M=3 Monte Carlo samples. Each individual then samples a decision from that archetype's distribution ([paper](https://arxiv.org/html/2409.10568v3)). On 8.4 million NYC agents the budget was about 300 to 400 LLM queries per step. Archetypes used 95% less runtime than one LLM call per agent. They beat both baselines on error against real data (lower is better):

| Agent type | Unemployment MSE | Infection MSE |
|---|---|---|
| Archetype | 24.59 | 95.17 |
| Heuristic | 41.05 | 2914.73 |
| LLM per agent | 56.98 | 4311.70 |

Caveats from the authors: LLM outputs may be biased or inconsistent, archetypes may miss individual heterogeneity, the action space is simple, and LLM data contamination is possible. The labor validation covered 3 of 5 boroughs and one US city. The repo is AGPL-3.0, with 653 stars, v0.6.0 on PyPI, and a commercial license on request ([repo](https://github.com/AgentTorch/AgentTorch)). The AGPL matters if we host it as a service. The README does not mention archetypes, so the idea is easier to copy than the code.

**Project Sid (Altera).** The experiments ran in Minecraft: 25 to 50 agents for most runs and 500 for the cultural-transmission run. The authors say runs over 1,000 agents exceeded their server limits and agents went unresponsive ([paper](https://arxiv.org/html/2411.00114v1)). GPT-4o was the main model. No cost figures are given and I found no code link. Results are preliminary. The authors admit models trained on human knowledge cannot show truly new institutions. This is a capability demo, not a calibration method.

**S3 and GA-S3.** S3 (Tsinghua, 2023) is the original LLM social-network simulator for emotion, attitude and interaction. The abstract gives no agent count or accuracy number ([abstract](https://arxiv.org/abs/2307.14984)). GA-S3 replaces individuals with group agents, each representing people who behave alike, and tests on 2024 online events ([abstract](https://arxiv.org/abs/2506.03532)). It claims "manageable" cost but gives no numbers in the abstract. It is the same idea as archetypes.

**Variance collapse is the main science risk.** In 2,414 grounded World Values Survey respondents from Turkey, independent LLM agents piled onto the modal answer: concentration went from 0.36 to 0.69 and entropy from 1.46 to 0.77, with total variation distance 0.44 from the real distribution. Asking the model once for the whole distribution ("verbalized sampling") raised fidelity, but overshot to over-dispersion, with an SD ratio of 1.26 to 1.37 against 0.4 to 0.56 before ([paper](https://arxiv.org/abs/2607.18310)). A separate 2026 preprint argues instruction-tuned models do not sample from distributions. The same persona gets the same answer on over half of items. One call describing the distribution more than halves error against survey data compared with aggregating many persona calls ([paper](https://arxiv.org/abs/2607.25292)). Both are single-author or recent preprints and not peer reviewed.

## What it means for Real World

- For the product: Say "100,000 agents" only if the number is honest. Show users how many were LLM-called today and how many are archetype-sampled. The ensemble spread we display must come from calibrated sampling, not from LLM temperature, which is too narrow.
- For the engineering: Use a three-tier cost design. Tier 1 holds all 100K agents as plain state vectors from census and survey microdata, updated by cheap numeric rules. Tier 2 calls the LLM per archetype (country x age band x income x a few attitude clusters) with M samples, and each agent samples from the returned distribution. Tier 3 gives a small activation-sampled set of agents a full persona prompt, which is what "click any agent, ask why" needs. Archetype count is the cost dial. AgentTorch needed only about 300 to 400 queries per step. OASIS reference tokens put 5,000 full-agent calls at about 17M input tokens, so the $15-60 per night budget holds if most calls go through archetypes. Write the sampler and state loop ourselves in Python or TS. Do not take an AGPL dependency.
- For the business: The honest pitch is "calibrated archetype ensembles with a public track record." The "1M agents" headline is a cluster-cost headline: 27 A100s for 18 hours per step. It is not a reasoning-quality claim. Nobody has shown that more agents means more accuracy for forecasting, only more dynamics in social-media sims.

## Recommendations

1. Build the daily engine as archetype-first: roughly 500 to 2,000 archetypes with country, age, income and attitude-cluster keys. Cap LLM queries per night and log the count.
2. Store, per archetype, a full response distribution (verbalized-sampling style) from one call. Draw agent answers from that distribution, then post-calibrate against the latest survey marginals each morning.
3. Measure dispersion every night. Track entropy and SD ratio of simulated answers against WVS and Gallup marginals per country. Fail the build if the ratio leaves 0.8 to 1.2. This directly addresses the variance collapse and Western flattening risks.
4. Reserve a small LLM-active sample for the "ask why" trace and fork demos. Use OASIS-style per-agent activity vectors to choose who is active, so cost scales with active count only.
5. Do not use OASIS, AgentSociety or AgentTorch as the core runtime. They are built for social-media, urban and epidemic settings. Steal ideas: OASIS activity vectors, AgentSociety Ray-plus-asyncio grouping if we need distribution, AgentTorch archetype Monte Carlo.
6. Run a 3-way ablation before launch on the same held-out questions: archetype, per-agent LLM, and heuristic baseline, scored by Brier or MSE against real outcomes. AgentTorch's table is the template.

## Open questions

- What does a 300-query archetype step cost on Haiku 5.5 with our prompt sizes? Find out by running one night with token logging.
- Does archetype granularity help forecasts outside AgentTorch's US labor and infection setting? Only our own held-out test answers this.
- How many archetypes does the AgentTorch paper actually use? It states only the query budget. Check the repo's example config.
- The ACL industry paper's 30K-agent, 24-GPU claim and the OASIS 1M-agent claim have no independent replication. Treat both as upper bounds.
- Both variance-collapse preprints are recent and unreviewed. Re-check their numbers against the full text before quoting them publicly.
- I did not find numbers for how many LLM-driven agents OASIS actually activates per step at 1M scale.

## Sources

- [OASIS paper, arXiv 2411.11581v3](https://arxiv.org/html/2411.11581v3), accessed 2026-10-11
- [OASIS repo, camel-ai/oasis](https://github.com/camel-ai/oasis), accessed 2026-10-11
- [AgentSociety paper, arXiv 2502.08691](https://arxiv.org/html/2502.08691v1), accessed 2026-10-11
- [AgentSociety repo](https://github.com/tsinghua-fib-lab/AgentSociety), accessed 2026-10-11
- [AgentSociety ACL industry follow-up (listing page, not opened)](https://aclanthology.org/people/jinghua-piao/), accessed 2026-10-11
- [AgentTorch LLM archetypes paper, arXiv 2409.10568v3](https://arxiv.org/html/2409.10568v3), accessed 2026-10-11
- [AgentTorch repo](https://github.com/AgentTorch/AgentTorch), accessed 2026-10-11
- [Project Sid, arXiv 2411.00114](https://arxiv.org/html/2411.00114v1), accessed 2026-10-11
- [S3, arXiv 2307.14984](https://arxiv.org/abs/2307.14984), accessed 2026-10-11
- [GA-S3, arXiv 2506.03532](https://arxiv.org/abs/2506.03532), accessed 2026-10-11
- [Distribution-First Population Simulation, arXiv 2607.18310](https://arxiv.org/abs/2607.18310), accessed 2026-10-11
- [Instruction-Tuned Language Models Cannot Sample from Distributions They Can Describe, arXiv 2607.25292](https://arxiv.org/abs/2607.25292), accessed 2026-10-11
