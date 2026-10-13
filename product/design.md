# Design reference

One look for every surface: the app in `web/`, the landing page, share images, ads, the API docs page and any text the API serves. The source is the landing design "Commit Slip" (direction A) by rovivek. Until the `landing/*` branches merge, read it with git, never by checking out or editing those branches:

- Rationale and the receipt anatomy: `git show origin/landing/design-pass:landing/design/DESIGN-PASS.md`, `COPY.md`, `A11Y-REVIEW.md`
- Reference shots: `landing/design/shots/after-desktop-full.png` (1440) and `after-mobile-full.png` (390) on `origin/landing/design-pass`; extract with `git show <ref>:<path> > /tmp/x.png`
- The CSS it was built from: `landing/src/styles/{tokens,fonts,global}.css` on `origin/landing/5-readiness`

What follows is that design written as rules a change can be checked against. `scripts/check_design.py` enforces the mechanical ones.

## Direction (2026-10-12)

Founder direction: the look of a top-tier deep-tech product: precise type, generous whitespace, one accent, crisp data, motion only where it explains. Evidence and per-site rules: [research/product/107](../research/product/107-design-direction-references.md) (TypeSafe, OpenAI developers, Cloudflare Workers AI, Linear, Perplexity). The decisions:

1. App chrome is calm and hairline: 1px `--line` borders, tonal fills, no shadow. The receipt stays the one heavy object (1.5px `--ink` border, torn edge, `--card-shadow`), so it is the only thing that looks like a slip.
2. Keep IBM Plex Sans and Mono, `--accent` green and `--accent-2` clay. No new font, no second accent, no gradient, no illustration, no emoji.
3. Polish only: no claim, number, logo, customer, funding or traction appears that is not on the allowed list in [messaging](../gtm/messaging.md) or traced to a committed artifact. No testimonial or "trusted by" row, ever.
4. A change to these rules lands here first, in its own PR, citing a research note; then in each surface.

## Tokens

`web/src/styles/tokens.css` is a byte-for-byte copy of the landing tokens; `tokens-dark.css` is the dark theme from the same hues. No colour, font, radius or shadow is written anywhere else. Light follows the system (`prefers-color-scheme`); a stored user choice in settings overrides it with `data-theme` on `html`. Both themes ship from the first build of any surface.

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `--paper` | page | `#f2f4f3` | `#111814` |
| `--paper-2` | raised or alternate fill, code blocks, table header, hover row | `#e7eae8` | `#1a231e` |
| `--surface` | cards, inputs, menus | `#ffffff` | `#18201c` |
| `--ink` | text, primary button | `#15201b` | `#e4eae6` |
| `--muted` | secondary text, labels, feet; at least 4.5:1 on `--paper` | `#5c6660` | `#9aa69f` |
| `--line` | the 1px hairline: borders, dividers, table rules, chart gridlines | `#cdd3cf` | `#34413a` |
| `--line-strong` (new) | hover border, input border at rest | `#aab2ad` | `#4a584f` |
| `--accent` | committed, verified, resolved, links, primary hover, focus, chart highlight | `#2f6f4e` | `#6dbd90` |
| `--accent-wash` (new) | 10% accent fill: verified row, selected nav item, spread band | `#e1ece5` | `#1b2a22` |
| `--accent-2` | pending, error, refused, destructive, event marker | `#b23a2e` | `#e8806f` |
| `--clay-wash` (new) | error and refused fill | `#f3e1de` | `#2e1b18` |
| `--focus` | 2px outline, 2px offset | `--accent` | `--accent` |
| `--radius` | 4px (was 2px) on everything with a radius; `0` and `50%` are the only others; no pill | | |
| `--card-shadow` | receipt only | | |

Semantic colour is exactly two: green means verified or committed, clay means pending or wrong. Nothing else is coloured; a chart's other series are `--ink` and `--muted` at different dash or weight, not new hues. Contrast: text at least 4.5:1, borders that carry meaning at least 3:1, in both themes; a test computes it from the token files.

## Type

IBM Plex Sans for reading, IBM Plex Mono for data and code. Weights 400, 500, 600 only. One scale, no value outside it:

