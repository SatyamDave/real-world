# Design reference

One look for every surface: the app in `web/`, the landing page, share images, ads, the API docs page and any text the API serves. The source is the landing design "Commit Slip" (direction A) by rovivek. Until the `landing/*` branches merge, read it with git, never by checking out or editing those branches:

- Rationale and the receipt anatomy: `git show origin/landing/design-pass:landing/design/DESIGN-PASS.md`, `COPY.md`, `A11Y-REVIEW.md`
- Reference shots: `landing/design/shots/after-desktop-full.png` (1440) and `after-mobile-full.png` (390) on `origin/landing/design-pass`; extract with `git show <ref>:<path> > /tmp/x.png`
- The CSS it was built from: `landing/src/styles/{tokens,fonts,global}.css` on `origin/landing/5-readiness`

What follows is that design written as rules a change can be checked against. `scripts/check_design.py` enforces the mechanical ones.

## Tokens

`web/src/styles/tokens.css` is a byte-for-byte copy of the landing tokens; `tokens-dark.css` is the product's dark theme built from the same hues. No colour, font, radius or shadow is written anywhere else.

| Token | Role |
| --- | --- |
| `--paper`, `--paper-2` | page; raised or alternate background |
| `--surface` | cards, inputs |
| `--ink`, `--muted` | text; secondary text, labels, footers |
| `--accent` (green) | committed, verified, resolved, hover on the primary button, step labels, globe land |
| `--accent-2` (clay) | pending, error, refused, globe event pulses |
| `--line` | borders, dividers, dashed rules |
| `--focus` | the 2px focus outline, offset 2px |
| `--radius` | 2px, on everything that has a radius (`0` and `50%` are the only others) |
| `--card-shadow` | the one shadow; an inset ring is a border, not a shadow |

## Type

IBM Plex Sans for everything people read; IBM Plex Mono only for values that are data (hashes, dates, commit times, sources, numbers in a receipt). Weights 400, 500, 600 only; `fonts.css` loads nothing else.

| Role | Size | Weight | Tracking |
| --- | --- | --- | --- |
| Page headline | clamp(40px, 6.4vw, 64px), line height 1.02 | 600 | -0.035em |
| Section title | clamp(26px, 4vw, 32px) | 600 | -0.025em |
| Item title (card question, step) | 20px or 16px | 500 or 600 | normal |
| Body | 16px, line height 1.5 | 400 | normal |
| Secondary, labels, feet | 14px and 12px, `--muted` | 400 | normal |

No all-caps labels, no letter-spaced small caps, no eyebrow above a section title. Headings, buttons and stamps are sentence case.

## Layout and spacing

Content column 1120px, 24px side gutter at every width, left aligned except a centred call-to-action band. Spacing uses 4px steps: 4, 8, 12, 16, 24, 32, 48, 64. Sections are separated by a 1.5px `--line` rule and 48px padding. Line length stays under 70 characters (`max-width` in `ch`).

Borders are 1.5px: `--ink` on cards, inputs and primary elements, `--line` on dividers, dashed `--line` for a printed rule (receipt header, the contrast line).

## Components

One implementation per pattern. In `web/` the implementation is a class in `src/styles.css` and, where it renders data, one component in `src/App.tsx`. A second button style, card style, badge, disclaimer string, loader or error block is a defect; extend the one that exists.

| Pattern | The one implementation | Rules |
| --- | --- | --- |
| Primary button | `button.primary` | filled `--ink`, `--on-accent` text, 16px 600; hover fills `--accent`; active moves 1px down; disabled 0.6 opacity; min height 44px |
| Secondary button | `button` | 1.5px `--ink` outline, transparent, 14px 600, hover `--paper-2` |
| Text action | `button.link` | underlined, offset 3px; used where a button would be noise |
| Card | `.card` | `--surface`, 1.5px `--ink` border, `--radius`, 20px padding; `--card-shadow` only where a card is lifted |
| Receipt | `.card.receipt` | the card with a printed header (`.receipt-top`, dashed rule), question, `.receipt-cols` in mono, foot in `--muted`; the torn bottom edge is the one memorable shape and appears nowhere else |
| Stamp | `.stamp` | 12px, 600, 1.5px border; clay `Pending`, green `.stamp.good` for committed or verified; sentence case |
| Coverage tier | `TierBadge` | `.tier .tier-A` to `.tier-D`; always next to a country or result |
| Disclaimer | `Disclosure` with `DISCLOSURE` | the one string, on every result view, with the tier |
| Loading | `Loading` | `.skeleton`, literal status "Loading <what>" |
| Error | `LoadError` | `.load-error`, says what did not load and what to do |
| Input, textarea, select | element selectors | 16px, 14px 16px padding, 1.5px `--ink` border, `--surface` |
| Chip (toggle) | `.chip` | pressed state `aria-pressed="true"` is `--paper-2` with a 1px inset `--ink` ring |
| Header | `.topbar` | brand, date, nav with `aria-current="page"` |
| Footer | `.site-footer` | links, the disclosure, copyright, 44px targets |
| Not found | `.notfound` | one line saying the path does not exist and a link home |

Formatting helpers live once in `src/App.tsx`: `pct`, `pts`, `usd`, `shortDate`, `plural`, `topicLabel`. Dates are ISO (`2026-10-28`) where they are data and `shortDate` where they are prose; probabilities are whole percent; dollars show two decimals or "under 1 cent".

## States

Every view shows one of: loading (`Loading`), empty (one sentence saying there is nothing yet and when there will be), result, refused (the API's `detail` sentence, in `--accent-2`), error (`LoadError`). No state exists for something that only happens when the product is broken; fix the cause.

## Focus, motion, accessibility

Focus is always visible: 2px `--focus` outline, 2px offset. One self-running motion per page at most (the globe pulse and its chips); everything else answers the visitor. `prefers-reduced-motion` turns motion off and keeps the still poster. Targets are 44px. One `h1`, then `h2` sections, then `h3` items; landmarks `header`, `main`, `footer`; a skip link.

## Dark mode

The landing design has no dark theme. `tokens-dark.css` keeps the same roles with lifted hues; every element must read in both, and a change to `tokens.css` changes `tokens-dark.css` in the same PR.

## Beyond the app

- Share images (`web/src/share.ts`) draw a receipt with token values read from `tokens.css`, the same anatomy as the card.
- The API docs page (`web/src/Docs.tsx`) is a product page in this theme, not Swagger. The API's own text endpoints (`/llms.txt`, `/docs` redirect) carry the same operation summaries as `api/openapi.json`.
- A 404, a refused request and an error read the same on every surface: one sentence, what happened, what to do.

## Words on a surface

Follow `gtm/messaging.md` for voice and claims and `product/glossary.md` for terms. Status is literal: what happened and when it takes effect, no anthropomorphised phrasing, no exclamation marks, no emoji. Full stops end sentences; a label or stamp has none.

## Screenshot comparison

A PR that changes `web/src` UI includes screenshots at 390 and 1440 px (`pr-quality.yml`). Put them beside the reference shots above and check: gutter, heading sizes, border weight, stamp colour, button states, the disclaimer and tier, dark mode. The `consistency-reviewer` agent does this on every `/ship-pr`.
