# Google DeepMind Concordia: game master pattern, maturity, fit

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo facts and architecture were read from primary sources (GitHub API, PyPI, source files, arXiv abstracts). The web search budget ran out mid-session, so I did not open the full papers, the NeurIPS contest pages or any third-party critiques. Cost numbers are my own arithmetic, not measured.

## Answer

Concordia is a real, actively maintained, Apache-2.0 library for LLM agent simulations with a game master (GM) that decides what happens. It is built for dozens of richly modelled agents, not 100,000. Real World should borrow three ideas (the GM-resolves-intent pattern, the entity/component split, the interviewer GM) and not adopt the library as the core engine.

## Findings

- **What it is.** "A library for generative social simulation," Python, created 2023-11-21. 1,773 stars, 379 forks, 44 open issues, license Apache-2.0. Last push 2026-10-08. [GitHub API](https://api.github.com/repos/google-deepmind/concordia). The README says "not an officially supported Google product." [README](https://raw.githubusercontent.com/google-deepmind/concordia/main/README.md)
- **Releases.** Latest on PyPI is 2.4.0 (2026-03-06). 1.0.0 was 2023-12-08. 2.0.0 shipped 2025-07-04, then 2.1.0 (Aug 2025), 2.2.0 (Jan 2026), 2.3.x (Feb 2026). Needs Python 3.12+. Install: `pip install gdm-concordia`. [PyPI](https://pypi.org/project/gdm-concordia/), [releases](https://api.github.com/repos/google-deepmind/concordia/releases?per_page=8). The 2.0 redesign was breaking: GMs became entities and prefabs replaced factories. Expect more breaks.
- **Team.** Top contributors are jzleibo (491 commits), vezhnick (296), jagapiou (194). Recent commits are Copybara imports from an internal repo plus a researcher adding "Concordia Island" examples. [contributors](https://api.github.com/repos/google-deepmind/concordia/contributors?per_page=10), [commits](https://api.github.com/repos/google-deepmind/concordia/commits?per_page=8). It is a research group's library, mirrored from Google-internal code. Bus factor is small.
- **Game master pattern.** Agents state intended actions in natural language. The GM, "inspired by tabletop role-playing games," turns them into outcomes: checks plausibility, writes the consequences, and can call external tools. [Vezhnevets et al. 2023](https://arxiv.org/abs/2312.03664). In v2 the GM is "a configurable entity" built from the same components as any actor. The paper names three roles: engineers, builders (write components), designers (compose entities). [Multi-Actor Generative AI as a Game Engine](https://arxiv.org/abs/2507.08892). That split matches the "engineer and PM can both work on it" goal.
- **Engine loop.** Each step: observe (GM says what each entity perceives), schedule (who acts), resolve (GM turns actions into world state), terminate. Engines: sequential (one agent at a time), simultaneous (a batch acts, GM resolves together) and, since 2.4.0, asynchronous (one thread per player, thread-safe GM, pause/resume for a UI). [engine README](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/environment/README.md), [asynchronous.py](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/environment/engines/asynchronous.py). Threads, not asyncio.
- **Components and prefabs.** `concordia/components` holds instructions, memory, action selection, sensory pieces. `concordia/prefabs` holds ready entities and GMs. There are 17 GM prefabs, including `interviewer`, `open_ended_interviewer`, `marketplace`, `psychology_experiment`, `async_social_media` and `formative_memories_initializer`. [GM prefabs](https://api.github.com/repos/google-deepmind/concordia/contents/concordia/prefabs/game_master)
- **Cost per agent step.** The basic entity makes about 4 sequential LLM calls per action: situation perception, self perception, "what would a person like X do," then the act call. [basic.py](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/prefabs/entity/basic.py). The GM then spends more calls resolving. Memory retrieval needs a text embedder.
- **Models.** Provider extras: amazon, google, groq, huggingface, langchain, mistralai, ollama, openai, together, vllm. There is no Anthropic wrapper in `contrib/language_models`. [listing](https://api.github.com/repos/google-deepmind/concordia/contents/concordia/contrib/language_models). We would write one (small) or go through langchain. Wrappers exist for retry, call caps and token profiling. [language_model README](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/language_model/README.md)
- **Scale evidence.** The biggest shipped example is Concordia Island: 100 residents per run, run as five shards of 20, 100 ticks (about 13 simulated days), 1,000 pregenerated Ohio personas, models Gemini 2.5 Flash, Gemma 3 27B and Gemma 4 MoE. No dollar cost is stated. Reported failure modes are repetitive "domestic loops," a conspiracy-theory attractor and a journaling "reflective sink"; the weakest setup had 30% degenerate output. [Island README](https://raw.githubusercontent.com/google-deepmind/concordia/main/examples/concordia_island/README.md). That is the variance-collapse risk we already track, shown in a first-party example.
- **Validation.** Both papers' abstracts claim usability and design goals only. I found no evidence that Concordia agents reproduce real survey distributions or forecast real events. It is a scenario and evaluation tool, not a calibrated population model.
- **Open bugs worth knowing.** Associative memory uses dot products where docs say cosine similarity; restoring memory in another process breaks dedup. [issues](https://api.github.com/repos/google-deepmind/concordia/issues?state=open&per_page=15). Retrieval correctness is our "why did this agent do that" feature, so these matter.

## What it means for Real World

- For the product:
  - Click-an-agent-and-ask-why maps cleanly to Concordia's `open_ended_interviewer` GM: an entity answers questions from its own memory and context. Fork-and-inject-event maps to a GM that injects an event as an observation to every entity.
  - Do not promise Concordia-style rich narrative for all 100,000 agents. Only a small tier can be that deep.
- For the engineering:
  - Cost math (my estimate): 4 calls per agent per tick x 100,000 agents = 400,000 calls per tick before GM calls. At about 1,500 input tokens per call that is roughly 600M input tokens per tick. Our budget is $15-60 per night, so a full Concordia tick across the population is out by one to two orders of magnitude. The nightly update must use a cheap structured step (one short call, or cohort-level agents), not Concordia's perception chain.
  - Its one-GM-per-world design serializes on the GM. The simultaneous engine batches, but we have not seen it run at 10^4+ agents.
  - Stack mismatch: Python library, we need Python 3.12+, no Anthropic wrapper, in-process memory and checkpoints rather than our own store.
- For the business:
  - Apache-2.0 allows commercial use and copying code with attribution. The "not officially supported" line means no support and no roadmap guarantee.
  - Using the DeepMind name for credibility is fine as "built on ideas from"; do not imply endorsement.

## Recommendations

1. Do not make Concordia the core simulator. Keep our own thin engine: typed state per agent, one batched cheap LLM call per agent-day, deterministic seeds for ensembles.
2. Copy the pattern, not the code: an event-resolver ("GM") that takes a typed event and emits per-agent observations, plus entity components (profile, memory, beliefs) that a PM can read as a list. Write it in 200 to 400 lines and own it.
3. Use Concordia as a deep tier for a small set (say 200 to 1,000 agents: the opt-in twins and the "ask why" agents). Spike: pip install 2.4.0, write an Anthropic `LanguageModel` wrapper, run `open_ended_interviewer` on 5 census-sampled personas. Time-box one engineer-day. Success: answers cite the agent's own memories.
4. Run Concordia Island's 1,000-persona example as a variance-collapse test. Measure how much agent answers differ across the 100 residents on one question, then compare with our own agents on the same prompt.
5. Pin the version (`gdm-concordia==2.4.0`) if we vendor anything, and read the memory-retrieval issues before trusting its "why" traces.
6. Do not add it to the launch critical path. With 16 days to launch (Oct 27), a new dependency with a history of breaking changes is a risk with no scoring upside.

## Open questions

- Has anyone run Concordia at 10,000+ agents, and at what cost? Find out: read the NeurIPS Concordia Contest and 2.4.0 simulation UI docs, and ask the maintainers on GitHub.
- Any evidence Concordia agents match survey marginals? Find out: read the full 2312.03664 paper and the Concordia Island paper for their evaluation sections.
- How many LLM calls does the GM make per resolution, and can it be batched? Find out: read `situated.py` and the simultaneous engine, then run `ProfiledLanguageModel` on the spike.
- Does `simultaneous.py` parallelize LLM calls, and with what concurrency limit? Find out: read `concurrency.run_tasks`.
- Third-party critiques and forks (I could not search): do a search pass before any adoption decision.

## Sources

- [google-deepmind/concordia repo API](https://api.github.com/repos/google-deepmind/concordia), accessed 2026-10-11
- [Concordia README](https://raw.githubusercontent.com/google-deepmind/concordia/main/README.md), accessed 2026-10-11
- [gdm-concordia on PyPI](https://pypi.org/project/gdm-concordia/), accessed 2026-10-11
- [GitHub releases](https://api.github.com/repos/google-deepmind/concordia/releases?per_page=8), accessed 2026-10-11
- [Generative agent-based modeling with actions grounded in physical, social, or digital space using Concordia (arXiv 2312.03664)](https://arxiv.org/abs/2312.03664), accessed 2026-10-11
- [Multi-Actor Generative Artificial Intelligence as a Game Engine (arXiv 2507.08892)](https://arxiv.org/abs/2507.08892), accessed 2026-10-11
- [Engine README](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/environment/README.md), accessed 2026-10-11
- [asynchronous.py](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/environment/engines/asynchronous.py), accessed 2026-10-11
- [basic entity prefab](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/prefabs/entity/basic.py), accessed 2026-10-11
- [GM prefab listing](https://api.github.com/repos/google-deepmind/concordia/contents/concordia/prefabs/game_master), accessed 2026-10-11
- [Concordia Island README](https://raw.githubusercontent.com/google-deepmind/concordia/main/examples/concordia_island/README.md), accessed 2026-10-11
- [Language model wrappers README](https://raw.githubusercontent.com/google-deepmind/concordia/main/concordia/language_model/README.md), accessed 2026-10-11
- [contrib language models listing](https://api.github.com/repos/google-deepmind/concordia/contents/concordia/contrib/language_models), accessed 2026-10-11
- [Open issues](https://api.github.com/repos/google-deepmind/concordia/issues?state=open&per_page=15), accessed 2026-10-11
- [Contributors](https://api.github.com/repos/google-deepmind/concordia/contributors?per_page=10), accessed 2026-10-11
