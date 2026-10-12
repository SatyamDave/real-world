# data/sample

Bundled inputs for `rw.population.sample_population`. Source id: `fixture_sample` in [../sources.csv](../sources.csv).

These values are illustrative. We wrote them to be shaped like a GLOPOP-S demographic table ([research/data/057](../../research/data/057-global-synthetic-population.md)) and published survey aggregates. They are not real data: no census, survey or poll produced them, and no number here should be cited as a fact about any country. Real populations replace them once the `glopop_s` licence row is cleared.

| File | Columns | What it holds |
| --- | --- | --- |
| `demographics.csv` | iso3, age_band, sex, education, urban, share | Joint share of adults in each trait cell, per country. Shares sum to 1 per country. Built as a product of illustrative age, sex, education and urban marginals, so the traits are independent within a country. |
| `attitudes.csv` | iso3, topic, mean_share, survey_sd_logit | For each of the 16 countries and 8 topics: the share answering yes, and the spread of individual answers in logit units that a survey would show. |
| `segment_effects.csv` | trait, value, topic, delta_logit | Small logit shifts by age band and education added to an agent's starting belief. A trait value with no row has no effect. |

Traits, topics and countries use the vocabularies in [decision 0001](../../research/decisions/0001-architecture.md), `../topics.csv` and `../countries.csv`.
