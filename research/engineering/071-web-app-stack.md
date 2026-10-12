# Web app stack for a live globe and streaming fork results

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Library facts come from the vendor pages and READMEs I opened. The web search budget ran out, so I did not compare against third-party benchmarks or other people's write-ups. The globe performance ceiling is untested.

## Answer

Build the web app as a Vite + React + TypeScript single-page app on top of react-globe.gl, served as static files from Cloudflare. Put the API (`/v1/simulate`, fork streams) in a small Worker. Stream fork progress with Server-Sent Events (SSE), not WebSockets. Do not render 100,000 agents as 100,000 objects; render aggregated hex cells and fetch single agents on click.

## Findings

**Next.js is current and fine, but it solves problems we do not have.** Next.js 16 shipped 2025-10-21 with Turbopack as the default bundler. 16.4 shipped 2026-10-06, and an out-of-band security release for upstream dependencies is announced for 2026-10-14. ([Next.js blog](https://nextjs.org/blog)). Its value is server rendering and caching. The globe is client-only WebGL, so server rendering adds nothing there. Only two pages (receipts, shared fork) benefit from server HTML, for link previews.

**Hosting Next.js has a cost.** Vercel Hobby is $0 but "personal, non-commercial use" only. Pro is $20/month with 1 TB bandwidth ([Vercel pricing](https://vercel.com/pricing)). Running Next.js on Cloudflare goes through `@opennextjs/cloudflare`, which the docs still show on a 1.0.0-beta line. It does not support Node Middleware, and the Worker size limit is 3 MiB (Free) or 10 MiB (Paid), compressed ([OpenNext docs](https://opennext.js.org/cloudflare)). A three.js globe plus Next.js runtime in a 10 MiB Worker is avoidable risk.

**Vite is current.** Vite 8 shipped 2026-03-12. The docs header shows v8.3.4, and the latest post is Vite 8.1 on 2026-06-23 ([Vite blog](https://vite.dev/blog/)). A Vite build is plain static files. There is no server runtime to size, secure or pay for.

**Globe library options.**
- globe.gl (MIT, 3.2k stars) wraps three-globe on three.js/WebGL. It has points, arcs, polygons, hex bins, rings, labels, heatmaps and HTML elements ([globe.gl](https://github.com/vasturiano/globe.gl)). three-globe is MIT, 1.6k stars ([three-globe](https://github.com/vasturiano/three-globe)).
- react-globe.gl (MIT, 1.5k stars) is the React wrapper. Hex bins use H3 resolution 0 to 15, weights are summed per bin, and the default resolution is 4 ([react-globe.gl](https://github.com/vasturiano/react-globe.gl)).
- Performance caveats are in the README. `pointsMerge` and `hexBinMerge` render faster but disable click and hover on those objects. Pointer tracking costs frame time. `pauseAnimation()` helps for static views.
- deck.gl `GlobeView` is documented as experimental. `HeatmapLayer`, `ContourLayer` and `TerrainLayer` do not work in it, and `TileLayer` support is experimental ([deck.gl GlobeView](https://deck.gl/docs/api-reference/core/globe-view)). Skip it.
- MapLibre GL JS 6.x has a `GlobeControl` and globe examples ([MapLibre docs](https://maplibre.org/maplibre-gl-js/docs/)). It is a real option if we want street-level zoom into a country. I did not find or test how it handles tens of thousands of data points. Not needed for launch.

I could not find release dates or version numbers for globe.gl or react-globe.gl on their GitHub pages (empty Releases sections). Check npm before pinning.

**Streaming: SSE is enough.** Fork results flow one way, server to browser. SSE gives automatic reconnect, a `retry` field and `Last-Event-ID` resume. It is GET-only and text-only. Over HTTP/1.1 browsers cap at about 6 connections per domain across all tabs. Over HTTP/2 the default is 100 streams ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)). Cloudflare serves HTTP/2 by default. The start request is a normal `POST`; the stream is a `GET /v1/forks/:id/events`.

**Cloudflare can hold the stream.** HTTP-triggered Workers have no hard wall-time limit while the client stays connected. Waiting on I/O does not count as CPU time. Response size is not limited ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). Paid is $5/month with 10M requests included, then $0.30 per million ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)). Free is capped at 100,000 requests/day and 10 ms CPU, which is too tight for launch day.

**Durable Objects if we need fan-out.** One object per fork can buffer events and serve many viewers. Paid plan: 1M requests/month included, then $0.15 per million. Duration is billed in GB-seconds, and the WebSocket Hibernation API avoids charges while idle ([Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)). This is relevant only if viewers share a live fork.

## What it means for Real World

- For the product: the globe is a view of aggregates (country or hex cells coloured by belief or forecast), with a side panel for the clicked agent's "why". That is also honest about what 100,000 agents can show. The "world-class" feel comes from smooth 60fps rotation, fast first paint and a clean receipts page, not from rendering every agent.
- For the engineering: one repo, two deployables. `web/` is Vite + React + TypeScript, built to static files. `api/` is a Worker. Shared types live in one package so the SDKs, API and UI use the same simulate response shape. A PM can read the route list; an engineer can run both with one command. No server components, no caching directives, no adapter.
- For the business: hosting is about $5 to $25/month at launch. No commercial-use licence trap, which Vercel Hobby would be.

## Recommendations

1. Scaffold `web/` with Vite 8, React, TypeScript, react-globe.gl. Pin exact versions after checking npm release dates.
2. Aggregate on the server. Precompute per-day hex or country cells (H3 resolution 3 to 4) for the globe. Return agents only through `GET /v1/agents/:id` and `/trace`.
3. Set `pointsMerge`/`hexBinMerge` on the main layer, turn pointer events off while the globe rotates, and pick the clicked cell by a custom ray-pick or country polygon instead of per-mesh callbacks.
4. Make fork runs a job. `POST /v1/forks` returns an id. `GET /v1/forks/:id/events` streams SSE with `id:` on every event so reconnect resumes. Store events in D1 or a Durable Object so a refresh replays the run instead of losing it.
5. Add client messages (pause, cancel) as plain `POST`s. Do not add WebSockets unless a feature needs two-way live state.
6. Make receipts and shared-fork pages crawlable: prerender them at build time (daily static pages) and have the Worker inject Open Graph tags for `/fork/:id`. This is the one place a server renders HTML. Keep it to one small Worker route.
7. Budget one afternoon for a frame-rate test: 20k hex cells plus 500 arcs on a mid-range laptop and a phone. If it fails, drop arcs on mobile.
8. Use the Workers Paid plan from day one ($5/month).

## Open questions

- Frame rate of react-globe.gl with the real daily payload on phones. Find out with the afternoon test in recommendation 7.
- Whether MapLibre globe is worth adding for country-level zoom. Find out after launch from user feedback.
- Whether the SSE stream needs Durable Objects for shared live forks, or whether D1 replay is enough. Find out from the first load test.
- Current npm versions and release dates for globe.gl and react-globe.gl. I could not read them from GitHub.
- Third-party opinions on Next.js vs Vite for globe apps. Web search was unavailable for this note.

## Sources

- [Next.js blog](https://nextjs.org/blog), accessed 2026-10-11
- [Vite blog](https://vite.dev/blog/), accessed 2026-10-11
- [Vercel pricing](https://vercel.com/pricing), accessed 2026-10-11
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare), accessed 2026-10-11
- [globe.gl on GitHub](https://github.com/vasturiano/globe.gl), accessed 2026-10-11
- [react-globe.gl on GitHub](https://github.com/vasturiano/react-globe.gl), accessed 2026-10-11
- [three-globe on GitHub](https://github.com/vasturiano/three-globe), accessed 2026-10-11
- [deck.gl GlobeView](https://deck.gl/docs/api-reference/core/globe-view), accessed 2026-10-11
- [MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/), accessed 2026-10-11
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), accessed 2026-10-11
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), accessed 2026-10-11
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/), accessed 2026-10-11
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), accessed 2026-10-11
