# Design reference

One look for every surface: the app in `web/`, the landing page, share images, ads, the API docs page and any text the API serves. The look is "Neutral" (founder direction, 2026-10-12): simple like production tools such as Jev and Linear, defined by `web/src/styles/tokens.css`, which the landing page adopts when it merges. It replaced the landing design "Commit Slip" (direction A) by rovivek, still readable with git for history:

- Rationale and the receipt anatomy: `git show origin/landing/design-pass:landing/design/DESIGN-PASS.md`, `COPY.md`, `A11Y-REVIEW.md`
- Reference shots: `landing/design/shots/after-desktop-full.png` (1440) and `after-mobile-full.png` (390) on `origin/landing/design-pass`; extract with `git show <ref>:<path> > /tmp/x.png`
- The CSS it was built from: `landing/src/styles/{tokens,fonts,global}.css` on `origin/landing/5-readiness`

What follows is that design written as rules a change can be checked against. `scripts/check_design.py` enforces the mechanical ones.

## Direction (2026-10-12)

Founder direction: the look of a top-tier deep-tech product: precise type, generous whitespace, one accent, crisp data, motion only where it explains. Evidence and per-site rules: [research/product/107](../research/product/107-design-direction-references.md) (TypeSafe, OpenAI developers, Cloudflare Workers AI, Linear, Perplexity). The decisions:

1. Neutral and plain: white surfaces, gray text, 1px `--line` borders, 8px radius, generous whitespace (24px card padding), one big `h1` and muted secondary text. No torn edges, no dashed rules, no boxed stamps, no all-mono labels.
2. One accent, indigo `--accent`, for primary actions, links, focus and positive data; amber `--accent-2` only for pending or a warning, sparingly. The system sans (Inter where installed) for reading and IBM Plex Mono for hashes and numbers only. No new font files, no gradient, no illustration, no emoji.
3. Polish only: no claim, number, logo, customer, funding or traction appears that is not on the allowed list in [messaging](../gtm/messaging.md) or traced to a committed artifact. No testimonial or "trusted by" row, ever.
4. A change to these rules lands here first, in its own PR, citing a research note; then in each surface.

## Identity: message testing for consumer founders (2026-10-13)

Real World is message testing for consumer (B2C) founders: test a launch, a price, a headline or an ad line on your ideal customer, in 27 segments beside a plain baseline, before you ship it ([decision 0016](../research/decisions/0016-icp-audiences.md)). Every run is a result card; the sealed public record of daily forecasts is the track record behind it.

- The top bar is the chrome: no sidebar and no ledger tape. The first screen says who the product is for.
- The founder is the hero: the home's first screen says who it is for, what it simulates for them and what to do ("Test your message on your ideal customer before you ship it.", "Test my message"), with a labelled example result beside the message box. The public record is one link.
- Each result is a plain card: a header row with its kind and a status pill, the input quoted on a `--paper-2` fill, the population drawn as data, the seal small at the foot.
- The seal is visible: `SealGrid` draws the 64 hex digits of a SHA-256 as an 8 x 8 grid in `--paper-2`, `--line`, `--muted` and `--accent`; unsealed is the same grid empty with `--line` outlines.
- Mono for numbers and hashes only; a tier badge wherever a country appears in the public record; the accent for sealed, verified and "would like or share"; amber only for pending and warnings. Status pills ("Sealed", "Not sealed", "Resolved") are small: neutral on `--paper-2`, or accent-tinted for a good state. No all-caps, no letter-spaced eyebrow.
- Retired phrases, on no surface: "Learn to simulate", "Real World in action", "Quickstart", "Primitive", "Playground", "Example requests", "Walkthrough lessons", "Real-life use cases", "Instructions", "Example output". "Primitive" stays only as an internal type name and glossary term.

## Tokens

