# Research

## What it does

One read-only endpoint, `GET /v1/research`, serves what a skeptic needs to check our claims: every pre-registered experiment with its registered hash, the hash of the file as it stands now and whether the two match, its hypothesis, primary metric and kill criterion, and every committed run with its command, commit, model, primary result with n and interval, and outcome. It also lists the eight papers with their claim, stage, target venue, pending results and links to the source and status files. Nothing is computed or stored by the API: each value is read from `experiments/REGISTRY.md`, each `PREREG.md`, each `results.json` and `papers/INDEX.md` in the repository at the commit it reports. An experiment with no run has an empty `results` list; a paper has no result number the index does not name.

## Who it is for

Reviewers, forecasting builders and funders who ask "what did you register before you ran it?" and want the hash, the run and the miss in one place, without cloning the repository.

## How we know it works

- Contract: the `Research` schema in `api/openapi.json`.
- `api/tests/test_research.py`: six experiments, every registered hash equals the file's hash; a changed pre-registration reports `hash_matches: false`; E003 and E006 carry their one committed run with `n`, interval and a `supported` outcome and the other four carry none; eight papers each with a `paper.tex` and `STATUS.md` folder.

## What it is not

- No web page yet; this is the contract it will read.
- No SDK method until a surface needs one.
- No result for a forecast: the only runs are the synthetic checks E003 and E006, labelled `model: none`.
- No write path, and no number that is not in a committed file.

## Where the code lives

- `api/rw_api/routes_research.py`; readers in `engine/rw/experiments.py` and `engine/rw/papers.py`.
- Rests on [experiments/README](../experiments/README.md) and [papers/INDEX](../papers/INDEX.md); decisions [0006](../research/decisions/0006-engine-visible-surfaces.md) (the surface) and [0002](../research/decisions/0002-benchmark-and-receipts.md) (the public-record rule).