| Role | Size / line height | Weight | Tracking |
| --- | --- | --- | --- |
| Display (landing hero, one per site) | clamp(40px, 6vw, 56px) / 1.05 | 600 | -0.03em |
| Page title (`h1` in app and docs) | 28px / 1.2 (40px / 1.15 on a landing section title) | 600 | -0.02em |
| Item title (`h2` in docs, card question) | 20px / 1.3 | 600 | normal |
| Lead (first paragraph under a title) | 18px / 1.55, `--muted` | 400 | normal |
| Body | 16px / 1.5 in app, 1.65 in docs prose | 400 | normal |
| Secondary, table cells, nav | 14px / 1.45 | 400 or 500 | normal |
| Label, caption, foot | 12px / 1.4, `--muted` | 400 | normal |
| Code, hashes, numbers in tables | Mono 14px / 1.6 (12px in a receipt foot) | 400 | normal |

No all-caps, no letter-spaced small caps, no eyebrow above a title. Sentence case everywhere. Numeric columns, probabilities, costs and dates use `font-variant-numeric: tabular-nums` and right-align in tables. Prose line length at most 70ch; docs prose column at most 72ch.

## Layout and spacing

Spacing steps (px): 4, 8, 12, 16, 24, 32, 48, 64, 96. Side gutter 24px (16px at 390px wide and below). Page column 1120px; reading column 720px; app content never wider than 1120px.

- Sections on a landing page: 96px vertical padding at 1024px and up, 64px below, separated by a 1px `--line` rule. Whitespace carries the grouping; no section background changes colour.
- Three-column docs grid at 1280px and up: left nav 264px, content 720px, right "On this page" 220px, 48px gaps. At 1024 to 1279px the right TOC is hidden. Below 1024px the left nav becomes a "Menu" button opening a drawer; the TOC becomes a collapsed "On this page" disclosure under the title.
- No horizontal page scroll at 390px. Wide code and tables scroll inside their own block.
- Grid inside the page column: 12 columns, 24px gap; cards in 1, 2 or 3 columns only.

## Components

One implementation per pattern; a second button, card, badge, disclaimer, loader, tab, code block or error block is a defect. In `web/` it is a class in `src/styles.css` and, where it renders data, one component. Existing patterns keep their names; the table lists the ones this direction adds or changes.

| Pattern | Rule |
| --- | --- |
| Primary button | filled `--ink`, 16px 600, 44px min height; hover fills `--accent`; active 1px down; disabled 0.6 opacity; one per view |
| Secondary button | 1px `--line-strong` border, transparent, 14px 600; hover `--paper-2` |
| Text action | `button.link`, underlined, 3px offset |
| Card | `--surface`, 1px `--line` border, `--radius`, 20px padding, no shadow; whole-card links show the hover border `--line-strong` |
| Receipt | unchanged: 1.5px `--ink` border, `--card-shadow`, torn edge, dashed header rule; the only card that is heavy |
| Stamp | unchanged |
| Input | 16px, 12px 14px padding, 1px `--line-strong` border, `--surface`; focus is the 2px `--focus` outline; the fork input placeholder is "What if …" |
| Tabs | underline tabs, not pills: 14px 500, 2px `--ink` underline on the active tab, `role="tablist"`, arrow-key navigation, 44px height; the chosen tab persists per surface in `localStorage` |
| Inline code | Mono 14px, `--paper-2` fill, `--radius`, 2px 6px padding |
| Table | full width, no vertical rules, 1px `--line` between rows, header row 12px `--muted` on `--paper-2`, 48px row height at 1024px and up, mono right-aligned numerals, sticky header when the body scrolls; at 390px a row becomes a stacked card list or the table scrolls inside its block with the first column sticky |
| Nav item (docs, settings) | 14px, 36px row; active has `--accent-wash` fill and 2px `--accent` left rule |
| Callout | `--paper-2` fill, 1px `--line` border, 14px text; the only coloured variant is clay for a refusal or an error; no icon, no emoji |
| Header | `.topbar`: 56px high, 1px bottom `--line`, brand, nav with `aria-current="page"`, then Sign in or the account button; sticky |
| Footer | links in columns (Product, Proof, Developers, Legal), the disclosure, copyright; 44px targets |

### Code blocks and language tabs

One `CodeBlock` component renders every snippet on the landing page, docs, the keys page and the fork card's "Get this via API".

