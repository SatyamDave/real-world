# UI audit of the current landing page (no code written for this)

Date 2026-10-13. Page: `landing/7-sections` at 4bd815a, which includes Satyam's cookie notice. Screenshots: [`satyam-diff/ours-home-390*.png` and `ours-home-1440*.png`](satyam-diff/), his UI beside it (`theirs-home-*`). Facts below were measured from the built page or read from the screenshots; opinions are marked. Inputs read: `INSPIRATION.md`, `DESIGN-PASS.md`, `DECISIONS.md`, `MORNING.md`, `gtm/messaging.md` (including the new "sealed" sub-line), `product/landing-page.md`, `product/design.md`, [SATYAM_DIFF.md](SATYAM_DIFF.md), and the product memo Satyam pasted on 2026-10-13 (its lesson is used in the last section; none of its internal content is quoted on the page).

## Verdict

The page is correct, honest and accessible, and it is not impressive. Rohit's disappointment is fair. It reads as a well-set document: a headline, paragraphs, a form, ruled text lists. The one object that could make a visitor stop, the globe, is a decoration that does not respond to a touch. The page asks a visitor to read about a record when it could let them hold one.

## First screen

| # | Finding | Evidence | Severity |
| --- | --- | --- | --- |
| 1 | On a 390x844 phone the first screen has no primary action visible. The email field is cut off by the cookie notice, and the notice is a full-width box that sits over the form. | `ours-home-390-fold.png`: the field's top edge shows, the button is below the fold, the notice covers the rest. | Critical. It blocks the one conversion the page exists for. |
| 2 | On a 1440x900 desktop the cookie notice floats in the middle of the viewport over "The first receipts." heading, not at an edge. | `ours-home-1440-fold.png` | High |
| 3 | The hero has nine elements before the receipts: eyebrow, H1, a four-line sub, a dashed rule, a bold defensive line ("No accuracy claim. Read the receipts."), a field label, the field, two buttons, a legal note. | measured from the DOM order and the screenshots | High. Display type should carry the screen. |
| 4 | The globe is the heaviest thing on the page: a saturated filled green sphere with a glow, bigger visual weight than the H1, plus two floating label chips. Satyam's is a pale sphere with green dots and nothing else. | `ours-home-1440-fold.png` against `theirs-home-1440-light.png` | High |
| 5 | The globe does nothing. It cannot be dragged, zoomed or tapped; the markers are three red dots with no way to open the receipt they stand for. The receipts live in a separate strip below with no link to the markers. | `src/components/Globe.tsx` has no pointer handling; `phi` only advances by itself, and nothing listens for a pointer | Critical for a brief that says the globe is the hero |
| 6 | Two equal-weight buttons side by side ("Join the waitlist", "See the receipts") split the one action. | `ours-home-1440-fold.png` | Medium |

## The page as a story

| # | Finding | Evidence |
| --- | --- | --- |
| 7 | After the receipts every section is the same shape: a heading, a muted note, rows of text. There is no artifact in any of them. `product/design.md` asks each block for one artifact from committed data (a real receipt, a real date). The page has one artifact, the receipt cards, and then eleven paragraphs. | `ours-home-1440.png` below the strip |
| 8 | The thesis statement is the only moment of scale. It is good and then it is not followed through. | `ours-home-1440.png` |
| 9 | The visitor is a spectator for the whole scroll. The product memo's evidence (and the repo's own note 076) says watching a simulation retains no one, having a stake does. The one stake on the page is the Tally question, and it appears only after the email is saved, below the fold on phones. | `TallySlot` renders only in the success state |
| 10 | Heavy 1.5px ink rules under every step, ledger row and column (my own Milestone B work). If everything is heavy, the receipt, the brand shape, stops being special. | `global.css` `.steps li`, `.ledger-row`, `.claims-title`: 1.5px `--ink` |

## Craft

| # | Finding | Evidence |
| --- | --- | --- |
| 11 | Eleven distinct font sizes, four fluid clamps and three off any scale (15, 17, 22 px). | counted with `grep -o "font-size:" global.css` |
| 12 | Section spacing is 48px, so sections run together; the reference rhythm is 96px (64px on phones). | computed padding on `.section` |
| 13 | No dark theme, while the system default for many visitors is dark. | no `prefers-color-scheme` rule |
| 14 | Em dashes in the hero and how-it-works copy, which the voice rule bans. | `headlines.ts`, `HowItWorks.tsx` |
| 15 | The Tally form, when embedded, inherits Tally's default blue button, which clashes with the palette. | `design/phase1/tally-demo-390.png` |
| 16 | The header has a button but no rule, so the top of the page has no edge. | `ours-home-1440-fold.png` |

## What is already good (keep)

The palette and type pairing (Satyam's UI uses the same), the receipt anatomy with a torn edge and pending stamp, honest copy checked against `gtm/messaging.md`, the accessibility work (axe clean, skip link, reduced motion), the pre-rendered first paint, and the single waitlist call to action.

## What the redesign must do

1. Put an action on the first screen on a phone, and give consent a slim, edge-docked bar that never covers the form.
2. Make the globe the interactive hero (drag with inertia, pinch and button zoom, reset, keyboard, tap a marker to open its receipt) and keep it calm: pale sphere, green dots, clay markers.
3. Make a marker's receipt end in the stake: "Make your call" focuses the waitlist field. The globe becomes a way into the personal call, not a spectacle.
4. Cut the hero to the H1, one lead, the field and one primary action; lower every other element to where it earns its place.
5. Give each lower section one artifact from committed data.
6. Adopt the discipline in [SATYAM_DIFF.md](SATYAM_DIFF.md): one type scale, 96/64 spacing, hairline chrome with the receipt as the only heavy object, a sticky top bar, dark mode, one voice.
7. Hold the budgets in the brief: poster first, the interactive layer after first paint on capable devices only, a static fallback always.
