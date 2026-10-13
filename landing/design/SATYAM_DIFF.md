# Satyam's UI against ours: what makes his better

Compared 2026-10-13. His UI is `web/` at `origin/main` a698ebd (home route `/`, plus `/receipts`, `/docs`, `/privacy`, `/terms`), built with `vite --mode fixtures` because no API was running, so his home shows "Try again" errors where data would be. Judge the layout, tokens and hierarchy, not the content. Ours is `landing/7-sections` (4bd815a, which includes his cookie notice). Screenshots: [`satyam-diff/`](satyam-diff/) (`theirs-home-*`, `ours-home-*`; his in light and dark). Computed styles were read from both pages at 1440 light. His rules are written down in [`product/design.md`](../../product/design.md) and its research in [`research/product/107`](../../research/product/107-design-direction-references.md); his UI started from our direction A, so the tokens already agree (same hexes, same IBM Plex pair, same 64px display size). The differences are structure, weight and discipline.

Only patterns and tokens are adopted. No component, bundle or file from `web/` is imported (his globe is `react-globe.gl` on three.js; ours stays cobe).

## What makes his better, and why it works

| # | His UI | Ours before | Why his reads better | Adopt |
| --- | --- | --- | --- | --- |
| 1 | A sticky 64px top bar with a full-width 1.5px hairline under it; brand left, nav right with a 2px ink underline on the current item | A floating brand and a filled "Join the waitlist" button, no rule | The rule defines the top of the page and gives the eye a fixed edge; the header stops competing with the hero for the one action | Yes, as a sticky bar with the rule; the button moves into the bar only after the hero's field has scrolled out |
| 2 | Hero is the display H1, one lead of two short sentences, then the artifact | Eyebrow, H1, a four-line sub, a dashed rule, a bold contrast line, a label, a field, two buttons, a small note (nine elements before the receipts) | One idea per screen; display type does the work. Ours spends the first screen on explaining before the visitor has a reason to read | Yes: cut the eyebrow's second sentence, the contrast line and the field label from the hero (each is kept lower on the page or in the field's own label) |
| 3 | Lead copy from the one-liner in `gtm/messaging.md`: "AI simulates how the world reacts to the news. Every forecast is sealed before the outcome and scored in public." | "Every morning Real World simulates ... We hash each forecast ... the misses too." with an em dash | Plain words; "sealed" is messaging.md's plain word for hashed and anchored; no dash chain. It is also the source of truth that every surface must share | Yes: the default headline's sub-line becomes messaging.md's sub-line; the other three ad headlines keep their own subs |
| 4 | The globe is a calm, larger object: a pale sphere (`--paper-2` ocean) with green dots for land, nothing filled or glowing | A saturated green filled sphere with a heavy glow and two floating chips; it outweighs the H1 | One accent used sparingly; a quiet globe lets the headline lead and makes any marker or receipt on it stand out | Yes: pale sphere, green dots, clay markers only |
| 5 | Hairline cards (1px `--line`); the receipt is the only heavy object (1.5px ink, torn edge, shadow) | 1.5px ink rules under every step, ledger row, claims column and thesis (I added most of these in Milestone B) | If everything is heavy nothing is. The receipt is the brand shape; it only works when it is rare | Yes: all section rules become 1px `--line`; ink rules stay on the receipt only |
| 6 | Section rhythm of 96px (64px on phones) with one 1px rule between sections | 48px, so sections run together | Whitespace groups content; it is also what makes the page feel expensive | Yes |
| 7 | One type scale: 56 / 40 / 28 / 20 / 18 / 16 / 14 / 12, tracking -0.03em only on display sizes, sizes only from the scale | Eleven distinct sizes in `global.css` (counted), four of them fluid clamps and three off any scale (15, 17, 22) | A short scale is what makes pages look designed instead of tuned | Yes: map every size to the scale |
| 8 | One primary action per view; secondary actions are underlined text actions | Two equal-width bordered buttons side by side in the hero | A single dominant action is also our own brief; two buttons split attention | Yes: "See the receipts" becomes a text action |
| 9 | Dark theme from the same hues, following the system; both themes ship in the first build | None | Visitors on dark phones get a page that was designed for them, and the globe poster flips by filter | Yes: dark tokens, system preference only (no toggle) |
| 10 | A footer that is the site map: links, then the disclosure, then the copyright, all with 44px targets | A short link row | Proof is one click away on every page | Partly: columns where it helps, only for pages that exist on our site (Privacy, Terms, the record when it exists) |
| 11 | Voice rules: sentence case, no em dashes or middle dots, full stops end sentences, literal status | Em dashes in the hero and how-it-works copy | One voice across surfaces | Yes: remove em dashes from page copy |
| 12 | Tabular numerals and Mono for data, right-aligned | Mono only for hash status strings | Dates and counts align | Yes, on the receipts |
| 13 | Calm motion: only the globe's single pulse, hover and focus | Chips fading in, plus the pulse | Motion that explains instead of decorating | Yes: chips go (markers become the interaction) |

## What is ours and stays

The interactive globe (his is a separate component in the app and does not exist on his landing page yet), the receipt strip with pending states, the thesis, use cases and research sections, the single waitlist call to action, the Tally form, no v1 link and nothing that depends on `APP_URL`.

## Where his rules and Rohit's brief collide

His `design.md` bans scroll-triggered reveals, parallax, gradients and anything that loops except the globe pulse. Rohit's Phase 2 brief names GSAP ScrollTrigger and Lenis as things to test. This is decided in [`EQUIP.md`](EQUIP.md) and [`DECISIONS.md`](../DECISIONS.md) C5: the page follows `design.md` (a rule change would land in `product/design.md` first, in its own PR), and the boldness is spent on the globe's interaction, which `design.md` does not forbid because it answers a person's action.

## Tokens and the check that guards them

His tokens are in an open PR (#97, `build/design-tokens`), not on `main`, and `scripts/check_design.py` requires `web` and `landing` `tokens.css` `:root` blocks to be identical. So the new tokens (`--line-strong`, `--accent-wash`, `--clay-wash`, the type and space scales) are mirrored from #97 into `landing/src/styles/tokens-next.css`, which the guard allows, and the swap to a byte-for-byte `tokens.css` is one commit once #97 merges. Radius stays 2px until then.
