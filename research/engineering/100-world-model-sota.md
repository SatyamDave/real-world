# World models of society and agentic simulation: state of the art, 2026

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Every cited page was opened, but the search tool hit its budget cap, so I could not run open discovery. Aaru funding, the Funhouse Mirrors paper and any 2026 frontier-lab society models are not covered.

## Answer

"World model" now means two different things. Labs build visual or physical world models (Genie 3). Society simulation is a separate field, run by Simile, Aaru, Stanford's Park group and open-source frameworks. In that field the single-agent part is proven. Interview-grounded agents match a person's own retest consistency at about 85 percent. The population-level, forward-in-time, publicly scored part is not shown by anyone I could verify. Real World's real novelty is the daily assimilate, hash, score loop, not the 100,000 agents. Build that first and keep the agent layer thin and swappable.

## Findings

**Frontier-lab "world models" are not society models.** DeepMind's Genie 3 (announced 2025-08-05) generates navigable 720p worlds at 24 fps that stay consistent for a few minutes. DeepMind lists multi-agent interaction as an open problem. [Genie 3](https://deepmind.google/discover/blog/genie-3-a-new-frontier-for-world-models/). No competition from that direction on our task.

**The agent foundation is real but narrow.**
- Park et al. 2023 put 25 agents in a sandbox town. The repo has about 22.2k stars, Apache-2.0, and needs an OpenAI key. [paper](https://arxiv.org/abs/2304.03442), [repo](https://github.com/joonspk-research/generative_agents).
- Park et al., arXiv 2411.10109 (v3, 2026-06-28), built agents for 1,052 Americans. Interview-grounded agents reached 83 percent of participants' own two-week test-retest accuracy on held-out General Social Survey items. Combined with survey data it was 86 percent. Demographics-only agents got 74 percent. [paper](https://arxiv.org/abs/2411.10109). The 9-point gap over demographics-only is the case for opt-in twins. It is also small, and it is US-only, from two-hour interviews.
- Argyle et al. 2022 showed GPT-3 conditioned on survey demographics reproduces subgroup response patterns ("algorithmic fidelity"). [paper](https://arxiv.org/abs/2209.06899). That is the basis for sampling agents from microdata.

**The documented failure modes match our known risks.**
- Santurkar et al. found LMs misalign with 60 US demographic groups, "on par with the Democrat-Republican divide on climate change", even when steered. Groups aged 65+ and widowed people were worst. [paper](https://arxiv.org/abs/2303.17548).
- Wang et al. (Nature Machine Intelligence) ran 3,200 participants across 16 identities and 4 LLMs. LLMs misportray and flatten groups. Inference-time fixes reduce this but do not remove it. [paper](https://arxiv.org/abs/2402.01908). Both studies are US-centric. Nobody I found has validated demographic fidelity at 100-country scale. That is open ground and also our biggest unproven claim.
- I could not locate the "Funhouse Mirrors" variance-collapse paper from the brief. Treat variance collapse as a known risk, not a cited result.

**Startups.**
- Simile: Series B of $200M at a $2B valuation (page undated). Customers named: CVS Health, Gallup, Itau, Deloitte, Wealthfront, Suntory. Claims weekly validation on more than 7,000 evaluations and a per-result confidence tag. It cites the Park interview-agent work (85 percent) and a finetuning study with 26 percent better alignment on unseen studies, trained on 2.9M responses from 210 experiments. All company-reported. [simile.com](https://www.simile.com/). Simile sells accuracy to enterprises on market-research tasks. It does not publish daily public forecasts.
- Aaru: sells population simulation for product, pricing and messaging tests. Claims 7.62 percent mean TVD and 3.53 percent MAE across 2,993 validation questions. No funding or valuation on the page. [aaru.com](https://aaru.com). The 2024 election miss in the brief is not on the page and I did not verify it. Their metric is distribution distance on survey questions, not forward forecasts scored against a market.

**Open-source frameworks.** All of these are single-machine research tools, not daily pipelines.

| Project | Stars | License | Note |
|---|---|---|---|
| [MiroFish](https://github.com/666ghj/MiroFish) | ~78.2k | AGPL-3.0 | "Predict anything" engine on OASIS. README claims thousands of agents, no benchmarks. Needs Zep Cloud. Warns runs are costly, start under 40 rounds |
| [OASIS (CAMEL-AI)](https://github.com/camel-ai/oasis) | ~5.3k | Apache-2.0 | X/Reddit simulator, claims up to 1M agents, reproduces polarization and herd effects. [paper](https://arxiv.org/abs/2411.11581) |
| [AgentSociety](https://github.com/tsinghua-fib-lab/AgentSociety) | ~1.3k | Apache-2.0 (commercial folder excepted) | City-scale, Ray-distributed, MCP support |
| [Concordia (DeepMind)](https://github.com/google-deepmind/concordia) | ~1.8k | Apache-2.0 | Game-master pattern for generative agent models |
| [AgentTorch](https://github.com/AgentTorch/AgentTorch) | ~653 | AGPL-3.0 | Differentiable, GPU, millions of agents, v0.6.0 |

MiroFish's 78k stars show demand for "inject an event, watch the world react." Its README shows no accuracy evidence. That is the gap a scored track record fills. AGPL on MiroFish and AgentTorch rules out copying code into a hosted API. Use the Apache-2.0 ones as reference only.

**Data layer.** GDELT 2.0 updates every 15 minutes and translates 65 live languages. It is described as free and open, with no named license. Read its terms before we commercialize. [GDELT](https://www.gdeltproject.org/data.html).

## What it means for Real World

- For the product: the differentiator is "forecast published as a hash, scored later." Lead with the receipts page. Fork-and-inject is a demo that others (MiroFish) already show. Do not promise "100,000 agents" as the headline claim. No source I opened shows that agent count adds accuracy beyond a representative sample.
- For the engineering: the proven building blocks are survey-conditioned personas and interview-grounded twins. A forward-in-time daily loop with belief nudging has no public reference implementation I found. We build it ourselves. Keep the agent engine behind one interface so we can swap OASIS-style, Concordia-style or plain survey-conditioned sampling. Cost is dominated by LLM calls, so most daily value should come from aggregate models and a small LLM-agent panel, with agents used for explanation.
- For the business: Simile at $2B shows buyers exist for behavioral simulation, but it sells enterprise research. A public, auditable, world-wide track record is a different asset and cannot be backfilled. The risk is that early scores are bad. A 22-day runway gives few resolved forecasts by Nov 2, so say so plainly in the YC application.

## Recommendations

1. Make the baseline first: write a no-agent forecaster (market price plus simple trend) and score every agent forecast against it. If agents do not beat it, say so. Owner: engineering.
2. Define one `Simulator` interface (input: world state plus event; output: typed distribution per segment). Implement survey-conditioned sampling now and keep OASIS/Concordia adapters optional.
3. Start the hashed forecast log on day one, even with a weak model. Resolved forecasts by Nov 2 are the only evidence that cannot be created later.
4. Run a fidelity check per region before claiming world coverage: compare simulated vs real answers on held-out WVS/Gallup items by country and by age band, since Santurkar found old and widowed groups worst. Publish the table.
5. Measure spread, not just means: report ensemble variance against real survey variance to catch collapse.
6. Do not import AGPL code (MiroFish, AgentTorch) into the hosted API. Read GDELT terms before launch.

## Open questions

- Who has published forward forecasts with a public score? Re-run discovery searches for 2026 society-simulation work (Aaru funding, Park group follow-ups, Funhouse Mirrors, Metaculus/Polymarket comparisons) once search is available.
- Does LLM-agent simulation beat a market-price baseline on any resolved question? Unknown. Our own log is the test.
- Does fidelity hold outside the US at the country level? No evidence found. Test it with WVS held-out items.
- Are Simile and Aaru numbers reproducible? Both are company-reported only.

## Sources

- [Genie 3](https://deepmind.google/discover/blog/genie-3-a-new-frontier-for-world-models/), accessed 2026-10-11
- [Generative Agents (Park 2023)](https://arxiv.org/abs/2304.03442), accessed 2026-10-11
- [Generative agents repo](https://github.com/joonspk-research/generative_agents), accessed 2026-10-11
- [LLM Agents Grounded in Self-Reports (Park 2024, v3 2026)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Out of One, Many (Argyle 2022)](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [Whose Opinions Do Language Models Reflect?](https://arxiv.org/abs/2303.17548), accessed 2026-10-11
- [LLMs that replace human participants can misportray and flatten identity groups](https://arxiv.org/abs/2402.01908), accessed 2026-10-11
- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Aaru](https://aaru.com), accessed 2026-10-11
- [OASIS paper](https://arxiv.org/abs/2411.11581), accessed 2026-10-11
- [OASIS repo](https://github.com/camel-ai/oasis), accessed 2026-10-11
- [MiroFish repo](https://github.com/666ghj/MiroFish), accessed 2026-10-11
- [AgentSociety repo](https://github.com/tsinghua-fib-lab/AgentSociety), accessed 2026-10-11
- [Concordia repo](https://github.com/google-deepmind/concordia), accessed 2026-10-11
- [AgentTorch repo](https://github.com/AgentTorch/AgentTorch), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
