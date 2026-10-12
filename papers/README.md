# Papers

Our public research papers. Credibility is the product, so the bar is a top venue's reviewers, not a blog.

## Layout

One folder per paper: `papers/<slug>/paper.tex`, `papers/<slug>/refs.bib`, and `papers/<slug>/STATUS.md`. CI builds every paper to PDF on each PR that touches `papers/` and attaches the PDFs to the run.

`STATUS.md` says, in a few lines: the paper's one-sentence claim, its stage (outline, draft, internal review, preprint, submitted), the target venue, and which results are still pending and what produces them.

## Rules every paper follows

1. **No number without an artifact.** Every reported result comes from something in this repo that anyone can rerun: a benchmark run, a hashed forecast log, a script and its output. Cite the path and commit. A result that does not exist yet is written as a pre-registered protocol and marked pending, never estimated.
2. **Every citation is real and checked.** Each `refs.bib` entry was opened by whoever added it. No citation is invented or cited from memory.
3. **Misses are reported.** Forecast and benchmark results include every pre-registered question, hits and misses alike.
4. **Claims match evidence.** "World changing" is earned by results, not adjectives. Limitations get their own section.
5. **Pre-register before you measure.** The hypothesis, metrics and question set are committed (and hashed, for forecasts) before the run that tests them.

## How papers stay current

When a PR merges to `main`, the `papers` workflow reads the change, decides which papers it affects, and opens a follow-up PR updating them: new methods, new results from committed artifacts, corrected claims. A human reviews that PR like any other. A PR that only touches `papers/` does not trigger it.
