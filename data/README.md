# data

Small, reviewable data files the engine reads: the licence table, the fixed vocabularies, and (in later slices) bundled sample marginals and fixtures. Specified by [product/world.md](../product/world.md); layout from [decision 0001](../research/decisions/0001-architecture.md).

## Files

| File | What it holds |
| --- | --- |
| `sources.csv` | One row per data source: licence, whether commercial use and redistribution are allowed (`yes`, `no`, `unknown`, or `n/a` for fixtures we wrote), the citation to show, and when it was checked. `rw.sources.require()` refuses every row whose `commercial_use` is not `yes`, unless its `kind` is `fixture`. |
| `topics.csv` | The eight belief topics every agent holds, with the yes/no question each one measures. Adding a topic is a data change. |
| `countries.csv` | The 16 countries in the base sample: centroid, population in millions, region, and the five coverage rubric parts from [research/data/099](../research/data/099-country-coverage-tiers.md) (population 0-25, attitudes 0-25, markets 0-15, news 0-20, ground truth 0-15). The tier is computed from their sum (A 75+, B 50-74, C 25-49, D below 25), never typed in. |
| `questions/` | Real question lists, one file per horizon, each `proposed` until the founder approves and freezes it. See [questions/README.md](questions/README.md). |

## The values are illustrative

The rubric parts in `countries.csv` are illustrative judgments following research/data/099, not measured scores. Populations and centroids are rounded. Fixture rows (`kind = fixture`) are data we wrote to exercise the pipeline; they are not real observations.

## Licence rules

- A source marked `unknown` or `no` stays blocked until someone reads its terms and records the answer here, with the date. See [research/data/060](../research/data/060-data-licensing-legal.md).
- No GADM: it is non-commercial only ([research/data/058](../research/data/058-geodata.md)). No IPUMS International microdata: commercial use and redistribution are prohibited.
