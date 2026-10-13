# Experiments

Every claim about how well Real World works comes from an experiment registered here before it ran. Papers and public copy cite only committed results from this folder. Rules for sessions working here: [`CLAUDE.md`](CLAUDE.md).

## Lifecycle

1. **Pre-register.** Copy [`_TEMPLATE/PREREG.md`](_TEMPLATE/PREREG.md) to `experiments/<id>/PREREG.md`, where `<id>` is the next unused `ENNN`. Fill every section. Use `/new-experiment`.
2. **Hash and register.** Compute the hash and add a row to [`REGISTRY.md`](REGISTRY.md) in the same commit:

   ```sh
   shasum -a 256 experiments/<id>/PREREG.md
   ```

   Merge that commit before any run. From then on the `PREREG.md` is frozen; a change is a new experiment or a hashed amendment file.
3. **Run.** Every experiment runs with one command:

   ```sh
   make experiment ID=<id>
   ```

   The run records the commit, model ids, data snapshot, spend and the hash of the `PREREG.md` it followed, and refuses to start if that hash does not match `REGISTRY.md`.
4. **Commit results** under `experiments/<id>/results/`: the command, its raw outputs, the computed metrics, and a short `RESULTS.md` that reports every pre-registered metric in the pre-registered analysis, with n and intervals. Update the row's status in `REGISTRY.md`.
5. **Cite.** Papers and `gtm/` cite only committed results, by path and commit.
6. **Publish misses.** A null result, a miss or a triggered kill criterion is committed and reported like a win, the same week it is known.

## How to run

```sh
make experiment ID=E003                                   # python -m rw.experiments run E003
uv run python -m rw.experiments list                      # each experiment, its hash check, and whether it can run
uv run python -m rw.experiments run E001 --fixtures       # the E001 pipeline on the fixture questions
```

`run` refuses to start when the `PREREG.md` hash does not match `REGISTRY.md`, and exits non-zero naming the missing input and its `PREREG.md` section when the pre-registered data does not exist yet. A run writes `experiments/<id>/results/<UTC date>-<provider>/` with `results.json` (metrics, n, seeds, engine version, model, provider, commit, `PREREG.md` hash, cost), `RESULTS.md` (every pre-registered metric, including misses and metrics it could not compute) and `rows.csv` (the raw per-item rows). Provider `fake` means the deterministic fake model: those results test the pipeline, not the science. Provider `none` means the experiment made no model calls. Commit a results folder only from a run on a clean, merged commit.

## Verifying a registration

Anyone can check that a plan was not changed after registration:

```sh
shasum -a 256 experiments/E*/PREREG.md
```

Each hash must match its row in `REGISTRY.md`, and `git log` must show the row committed before the first file in `results/`.

## Registered experiments

See [`REGISTRY.md`](REGISTRY.md). E003 has one committed run, [`E003/results/2026-10-12-none/`](E003/results/2026-10-12-none/RESULTS.md); the others have not run. `uv run python -m rw.experiments list` shows which can run now.
