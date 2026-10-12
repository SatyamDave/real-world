# data/

Data the engine reads, small enough to review in a diff: `sources.csv` (licence table), `topics.csv`, `countries.csv`, and in later slices `sample/`, `fixtures/` and `protocol.json`.

## Specs and research

- Product: [product/world.md](../product/world.md)
- Decision: [0001-architecture](../research/decisions/0001-architecture.md) (fixed vocabularies, fixture days 2026-10-01 to 2026-10-05, `fx-` question ids)
- Licences: [research/data/060](../research/data/060-data-licensing-legal.md); geodata: [research/data/058](../research/data/058-geodata.md); coverage rubric: [research/data/099](../research/data/099-country-coverage-tiers.md)

## Boundaries

- `rw.sources.require()` reads `sources.csv` and refuses any source whose `commercial_use` is not `yes`, unless its `kind` is `fixture`. Every loader calls it first.
- Topics, countries, traits and segment keys are fixed by 0001 so parallel slices agree. Changing them is its own PR.
- Tiers are computed from the rubric parts in `countries.csv`; no tier column.
- Fixtures are illustrative and say so (titles prefixed `FIXTURE:`, READMEs state it). No real personal data.
- No GADM, no IPUMS International microdata, no copied article text.

## Test

```
uv run pytest engine/tests/test_sources.py -q
make check
```

## A reviewer rejects

- A source row moved to `yes` without the licence page read and `checked_on` updated.
- A real-data file committed whose source row is not cleared.
- Values presented as real that are illustrative.
- A new topic or country code that is not in the vocabularies.