`web/src/styles/tokens.css` is a byte-for-byte copy of the landing tokens; `tokens-dark.css` is the dark theme from the same hues. No colour, font, radius or shadow is written anywhere else. Light follows the system (`prefers-color-scheme`); a stored user choice in settings overrides it with `data-theme` on `html`. Both themes ship from the first build of any surface.

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `--paper` | page | `#ffffff` | `#0b0b0d` |
| `--paper-2` | subtle fill: quotes, pills, table header, hover row | `#f6f6f7` | `#1b1b1f` |
| `--surface` | cards, inputs, menus | `#ffffff` | `#141417` |
| `--ink` | text | `#111113` | `#ededf0` |
| `--muted` | secondary text, labels, feet | `#6b6b76` | `#9a9aa5` |
| `--line` | the 1px hairline: borders, dividers, table rules, chart gridlines | `#e6e6ea` | `#26262c` |
| `--accent` | primary actions, links, focus, sealed, verified, positive data | `#4f46e5` | `#818cf8` |
| `--accent-2` | pending, warning, destructive; sparingly | `#d97706` | `#f59e0b` |
| `--on-accent` | text on an `--accent` or `--ink` fill | `#ffffff` | `#0b0b0d` |
| `--focus` | 2px outline, 2px offset | `--accent` | `--accent` |
| `--radius` | 8px on everything with a radius; `0` and `50%` are the only others | | |
| `--card-shadow` | cards: `0 1px 2px` at 6% ink; none in dark | | |

Semantic colour is one accent and one warning: indigo means act, sealed or positive; amber means pending or careful. Charts and data visuals use the accent and neutral grays only. Contrast: text at least 4.5:1, borders that carry meaning at least 3:1, in both themes.

## Type

The system sans (`"Inter", ui-sans-serif, system-ui`) for reading, IBM Plex Mono for hashes, numbers and code. Weights 400, 500, 600 only. One scale, no value outside it:

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
| Primary button | filled `--accent` with `--on-accent` text, 8px radius, 16px 600, 44px min height; hover darkens the accent; active 1px down; disabled 0.6 opacity; one per view |
| Secondary button | `--surface` with a 1px `--line` border, 14px 600; hover `--paper-2` |
| Text action | `button.link`, underlined, 3px offset |
| Card | `--surface`, 1px `--line` border, `--radius`, 24px padding, `--card-shadow`; whole-card links fill `--paper-2` on hover |
| Result card (`.receipt`) | the card with a header row (kind, status pill) over a 1px `--line` rule; no torn edge, no dashed rule |
| Status pill (`.stamp`) | 12px 500, 2px 8px padding, `--radius`; `--muted` on `--paper-2`, or `.good`: `--accent` on a 12% accent tint |
| Stamp | unchanged |
| Input | 16px, 12px 14px padding, 1px `--line-strong` border, `--surface`; focus is the 2px `--focus` outline; the post box placeholder is "Paste a tweet, a caption, a headline or a hook" |
| Tabs | underline tabs, not pills: 14px 500, 2px `--ink` underline on the active tab, `role="tablist"`, arrow-key navigation, 44px height; the chosen tab persists per surface in `localStorage` |
| Inline code | Mono 14px, `--paper-2` fill, `--radius`, 2px 6px padding |
| Table | full width, no vertical rules, 1px `--line` between rows, header row 12px `--muted` on `--paper-2`, 48px row height at 1024px and up, mono right-aligned numerals, sticky header when the body scrolls; at 390px a row becomes a stacked card list or the table scrolls inside its block with the first column sticky |
| Nav item (docs, settings) | 14px, 36px row; active has `--accent-wash` fill and 2px `--accent` left rule |
| Callout | `--paper-2` fill, 1px `--line` border, 14px text; the only coloured variant is amber `--accent-2` for a refusal or an error; no icon, no emoji |
| Header | a top bar. `.topbar`: 56px high, bottom `--line`, brand, nav (Simulate, Your tests, Public record, How it works) with `aria-current="page"` underlined 2px `--ink`, then Sign in or the account; sticky. At 720px and below the nav takes a second row that scrolls inside itself |
| `SealRow` | `App.tsx`: the one seal line: a `.lg` `SealGrid` left, 12px gap, `align-items: center`, then two lines: a 14px 500 title and a mono 12px line with the hash and where to check it. Used on the home's day record and Today's question, on Call it and at the foot of the post test |
| `.button` | a link drawn as the button (`.button.primary` filled), for the one next action when it is a page: "Make your call", "Sign in to start your record" |
| `SealGrid` | `App.tsx`: a SHA-256 as 8 x 8 cells of 8px (`.lg` 12px), shades `s0`..`s3` from `--paper-2`, `--line`, `--muted`, `--accent`; empty with `--line` outlines when there is no hash (4px cells in a receipts day row). On the sealed message test, the AI's sealed call and the home's day record |
| `PopulationField` | `results.tsx`: 100 dots split across segments by population weight (largest remainder), filled `--accent` where the segment would like or share it, empty as a `--line` ring; 20 x 5 at 720px and up, 10 x 10 below |
| `MixBar` | `results.tsx`: the reaction mix as one stacked bar with labels inside; under 720px the in-bar labels hide and a mono 12px legend row with a swatch per part sits under the bar |
| `SegmentMatrix` | `results.tsx`: country rows (ISO and tier, sticky first column) by age band and education columns, only the columns with at least one asked segment (an age band with none is dropped), mono landing chance shaded `m0`..`m4` (`--surface`, `--paper-2`, `--line`, `--accent` at 35% and 70%); scrolls inside its block at 390px |
| `BeliefShifts` | `results.tsx`: a row per topic, a 0-100% track with the p10-p90 band (at least 2px, `--ink` at 25% on `--surface`), a 2px `--muted` tick at before that runs 6px above and below the track, and a 10px `--ink` dot at the median, and mono "{before} → {after} ({pts}) · p10–p90 {p10}–{p90}", which drops under the track at 720px and below. Call it reuses the track for its resolved strip: you as the filled dot, the AI as a hollow dot, the outcome as the tick |
| Call it | two slips at 1024px and up (7fr 5fr, 32px gap), one column below with "Your call" first; the slider starts unset (a muted thumb, "–", the button disabled reading "Move the slider to call it") |
| Charts | `Chart.tsx`: the svg's viewBox is its measured pixel width, so every chart spans its slip and axis text stays 12px mono at every width |
| Use case list | `Home.tsx` `UseCaseList`: groups by who, rows (not cards) with an outlined mono kind tag, title, sentence and audience; 2 columns of groups at 1024px and up |
| Footer | links (Receipts, Acceptable use, Privacy, Terms, Source), the disclosure, copyright; 44px targets |

