# Design pass: copy

Produced with the design:ux-copy skill, then checked line by line against [gtm/messaging.md](../../gtm/messaging.md). The literal copy for the whole page lives in [product/landing-page.md](../../product/landing-page.md); this file records only what the design pass changes and why.

## Recommended copy

| Element | Copy | Why |
| --- | --- | --- |
| Contrast line (under the subline) | No accuracy claim. Read the receipts. | States what we do instead of the claim competitors make. Matches the line in messaging.md ("Do not trust our accuracy claim either. Read the receipts."). Names no one. |
| Secondary action | See the receipts | Verb first, says where it goes. Scrolls to the receipt strip. |
| Primary action | Join the waitlist | Unchanged, same name in the hero, header and repeat band. |
| Receipt strip heading | The first receipts. | Unchanged. |
| Receipt strip note | These are the events {BRAND} will forecast first. No hashes or probabilities are shown here yet. The record starts when the first forecast is hashed. | Same facts, em dash replaced by a full stop. |
| Card status | Pending | Sentence case, replaces the all-caps stamp. |
| Card columns | Committed: "Hash publishes Oct 14" or "Awaiting hash". Resolves: the date and the source. | "Committed" and "Resolves" are the two moments the product is about. No hash or number is shown. |
| Card footer | AI-simulated. Not a poll. | Required disclosure, shortened. |
| Invalid email | Enter an email address like you@email.com. | Unchanged. |
| Server or network error | That didn't save. Check your connection and try again. | Same advice, no em dash. |
| Bot check failed | We couldn't confirm you're human. Reload the page and try again. | New. Says what happened and the fix. |
| Rate limited | Too many tries from this device. Wait a few minutes and try again. | New. Says why and when to retry. |
| Loading | Saving… | Unchanged. |
| Duplicate and success | Unchanged from the spec. | Already specific, one action each. |

## Alternatives considered for the contrast line

| Option | Copy | Verdict |
| --- | --- | --- |
| A | No accuracy claim. Read the receipts. | Chosen. Shortest, safe. |
| B | Don't take our word for it. Read the receipts. | Softer, but "our word" invites the question what we are claiming. |
| C | We publish our misses. | Already a headline variant (`public-score`); would repeat it. |

## Localization notes

None needed for launch (US only, English). Avoid translating "receipt" as a purchase receipt; it means a record you can check.
