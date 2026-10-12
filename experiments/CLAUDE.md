# experiments/

`experiments/README.md` describes the lifecycle. This file holds the rules a session must not break.

## Hard rules

- No run before registration. A run is valid only if its `PREREG.md` hash is in `REGISTRY.md` in a commit older than the first result.
- A `PREREG.md` is registered when the PR that adds its `REGISTRY.md` row merges. Before that, recompute the hash after every edit. After that, never edit it; to change the plan, register a new experiment that names the old one, or add an "Amendment" file with its own hash and say in the results which plan was followed.
- Results go under `experiments/<id>/results/` with the exact command, the commit it ran on, the model ids, the data snapshot and the raw outputs needed to recompute every metric.
- Report every pre-registered metric, in the pre-registered analysis, with n and the interval. Exploratory analyses go in a separate, labelled section.
- A miss or a kill is published, in `results/` and in `REGISTRY.md`, the same week it is known.
- Data that a licence restricts to non-commercial or internal use stays out of the repo. Commit a pointer and the licence, not the rows.
- Spend is capped in the run command and the run stops when the cap cannot be checked.

## A great pre-registration

- One falsifiable hypothesis, one primary metric, and a baseline a skeptic would choose.
- Sample size and stopping rule are fixed in advance, with the reason.
- The kill criterion says what we stop believing, building or claiming if it triggers.
- It links the research notes that motivate it and the claim in `gtm/messaging.md` it would earn or kill.
- Its data is post-cutoff for every model involved, or the experiment says why contamination cannot help.

## What gets rejected

- Results with no registered hash, or a hash registered after the run started.
- Backtests on pre-cutoff data reported as forecast skill.
- Changing the metric, baseline, sample or exclusion rule after seeing data, without a registered amendment.
- Pooled numbers with no per-region or per-tier split when the pre-registration asked for one.
