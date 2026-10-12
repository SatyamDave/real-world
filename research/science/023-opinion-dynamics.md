# Opinion dynamics for neighbor talk over 7 simulated days

- Date: 2026-10-11
- Area: science
- Confidence: medium. The classical models are well established. The LLM-hybrid literature is small, mostly preprints, with 5 to 100 agents; nobody has shown this at 100,000 agents.

## Answer

Do not let LLMs do the neighbor talk for every agent. Run a cheap numeric stance update for all 100,000 agents: Friedkin-Johnsen (each agent anchored to its own prior), with a bounded-confidence gate on who influences whom. Use the LLM on a small sample to write messages, to measure how strongly LLM agents actually move, and to catch consensus artifacts. Seven days is a short transient, not an equilibrium, so the per-day step size matters more than which model has the nicest fixed point.

## Findings

**The classical models.** Hegselmann and Krause (JASSS 5(3), 2002) put four models in one frame: the classical consensus (DeGroot) model, the Friedkin-Johnsen variant, a time-dependent version and a nonlinear bounded-confidence version. They run simulations only for bounded confidence. Their question is when a group ends in consensus, polarization or fragmentation. [HK 2002](https://www.jasss.org/5/3/2.html)

**What the confidence bound does.** I read the PDF. Opinions are in [0,1], with 625 random starting opinions and simultaneous updates. At a bound of 0.01, 38 distinct opinions survive. At 0.15 the group splits into two camps. At 0.25 it reaches consensus. The pattern stabilises in under 15 periods. Fifty runs per setting showed a sharp drop from plurality to two clusters, then to one. [HK 2002 PDF](https://www.jasss.org/5/3/2/2.pdf) The bound is the whole story, and the transition is steep. A small error in the bound flips the world from polarized to united.

**DeGroot alone always converges.** The Yang paper notes that under pure DeGroot-style anchoring, any connected graph reaches consensus for any positive coupling. Friedkin-Johnsen keeps diversity only if agents stay anchored to their initial opinion. [Yang 2026](https://arxiv.org/html/2606.22203) This is the main reason not to use plain DeGroot for a world model. It erases the disagreement we are trying to forecast.

**Default LLM agents drift to consensus.** Chuang et al. (Findings of NAACL 2024) report that LLM agents carry a strong bias toward accurate information, so they converge on scientific consensus regardless of persona. After the authors induced confirmation bias by prompt, opinions fragmented as in classical models. [Chuang et al.](https://arxiv.org/abs/2311.09618) This is the variance-collapse risk from our plan, seen in the literature. The abstract does not give agent counts or models, and I did not open the full text.

**LLM coupling is measurable, and it differs by model.** Yang (arXiv 2606.22203, 20 June 2026, single author) perturbs a neighbor's stated opinion and regresses the agent's update on it. The slope, called coupling gain, was 0.43 for DeepSeek, 0.28 Qwen, 0.25 Gemini, 0.18 GPT-5.5 and 0.15 Claude. Eleven open-weight models fell between 0.25 and 0.34. It maps onto Friedkin-Johnsen susceptibility. Frontier models never polarized spontaneously; polarization appeared only when induced. Pairwise gain did not reliably predict outcomes with several neighbors. Caveats from the author: societies of 6 to 10 agents, few rounds, one task. [Yang 2026](https://arxiv.org/html/2606.22203)

**An artifact test exists.** Yang regresses final group mean on initial group mean. A slope near 1 and bias near 0 means real averaging. A slope near 0 means the model's prior is pulling everyone to the same place. Claude and GPT-5.5 showed artifacts on vaccines and flat-earth claims. Gemini showed none. [Yang 2026](https://arxiv.org/html/2606.22203)

**Fitting the classical models to LLM dialog.** He et al. (arXiv 2602.12583, Feb 2026) fit DeGroot and Friedkin-Johnsen weights to LLM conversations: 5 agents per group, 20 rounds, five models, scalar opinion from a sentiment classifier on a fictional topic. Fitted susceptibilities were 0.82 to 0.98 in homogeneous groups. Friedkin-Johnsen residuals were higher than DeGroot for every model. They report no repeated runs and no bounded-confidence test. [He et al., HTML](https://arxiv.org/html/2602.12583v1)

**Closest thing to our design.** discourse_sim (EMNLP 2025 per its PyPI link) has LLMs write posts and interpret opinions on a small-world network. The case study is 100 agents over 15 simulated days, on the Dublin anti-immigration march of 26 April 2025. [arXiv 2604.03898](https://arxiv.org/abs/2604.03898) That is three orders of magnitude below our target. I could not read its update rule, license or cost.

**Cost arithmetic (my estimate, not sourced).** 100,000 agents over 7 days is 700,000 agent-days per run. Even one 1,000-token call each is about 700 million tokens per run, before any ensemble. That cannot fit a $15 to $60 nightly budget. Neighbor talk must be numeric for most agents.

## What it means for Real World

- For the product: "Click an agent to ask why" needs a readable trace. A scalar update gives it for free: "moved 0.06 toward neighbors A and B, held back by anchor." Show the ensemble spread over the confidence bound, since that is the most sensitive input.
- For the engineering: one function, `step(stance, neighbors, anchor, gamma, eps)`, vectorised over a sparse neighbor graph. Per-agent update is cheap on edges. Global Hegselmann-Krause is a full pairwise comparison, so restrict it to neighbors or use pairwise Deffuant sampling. Keep the LLM out of the inner loop. A PM can read the five parameters; an engineer can unit-test them.
- For the business: the track record only means something if the dynamics are not tuned to the answer. Freeze the update rule and the LLM version before the launch, and publish the parameters with each hashed forecast. Model swaps change coupling by up to 3x, so a silent model upgrade would break comparability.

## Recommendations

1. Adopt Friedkin-Johnsen as the base: `x_next = gamma * mean_of_trusted_neighbors + (1 - gamma) * x_prior`, where the prior is today's assimilated belief. Daily assimilation then plays the role of the anchor and keeps spread alive.
2. Add a bounded-confidence gate: an agent listens only to neighbors within epsilon, soft-edged to avoid cliffs. Do not trust one epsilon. Run the ensemble over epsilon in roughly 0.1 to 0.3 per topic and show the spread.
3. Calibrate gamma per day, not per equilibrium. Fit it by regression of next-day poll movement on neighbor stance, per segment. Start from the 0.15 to 0.43 range Yang measured as a prior, not as truth.
4. Use LLMs on a sample of about 1 to 2 percent of agents each night: generate the actual messages, read the stance back, and compare their coupling with the numeric rule. Alert when the gap passes a set tolerance.
5. Run Yang's slope-and-bias test on every model version before it goes into the pipeline, and once per quarter. Block versions that show prior-driven convergence on contested topics.
6. Pin the LLM version and record gamma, epsilon and model id in the hashed forecast record.
7. Do not build a custom DeGroot variant, a learned update network, or multi-topic vector opinions in v1. One scalar per topic is enough for the 22-day window.

## Open questions

- Do real-world networks at 100,000 agents behave like these 5 to 625 agent toy runs? We would find out by backtesting the numeric rule against GDELT and poll movement over past weeks, before launch.
- What neighbor graph do we use? The literature here assumes small-world or complete graphs. Census microdata has no social ties. We need a homophily-based synthetic graph and a way to test it.
- Is the 7-day horizon too short for any of this to matter versus the assimilation nudge? A null-model comparison (no neighbor talk at all) would show it. If neighbor talk adds nothing to Brier score, drop it.
- I could not read the discourse_sim update rule, the Chuang agent counts, or the Larooij and Torberg critical review (arXiv 2504.03274, which argues LLMs worsen agent-based model validation problems). My search budget ran out; a follow-up pass should read those three.
- Non-English opinion expression is untested in every source above, so Western flattening is unaddressed here.

## Sources

- [Hegselmann and Krause, Opinion dynamics and bounded confidence (JASSS 5(3), 2002)](https://www.jasss.org/5/3/2.html), accessed 2026-10-11
- [Hegselmann and Krause 2002, full PDF](https://www.jasss.org/5/3/2/2.pdf), accessed 2026-10-11
- [Chuang et al., Simulating Opinion Dynamics with Networks of LLM-based Agents, arXiv 2311.09618](https://arxiv.org/abs/2311.09618), accessed 2026-10-11
- [He et al., Opinion dynamics and mutual influence with LLM agents through dialog simulation, arXiv 2602.12583](https://arxiv.org/html/2602.12583v1), accessed 2026-10-11
- [Yang, When Is Emergent Consensus Real?, arXiv 2606.22203](https://arxiv.org/html/2606.22203), accessed 2026-10-11
- [LLM-Agent-based Social Simulation for Attitude Diffusion (discourse_sim), arXiv 2604.03898](https://arxiv.org/abs/2604.03898), accessed 2026-10-11
