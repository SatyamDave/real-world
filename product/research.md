# Research

## What it does

One read-only endpoint, `GET /v1/research`, serves what a skeptic needs to check our claims: every pre-registered experiment with its registered hash, the hash of the file as it stands now and whether the two match, its hypothesis, primary metric and kill criterion, and every committed run with its command, commit, model, primary result with n and interval, and outcome. It also lists the eight papers with their claim, stage, target venue, pending results and links to the source and status files. Nothing is computed or stored by the API: each value is read from `experiments/REGISTRY.md`, each `PREREG.md`, each `results.json` and `papers/INDEX.md` in the repository at the commit it reports. An experiment with no run has an empty `results` list; a paper has no result number the index does not name.

`/research` in `web/` renders it: a header line naming the repository commit read, then one card per experiment (id, title, status stamp, registered hash against the file's hash with a "Hash matches" or "Changed since registered" stamp, the pre-registration link, the hypothesis, the primary metric and kill criterion behind a disclosure, and a table of committed runs with command, commit, model, primary result with interval and n, and outcome), then one card per paper (stage, venue, claim, pending results, source and status links, how to build the PDF), then "Get this via API" and the simulation disclaimer. Both SDKs expose `research()`.

States: "Loading the research record"; "Could not load the research record" with a retry; with nothing registered, "No experiment is registered yet. The first one appears here."; an experiment with no run says "No run committed yet."

## Who it is for

Reviewers, forecasting builders and funders who ask "what did you register before you ran it?" and want the hash, the run and the miss in one place, without cloning the repository.

## How we know it works

- Contract: the `Research` schema in `api/openapi.json`.
- `web/src/pages/research.test.tsx`: every experiment and paper is listed, a changed hash is stamped, and the empty, loading and error states.
- `api/tests/test_research.py`: six experiments, every registered hash equals the file's hash; a changed pre-registration reports `hash_matches: false`; E003 and E006 carry their one committed run with `n`, interval and a `supported` outcome and the other four carry none; eight papers each with a `paper.tex` and `STATUS.md` folder.

## What it is not

- No result for a forecast: the only runs are the synthetic checks E003 and E006, labelled `model: none`.
- No write path, and no number that is not in a committed file.

## Where the code lives

- `api/rw_api/routes_research.py`, `web/src/pages/research.tsx`; readers in `engine/rw/experiments.py` and `engine/rw/papers.py`.
- Rests on [experiments/README](../experiments/README.md) and [papers/INDEX](../papers/INDEX.md); decisions [0006](../research/decisions/0006-engine-visible-surfaces.md) (the surface) and [0002](../research/decisions/0002-benchmark-and-receipts.md) (the public-record rule).
