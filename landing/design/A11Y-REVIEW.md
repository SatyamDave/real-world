# Accessibility review: design pass

WCAG 2.1 AA review of the redesigned page, run with the design:accessibility-review checklist on 2026-10-12. Automated axe results and measured contrast are in the PR body; this file records the review findings and what was done.

## Findings and fixes

| # | Finding | Criterion | Severity | Fix |
| --- | --- | --- | --- | --- |
| 1 | The receipt cards scroll sideways on a phone, and nothing inside them is focusable, so a keyboard user could not scroll them. | 2.1.1 Keyboard | Major | The scroll region is focusable and named ("First receipts. Scroll sideways.") only while it actually scrolls. On desktop it is not a tab stop. `ReceiptStrip.tsx`. |
| 2 | After a successful signup the form unmounts, which dropped keyboard focus to the page. | 2.4.3 Focus order | Major | Focus moves to the result heading ("You're in." or "You're already on the list."). Test in `SignupForm.test.tsx`. |
| 3 | The error message was not tied to the email field. | 3.3.1 Error identification | Major | The field has `aria-invalid` and `aria-describedby` pointing at the `role="alert"` message. |
| 4 | The two chips on the globe repeat what the receipt cards say, so a screen reader read each event twice. | 1.3.1 Info and relationships | Minor | The chips are `aria-hidden`; the receipt strip carries the same facts. |
| 5 | Card questions were paragraphs inside articles with no heading. | 1.3.1 | Minor | Questions are `h3` under the section `h2`. |
| 6 | The embedded Typeform had no accessible name for its container. | 4.1.2 Name, role, value | Minor | The container is a labelled `section`. |
| 7 | Header button was 40px high; footer links were about 20px high. | 2.5.5 Target size | Minor | Header button `min-height: 44px`; footer links 44px in both directions. |

## Checked and fine

- Language is set (`lang="en"`). Landmarks: header, main, footer, and a labelled footer nav. One `h1`, then `h2` sections and `h3` items. Skip link goes to `#main`.
- Globe: the poster image has descriptive alt text; the canvas has no content and is ignored.
- Motion: with `prefers-reduced-motion` the globe is the still poster, the chips are shown at once, smooth scrolling and button transitions are off. Nothing animates on its own except the one pulse sequence.
- Contrast, computed from the tokens: body text on paper 15:1 or better, muted text 5.4:1 on paper and 6.0:1 on white, the clay "Pending" text 5.9:1, the green step labels 5.4:1, button text 15:1, hover state text on green 5.4:1. The dashed rules are decorative (1.4:1).
- Focus: a 2px green outline with 2px offset on every interactive element.
- `dl`, `dt`, `dd` pairs in the cards are inside `div` wrappers, which HTML allows.

## Not covered

- No screen reader (VoiceOver, NVDA) pass was run; this review is code, computed styles and axe. A manual pass is a follow-up.
- 200% zoom was not tested by hand. Layout was checked at 320px width, which is the same reflow condition.
