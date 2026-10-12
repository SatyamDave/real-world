# Builders program

Ten named people who each ship one public thing on the API before Oct 27. Not a community, not an application form. Source for everything below unless marked: [builders program note](../research/product/086-builders-program.md).

## The ten slots, filled by type

| Slots | Type | Where to find them | What they test |
| --- | --- | --- | --- |
| 3 | Forecasting-bot builders | Metaculus and Manifold bot communities, people who have posted forecasting bots | The API and the receipts as a forecaster would use them |
| 2 | Social-science or survey researchers | Personal email | Whether subgroup output survives expert reading |
| 2 | Journalists or data-visualization people | Personal email | Whether a fork card makes a publishable story |
| 2 | Prediction-market traders | Direct messages | Whether our probabilities are worth reading next to the market |
| 1 | Developer outside the US and Europe | Personal email | The Western-flattening risk ([cross-cultural bias](../research/science/027-cross-cultural-llm-bias.md)) |

Names go in a spreadsheet by Oct 13. Recruit by hand: one sentence, one link, one ask per person. No public form, no paid ads.

## What we give

- An API key with a dollar cap. The note suggests $100 each, about $1,000 in total, as an estimate to set after measuring cost per ensemble run; the [CFO lens](../research/lenses/cfo.md) budgets the same $1,000, enforced by the key cap.
- Early access from Oct 17.
- A named slot on the receipts page.
- A direct line to the founder.
- No equity, no cash.

## What we ask

One deliverable each by Oct 25: a public demo that runs without sign-up, plus a 60-second screen recording of a fork, a 7-day ensemble and one agent trace. Three formats only: a static page calling the API, a notebook on the Python SDK, or a screen recording.

The API they build on is frozen: no breaking changes after Oct 20.

## Running it

| Date | Step |
| --- | --- |
| Oct 13 | Ten names in the spreadsheet; five cold messages sent, replies counted by Oct 14 |
| Oct 17 | Keys issued, one-page spec sent |
| Oct 20 | 15-minute group call; shared channel open; every confusing moment logged as an issue |
| Oct 21 | Kill check (below) |
| Oct 24 | Top five confusing moments fixed |
| Oct 25 | Demos due |
| Oct 27 | Builders post their own work and answer comments; nobody is asked to upvote |

## Kill criterion

If fewer than five builders have a working API call by Oct 21, cut the program. Fall back to our own three demos and a launch to the forecasting community only.

## What success looks like

At least five public demos live on Oct 27, each linked from the receipts page, and the top five confusing moments fixed. Unknowns to log: reply rate to cold messages, and which builders keep using the API after launch.
