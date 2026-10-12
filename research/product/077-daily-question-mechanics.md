# Daily question mechanics: Wordle, Connections, GeoGuessr, prediction games

- Date: 2026-10-11
- Area: product
- Confidence: medium. The Wordle and Connections numbers are solid. Claims about streak psychology and the GeoGuessr daily rest on thin sources, because the search tool hit its call limit mid-session and only Wikipedia pages could be opened.

## Answer

The daily games that spread share four traits: one item per day, the same item for everyone, a result you can paste without spoiling it, and a counter that punishes missing a day. A daily "predict the world" question can copy all four. The catch is that a forecast resolves in days or weeks, not seconds, so the game needs a fast first reward (guess, then see where the crowd landed) and a slow second reward (the score when the outcome arrives). Build the first loop in week one and treat the scored loop as the product's real differentiator.

## Findings

**Wordle** ([Wikipedia](https://en.wikipedia.org/wiki/Wordle)):
- Public release was October 2021. About 90 players on 1 Nov 2021, over 300,000 on 2 Jan 2022, and over 2 million per week a week later.
- Growth took off after the emoji result grid was added. It was copied from a friend group's emoji results. 1.2 million results were shared on Twitter between 1 and 13 Jan 2022.
- Wardle's stated reason for one puzzle a day: scarcity leaves players wanting more, and it keeps play to about three minutes.
- The NYT bought it for a "low seven figures" on 31 Jan 2022. Streak stats carried over, but some users saw streaks reset in the move.
- The NYT page cites 5.3 billion Wordle plays in 2024 ([NYT Games](https://en.wikipedia.org/wiki/The_New_York_Times_Games)).

**Connections** ([NYT Games](https://en.wikipedia.org/wiki/The_New_York_Times_Games)): launched mid-2023 (sources disagree between June and July). Four mistakes allowed, 16 words, edited by Wyna Liu. 3.3 billion plays in 2024, second only to Wordle. Strands, a third word game, reached 1.3 billion plays within months. The NYT reported over 10 million daily players across all games in 2024, and 11.1 billion puzzles played. The pattern: one editor, one puzzle, a fixed daily cadence, and a shareable colored grid.

**GeoGuessr** ([Wikipedia](https://en.wikipedia.org/wiki/GeoGuessr)): five rounds, up to 5,000 points each, 25,000 max. 40 million accounts by July 2022. Free play is capped, and the paid tier unlocks unlimited play. The Wikipedia page does not mention a daily challenge, so I could not verify its mechanics. What the page does show is that a score out of 5,000 per round gives a continuous, comparable number, which is useful for us.

**Heardle** ([Wikipedia](https://en.wikipedia.org/wiki/Heardle)): a Wordle clone for music, released 26 Feb 2022, bought by Spotify in July 2022, shut down April 2023. Clones of the format are cheap and numerous, and a bought clone did not survive a year. The mechanic alone is not a moat.

**Duolingo streaks** ([Wikipedia](https://en.wikipedia.org/wiki/Duolingo)): any completed lesson extends the streak. Friend Streaks allow up to five friends. Leagues group users into cohorts of up to 30 ranked by weekly XP. A bandit algorithm picks each user's notification. The page reports 130 million monthly users (Q1 2025) but gives no retention numbers, so the "streaks drive retention" claim is common knowledge here, not something I verified. The page also records users quitting streaks en masse in protest after a 2025 AI backlash. A streak is leverage over the user, and it can sour.

**Forecasting games:**
- Brier score for a binary event is the mean of (forecast minus outcome) squared, 0 to 1, lower is better. Always saying 50% scores 0.25, which gives a built-in "no skill" line ([Wikipedia](https://en.wikipedia.org/wiki/Brier_score)). It is a strictly proper rule, so honest probabilities are the best strategy.
- The Good Judgment Project scored forecasters with Brier scores and won the IARPA-ACE tournament, with IARPA posting roughly 100 to 150 questions a year ([Wikipedia](https://en.wikipedia.org/wiki/Good_Judgment_Project)). Real forecasting tournaments run on 2 to 3 new questions a week, not daily.
- Metaculus has existed since 2015, hit 1 million predictions in 2022, and rewards both being right and beating the crowd ([Wikipedia](https://en.wikipedia.org/wiki/Metaculus)). I could not open its scoring FAQ (403), so I cannot quote its formulas.
- Polymarket: over 70% of users lose money, and 0.1% of accounts take 67% of profits ([Wikipedia](https://en.wikipedia.org/wiki/Polymarket)). Money-based prediction is a poor mass-market daily game. It is also legally contested in several US states as of 2026. We should not take stakes.

**What these games share, and where the analogy breaks:**
- Wordle and Connections have an answer that exists at midnight. A world forecast does not resolve for days to months. A streak tied to resolution would reward nothing for a week.
- The Wordle answer has no judgment in it. A forecast does. That invites arguments about resolution, which kill trust faster than a hard puzzle.
- Wordle's moat is not the mechanic (Heardle shows that) but habit plus the NYT brand. Ours is the hashed record, which only accrues with time.

## What it means for Real World

- For the product:
  - The daily card is one question, answered with a probability slider (0 to 100), submitted before any crowd number is shown.
  - Right after submit, show a reveal: where you landed against the human crowd, the simulated world, and the prediction-market price if one exists. This is the instant reward.
  - Make the shareable artifact a text grid (for example one colored square per question over the week, colored by how close you were) with a link to the day's receipt. Do not paste the answer or the question text in a way that spoils it.
  - Streak = days you submitted a forecast, not days you scored well. Allow one freeze per week. Never reset a streak because of our own outage.
  - Scores show up later on the receipts page, as Brier against the market price. A new player gets a visible "score pending" count so the wait feels like progress.
- For the engineering:
  - Needed tables: question (id, publish time, resolve-by, resolution source, hash), forecast (user, question, probability, locked_at), score (computed at resolution), streak (derived, never stored as a counter).
  - Lock the forecast server-side at submit time. Publish the question hash before any outcome exists, matching the public track-record plan.
  - Scoring is a one-liner. Store the market price at question publish time so the comparison cannot be backfilled.
  - The share grid is a pure function of the user's last 7 forecasts and runs in the client.
- For the business:
  - A daily human panel is also the engine's calibration data. Each submit is a labeled sample next to the simulated agents, which is worth more than the engagement.
  - Do not gate the daily question. Charge for forks and API runs, where compute costs are real.
  - Expect a wait: Wordle took about 10 weeks from a few dozen users to 2 million, and only after a share format existed. We have 16 days to launch. Plan for a small, engaged cohort, not virality.

## Recommendations

1. Ship the daily card with the instant reveal first. A user should see crowd, sim, and market numbers within a second of submitting. One screen, one slider, one button.
2. Pick questions that resolve in 1 to 7 days for the first month, so players see a score within a week. Save slow questions for later. Aim for one quick-resolving question a day and tag it clearly.
3. Define each question's resolution source and tie-break rule before it is published, and store them in the hashed record. A disputed resolution is the biggest trust risk.
4. Streak counts submissions, with one weekly freeze. Add leagues, friend streaks, or notifications only after the first week of data shows the plain streak is used.
5. Make the share text a 7-square grid plus a receipt link, and track clicks from share to new visitor. If that rate is under about 2%, change the format before building anything else.
6. Report the metric that matters to us: percent of daily players who come back on day 2 and day 7, and the median Brier of the human panel versus the market and versus 0.25.

## Open questions

- How does GeoGuessr's daily challenge really work, and does it have a streak? I could not verify this. Fix: open geoguessr.com's help pages and the daily challenge screen.
- Do streaks raise retention when the reward is delayed, as it is for forecasts? No source found. We would find out by A/B testing streak display in the first two weeks.
- What are Metaculus and Good Judgment Open's actual scoring formulas and return rates? Both pages were blocked or not reached. Fix: read the Metaculus scores FAQ in a browser.
- How many questions per day can we resolve cleanly, across 100+ countries, without a human adjudicating? Needs a pass over the resolution sources from the data research notes.
- What streak and share-grid conventions reduce spoilers for a game whose answer is a probability? Needs a short usability test with five people.

## Sources

- [Wordle (Wikipedia)](https://en.wikipedia.org/wiki/Wordle), accessed 2026-10-11
- [The New York Times Games (Wikipedia)](https://en.wikipedia.org/wiki/The_New_York_Times_Games), accessed 2026-10-11
- [GeoGuessr (Wikipedia)](https://en.wikipedia.org/wiki/GeoGuessr), accessed 2026-10-11
- [Heardle (Wikipedia)](https://en.wikipedia.org/wiki/Heardle), accessed 2026-10-11
- [Duolingo (Wikipedia)](https://en.wikipedia.org/wiki/Duolingo), accessed 2026-10-11
- [Brier score (Wikipedia)](https://en.wikipedia.org/wiki/Brier_score), accessed 2026-10-11
- [Good Judgment Project (Wikipedia)](https://en.wikipedia.org/wiki/Good_Judgment_Project), accessed 2026-10-11
- [Metaculus (Wikipedia)](https://en.wikipedia.org/wiki/Metaculus), accessed 2026-10-11
- [Polymarket (Wikipedia)](https://en.wikipedia.org/wiki/Polymarket), accessed 2026-10-11
