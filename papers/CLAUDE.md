# papers/

`papers/README.md` holds the rules every paper follows. Read it first. This file adds what a session must do here.

## Scope since decision 0012

Papers describe the engine and its public record, which carry both product jobs of [decision 0012](../research/decisions/0012-will-it-land-and-call-it.md). Post tests become paper material only through a pre-registered experiment on marked tests; a paper never cites a single person's record.

## A great contribution

- A result enters a paper only by citing a committed file under `experiments/<id>/results/` or a hashed forecast log, with its path and commit.
- Every result traces to a pre-registration hashed in `experiments/REGISTRY.md` before the run. Report every pre-registered metric, not the flattering subset.
- Each result states n, the interval and the baseline it is compared with. Below the sample size the pre-registration names, write "pending" and what produces it.
- Every `refs.bib` entry has a URL or DOI that the adding session opened. Cite research notes for context, never in place of the primary source.
- The limitations section names the failure modes in the research notes that apply to the result.
- `STATUS.md` is updated in the same PR.
- Terms are the ones in [product/glossary.md](../product/glossary.md); define a paper-only term once, in the paper, and do not rename a glossary term.

## What gets rejected

- Any number with no committed artifact behind it, including "preliminary" or "approximate" numbers.
- Backtest or hindcast numbers presented as forecast skill. Label them retrospective, in their own section.
- Results from an experiment that was edited after its hash was registered, unless the paper reports the edit.
- Dropping a missed forecast or a failed experiment from a paper that reports the series.
- Claims in the abstract stronger than the results section supports, or any claim `gtm/messaging.md` forbids.
- Citations found only through a model's memory or a search snippet.

## The papers workflow

The workflow's follow-up PR is reviewed like any other. Check every new number against its cited artifact before approving.
