---
description: Pre-register an experiment in experiments/ and hash it into REGISTRY.md
argument-hint: <hypothesis to test>
---

Pre-register one experiment for: $ARGUMENTS

1. Read `experiments/README.md`, `experiments/CLAUDE.md` and `experiments/_TEMPLATE/PREREG.md`. Read `experiments/REGISTRY.md` and check no registered experiment already tests this.
2. Find the research notes and lenses that motivate it, and the claim in `gtm/messaging.md` or the decision it would earn or kill. If no note exists, run `/new-research` first.
3. Take the next unused id from `REGISTRY.md` (`ENNN`). Copy the template to `experiments/ENNN/PREREG.md`.
4. Fill every section before any data is looked at:
   - one falsifiable hypothesis with a direction;
   - one primary metric, and the baseline a skeptic would choose;
   - data that is post-cutoff for every model, with each source's licence status;
   - sample size and stopping rule with the reason, saying which numbers are our choice;
   - the exact analysis, including region and tier splits;
   - a kill criterion that says what we stop claiming or building;
   - a cost cap that fails closed;
   - the command `make experiment ID=ENNN`.
5. Do not run anything. Hash the file and add the row to `REGISTRY.md` in the same commit:
   `shasum -a 256 experiments/ENNN/PREREG.md`
6. Check that every number in the plan is either our stated design choice or linked to a note. Run `python3 scripts/check_links.py`.
7. Finish with `/ship-pr`. Title: `docs(experiments): register ENNN <short title>`. Once merged, the `PREREG.md` is frozen.
