# Geographic layers for placing agents

- Date: 2026-10-11
- Area: data
- Confidence: medium. Licenses and H3 numbers were read on the primary pages. The web search budget ran out mid-task, so I could not check GADM v5 status, the IPUMS boundary license, or GHS-POP file sizes.

## Answer

Do not use GADM: it is free only for non-commercial use and cannot be redistributed, which blocks a public API and a company. Use IPUMS's own harmonized boundaries to join agents to their census region, WorldPop (CC BY 4.0) to decide where inside a region an agent lives, H3 to store and aggregate that location, and Natural Earth (public domain) to draw the globe. That stack is five open pieces, one precompute script, and one small table.

## Findings

**GADM is the wrong license for us.** The [GADM license page](https://gadm.org/license.html) says data are free for academic and other non-commercial use. Commercial use and redistribution need prior permission. The [GADM data page](https://gadm.org/data.html) shows version 4.1 with 400,276 administrative areas, and says version 5 was planned for January 2026. I did not confirm whether v5 shipped or changed the license. Austria is the one exception, under CC BY-SA 2.0.

**geoBoundaries is the open substitute.** The [geoBoundaries site](https://www.geoboundaries.org/) states CC BY 4.0, covers over 200 entities including all UN members, and tracks about one million boundaries. The [global downloads page](https://www.geoboundaries.org/globalDownloads.html) offers a composite called CGAZ with ADM0, ADM1 and ADM2. ADM2 is about 150 MB as a shapefile and 250 MB as GeoPackage. It says attribution is required for all uses.

**IPUMS already gives the boundaries that match the microdata.** The [IPUMS International GIS page](https://international.ipums.org/international/gis.shtml) offers one world shapefile for GEOLEV1 and one for GEOLEV2 (most samples), plus per-country, per-year files for levels 1 to 3 and EU NUTS 1 to 3. Microdata carries only these subnational units, so a sampled person is known to live in a region, not at a point. IPUMS warns the shapefiles are generalized and not for precise calculation. The page gives no license for the boundary files. Check the IPUMS terms before we redistribute them.

**WorldPop gives the within-region distribution.** The [WorldPop hub](https://hub.worldpop.org/project/categories?id=3) lists annual global datasets for 2015 to 2030 (release R2025A v1) under CC BY 4.0. The [constrained vs unconstrained note](https://www.worldpop.org/methods/top_down_constrained_vs_unconstrained/) describes the global set as 100 m, age and sex structured. Unconstrained spreads people over every land cell. Constrained puts them only on mapped buildings. WorldPop calls constrained likely more accurate for most settings, and unconstrained safer where small rural settlements are poorly mapped.

**GHSL is the cross-check.** The [GHSL FAQ](https://human-settlement.emergency.copernicus.eu/faq.php) says data are free, need no registration, and are CC BY 4.0 with required credit. GHS-POP disaggregates census counts onto built-up areas. The [GHS-POP page](https://human-settlement.emergency.copernicus.eu/ghs_pop2023.php) confirms R2023A covers 1975 to 2030. The [download page](https://human-settlement.emergency.copernicus.eu/download.php) lists GHS-SMOD (urban/rural degree of urbanisation) v1.2, dated 10 June 2026, split by country. GHS-SMOD is useful: it gives each cell an urban or rural class.

**Natural Earth is for the picture only.** The [terms page](https://www.naturalearthdata.com/about/terms-of-use/) says everything is public domain and credit is unnecessary. It is coarse (1:10m at best), so it suits the globe, not placement. Some third-party layers carry separate terms.

**H3 is the index.** The [H3 repo](https://github.com/uber/h3) is Apache-2.0 with 6.6k stars and bindings for Java, JavaScript and Python. [h3 on PyPI](https://pypi.org/project/h3/) is 4.5.0 (30 May 2026), needs Python 3.10 or later, and ships prebuilt wheels for Linux, macOS ARM and Windows. The [resolution table](https://h3geo.org/docs/core-library/restable/) gives these sizes:

| Res | Avg area | Cells |
|---|---|---|
| 3 | 12,393 km2 | 41,162 |
| 4 | 1,770 km2 | 288,122 |
| 5 | 253 km2 | 2,016,842 |
| 7 | 5.2 km2 | 98,825,162 |
| 8 | 0.74 km2 | 691,776,122 |

**What does not work.** A 100 m placement is false precision for 100,000 agents covering about 8 billion people. Each agent stands for roughly 80,000 people. Raw 100 m global rasters are large and add nothing at that sampling rate. GHS-POP and WorldPop will disagree in places, and neither is ground truth in countries with old censuses.

## What it means for Real World

- For the product: the globe shows hex bins at H3 res 2 to 4. Clicking an agent shows region, urban or rural, and a cell, never a street. This also protects the privacy of opt-in twins.
- For the engineering: one offline script, run once per population release. It sums the WorldPop raster into H3 res 7 cells, keeps cells with people, and writes one Parquet table (cell id, GEOLEV2 unit, population, urban class). Sampling an agent is: pick the IPUMS region from the microdata, then pick a cell inside it weighted by population. Store the res 7 cell as an integer. Coarser cells come from `cell_to_parent`, so aggregation needs no spatial joins at runtime.
- For the business: avoid every layer with a non-commercial or no-redistribution clause. The remaining set needs only attribution lines on a credits page. This must be clean before the YC application on 2 Nov, and before the API serves any geography.

## Recommendations

1. Drop GADM from the plan. Write "no GADM" in the data README so nobody adds it back later for convenience.
2. Use IPUMS GEOLEV1/GEOLEV2 as the join key between a microdata record and a place. Read the IPUMS terms for the boundary files this week and record the answer.
3. Use geoBoundaries ADM1/ADM2 only where IPUMS has no matching level or country. Credit it.
4. Build the one precompute script: WorldPop 100 m, unconstrained first, to H3 res 7 population table. Add constrained and GHS-POP only if a spot check of 10 countries shows a gap that changes results.
5. Join GHS-SMOD to each cell for an urban or rural flag, since many survey questions split on it.
6. Pin `h3==4.5.0` and Natural Earth 1:50m for the globe. Ship a credits page listing WorldPop, GHSL, geoBoundaries, IPUMS and Natural Earth.
7. Keep agent location at res 7 internally and publish only res 4 or coarser in the API.

## Open questions

- Did GADM v5 ship, and did its license change? Check gadm.org directly.
- What are the IPUMS terms for redistributing its boundary files? Read the IPUMS user agreement.
- Which IPUMS samples lack GEOLEV2, and how many countries fall back to GEOLEV1 only? Count them from the IPUMS sample list.
- Does constrained or unconstrained WorldPop give better urban counts for our 10 test countries? Compare both to GHS-POP.
- GHS-POP file sizes and exact resolutions were not on the pages I opened. Check the product technical documentation.

## Sources

- [GADM license](https://gadm.org/license.html), accessed 2026-10-11
- [GADM data](https://gadm.org/data.html), accessed 2026-10-11
- [geoBoundaries](https://www.geoboundaries.org/), accessed 2026-10-11
- [geoBoundaries global downloads](https://www.geoboundaries.org/globalDownloads.html), accessed 2026-10-11
- [IPUMS International GIS boundary files](https://international.ipums.org/international/gis.shtml), accessed 2026-10-11
- [WorldPop population count datasets](https://hub.worldpop.org/project/categories?id=3), accessed 2026-10-11
- [WorldPop constrained vs unconstrained](https://www.worldpop.org/methods/top_down_constrained_vs_unconstrained/), accessed 2026-10-11
- [GHSL downloads](https://human-settlement.emergency.copernicus.eu/download.php), accessed 2026-10-11
- [GHSL FAQ](https://human-settlement.emergency.copernicus.eu/faq.php), accessed 2026-10-11
- [GHS-POP R2023A](https://human-settlement.emergency.copernicus.eu/ghs_pop2023.php), accessed 2026-10-11
- [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/), accessed 2026-10-11
- [H3 repository](https://github.com/uber/h3), accessed 2026-10-11
- [H3 resolution table](https://h3geo.org/docs/core-library/restable/), accessed 2026-10-11
- [h3 on PyPI](https://pypi.org/project/h3/), accessed 2026-10-11
