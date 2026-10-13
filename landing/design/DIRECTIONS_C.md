# Milestone C: three directions, scored against the audit

Inputs: [UI_AUDIT.md](UI_AUDIT.md), [SATYAM_DIFF.md](SATYAM_DIFF.md), [EQUIP.md](EQUIP.md), the references in [INSPIRATION.md](INSPIRATION.md), and `product/design.md`. All three share Satyam's tokens and rules (IBM Plex, one green, one clay, hairline chrome, the receipt as the only heavy object, no gradient, no scroll-triggered motion, dark theme). They differ in where the boldness is spent. The frontend-design brief says spend it in one place.

## The brief all three must satisfy

An interactive globe as the hero (drag with inertia, pinch and button zoom, reset, keyboard, tap a marker to open its receipt), a primary action on the first screen on a phone, one waitlist call to action, no v1 link, nothing on `APP_URL`, honest pending markers only, and the story the product memo supports: the visitor needs a stake, so a marker's receipt ends in "Make your call".

## Direction 1: The Instrument

The globe is the page. On desktop it is large, to the right and bleeding slightly past the column, with three small controls pinned to its corner and the marker receipts opening as a slip over its lower left. The headline, one lead and the field sit left. On a phone the globe comes first at about 80% of the width, then the headline and the field with the button visible on the first screen.

```
desktop 1440                                   phone 390
+-----------------------------------------+   +-------------------+
| Real World.                             |   | Real World.       |
| Simulations      +-------------------+  |   |   ( globe, drag ) |
| with receipts.   |                   |  |   |    + - reset      |
| lead (2 lines)   |   interactive     |  |   | Simulations       |
| [ email ][Join]  |      globe        |  |   | with receipts.    |
| See the receipts |   o  o        +-+ |  |   | lead              |
|                  |        [slip] | | |  |   | [ email        ]  |
|                  +-------------------+  |   | [ Join waitlist ] |
+-----------------------------------------+   +-------------------+
```

Boldness: the globe's interaction and size. Everything else is Satyam's discipline.

## Direction 2: The Ledger

An editorial page. A very large statement, a modest globe in the right column as one of several artifacts, the receipts as a rail of slips below. Calm and legible, the closest to Satyam's UI. The globe is interactive but small.

```
| Real World.                                |
| A forecast is only worth something if     [globe 360]
| you can check it.                           o o
| lead   [email][Join]                              |
| [slip][slip][slip]  (receipt rail)               |
```

Boldness: the type scale. The globe is demoted, which is what Satyam's memo guesses ("the globe as the home page" may be cut).

## Direction 3: The Slip

The hero is one giant receipt: the headline, the field and the pending question printed on a torn-edge slip, with a dotted globe behind it as the background. Marker taps print a smaller slip.

```
|          +------------------------+       |
|  globe   | Receipt        Pending |       |
| (behind) | Simulations with       |       |
|          | receipts.  [email][Join]|       |
|          +/\/\/\/\/\/\/\/\/\/\/\/\+       |
```

Boldness: the receipt as the whole hero.

## Scores (1 to 5, my judgment; 5 is best)

| Criterion (from the audit) | 1 Instrument | 2 Ledger | 3 Slip |
| --- | --- | --- | --- |
| Delivers the interactive-globe hero (finding 5) | 5 | 2 | 3 |
| Action on the first phone screen (finding 1) | 4 | 5 | 3 (the slip is tall) |
| Fits `product/design.md` (calm, one heavy object, no gradient) | 4 | 5 | 2 (the receipt stops being rare) |
| First-load weight and LCP risk (poster first, globe after paint) | 4 | 5 | 3 |
| Distinct from Satyam's UI and the references | 4 | 2 | 4 |
| Supports a stake (marker to receipt to "Make your call") | 5 | 3 | 3 |
| Accessibility effort (keyboard, text alternative) | 4 | 5 | 3 |
| **Total (out of 35)** | **30** | **27** | **21** |

The Ledger is the safest and the closest to what already exists, so it would not answer Rohit's disappointment. The Slip breaks the rule that makes the receipt work. The Instrument is the only one that makes the globe the interface. It scores below the Ledger on first-screen action and on weight because a bigger globe is more to load and more to fit on a phone; both are handled in the build (button visible above the fold at 390x844; poster first, cobe after paint).

## Decision: Direction 1, the Instrument

Runner-up: Direction 2, the Ledger. Would change our mind: if Satyam and Rohit decide the globe is not the home page (his memo lists "the globe as the home page" among things that may be demoted, as an inference not yet decided), the Ledger is the page to build, and most of this work (tokens, type, sections, the controller) carries over. Logged in DECISIONS C5 to C7.
