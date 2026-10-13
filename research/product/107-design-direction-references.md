# Design direction: what five reference sites do and which rules transfer

- Date: 2026-10-12
- Area: product
- Confidence: medium. Numbers below were read from the live pages' computed styles at one viewport (1024 px wide, plus 390 px for two sites). Signed-in pages (OpenAI keys page, any dashboard) were not opened, so keys and empty-state patterns rest on public docs and are labelled inference. openai.com/api returned 403 to fetch; its docs site was read instead.

## Answer

The references share one recipe: a near-neutral palette with a single accent, one variable sans plus one mono, a small type scale with tight tracking on large sizes, hairline borders instead of shadows, prose capped near 70 characters, and code as the primary visual on developer pages. Real World already has the right base (IBM Plex, one green, 4 px spacing, receipts as the one memorable shape). What it lacks is hairline restraint (1.5 px ink borders everywhere read as a form, not a platform), a docs layout with an on-page TOC, language-tabbed code, a keys pattern, and a landing page that explains the engine as four mechanisms with real committed data. Adopt those in [product/design.md](../../product/design.md); keep Plex, the green, and the receipt.

## Findings

Values are computed styles read from the pages on 2026-10-12. "Inference" marks my reading.

**TypeSafe ([typesafe.ai](https://typesafe.ai))**
- Light page `#fefefe`, ink `#1e1e1e` at 0.86 alpha. One display grotesk (proprietary, not usable) at 94 px / line-height 0.8 for the hero, 41 px for section statements, 18 px for nav and body.
- Section order from the page markup: hero, three one-line principles, a code-like block, a big-number comparison with a footnote link to proof, pricing as two large figures, FAQ, footer. The technology is explained as problem, new category, three named parts, numeric proof with a link.
- Retro window chrome and a gradient sky give it character; the transferable part is large single statements with one number each and proof one click away. Its "x faster, x cheaper" headline is a vendor claim we may not mimic ([messaging](../../gtm/messaging.md), [market/004](../market/004-jev-typesafe.md)).
- Cookie banner offers Reject and Accept equally.

**OpenAI developers ([quickstart](https://developers.openai.com/api/docs/quickstart))**
- Dark page, black background, text `#dcdcdc`, secondary `#b9b9b9`. Proprietary sans; H1 30 px / 600 / line-height 42 px, H2 20 px / 600, lead paragraph 18 px / 29 px in secondary colour, body 16 px / 25.6 px.
- Three layers of navigation: top bar, a second row of section tabs (Overview, Models, Agents, Tools, Production, API reference), and a left rail of grouped docs; a "Copy Page" button sits under the title.
- Code: SF Mono 14 px / 25.6 px, block radius 6 px with a 12% white fill (no border), a file-name tab above, and pill tabs for variants ("macOS / Linux", "Windows"; "API", "ChatGPT"), pill radius 9999 px, active tab filled `#303030`.
- The key step is prose plus one button: create the key, store it as an environment variable, then use it in the snippet. The dashboard button is the only filled-white control in view.

**Cloudflare Workers AI ([REST API guide](https://developers.cloudflare.com/workers-ai/get-started/rest-api/), [models](https://developers.cloudflare.com/workers-ai/models/))**
- Dark body `oklch(0.192 0 0)` (about `#161616`), text a warm off-white, one orange accent used for links and the sign-in button. Inter Variable for text, JetBrains Mono Variable for code (both open-licensed).
- Layout at 1024 px: left nav 300 px, main column 724 px, right "On this page" TOC appears only on wider screens (hidden at 1024). Body 16 px / 28 px, H1 35 px / 600, H2 20.8 px / 600 with 36 px line height. Code 14 px / 22.75 px.
- Page header: breadcrumb, H1, one meta row (last updated date, Copy as Markdown, View as Markdown, Agent setup), a collapsed overview disclosure. Page footer: "Was this helpful?" with Yes and No. Skip link first.
- Catalogue page: search box, three filters (Task Types, Capabilities, Authors), sort, a result count ("We found 70 models"), then a card grid with name, type label, two-line description, tags, a Compare action.
- At 390 px: no horizontal page scroll; code blocks scroll horizontally inside themselves.

**Linear ([linear.app](https://linear.app))**
- Dark `#08090a`, text `#f7f8f8`, secondary `#8a8f98`, border `#23252a`, raised `#1c1c1f`, one brand violet `#5e6ad2` used sparingly. Inter Variable.
- Scale: H1 56 px / 510 / line-height 61.6 / tracking -1.23 px (-0.022em); H2 40 px / 510 / tracking -0.88 px; H3 20 px / 590; body 15 px / 24 px; small 13 to 14 px. Weight 510 is a variable-font value; ours is limited to 400, 500, 600.
- Structure: hero with one product screenshot, three numbered value statements ("Fig 0.1" captions), four alternating feature blocks each with title, one sentence, a product visual and an expandable list, a changelog teaser (four cards with dates), a closing CTA. At 390 px: H1 38 px, 23 px side gutter, no horizontal scroll.
- The page is mostly real product UI, not illustration. The testimonial and customer-count rows are not transferable to us (forbidden: no customers or logos).

**Perplexity ([perplexity.ai](https://www.perplexity.ai))**
- Dark `#161616`, white text, teal accent used only on feature cards; proprietary sans at 16 px / 24 px, weight 360. The home is one question and one input: a left rail (New, Library-style items, Sign in at the bottom), a single heading in the page's centre ("What do you want to know?"), the input, two suggestion cards.
- Cookie notice offers "Decline optional" and "Got it".
- Inference: one input as the whole product surface is the pattern for our fork box ("What if …").

**Where they agree**
- One accent, used for the primary action and links only. Neutrals do the rest.
- Hairline borders and tonal fills for surfaces, not shadows.
- Large type is tightened (about -0.02em), small type is not.
- Docs: three columns (nav, content, TOC), content 700 to 760 px, mono 14 px.
- Both light and dark are first-class on the docs sites (OpenAI and Cloudflare followed the system theme in this browser; Linear and Perplexity rendered dark).

## What it means for Real World

- For the product: the app chrome moves to hairlines and calm tonal surfaces; the receipt stays the one heavy, ink-bordered object, so the brand shape is rarer and stronger. A docs area and a keys area become first-class pages with the patterns above.
- For the engineering: no new font or dependency. IBM Plex Sans and Mono (already self-hosted, OFL) cover what Inter and JetBrains Mono do. `check_design.py` constants (radius, weights, shadow) change only where [design.md](../../product/design.md) says so, in the implementation PR.
- For the business: the trust cost of a flashy page is high for a product whose point is a record. Restraint is the claim.

## Recommendations

1. Adopt the rules in [product/design.md](../../product/design.md) (this PR). Implementation lanes cut one PR per surface: tokens, docs, keys, landing.
2. Keep Plex; add `font-variant-numeric: tabular-nums` to every numeric column.
3. Build the landing "how it works" as four mechanism blocks, each with one artefact read from committed data, not an illustration.
4. Do not add testimonials, logos, "trusted by", counts of users, speed or accuracy superlatives. Every landing number must trace to a committed artifact.
5. Take screenshots at 390 and 1440 for each implementation PR against these references, as `CLAUDE.md` requires.

## Open questions

- OpenAI's keys page and Linear's and Cloudflare's signed-in dashboards were not opened (no sign-in by rule). Re-check keys and empty-state patterns once we have a throwaway account decision from the founder.
- Whether the OpenAI and Cloudflare docs follow the system theme or a stored preference was not tested; our rule (system theme, with a user override) is our choice.
- Motion durations are not measurable from computed styles; the values in design.md are our choice, to be verified in a Playwright check.

## Sources

- [TypeSafe AI](https://typesafe.ai), accessed 2026-10-12
- [OpenAI developer quickstart](https://developers.openai.com/api/docs/quickstart), accessed 2026-10-12
- [Cloudflare Workers AI REST API guide](https://developers.cloudflare.com/workers-ai/get-started/rest-api/), accessed 2026-10-12
- [Cloudflare Workers AI models](https://developers.cloudflare.com/workers-ai/models/), accessed 2026-10-12
- [Linear](https://linear.app), accessed 2026-10-12
- [Perplexity](https://www.perplexity.ai), accessed 2026-10-12
- Agrees with [market/004](../market/004-jev-typesafe.md) on not copying TypeSafe's claims; consistent with [engineering/071](../engineering/071-web-app-stack.md) (stack unchanged).