- Frame: `--paper-2` fill, 1px `--line` border, `--radius`; header row 40px with the language tabs at the left and a "Copy" text action at the right; Mono 14px / 1.6; 16px padding; horizontal scroll inside the block, no wrapping, no line numbers unless a prose step cites a line.
- Tabs are `curl`, `Python`, `TypeScript`, in that order, on every endpoint, with the same request in each. The Python and TypeScript tabs are the SDK quickstarts' own snippets, as `Docs.tsx` already reads them; the `curl` tab is generated from `api/openapi.json`. `check_sdk_parity.py` keeps them aligned.
- Highlighting uses four tones only: `--ink` for names, `--muted` for punctuation and comments, `--accent` for strings, `--accent-2` never. No rainbow theme.
- "Copy" changes to "Copied" for 1.5s and announces it to screen readers. A response block sits under the request with a "Response" label and the status code; a response example is the API's real shape from a fixture, never invented fields.
- The key in a snippet is read from the environment variable `REAL_WORLD_API_KEY` or shown as `rw_...`; a real key is never rendered into a snippet.

### Docs

- Page header: breadcrumb (12px), page title, lead sentence, one meta row: "Last updated <ISO date>", "Copy as Markdown". No other chrome.
- Left nav groups: Get started, Concepts, API reference (one entry per operation, in `openapi.json` order), SDKs, Changelog. Active item per Nav item rule.
- Right TOC lists `h2` and `h3`, highlights the one in view, and uses plain anchor links.
- Each operation page: one-sentence summary, the `curl`/`Python`/`TypeScript` block, a parameter table (name, type, required, description), a response table, a refusal-codes table, the error shape. Every page ends with "Was this page useful?" (Yes, No) only if its answer is stored; otherwise omit it.
- Search is a 14px input in the header opened with `/`; results show page title and the matching line. A search with no results says "No pages match <query>."

### Keys page (`/developers`)

- Top: the one-line spend rule ("A key cannot spend more than its daily cap; when the cap cannot be checked the call is refused."), then "Create key".
- Create: a name field and a daily dollar cap field, one primary button. On success the full key shows once in a callout with "Copy" and the line "This key is shown once. Store it now."; leaving the page removes it, and the list shows only the prefix.
- List is a table: name, key prefix (Mono), created (ISO date), last used (ISO date or "Never"), daily cap, spent today, and a "Revoke" text action. Revoke asks for confirmation in a dialog with focus on "Cancel".
- Under the table: "Use your key" with the code block and the three tabs, pre-filled with `REAL_WORLD_API_KEY`.
- Empty: "No keys yet. Create one to call the API." with the primary button. Loading, error, signed-out: States below.

### Charts and data visualisation

- One `Chart` component family, each with its data table (existing rule). Marks are `--ink` for the main series, `--accent` for the highlighted one (ours against the baseline), `--muted` for the rest. No fills except the spread band (`--accent-wash`, the p10 to p90 range) and bars.
- Axes: 1px `--line`, tick labels 12px Mono `--muted`; gridlines dashed 1px `--line`, horizontal only; zero line `--line-strong`. The y axis starts at zero for bars; a zoomed axis says so in the caption.
- Label series directly at the line end; a legend only for more than three series. No 3D, no dual axis, no pie, no gradient, no animation on load.
- Always shown with the chart: n, the interval, the coverage tier, and the line "AI-simulated". Hover and focus show a tooltip (14px, `--surface`, 1px `--line`) and a focus ring on each point; keyboard arrows move between points.
- A score with fewer than 10 resolved questions shows no interval; fewer than 100 shows "No claim yet" (existing rule).

## States

Every view shows one of: loading, empty, result, refused, error. No state exists for something that only happens when the product is broken; fix the cause.

| State | Rule |
| --- | --- |
| Loading | A skeleton in the exact shape and height of the result (`.skeleton`, `--paper-2`, `--radius`), shown only after 200ms so fast loads show nothing; no spinner except inside a button that has been pressed; a status line "Loading <what>" for screen readers (`aria-live="polite"`); layout does not shift when the result arrives |
| Empty | One sentence saying there is nothing yet and when there will be, in `--muted`, plus the one next action as a button; no illustration |
| Result | Always with tier, spread and "AI-simulated" where they apply |
| Refused | The API's `detail` sentence as sent, in a clay callout, with the one link that helps (for example acceptable use) |
| Error | `LoadError`: what did not load, why in one clause, "Try again"; the response body is never shown; the failed region keeps its size |
| Signed out | The one-line reason and "Sign in"; the page returns here after sign-in |

Copy for each state is written in the surface's spec, literally.

## Landing narrative

One page, `/` signed out, in this order. Each block is a headline (section title), one lead sentence, and one artefact read from committed data; no stock imagery, no decoration.

