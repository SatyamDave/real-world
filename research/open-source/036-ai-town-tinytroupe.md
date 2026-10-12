# AI Town, TinyTroupe and Stanford generative_agents: what to borrow

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo facts (stars, licenses, designs) were read from the live pages. Last-commit dates, cost figures and the access terms for the Park 2024 "agent bank" could not be confirmed; the search budget ran out mid-task.

## Answer

None of the three is a base to build on. All are small-world simulators (3 to 25 agents, one machine), and none handles 100,000 agents, census sampling, or belief updates from news. They are all permissively licensed, so we can copy ideas freely. Borrow four things: the Stanford memory-retrieval score, TinyTroupe's persona JSON and empirical validator, the Park 2024 interview-grounded twin recipe, and AI Town's input-log pattern. Write our own engine.

## Findings

**Stanford generative_agents** ([repo](https://github.com/joonspk-research/generative_agents), [paper](https://arxiv.org/abs/2304.03442))
- 22.2k stars, 3.1k forks, Apache-2.0, 31 commits. It is research code, not a library: a Django front end plus a `reverie.py` loop, Python 3.9.12, OpenAI key pasted into `utils.py`.
- Demo worlds have 25 agents (`base_the_ville_n25`) or 3. One step is 10 game seconds. The README warns it "could be somewhat costly" and that the OpenAI API can hang at rate limits.
- Memory design (from the [paper](https://arxiv.org/html/2304.03442)): a memory stream of natural-language items with a creation time and last-access time. Types are observation, reflection (cites its source memories), and plan.
- Retrieval score is recency + importance + relevance, each min-max normalized to [0,1], weights all 1. Recency decays at 0.995 per game hour. Importance is an LLM rating from 1 to 10, set when the memory is written. Relevance is embedding cosine similarity.
- Reflection fires when summed importance of recent events passes 150. Agents reflected two or three times a day. The paper used gpt-3.5-turbo.
- Ablation: observation, planning and reflection each add believability. The 25-agent party scenario worked, but that is a story test, not a forecast test.

**a16z AI Town** ([repo](https://github.com/a16z-infra/ai-town), [architecture](https://raw.githubusercontent.com/a16z-infra/ai-town/main/ARCHITECTURE.md))
- 10.6k stars, 1.2k forks, MIT, 1,147 commits, 67 open issues. Stack is Convex (database, vector search, engine), PixiJS, optional Clerk. Default model is Ollama llama3 with mxbai-embed-large; OpenAI and Together also work.
- Engine runs 60 ticks per second, batched into one write step per second. Inputs go into an ordered `inputs` table and the engine writes results back. That log pattern is the useful part.
- Memory is thinner than Stanford's: after a conversation the LLM summarizes it, the summary is embedded, and a new conversation retrieves the top 3 by similarity. The doc describes no reflection and no importance score.
- Limits stated by the authors: world state should stay under a few dozen KB, one world is single-threaded, conversations have exactly two members, and input latency is about 1.5 seconds. No agent maximum is given. It pauses after 5 minutes of tab inactivity.

**Microsoft TinyTroupe** ([repo](https://github.com/microsoft/TinyTroupe), [README](https://raw.githubusercontent.com/microsoft/TinyTroupe/main/README.md))
- 7.6k stars, 687 forks, MIT, version 0.7.0 (2026-03-28). The README says "WORK IN PROGRESS: expect frequent changes" and that past releases broke programs. Install is from git, not PyPI. Python 3.10+. Defaults: gpt-5-mini, text-embedding-3-small.
- Persona format is a JSON file (`Lisa.agent.json`) with age, nationality, occupation, style, personality, Big Five scores, behaviors and preferences. Reusable fragments (`.agent.fragment.json`) can be mixed in.
- `TinyPersonFactory.create_factory_from_demography(...)` builds a population from a demographic description and makes its own sampling plan (inspectable via `sampling_dimensions`, `sampling_plan`). The README does not explain how the plan works. It is LLM-generated, which is the Western-flattening risk in a box.
- Memory ([source](https://github.com/microsoft/TinyTroupe/blob/main/tinytroupe/agent/memory.py)): episodic memory is a buffer committed to a list. Recall is positional: first 20 items plus the last 100. `retrieve_relevant` is not implemented there. Semantic memory goes through a LlamaIndex connector. `ReflectionConsolidator` is marked work in progress and does not run.
- It ships `SimulationExperimentEmpiricalValidator`, which compares simulated answers to real survey data with t-tests and KS-tests. The README says outputs may be "unrealistic, inappropriate, harmful or inaccurate" and that Ollama support is experimental.

**Park et al. 2024, 1,052 people** ([paper](https://arxiv.org/abs/2411.10109))
- Agents built from two-hour interviews (American Voices Project schedule). On held-out GSS items they reached 83% of the person's own two-week test-retest consistency, versus 82% from survey data, 86% combined, and 74% from demographics only. Accuracy gaps across racial and ideological groups shrank versus demographics-only.
- Gains from combining sources over either alone were modest. US-only sample. I could not confirm how the agent bank is shared or what the access terms are.

**Alternative worth a look**: [OASIS](https://github.com/camel-ai/oasis) (CAMEL-AI, Apache-2.0, 5.3k stars) claims "up to one million agents" on a Twitter/Reddit model with 23 action types. The claim has no benchmark on the page. It models posting behavior, not populations.

## What it means for Real World

- For the product: "click any agent to ask why" is the Stanford memory stream: each belief has cited memories. Opt-in twins map to the Park 2024 interview recipe. Neither repo gives a forecast, a scoreboard or a segment output. Those are ours.
- For the engineering: 100,000 agents with one LLM call per agent per day is not what any of these loops do. They run an LLM turn per agent per 10 game seconds. Use their ideas only for the small deep-trace subset (twins, a few thousand sampled agents) and use cheap batched calls for the rest. Do not fork any of the three. AI Town's single-threaded Convex world and TinyTroupe's unstable API are both wrong for a nightly job.
- For the business: all three are MIT or Apache-2.0, so copying code or designs is safe with attribution and the Apache NOTICE. Park 2024 data is a separate matter and must be checked before we promise "Park-style twins" to YC. Simile and Aaru already cite this lineage; the hashed daily track record is what these repos cannot give anyone.

## Recommendations

1. Implement the Stanford retrieval score (recency 0.995, importance 1-10, relevance cosine, weights 1) as the single memory function for deep-trace agents. One short module, one test. Skip reflection until a miss analysis shows we need it.
2. Store each agent as a JSON file with TinyTroupe-like fields plus country, census-source id, and survey-item answers. Keep ours typed and versioned. Do not take the LLM-generated sampling plan; sample from census microdata.
3. Copy TinyTroupe's empirical-validator idea: every nightly run compares simulated survey marginals to the real ones with a KS test and prints the result on the receipts page.
4. Copy AI Town's ordered input log. Each fork, injected event and daily assimilation nudge is one row, so any world state replays from the log. This also supports the "cannot be backfilled" claim.
5. Build opt-in twins as a Park 2024 style interview plus survey item set, and run the 74% demographics-only baseline as a control on our own panel.
6. Budget a real run of a 25-agent Stanford-style loop on Haiku to measure tokens per agent per day, then extrapolate. Do not trust the $15-60 per night number until this is measured.

## Open questions

- Terms of access to the Park 2024 agent bank (public, gated, or none). Find out by reading the paper PDF's data statement and emailing the authors.
- Last-commit dates for all three repos. The GitHub pages did not show them, so maintenance status is unverified. Check with `gh api repos/<owner>/<repo>` for `pushed_at`.
- Whether Stanford's importance score and reflection survive at cheap-model scale. Test on a small run.
- Cost of the Stanford 25-agent run. The text I read does not state it.
- OASIS's million-agent claim: ask for or run a benchmark before citing it.

## Sources

- [generative_agents repo](https://github.com/joonspk-research/generative_agents), accessed 2026-10-11
- [Generative Agents paper, arXiv 2304.03442](https://arxiv.org/abs/2304.03442), accessed 2026-10-11
- [Generative Agents paper, HTML (retrieval, reflection)](https://arxiv.org/html/2304.03442), accessed 2026-10-11
- [AI Town repo](https://github.com/a16z-infra/ai-town), accessed 2026-10-11
- [AI Town ARCHITECTURE.md](https://raw.githubusercontent.com/a16z-infra/ai-town/main/ARCHITECTURE.md), accessed 2026-10-11
- [TinyTroupe repo](https://github.com/microsoft/TinyTroupe), accessed 2026-10-11
- [TinyTroupe README](https://raw.githubusercontent.com/microsoft/TinyTroupe/main/README.md), accessed 2026-10-11
- [TinyTroupe memory.py](https://github.com/microsoft/TinyTroupe/blob/main/tinytroupe/agent/memory.py), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [OASIS repo](https://github.com/camel-ai/oasis), accessed 2026-10-11
