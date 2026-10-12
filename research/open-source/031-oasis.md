# camel-ai/OASIS: social-media agent simulator

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo, PyPI and paper pages were opened and agree. Appendices of the paper (hardware, limitations) and the docs site internals were not readable, and I did not run the code.

## Answer

OASIS is a real, Apache-2.0, actively touched Python simulator of Twitter-like and Reddit-like platforms. Its "one million agents" claim is true only in a narrow sense: 1M accounts exist, but about 1% of them act per step. Real World should not adopt it as the engine. Borrow three ideas (probabilistic activation from an hourly activity vector, a trace table of every action, an interview action for "ask why") and build neighbor talk ourselves in a few hundred lines.

## Findings

**Maturity and license.**
- License is Apache-2.0, repo at [github.com/camel-ai/oasis](https://github.com/camel-ai/oasis): about 5.3k stars, 647 forks, 971 commits. No formal GitHub releases page entry.
- PyPI package `camel-oasis` is at 0.2.5, dated 2025-12-04, first release 0.0.1 on 2025-04-18. It requires Python 3.10 to below 3.12 ([PyPI](https://pypi.org/project/camel-oasis/)). Stable-but-stalled: the PyPI release is 10 months old while the repo bumped its camel-ai pin to 0.2.90 on 2026-08-19.
- Last commits (Sep 30 to Oct 5, 2026) are docs, a QR code and a requirements fix. 42 open issues, newest dated 2026-10-06 ([issues](https://github.com/camel-ai/oasis/issues)). It is maintained, but not fast-moving.
- Known open problems: slow recommender (#111), a scale stress test never finished (#150, June 2025), checkpoints not implemented (#108), only SQLite-style storage with a request for other SQL databases (#214), and a recsys key error (#198).

**Architecture.** Per the [paper](https://arxiv.org/html/2411.11581v5) (arXiv 2411.11581, v1 Nov 2024, v5 Mar 2025, 23 authors) there are five parts: Environment Server (relational DB: users, posts, comments, relations, traces, recommendations), RecSys, Agent Module (built on CAMEL), Time Engine, Scalable Inferencer. The X recommender ranks in-network posts by likes and out-of-network by TwHIN-BERT interest match. The Reddit one is a hot-score formula.

**How agents act.** From [`env.py`](https://raw.githubusercontent.com/camel-ai/oasis/main/oasis/environment/env.py): the caller passes a dict of agent to action each step. `LLMAction` calls the model; `ManualAction` runs a fixed action with no LLM call. All run through `asyncio.gather`, with a semaphore defaulting to 128 concurrent LLM calls. The recommendation table is rebuilt at the start of every step. From [`agent_action.py`](https://raw.githubusercontent.com/camel-ai/oasis/main/oasis/social_agent/agent_action.py): 30 async actions, 29 exposed as LLM tool calls (post, comment, repost, quote, like, dislike, follow, mute, search, trend, groups, interview, purchase, report and others). The README says 23; the code has more.

**Scale claim, read carefully.**
- Time Engine uses a 24-dimension hourly activity vector; one step is 3 simulated minutes.
- The million-agent misinformation run used activation probability 0.1 for 196 core users and 0.01 for 1M regular users, 60 steps, on 24 A100 GPUs for about a week, with Llama-3-8B-Instruct. That is roughly 10,000 LLM activations per step (my estimate, not stated in the paper).
- Efficiency table, 4 A100s: 100 agents 0.33 min per step, 1k agents 0.83 min, 10k agents 15 min. Time per step grows faster than agent count.
- The 1M run produced 733,824 posts, compared against 4 real misinformation topics.

**Fidelity results are weak for our purpose.**
- Information spread: normalized RMSE about 30% against 198 real Twitter cascades; simulated depth is shallower than real. The authors blame a simplified recommender and thin profiles.
- Agents herd more than humans on down-voted comments.
- Polarization drifts conservative over 80 steps, more so with an uncensored model. That is a model-alignment artifact, not a measurement of people.
- Setting all activity probabilities to 1.0 made the fit worse. This is the only place the paper supports sparse activation as more accurate, not just cheaper.

**Cost.** The README's own table: 100 agents, one step, activation 1.0 used 335,600 input and 16,750 output tokens (Qwen-turbo). That is about 3,400 input and 170 output tokens per agent action, because each agent reads its feed. Its cost table is in yuan at December 2024 Qwen prices, so it is stale.

**Platform lock-in.** The world is a social feed: posts, follows, feeds. There is no household, workplace, region, country, census attribute, economy or news input. Agent profiles are bio text; the quickstart uses OpenAI GPT-4o-mini via CAMEL. No multilingual or cross-country support is documented.

## What it means for Real World

- For the product: OASIS models people talking on a platform. Real World models a population reacting to world events. The neighbor-talk idea maps to a "who influences whom" step, not to a feed with likes. The interview action is the same idea as "click any agent to ask why".
- For the engineering: Importing OASIS drags in a SQLite database, a CAMEL dependency tree, Python below 3.12, a channel and platform process, and a recommender we do not want. 100,000 agents at 10 to 15 minutes per 10k-agent step is unusable inside a $15 to $60 nightly budget. Rebuild the activation loop ourselves: sample which agents wake (hourly or daily vector), give each only a short neighbor summary, batch the call. Cheaper than OASIS's feed-reading prompt.
- For the business: Apache-2.0 allows reuse and copying of small pieces with attribution. Any claim that Real World "builds on OASIS" would invite a million-agent comparison we lose on honesty. The paper's own numbers (30% RMSE, over-herding) give us a baseline to beat and cite.

## Recommendations

1. Do not depend on `camel-oasis`. Read `env.py`, `agent_action.py` and the time engine once, copy the patterns, write our own.
2. Implement activation as a per-agent daily probability drawn from a profile-conditioned vector, with a semaphore-style cap on concurrent calls. Log every action to a trace table keyed by agent id and day; this is what powers "ask why".
3. Implement neighbor talk as a graph step: each woken agent gets a 100-to-200-token digest of its neighbors' stances, not a full feed. Cap input tokens per agent in a test and fail the build if exceeded.
4. Keep OASIS's herd and polarization findings as a risk list: test our ensembles for over-herding and for alignment drift (variance collapse) on day one.
5. Run a two-hour spike only if neighbor-talk quality is in doubt: 200 agents in OASIS with Haiku-class model, measure tokens per activation against our own loop. Expect roughly the README's 3,400 input tokens.

## Open questions

- Hardware and limitations in the paper's appendices (D to H) were not readable; fetch the PDF and read Appendix H.
- Does the Reddit platform advance its clock? `env.py` only increments it for Twitter. Check by running the quickstart.
- Is any third party reproducing the million-agent run? None found; search citing papers on Google Scholar.
- Real current pricing for our Haiku-class model, to turn 3,400 tokens per activation into dollars per night. A rough bound: 100k agents all active once is about 340M input tokens; the cost scales linearly with price per million.

## Sources

- [camel-ai/oasis repository](https://github.com/camel-ai/oasis), accessed 2026-10-11
- [OASIS paper, arXiv 2411.11581 v5](https://arxiv.org/html/2411.11581v5), accessed 2026-10-11
- [OASIS abstract page](https://arxiv.org/abs/2411.11581), accessed 2026-10-11
- [camel-oasis on PyPI](https://pypi.org/project/camel-oasis/), accessed 2026-10-11
- [OASIS README (raw)](https://raw.githubusercontent.com/camel-ai/oasis/main/README.md), accessed 2026-10-11
- [env.py](https://raw.githubusercontent.com/camel-ai/oasis/main/oasis/environment/env.py), accessed 2026-10-11
- [agent_action.py](https://raw.githubusercontent.com/camel-ai/oasis/main/oasis/social_agent/agent_action.py), accessed 2026-10-11
- [OASIS open issues](https://github.com/camel-ai/oasis/issues), accessed 2026-10-11
- [OASIS commit history](https://github.com/camel-ai/oasis/commits/main), accessed 2026-10-11
