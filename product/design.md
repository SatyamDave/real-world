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

## Identity: the ledger desk (2026-10-12)

Real World is a public ledger of simulated countries; every run prints a sealed slip from it ([decision 0014](../research/decisions/0014-ledger-desk.md)).

- The ledger is the chrome: no sidebar. A top bar, and under it the ledger tape, one mono 12px `--muted` line on `--paper-2` with the last cycle, the ledger head, the anchor, the model and today's spend. Every page sits under it.
- The populations are the hero: the home shows the 16 simulated countries with their coverage tier and one belief's simulated share.
- Each result is a slip (the receipt): the input quoted in mono at the top, the population drawn as data, the seal drawn at the foot.
- The seal is visible: `SealGrid` draws the 64 hex digits of a SHA-256 as an 8 x 8 grid in four shades of `--ink`; unsealed is the same grid empty and dashed.
- Mono for every number, hash, ISO code and the tape; dashed `--line` rules inside slips; torn edge only on slips; a tier badge wherever a country appears; green only for sealed, verified and "would like or share"; clay only for pending, not sealed and refused. No all-caps, no letter-spaced eyebrow.
- Retired phrases, on no surface: "Learn to simulate", "Real World in action", "Quickstart", "Primitive", "Playground", "Example requests", "Walkthrough lessons", "Real-life use cases", "Instructions", "Example output". "Primitive" stays only as an internal type name and glossary term.

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
| Input | 16px, 12px 14px padding, 1px `--line-strong` border, `--surface`; focus is the 2px `--focus` outline; the post box placeholder is "Paste a tweet, a caption, a headline or a hook" |
| Tabs | underline tabs, not pills: 14px 500, 2px `--ink` underline on the active tab, `role="tablist"`, arrow-key navigation, 44px height; the chosen tab persists per surface in `localStorage` |
| Inline code | Mono 14px, `--paper-2` fill, `--radius`, 2px 6px padding |
| Table | full width, no vertical rules, 1px `--line` between rows, header row 12px `--muted` on `--paper-2`, 48px row height at 1024px and up, mono right-aligned numerals, sticky header when the body scrolls; at 390px a row becomes a stacked card list or the table scrolls inside its block with the first column sticky |
| Nav item (docs, settings) | 14px, 36px row; active has `--accent-wash` fill and 2px `--accent` left rule |
| Callout | `--paper-2` fill, 1px `--line` border, 14px text; the only coloured variant is clay for a refusal or an error; no icon, no emoji |
| Header | a top bar with the ledger tape beneath it. `.topbar`: 56px high, bottom `--line`, brand, nav (Simulate, Call it, Your record, Receipts, Scores) with `aria-current="page"` underlined 2px `--ink`, then Sign in or the account; sticky. At 720px and below the nav takes a second row that scrolls inside itself. `.tape`: the ledger tape, one line with ellipsis at 720px and up, wrapping below |
| `SealGrid` | `App.tsx`: a SHA-256 as 8 x 8 cells of 8px (`.lg` 12px), shades `s0`..`s3` from `--paper-2`, `--line`, `--muted`, `--ink`; empty and dashed when there is no hash. On the sealed post test, the AI's sealed call and the home's day record |
| `PopulationField` | `results.tsx`: 100 dots split across segments by population weight (largest remainder), filled `--accent` where the segment would like or share it, empty as a `--line` ring; 20 x 5 at 720px and up, 10 x 10 below |
| `SegmentMatrix` | `results.tsx`: country rows (ISO and tier, sticky first column) by age band and education columns, mono landing chance shaded `m0`..`m4` (`--surface`, `--paper-2`, `--line`, `--accent` at 35% and 70%); scrolls inside its block at 390px |
| `BeliefShifts` | `results.tsx`: a row per topic, a 0-100% track with the p10-p90 band in `--line`, a 2px `--muted` tick at before and a 12px `--ink` dot at the median, and mono "{before} → {after} ({pts})" |
| Use case list | `Home.tsx` `UseCaseList`: groups by who, rows (not cards) with an outlined mono kind tag, title, sentence and audience; 2 columns of groups at 1024px and up |
| Footer | links (Receipts, Acceptable use, Privacy, Terms, Source), the disclosure, copyright; 44px targets |

## Landing narrative

Since [decision 0012](../research/decisions/0012-will-it-land-and-call-it.md) the landing page and the app's home tell one story, in this order; [landing-page.md](landing-page.md) holds the positioning rules. Each block is a headline, one lead sentence, and one artefact from real data; no stock imagery, no decoration.

1. Hero: "Will this land?", the sub-line from [messaging](../gtm/messaging.md), and the post box itself as the one primary action ("Test it"). The still globe poster may sit beside it as decoration, never as the action.
2. The result: a real post test card (landing chance with its range, best and worst audiences with tiers, two simulated accounts, the rewrite) and the seal line.
3. Call it: today's question with "The AI's call is sealed" and its leaf hash.
4. Proof: the latest receipts and the score card with its n, "No claim yet" until the rule allows one, linking `/receipts` and `/scores`.

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
