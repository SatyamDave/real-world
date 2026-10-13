# Equipping for the redesign: options, measured byte costs, recommendation

Date 2026-10-13. Byte costs were measured here, not quoted: each library was installed at the version shown and bundled with esbuild (`--minify`, tree-shaken, ESM), then compressed. The page's budget is first-load JavaScript under 120 KB gzipped (77.6 KB today) with everything heavy loaded after first paint on capable devices only.

## Skills available this session, and what each is for

| Skill | Use in this work |
| --- | --- |
| `frontend-design:frontend-design` (invoked by name earlier in the session) | Plan tokens, type and layout before building; self-critique against its list of generic tells |
| `design:design-critique` | Structured critique of each screenshot round |
| `design:accessibility-review` | WCAG 2.1 AA pass after the globe controls exist |
| `design:ux-copy` | Marker-card and control copy |
| `engineering:code-review` | Diff review before each PR |
| `ship-pr` and the `consistency-reviewer` agent (new, from `origin/main`) | Definition-of-done walk and the one-look check, run before the PR |

No separate "award-winning design" skill exists in this session; the critique is done from pixels with the skills above.

## Globe implementation

| Option | Measured cost | Interaction fit | Verdict |
| --- | --- | --- | --- |
| cobe 2.0.1 plus our own pointer controller | 5.7 KB gzip today (it already ships); controller about 2 KB | cobe takes `phi`, `theta`, `scale` per frame, so drag, inertia, pinch and buttons are our code. It also creates a hidden 1px element at each marker's projected position and says which markers face the viewer (`id` on a marker, `--cobe-visible-<id>`), so tappable HTML markers need no projection maths of ours | **Recommended** |
| OGL 1.0.11 with a custom sphere shader | 14.7 KB gzip for the classes we would import, plus a land bitmap or dot data (tens of KB) and a shader we would write and test | Full control (atmosphere, a real day and night terminator) | Runner-up. About 3x the bytes and a new renderer for effects the budget and `design.md` do not ask for |
| three.js (WebGLRenderer, Scene, camera, SphereGeometry, ShaderMaterial, Mesh) | 129.7 KB gzip before any texture | Everything | Rejected: costs more than our whole first load |
| `react-globe.gl` (what `web/` uses) | not measured here; it bundles three.js, so at least the row above | Country polygons and click | Rejected for the landing page; Satyam's app already carries it |

Decision basis: cobe is already the smallest thing that draws a good globe, it exposes marker positions, and the only missing parts (pointer control, inertia, zoom, keyboard) are about 150 lines we own and can test. Logged as DECISIONS C5.

## Motion and scroll

| Option | Measured cost | Fit with `product/design.md` and the brief | Verdict |
| --- | --- | --- | --- |
| GSAP 3.15.0 core | 27.0 KB gzip | | Not adopted |
| GSAP core plus ScrollTrigger | 44.1 KB gzip | `design.md`: "No scroll-triggered reveals, parallax, auto-playing carousels or number count-ups." | Not adopted |
| Lenis 1.3.26 | 5.3 KB gzip | Smooth scroll replaces native scrolling, which is the page-scroll hijack the brief forbids ("Do not hijack page scroll") | Not adopted |
| Native CSS scroll-driven animations (`animation-timeline`) | 0 KB | Same rule: scroll-triggered motion | Not adopted |
| View Transitions API | 0 KB | Would animate the marker card opening; `design.md` caps motion at 320 ms and wants opacity and transform only | Not adopted; the card uses an opacity and transform transition we write |

The references agree: none of the seven sites measured hijacks the wheel; all scroll natively. The heaviest (omi.me, 8.5 MB, 506 requests; Apple AirPods, 8.3 MB) are the ones to avoid.

### The conflict, stated plainly

Rohit's brief lists GSAP ScrollTrigger, Lenis and native scroll-driven animation as things to test. `product/design.md` (Satyam) forbids scroll-triggered reveals and parallax, and `CLAUDE.md` says a change to the look "lands in that file first, in its own PR". I tested the options for cost (table above) and decided not to adopt any, for two reasons that do not depend on each other: they break the repo's own design rule, and the brief's own "do not hijack scroll" rule rules out the smooth-scroll one. The boldness is spent where `design.md` allows it, in the globe's interaction, which answers a person's action. If Rohit wants scroll-driven storytelling anyway, the change starts as a PR to `product/design.md`; it is listed as a follow-up in DECISIONS C5.

## Measuring our own pixels

Playwright with Google Chrome: full-page screenshots at 390x844 and 1440x900 at several scroll positions (top, 25, 50, 75, 100 percent), a drag test that compares the canvas before, during and 400 ms and 1.4 s after release (to prove rotation and inertia), a wheel test (plain wheel must scroll the page; ctrl or cmd wheel zooms), and a touch emulation test (vertical swipe scrolls the page, horizontal swipe rotates). Lighthouse mobile before and after, local and live staging. All run by subagents; the images are read by me.
