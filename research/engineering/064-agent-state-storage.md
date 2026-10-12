# Agent state and memory at 100k scale

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. The sizing is my own arithmetic and the tool docs are read from primary pages, but no one has published a 100k-agent daily-snapshot design to copy, and web search hit its budget midway through this slice, so I could not check competitor architectures.

## Answer

Do not build a memory system for 100k agents. Store each agent as one small row (fixed persona plus a numeric belief vector) in Parquet files, one snapshot per day, in object storage, and query them with DuckDB. A fork is a pointer to a base day plus a small file of changed rows, not a copy. Keep rich free-text memory only for the few thousand agents a user actually clicks or that opt-in twins cover.

## Findings

Size is small if we choose it to be. My arithmetic, not a source: 100k agents with a 64-dimension float32 belief vector is 25.6 MB raw per day. With zstd Parquet it is likely 10 to 20 MB. A year of daily snapshots is under 10 GB. That is a file-per-day problem, not a database problem. The real cost driver is free-text memory: if each agent stored five 300-byte memories a day, that is 150 MB a day, and each memory needs an LLM call to write and rate.

The memory model everyone copies is the one in the Generative Agents paper. It keeps a natural-language memory stream, scores retrieval as recency plus importance plus relevance (each min-max scaled to 0-1, all weights 1), uses a recency decay of 0.995 per game hour, has the LLM rate importance 1-10, and triggers reflection when summed importance passes 150, about two or three times a day. It ran 25 agents on gpt3.5-turbo. The paper gives no cost figure and the repo warns that many agents are costly. That design needs an embedding and an LLM call per memory. It does not fit 100k agents nightly. ([paper](https://arxiv.org/html/2304.03442v2), [repo](https://github.com/joonspk-research/generative_agents), 22.2k stars, Apache-2.0)

Interview-grounded agents work, but only for a small set. Agents built from 1,052 people's two-hour interviews matched participants' own two-week retest consistency at 83% on held-out General Social Survey items. Survey-only agents got 82%, combined 86%, and demographics-only 74%. So rich text memory buys about 9 points over demographics for people we actually interviewed. That supports using it only for opt-in twins. ([paper](https://arxiv.org/abs/2411.10109))

The closest open large-scale simulator, OASIS, claims up to one million agents and is Apache-2.0 with about 5.3k stars. Its quick start writes to a `.db` file, which is consistent with SQLite, but the README never names the engine. Its token reference only covers a 100-agent single step, and its 1,000 and 10,000-agent costs are extrapolations. Treat the million-agent claim as unproven for LLM-driven agents. ([repo](https://github.com/camel-ai/oasis), [abstract](https://arxiv.org/abs/2411.11581))

Storage options, from the docs:

- DuckDB reads Parquet with column and filter pushdown, zonemaps, hive-partitioned paths, and writes zstd or snappy (snappy default). The overview page gives no file-size guidance. ([docs](https://duckdb.org/docs/current/data/parquet/overview.html))
- DuckLake is an open table format that keeps metadata in a SQL database and data in Parquet. Each commit writes one snapshot row, snapshots are cheap, and it supports time travel and incremental scans between snapshots. Stable version is 1.0. The GitHub repo is MIT, 3.3k stars. The docs I read do not mention branching or forking, so I cannot say it supports forks. ([manifesto](https://ducklake.select/manifesto/), [docs](https://ducklake.select/docs/stable/), [repo](https://github.com/duckdb/ducklake))
- Neon gives real copy-on-write Postgres branches, with a history window of 6 hours on Free, 1 day paid default, up to 7 days on Launch and 30 days on Scale. Paid plans: $0.35/GB-month storage, $0.106 per CU-hour (Launch), 10 branches included then $1.50 per extra branch-month, max 5,000 branches per project. Fine for the live app's metadata, wrong for daily history we must keep forever. ([branching](https://neon.com/docs/introduction/branching), [pricing](https://neon.com/pricing))
- Cloudflare R2 holds files at $0.015/GB-month, free egress through the Workers/S3 APIs, $4.50 per million writes and $0.36 per million reads. Ten years of our snapshots would cost cents. ([pricing](https://developers.cloudflare.com/r2/pricing/))

## What it means for Real World

- For the product: "ask any agent why" needs a trace, not a full life memory. Show the agent's persona, its belief vector at day D, and the events that moved it. That is enough and is honest. Opt-in twins are the only place free-text memory is a feature.
- For the engineering: three tables cover everything. `agents` (fixed persona, never changes, one Parquet file). `beliefs` (agent_id, day, vector, partitioned by day). `exposures` (agent_id, day, event_id, delta) for the trace. A PM can read these three tables and understand the system. Public hashed forecasts stay append-only and separate.
- For the business: the cost and the track record both argue for the same thing. Immutable daily Parquet files can be hashed and published, which fits the "cannot be backfilled" moat. Database rows that get updated in place cannot.

## Recommendations

1. Write one Parquet file per day to R2 at `beliefs/day=YYYY-MM-DD/part-0.parquet`, zstd, and publish the SHA-256 of each file with that day's forecast hash. Owner: engineering. Done when a third party can verify a past day from the file alone.
2. Query with DuckDB directly over the files for the launch. Do not adopt DuckLake or Postgres-as-catalog until a second writer exists. Revisit if we need concurrent daily and fork writers.
3. Implement forks as `(base_day, event, overrides.parquet)`. Read a fork's agent state as base-day rows with the override rows applied (a left join in DuckDB). Ensemble members write only changed agents per simulated day. Test: a 7-day, 20-member fork of a global event stays under 1 GB.
4. Keep persona rows static and tiny (country, age band, sex, education, urbanicity, survey-derived trait scores, source record id). Store the source microdata id so any agent can be audited back to a census row.
5. Skip embeddings and reflection for the 100k. Use a 64-dimension belief vector plus a per-agent exposure log. Spend LLM calls on deciding belief deltas by segment, then fan out to agents numerically. Benchmark this against full per-agent calls on a 1,000-agent sample before committing.
6. Store free-text memory only for opt-in twins and clicked agents, in a separate table with a consent flag and a delete path.
7. Use Postgres (Neon or similar) only for users, forks metadata and API keys, not for agent state.

## Open questions

- How many belief dimensions do we need? Find out by checking which survey items (WVS, Gallup, Pew) we actually score forecasts on, and size the vector to those.
- Does DuckLake 1.0 support cheap branching? I could not confirm it. Read its snapshot and maintenance pages, or test a branch-like workflow.
- What do competitors (Aaru, Simile) store per agent? Not found; my web searches were cut off. Re-run this when the search budget resets.
- Real compressed size of the beliefs table. Measure with a synthetic 100k-row file this week.
- OASIS's actual storage engine and per-step cost. Read its source before borrowing any of its design.

## Sources

- [Generative Agents: Interactive Simulacra of Human Behavior (full text)](https://arxiv.org/html/2304.03442v2), accessed 2026-10-11
- [Generative Agents abstract](https://arxiv.org/abs/2304.03442), accessed 2026-10-11
- [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [OASIS paper abstract](https://arxiv.org/abs/2411.11581), accessed 2026-10-11
- [camel-ai/oasis](https://github.com/camel-ai/oasis), accessed 2026-10-11
- [DuckDB Parquet overview](https://duckdb.org/docs/current/data/parquet/overview.html), accessed 2026-10-11
- [DuckLake manifesto](https://ducklake.select/manifesto/), accessed 2026-10-11
- [DuckLake docs](https://ducklake.select/docs/stable/), accessed 2026-10-11
- [duckdb/ducklake](https://github.com/duckdb/ducklake), accessed 2026-10-11
- [Neon branching](https://neon.com/docs/introduction/branching), accessed 2026-10-11
- [Neon pricing](https://neon.com/pricing), accessed 2026-10-11
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), accessed 2026-10-11
