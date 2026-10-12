# Belief representation and update operators

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. The agent-memory, interview-agent and assimilation facts were read at the source. The web search budget ran out mid-task, so the opinion-dynamics operators (DeGroot, Friedkin-Johnsen, bounded confidence) and the "variance collapse" literature are from general knowledge and are marked as such.

## Answer

Use both representations, with a strict split of jobs. A small numeric belief vector per agent is the state that news, polls and assimilation move. A short text profile (and, for twins, interview text) is only read when an LLM must speak or explain, and is never the thing we update at scale. News and assimilation should act as small, bounded numeric operators with a per-agent stubbornness term and a fixed personal anchor, so individual quirks survive the daily nudge. LLM calls should happen only where a number cannot answer, because 100,000 agents cannot each run a text-memory loop every night inside $15-60.

## Findings

- Text memory is the research default but is built for small casts. Generative Agents keeps a natural-language memory stream, scores retrieval as recency (decay 0.995) plus LLM-rated importance (1-10) plus embedding relevance, all min-max normalized with weights of 1, and triggers a reflection when summed importance passes 150, about two or three reflections a day. The demo had 25 agents. Every memory write and retrieval costs an LLM or embedding call, so it does not scale to 100,000 agents nightly. [Park et al. 2023](https://arxiv.org/abs/2304.03442), details via [ar5iv copy](https://ar5iv.labs.arxiv.org/html/2304.03442).
- Interview text is the strongest individual grounding we have evidence for. Agents built from two-hour interviews with 1,052 Americans matched 83% of participants' own two-week test-retest consistency on held-out General Social Survey items. Survey-only agents got 82%, combined 86%, and demographics-only 74%. Gains from stacking sources were modest. The paper also reports smaller accuracy gaps across racial and ideological groups than demographics-only agents. Version 3 was revised 28 Jun 2026. [Park et al.](https://arxiv.org/abs/2411.10109). Reading: demographics alone leaves a large gap, but 10 to 12 points is the whole prize from rich text, and survey answers get nearly all of it. That favors a cheap numeric vector built from survey items for most agents and reserves interview text for opt-in twins.
- LLM agents do not update beliefs like humans by default. In a network of LLM agents, the authors found a strong bias toward accurate information that pulls opinions to scientific consensus, so the agents resisted fragmentation. Only prompt-induced confirmation bias produced opinion fragmentation like classic models. [Chuang et al. 2023](https://arxiv.org/abs/2311.09618). Implication: letting the LLM decide how much to update will flatten the world toward "what the model believes is true". The update magnitude has to come from our operator, not from the model.
- Persona sets themselves bias populations. Unrepresentative personas introduce population-level bias, and importance sampling to reference psychometric distributions (Big Five) reduces it. [Hu et al. 2025](https://arxiv.org/abs/2509.10127). This paper does not mention "variance collapse" or "Funhouse Mirrors"; I could not open a source for those names, so treat the risk as given in the plan, not verified here.
- Weather assimilation is the right template and has three relevant methods. Nudging adds a term proportional to (observed minus modeled) with a prescribed gain. 3D-Var minimizes a weighted sum of departure from the background forecast (covariance B) and misfit to observations (covariance R). The ensemble Kalman filter updates each ensemble member with a gain from the sample covariance: K = C Hᵀ (H C Hᵀ + R)⁻¹, X_new = X + K (D − H X), with perturbed observations; ensembles are typically under a hundred members, and covariance is tapered by distance (localization) to kill spurious correlations. Hybrid ensemble-variational systems run at ECMWF and NCEP. [Wikipedia: Data assimilation](https://en.wikipedia.org/wiki/Data_assimilation), [Wikipedia: Ensemble Kalman filter](https://en.wikipedia.org/wiki/Ensemble_Kalman_filter). Note the EnKF assumes Gaussian distributions, which opinion shares on bounded scales are not.
- From general knowledge, not fetched: the Friedkin-Johnsen model updates opinion as a mix of neighbors' opinions and an innate prior with a per-agent susceptibility, which is why disagreement persists instead of converging. Bounded-confidence models (Deffuant, Hegselmann-Krause) only update on messages within a distance threshold. Both are single-line operators and fit our needs.

## What it means for Real World

- For the product: "click any agent, ask why" needs a readable record per agent. Show the vector, the last three belief changes with the news item that caused each, and the text profile. That is explainable to a PM without exposing a prompt log.
- For the engineering: keep three layers and do not blur them.
  1. Fixed anchor: each agent's census plus survey-derived prior `b0` (vector in logit space for yes/no questions) and a stubbornness `s` in [0,1]. Never overwritten.
  2. Mutable state: current belief `b_t`, plus a short list of recent evidence IDs.
  3. Text: a profile paragraph generated once from demographics, and for twins the interview. Used for explanations and for the rare LLM-sampled answer.
  Daily update, per agent and topic: `b_t+1 = b_t + (1-s)*exposure*clip(w*(evidence_signal), ±step_cap) + pull*(b0 - b_t)`. Exposure depends on language, country, media diet. The pull term is the mean-reversion that keeps quirks; `step_cap` stops one headline from flipping people. This is a few lines of numpy, runs on 100,000 agents in milliseconds, and costs zero tokens.
- For the engineering, assimilation: apply it to population aggregates by segment, not to each agent. After the forecast, compute the gap between simulated and observed (poll, market price) per segment, then shift each agent's belief by a shared correction scaled by its own `(1-s)` and by its position, so heterogeneity is preserved. Keep the correction in logit space, cap it per day, and store it as its own field so it can be audited and undone. Skip a full EnKF for v1; nudging with a gain is the same idea without covariance estimation. Add ensemble members (the plan already runs an ensemble) as the spread estimate.
- For the engineering, LLM use: call the model only to (a) turn a news item into a signed signal on a few topics once per story, not once per agent, and (b) to answer free-text questions for a sampled subset. Per-agent per-story LLM calls are the cost trap behind the $15-60 budget.
- For the business: the hashed daily forecasts only mean something if the update rule is frozen and versioned. Hash the operator version and parameters with each forecast.

## Recommendations

1. Define the belief vector schema now: topics list, logit-scale values, `b0`, `s`, evidence IDs. One JSON schema, one doc a PM can read, owned jointly.
2. Ship the three-layer state and the bounded update formula above as a single `update_beliefs()` function with a property test: with zero evidence the population mean stays put and per-agent variance does not shrink more than a stated amount per week.
3. Track variance explicitly: log the standard deviation of beliefs per segment and per topic every simulated day, and alarm when it falls below the survey's own spread. This is the cheap detector for variance collapse.
4. Do not let an LLM set update size. Use it to extract signals only, and compare its signals against a keyword or market-move baseline on 20 stories.
5. Implement assimilation as capped per-segment nudging; revisit EnKF only if the nudge visibly overfits polls and hurts out-of-sample Brier.
6. Build twins as an add-on: interview text plus the same vector, with the vector initialized from the interview's survey answers, so the update code is identical for all agents.
7. Run one ablation before launch: vector only, vector plus profile text, on 50 held-out survey items for one non-US country. Keep the extra text only if it helps.

## Open questions

- What step size and pull strength reproduce real opinion drift after a major event? Fit on the 2020-2024 poll series and GDELT tone, then check against held-out events.
- Does the survey-only 82% result hold outside the US? The interview paper is Americans only. Test on WVS wave 7 country holdouts.
- Which published sources document variance collapse and Western flattening with numbers? Searches were cut off; redo a literature pass.
- Do Friedkin-Johnsen and bounded confidence outperform plain capped additive updates on our data? I could not open primary sources for them.

## Sources

- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442), accessed 2026-10-11
- [Generative Agents full text (ar5iv)](https://ar5iv.labs.arxiv.org/html/2304.03442), accessed 2026-10-11
- [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Simulating Opinion Dynamics with Networks of LLM-based Agents](https://arxiv.org/abs/2311.09618), accessed 2026-10-11
- [Population-Aligned Persona Generation for LLM-based Social Simulation](https://arxiv.org/abs/2509.10127), accessed 2026-10-11
- [LLM Empowered Agent-based Modeling and Simulation: A Survey](https://arxiv.org/abs/2312.11970), accessed 2026-10-11
- [Data assimilation (Wikipedia)](https://en.wikipedia.org/wiki/Data_assimilation), accessed 2026-10-11
- [Ensemble Kalman filter (Wikipedia)](https://en.wikipedia.org/wiki/Ensemble_Kalman_filter), accessed 2026-10-11
