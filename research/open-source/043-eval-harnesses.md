# Evaluation harnesses for the Real World benchmark

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Repo and docs pages were opened and read. Web search quota ran out mid-task, so the promptfoo-OpenAI deal terms and the Inspect custom-metric signature were not verified.

## Answer

Use UK AISI Inspect for the one part of our benchmark that is a real eval: "does a simulated population answer survey items like the real one". Do not use a harness for the headline track record. Hash, resolve and Brier-score forecasts in about 100 lines of our own Python, because the public ledger is the product and must not depend on a third party's log format. Skip lm-eval-harness, promptfoo and OpenAI evals.

## Findings

**Inspect** ([repo](https://github.com/UKGovernmentBEIS/inspect_ai), [docs](https://inspect.aisi.org.uk/)).
- MIT license, about 3.0k stars, 800 forks. Created by the UK AI Security Institute; the docs also credit Meridian Labs.
- PyPI shows 0.3.278 released 2026-10-09, Python 3.10+ ([PyPI](https://pypi.org/project/inspect-ai/)). That is about 130 releases in a year, two to three a week. Still 0.3.x, so pin the version.
- Model: Task = Dataset + Solver + Scorer. A solver can be one model call or a full agent. Over 20 providers including Anthropic, plus vLLM and HuggingFace for local models.
- Logs are `.eval` (binary, default since v0.3.46, roughly 1/8 the size of JSON) or `.json`. Logs can live in S3 via `INSPECT_LOG_DIR=s3://...`. A Python log API reads headers and samples without loading everything. `inspect view` gives a web log viewer ([logs docs](https://inspect.aisi.org.uk/eval-logs.html)).
- `inspect log export-config` plus `inspect eval --run-config` reproduces a run. The docs do not say the git revision is recorded. We would have to add it ourselves.
- Built-in scorers are mostly accuracy/match style, plus model-graded QA, f1, exact. Metrics default to accuracy and stderr. Custom scorers and metrics are supported; the docs point to separate pages I did not read ([scorers](https://inspect.aisi.org.uk/scorers.html)).
- 200+ prebuilt evals live in [inspect_evals](https://github.com/UKGovernmentBEIS/inspect_evals) (MIT, about 700 stars). It now only accepts PRs from pre-approved contributors. Irrelevant to us except as a style reference.

**lm-evaluation-harness** ([repo](https://github.com/EleutherAI/lm-evaluation-harness)).
- MIT, about 14.2k stars. Latest on PyPI is 0.4.13, 2026-08-31 ([PyPI](https://pypi.org/project/lm-eval/)).
- Built for comparing model capability on academic benchmarks. 60+ standard benchmarks, YAML task configs with Jinja2 prompts, `--log_samples`, `--use_cache`, Hugging Face Hub push.
- Chat APIs such as Anthropic are `generate_until` only, with no logprobs. Most of its value (log-likelihood multiple choice) does not apply to API agents.
- Its unit is "one model, one task, one score". We are scoring a population and a forecast pipeline, not a base model.

**promptfoo** ([repo](https://github.com/promptfoo/promptfoo), [docs](https://www.promptfoo.dev/docs/configuration/expected-outputs/)).
- MIT, about 25.9k stars. The README says "Promptfoo is now part of OpenAI" and that it stays MIT. I could not open the announcement (the blog URL I guessed returned 404), so deal terms are unverified.
- Declarative YAML test cases, many assertion types (equals, regex, llm-rubric, python, cost, latency). A custom Python assertion returns a bool, a float or a JSON `{pass, score, reason}`.
- It is a prompt and app regression tool with red teaming. Good for "did my prompt change break the sim API". Poor for a public, neutral benchmark, and owned by a lab that is also a model vendor and, indirectly, a competitor in simulation.

**OpenAI evals** ([repo](https://github.com/openai/evals)).
- About 19.6k stars, MIT contributions, 691 commits. The README says it is "not accepting evals with custom code" and that evals can now be run "in the OpenAI Dashboard". Treat it as legacy. No reason to start on it.

**What a forecast benchmark needs, and who has it.** Pre-registered hashed predictions, resolution against outcomes, Brier score against market price, public ledger. None of the four harnesses do this. [ForecastBench](https://github.com/forecastingresearch/forecastbench) is the closest prior art: MIT, "dynamic, contamination-free", leaderboard updated nightly. Its README does not explain scoring or contamination handling, so read its code before copying anything.

## What it means for Real World

- For the product: the receipts page is the benchmark. Show hash, timestamp, forecast, resolution, Brier, market Brier. A harness log viewer is an internal tool, not the public surface.
- For the engineering: two separate things.
  1. Ledger (own code). A `forecasts` table with `sha256(canonical_json)` committed before the question resolves, then a resolver job. Brier is `(p - o)^2`. This is trivial, auditable, and has no dependency.
  2. Fidelity evals (Inspect). Each task is a survey item (WVS, Pew, Gallup) by country or segment. Solver is the agent population answering. Scorer or custom metric compares the simulated answer distribution with the real one, which also surfaces variance collapse and Western flattening per region. Inspect fits because its logs are structured, resumable, S3-backed and parallel.
- For the business: a hashed, un-backfillable record is the moat story for YC. Third-party harness branding adds nothing. A published Inspect task suite that others can run against their own simulators is cheap credibility and a possible community hook, since the AISI ecosystem is where safety and eval people already work.

## Recommendations

1. Write the forecast ledger in plain Python and SQLite or D1-style SQL, not in any harness. One owner, one table, one resolver script. Done by Oct 20.
2. Build one Inspect task, `survey_fidelity`, for 20 WVS items across 10 countries as the first reproducible public benchmark. Pin `inspect-ai` to an exact version in `pyproject.toml`.
3. Write the distribution-distance scorer as a custom Inspect metric that reduces all sample scores. Check the Scoring Metrics docs page first, since I did not verify the signature. If it does not fit, compute the distance in a post-run script from the log API.
4. Store Inspect logs in S3/R2-compatible storage and add the git SHA and prompt hash to task metadata, since Inspect does not clearly record the SHA.
5. Use promptfoo only if we want a CI regression check on the `/v1/simulate` prompts. Optional, internal, and not part of the public benchmark.
6. Do not adopt lm-eval-harness or OpenAI evals.
7. Read ForecastBench's question-set and scoring code before finalizing our Brier-vs-market definition, so our numbers are comparable with theirs.

## Open questions

- Does an Inspect `@metric` get all sample scores at once, so it can compute a distribution distance? Read the Scoring Metrics page and write a 20-line test.
- Is the Inspect `.eval` format stable across 0.3.x, given weekly releases? Check the changelog, and keep exported JSON as the archival copy.
- What are the terms of the promptfoo-OpenAI deal, and does it change the license trajectory? Read the company announcement linked from the README.
- How does ForecastBench score against market prices, and how does it prevent contamination? Read its code and datasets repo.
- Cost of Inspect runs at 100k agents. Likely bounded by model calls, not the harness, but untested.

## Sources

- [Inspect GitHub](https://github.com/UKGovernmentBEIS/inspect_ai), accessed 2026-10-11
- [Inspect docs home](https://inspect.aisi.org.uk/), accessed 2026-10-11
- [Inspect eval logs](https://inspect.aisi.org.uk/eval-logs.html), accessed 2026-10-11
- [Inspect scorers](https://inspect.aisi.org.uk/scorers.html), accessed 2026-10-11
- [inspect-ai on PyPI](https://pypi.org/project/inspect-ai/), accessed 2026-10-11
- [inspect_evals GitHub](https://github.com/UKGovernmentBEIS/inspect_evals), accessed 2026-10-11
- [lm-evaluation-harness GitHub](https://github.com/EleutherAI/lm-evaluation-harness), accessed 2026-10-11
- [lm-eval on PyPI](https://pypi.org/project/lm-eval/), accessed 2026-10-11
- [promptfoo GitHub](https://github.com/promptfoo/promptfoo), accessed 2026-10-11
- [promptfoo intro docs](https://www.promptfoo.dev/docs/intro/), accessed 2026-10-11
- [promptfoo assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/), accessed 2026-10-11
- [OpenAI evals GitHub](https://github.com/openai/evals), accessed 2026-10-11
- [ForecastBench GitHub](https://github.com/forecastingresearch/forecastbench), accessed 2026-10-11