1. Hero: display headline "Simulations with receipts.", the sub-line from [messaging](../gtm/messaging.md), one primary action ("Fork today's world") and one text action ("Read the record"). The still globe poster beside it at 1024px and up.
2. How it works, four numbered blocks (`1`, `2`, `3`, `4` in Mono, not "Fig"), each the same anatomy: title, two sentences of mechanism, one artefact, a link to the proof page.
   - Population: agents are rows of traits with a belief per topic; the artefact is a real agent row and the coverage-tier legend ([coverage tiers](../research/data/099-country-coverage-tiers.md)).
   - Daily cycle: the eight steps of the [glossary](glossary.md) as a horizontal list with today's run status from `GET /v1/status`.
   - Receipts: the forecast sealed before it resolves; the artefact is a real leaf hash, salt-free, and its inclusion proof, with "Verify in your browser" opening `/receipts`.
   - Scoring: forecasts against the market price at commit time, misses included; the artefact is the real score card with its n, and "No claim yet" until the rule allows one.
3. Live proof: the latest three receipts and today's question, from the API; if none exist, the empty state, not a placeholder.
4. For developers: the first call as the three-tab code block, the key line, a link to `/docs`.
5. Closing band: one sentence and one action; the footer with the disclosure.

Never on this page: customer or investor mentions, a "trusted by" or logo row, testimonials, user counts, a speed, cost or accuracy comparison, "world model", "beats the market", any backtest number.

## Focus, motion, accessibility

Focus is always visible: 2px `--focus` outline, 2px offset. Targets are 44px. One `h1`, then `h2` sections, then `h3` items; landmarks `header`, `nav`, `main`, `footer`; a skip link first.

Motion explains a change; it never decorates.

- Allowed: hover and press (120ms), tab and disclosure change (200ms), a drawer or dialog opening (240ms), a new result row appearing (opacity only, 200ms), a fork's day-by-day progress, the globe's single self-running pulse (one per page).
- Easing `cubic-bezier(0.2, 0, 0, 1)`; only `opacity` and `transform` animate; nothing longer than 320ms; nothing loops except the globe pulse and a skeleton's 1.2s opacity pulse.
- No scroll-triggered reveals, parallax, auto-playing carousels or number count-ups.
- `prefers-reduced-motion` removes every transition and the pulses; the still poster and static skeleton remain.

## Dark mode

Same roles, values in the Tokens table. Rules: the receipt keeps its light paper in a saved image; code blocks use `--paper-2`; the still globe poster is inverted by filter as today; no pure black (`#000`) or pure white text; a screenshot at 390 and 1440 in both themes is part of every UI PR.

## Beyond the app

- Share images (`web/src/share.ts`) draw a receipt with token values read from `tokens.css`, the same anatomy as the card.
- The API docs page (`web/src/Docs.tsx`) follows the Docs and Code blocks rules above and is rendered from `api/openapi.json`; the API's text endpoints (`/llms.txt`, `/docs` redirect) carry the same operation summaries.
- A 404, a refused request and an error read the same on every surface: one sentence, what happened, what to do.

## Checks to change with this direction

The implementation PRs, not this one, update these. Until they land, the mechanical guards still enforce the earlier values.

- `scripts/check_design.py`: `--radius` becomes 4px; allow `1px` and `1.5px` borders only; keep one shadow and three weights; add `CodeBlock`, `Tabs` and `DataTable` to the duplicate-component guard.
- `web/src/theme.test.ts`: contrast of every token pair in both themes; `--line-strong`, `--accent-wash`, `--clay-wash` exist in both files.
- A Playwright run at 390 and 1440, light and dark, on `/`, `/docs`, `/developers`: no horizontal page scroll, no layout shift when a skeleton is replaced (CLS under 0.05), focus visible on every control.

## Words on a surface

Follow `gtm/messaging.md` for voice and claims and `product/glossary.md` for terms. Status is literal: what happened and when it takes effect, no anthropomorphised phrasing, no exclamation marks, no emoji. Full stops end sentences; a label or stamp has none.

## Screenshot comparison

A PR that changes `web/src` UI includes screenshots at 390 and 1440 px (`pr-quality.yml`). Put them beside the reference shots above and check: gutter, heading sizes, border weight, stamp colour, button states, the disclaimer and tier, dark mode. The `consistency-reviewer` agent does this on every `/ship-pr`.