## Landing narrative

Since [decision 0012](../research/decisions/0012-will-it-land-and-call-it.md) the landing page and the app's home tell one story, in this order; [landing-page.md](landing-page.md) holds the positioning rules. Each block is a headline, one lead sentence, and one artefact from real data; no stock imagery, no decoration.

1. Hero: "Test your message on your ideal customer before you ship it.", who it is for, what it simulates, and the message box itself as the one primary action ("Test my message"). The still globe poster may sit beside it as decoration, never as the action.
2. The result: a real message test card (would act with its range, the baseline beside it, the objections, best and worst segments, the rewrite) and the seal line.
3. Real results: a marked test with its real metric, and the backtest.
4. Proof: the latest receipts and the score card with its n, "No claim yet" until the rule allows one, linking `/receipts` and `/scores` as the "Public record".

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

- `scripts/check_design.py`: `--radius` is 8px (Neutral) and borders are 1px; keep one shadow and three weights; add `CodeBlock`, `Tabs` and `DataTable` to the duplicate-component guard.
- `web/src/theme.test.ts`: contrast of every token pair in both themes; `--line-strong`, `--accent-wash`, `--clay-wash` exist in both files.
- A Playwright run at 390 and 1440, light and dark, on `/`, `/docs`, `/developers`: no horizontal page scroll, no layout shift when a skeleton is replaced (CLS under 0.05), focus visible on every control.

## Words on a surface

Follow `gtm/messaging.md` for voice and claims and `product/glossary.md` for terms. Status is literal: what happened and when it takes effect, no anthropomorphised phrasing, no exclamation marks, no emoji. Full stops end sentences; a label or stamp has none.

## Screenshot comparison

A PR that changes `web/src` UI includes screenshots at 390 and 1440 px (`pr-quality.yml`). Put them beside the reference shots above and check: gutter, heading sizes, border weight, stamp colour, button states, the disclaimer and tier, dark mode. The `consistency-reviewer` agent does this on every `/ship-pr`.
