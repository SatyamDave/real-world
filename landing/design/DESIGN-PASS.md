# Design pass: plan

Written before any UI change, per the frontend-design skill. Inputs: [INSPIRATION.md](INSPIRATION.md), the three built directions in `direction-a/`, `-b/`, `-c/`, and the scores in [OVERNIGHT_LOG.md](../OVERNIGHT_LOG.md).

## Direction: keep A, "Commit Slip"

Re-scored against the alternates after the competitor analysis (distinct from Aaru and Simile / phone legibility / receipt idea / LCP, each out of 5):

| Direction | Distinct | Phone | Receipt | LCP | Total | What the analysis changes |
| --- | --- | --- | --- | --- | --- | --- |
| A Commit Slip (cool paper, ink, green, clay) | 5 | 5 | 5 | 5 | 20 | Distinct goes 4 to 5. Aaru's hero is saturated blue and Simile's page is warm off-white with an orange-red button ([INSPIRATION](INSPIRATION.md#corrections-to-the-starting-assumptions)). A cool grey-green paper with a green and clay pair sits away from both. |
| B Observatory (dark) | 4 | 3 | 5 | 3 | 15 | Distinct goes 5 to 4. Aaru's lower page is black with grey panels, so a dark page lands closer to it than we assumed. Phone and LCP unchanged. |
| C Almanac | 4 | 5 | 3 | 4 | 16 | No change. The receipt idea reads least. |

The analysis does not clearly say to switch, so we keep A. The scores for B and C changed by one point each on the same evidence; the ranking is unchanged.

## Tokens

Palette (named, all from `tokens.css`, unchanged except where marked):

| Token | Hex | Role |
| --- | --- | --- |
| paper | `#f2f4f3` | page |
| surface | `#ffffff` | receipt cards, input |
| ink | `#15201b` | text, primary button |
| verify | `#2f6f4e` | committed and verified states, globe land |
| clay | `#b23a2e` | pending and error, globe event pulses |
| line | `#cdd3cf` | borders, perforation |

Type: IBM Plex Sans for everything people read; IBM Plex Mono only for values that are data (commit time, hash status, resolve date, source), because those are the receipt's printed fields. Headline 64px desktop and 40px mobile, weight 600, tracking -0.035em, line height 1.02. Body 17px desktop, 16px mobile. No all-caps labels and no eyebrow above section titles.

Layout concept:

```
desktop 1440                          mobile 390
+----------------------------------+  +------------------+
| Real World            (nav CTA)  |  | Real World       |
| headline          +---------+    |  |   (globe, 240px) |
| sub               |  globe  |    |  | headline         |
| contrast line     |  pulses |    |  | sub              |
| [email][Join]  See the receipts  |  | contrast line    |
+----------------------------------+  | [email]          |
| receipt strip: 4 forecast cards  |  | [Join the list]  |
| (perforated, pending)            |  | See the receipts |
+----------------------------------+  +------------------+
| how it works (3) | repeat CTA     |  | card peek ...    |
```

Alignment: left-aligned everywhere except the repeat CTA band, which stays centred. Line length under 70 characters.

## What changes, and why (each ties to a ranked pattern)

1. Receipt strip directly under the hero, where competitors put logos (pattern 1). The "first receipts" section moves up and becomes the credibility device. On mobile it scrolls sideways with snap so the next card peeks (pattern 8).
2. Forecast card anatomy (patterns 3 and 4): status stamp, question, a "Committed" and a "Resolves" column, source, and the AI-simulated line. Perforated bottom edge is the one memorable shape: it is the receipt. No probability, no hash, no score is shown.
3. Hero: globe above the headline on mobile at 240px, right column on desktop (pattern 2). Headline 64/40px, one typeface, tight tracking (pattern 6).
4. A contrast line under the subline that states what we do instead of an accuracy claim.
5. CTA hierarchy (pattern 5): filled "Join the waitlist" with the email field, and a quiet secondary "See the receipts" that scrolls to the strip.
6. Motion (pattern 7): one orchestrated moment. The globe's marker for each tracked event pulses once in turn after the globe is ready, and the anchored chips fade in as their pulse lands. Nothing else animates on its own. Button and focus states answer the visitor. `prefers-reduced-motion` keeps the static poster and no pulses.

## Review of the plan against generic output

- Cool grey-green paper with ink and one green is not the cream-and-terracotta default, and not black with an acid accent.
- Dropped from the current page: the middle-dot meta strings in the receipt header ("RECEIPT · pre-launch") and the all-caps stamp. The stamp now reads "Pending" in sentence case. Dropped the "→" in the secondary action.
- Kept: mono for printed fields. It is content here (the fields of a receipt), not chrome.
- Spent boldness in one place: the perforated receipt. Everything else stays plain. Cards are not identical rounded cards with soft shadows; they have a flat edge, a printed header and a torn bottom.
- Changed after review: the first draft added a numbered "01 02 03" marker to How it works. Removed. It is a sequence (simulate, hash, score) but the step labels already carry the order.
