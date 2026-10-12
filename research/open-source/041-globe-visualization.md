# Web globe for 100,000 agent points

- Date: 2026-10-11
- Area: open-source
- Confidence: medium. Licenses, versions and the deck.gl numbers come from primary pages. No independent benchmark of any library at 100k points on a globe was run or found. Web search budget ran out mid-task, so only repo, docs and npm pages were opened.

## Answer

Use deck.gl with ScatterplotLayer on a globe, or globe.gl if we want the fastest path to a pretty demo. 100,000 points is small for deck.gl: its own guide says about 1 million items hold 60 FPS. The honest catch is that deck.gl's GlobeView is still marked experimental. Cesium is overbuilt for us, and MapLibre's globe is the right pick only if we also want a real flat map with borders and labels.

Recommended: ship globe.gl in week one for the launch globe (MIT, hours to wire), and put the points on deck.gl only if globe.gl's click-to-ask-why or aggregation hits a wall. Do not build both up front.

## Findings

All licenses are permissive. None is a blocker.

| Library | License | Version (npm, 2026-10-11) | Stars | Fit |
|---|---|---|---|---|
| [deck.gl](https://github.com/visgl/deck.gl) | MIT | 9.4.0 | 14.6k | GPU layers, strong with big data, globe view experimental |
| [globe.gl](https://github.com/vasturiano/globe.gl) | MIT | 2.46.2 | 3.2k | Purpose-built globe, thin wrapper over three.js |
| [three-globe](https://github.com/vasturiano/three-globe) | MIT | not checked | 1.6k | The engine inside globe.gl; use directly in a three.js scene |
| [CesiumJS](https://github.com/CesiumGS/cesium) | Apache-2.0 | 1.146.0 | 15.8k | Full 3D geospatial engine, heavy |
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | BSD-3-Clause | 6.14.0 | 11.8k | Map first, globe as a projection mode |

deck.gl:
- The [performance guide](https://deck.gl/docs/developer-guide/performance) says ScatterplotLayer runs about 60 FPS during pan and zoom up to roughly 1 million items. That figure was measured on 2015 MacBook Pros. At 10 million items it drops to 10 to 20 FPS. Layers can crash between 10 and 100 million items because Chrome caps single allocations at 1 GB.
- Its advice for us: pass typed arrays instead of one JS object per item, and use `updateTriggers` so a color change does not rebuild every GPU buffer. Changing the `data` prop rebuilds all buffers.
- [GlobeView](https://deck.gl/docs/api-reference/core/globe-view) is experimental. The docs say it lacks the stability of other views. HeatmapLayer, ContourLayer and TerrainLayer do not work in it. MaskExtension is unsupported. Precision is poor above zoom 12. Tile and MVT layers are experimental.
- ScatterplotLayer supports `radiusUnits`, `radiusMinPixels` and `radiusMaxPixels`, which is what we need to keep dots visible when zoomed out ([docs](https://deck.gl/docs/api-reference/layers/scatterplot-layer)). It is flagged WebGPU-ready.
- Releases are active: 9.4.0 is tagged latest on [GitHub releases](https://github.com/visgl/deck.gl/releases), dated 5 September (year not shown on the page).

globe.gl / three-globe:
- Points are drawn as cylinders standing on the surface (`pointsData`, with lat, lng, altitude, radius, color accessors). Each cylinder is a mesh. `pointsMerge` merges them into one object for speed, but then hover and click callbacks stop working, and animated transitions stop too ([globe.gl docs](https://github.com/vasturiano/globe.gl), [three-globe docs](https://github.com/vasturiano/three-globe)).
- That is a direct conflict with our "click any agent" feature. At 100k points we would have to choose between merged speed and per-point click. The docs give no point-count threshold. Disabling `enablePointerInteraction` is called the most effective speedup, which again is the click feature.
- Workaround, not tested here: keep merged points for the 100k dots and resolve clicks ourselves with a nearest-point lookup on a spatial index (lat/lng grid or kd-tree) from the click ray.
- It also offers hex bins, arcs, rings and heatmaps, which suit "fork the world, drop in an event" ripples.

CesiumJS:
- Apache-2.0 and free for commercial use ([repo](https://github.com/CesiumGS/cesium)). Its [PointPrimitiveCollection docs](https://cesium.com/learn/cesiumjs/ref-doc/PointPrimitiveCollection.html) give tuning rules (few big collections, batch adds, `BlendOption.OPAQUE` for up to 2x) but no point count.
- Cesium ion is the hosted imagery and terrain service. Free tier is non-commercial only (1,000 imagery sessions per month). Commercial plans start at $149 per month individual, $524 team ([pricing](https://cesium.com/platform/cesium-ion/pricing/)). We would avoid ion and bring our own tiles, but that is extra work for a globe whose job is to show dots.
- The npm package is large and built for terrain, 3D tiles and time-dynamic data, none of which we need.

MapLibre:
- Globe is a projection set with `map.setProjection({ type: 'globe' })` inside a `style.load` handler ([example](https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-vector-map/)). Docs list examples with atmosphere and fill-extrusion on the globe.
- It needs a style and tile source. 100k points go in as a GeoJSON circle layer, which gets heavy at that size, or via deck.gl as an overlay. I did not verify deck.gl's MapLibre globe overlay support; check before relying on it.
- Gain: real borders, labels, country boundaries at zoom, which matters for a world sim with 100+ countries.

Not covered: raw three.js. It would give full control and the smallest bundle, but we would rebuild what three-globe already does. No reason at 22 days.

## What it means for Real World

- For the product: the launch globe needs three things only: dots colored by belief or segment, a click that opens an agent trace, and a before/after view for forks. Pick the library that does those with the least code. A 100k-point globe will look like a blob of color over Asia and Europe at world zoom, so plan aggregation (hex bins or density) for the zoomed-out view and individual dots on zoom.
- For the engineering: the point data should be a typed array (lng, lat, color index, agent id), generated once per daily run and served as a binary file from R2 or similar. That works with either library and keeps the render layer swappable. Hold the render code behind one small component so the engine can change.
- For the business: license cost is zero for all choices except Cesium ion at commercial scale. No attribution or copyleft issues. Basemap tiles are the real cost: use free tiles (Natural Earth style imagery, or a self-hosted PMTiles file) rather than a paid tile API.

## Recommendations

1. Build the globe in globe.gl first, with `pointsMerge: true`, a static earth texture, and our own click handler via nearest-point lookup. Measure FPS on a mid laptop and a phone with 100k points. Target 30 FPS or better on the phone.
2. In parallel, make a one-page deck.gl GlobeView ScatterplotLayer prototype with the same typed-array data. It is a small spike. Compare FPS and click latency. Keep whichever wins; delete the other.
3. If deck.gl wins, avoid HeatmapLayer, ContourLayer and TerrainLayer on the globe. Use hex bins computed server-side or HexagonLayer if it works in GlobeView (untested).
4. Do aggregation server-side: ship the daily 100k point file plus a precomputed per-country summary, so the zoomed-out globe does not need to cluster in the browser.
5. Skip Cesium. Revisit MapLibre only if the PM wants a flat map mode with country labels.
6. Put the data format in the API contract now (binary lng, lat, segment, belief), so the web app and SDK share it.

## Open questions

- What are real FPS numbers for 100k points on globe.gl merged, deck.gl GlobeView and MapLibre globe on a phone? Answer by running the two spikes in recommendation 1 and 2; no published number was found.
- Does deck.gl 9.4 work on a MapLibre 6.x globe through its overlay? Check the deck.gl MapLibre integration docs and test it.
- Is the experimental GlobeView stable enough for launch week? Read open GlobeView issues on the deck.gl repo and test on Safari and iOS.
- Does the nearest-point click workaround stay accurate near the globe edge? Test it.
- GitHub release dates for the other libraries were not readable from the repo pages. Versions above are from npm.

## Sources

- [deck.gl repository](https://github.com/visgl/deck.gl), accessed 2026-10-11
- [deck.gl releases](https://github.com/visgl/deck.gl/releases), accessed 2026-10-11
- [deck.gl performance guide](https://deck.gl/docs/developer-guide/performance), accessed 2026-10-11
- [deck.gl GlobeView](https://deck.gl/docs/api-reference/core/globe-view), accessed 2026-10-11
- [deck.gl ScatterplotLayer](https://deck.gl/docs/api-reference/layers/scatterplot-layer), accessed 2026-10-11
- [npm @deck.gl/core](https://registry.npmjs.org/@deck.gl/core/latest), accessed 2026-10-11
- [globe.gl repository](https://github.com/vasturiano/globe.gl), accessed 2026-10-11
- [three-globe repository](https://github.com/vasturiano/three-globe), accessed 2026-10-11
- [npm globe.gl](https://registry.npmjs.org/globe.gl/latest), accessed 2026-10-11
- [CesiumJS repository](https://github.com/CesiumGS/cesium), accessed 2026-10-11
- [Cesium PointPrimitiveCollection](https://cesium.com/learn/cesiumjs/ref-doc/PointPrimitiveCollection.html), accessed 2026-10-11
- [Cesium ion pricing](https://cesium.com/platform/cesium-ion/pricing/), accessed 2026-10-11
- [npm cesium](https://registry.npmjs.org/cesium/latest), accessed 2026-10-11
- [MapLibre GL JS repository](https://github.com/maplibre/maplibre-gl-js), accessed 2026-10-11
- [MapLibre globe example](https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-vector-map/), accessed 2026-10-11
- [npm maplibre-gl](https://registry.npmjs.org/maplibre-gl/latest), accessed 2026-10-11
