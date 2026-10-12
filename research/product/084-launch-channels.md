# Launch channels for deep tech in 2026

- Date: 2026-10-11
- Area: product
- Confidence: medium. HN rules, PH rules and HN data come from primary pages and the HN API. The web search tool hit its budget mid-task, so X tactics, YouTube and newsletters rest on thin evidence and are marked as such.

## Answer

Lead with Hacker News as a Show HN on launch day, and make the thing people can open the daily forecast page, not the platform. Show HN rewards something people can try now, with no signup. A page that answers one live question each day got 484 points this year. Prediction-scoring projects that led with a methodology or a dataset got single digits. Use Product Hunt as a secondary channel and do not spend more than a day of effort on it. The receipts should be on the front page, and they need to exist before launch, not after.

## Findings

**Hacker News rules (primary source).**
- Show HN is for "something you've made that other people can play with". It must be runnable, non-trivial, and the poster must be there to discuss it. Users should be able to try it without signups or emails. ([Show HN rules](https://news.ycombinator.com/showhn.html))
- Not allowed: landing pages, fundraisers, blog posts, newsletters, and asking friends to upvote or comment. The site-wide rule is "Don't solicit upvotes, comments, or submissions". ([Show HN rules](https://news.ycombinator.com/showhn.html), [guidelines](https://news.ycombinator.com/newsguidelines.html))
- Titles: no caps, no exclamation points, no gratuitous numbers, original title unless misleading. Posts should not be generated text. ([guidelines](https://news.ycombinator.com/newsguidelines.html))
- Ranking divides points by a power of age, then applies flags, anti-abuse software and moderator action. ([FAQ](https://news.ycombinator.com/newsfaq.html)) A community-maintained note says a post whose comment count exceeds its score is likely penalised as an overheated discussion, and that a voting-ring detector exists. This is unofficial and undocumented by HN. ([minimaxir notes](https://github.com/minimaxir/hacker-news-undocumented))
- Moderators can reset a post's time and rescue it through the second-chance pool. Do not count on it. The FAQ itself does not mention the pool; the community note does.

**What forecasting and simulation Show HNs actually scored (HN Algolia API, queried 2026-10-11).**
- Is Hormuz open yet?: 484 points, 209 comments, 2026-04-08. A one-question live-answer page. ([HN item 47696562](https://news.ycombinator.com/item?id=47696562))
- AI Town, a custom AI world sim in JavaScript: 429 points, 115 comments, 2023-08. Open repo, run it yourself. ([repo](https://github.com/a16z-infra/ai-town))
- Smallville, generative agents for simulations: 112 points, 31 comments, 2023-05. ([repo](https://github.com/nickm980/smallville))
- Manifold, create your own prediction market: 84 points, 72 comments, 2022-02. ([site](https://manifold.markets))
- Forecaster Arena, LLMs tested on prediction markets: 4 points, 0 comments, 2025-12. ([site](https://forecasterarena.com/))
- Open LLM for sports forecasting: 7 points, 0 comments, 2026-02. Trump-Forecaster: 10 points, 2 comments, 2026-02. Fatebook: 4 to 5 points, 2023. ([Golf-Forecaster](https://huggingface.co/LightningRodLabs/Golf-Forecaster), [Fatebook](https://fatebook.io/))
- Pattern in this sample: people-can-touch-it beats people-can-read-the-method. The scoring-focused projects with a model card or a leaderboard got almost no traction. This is a small, keyword-driven sample, not a study.

**Dev-tool Show HN advice.** One practitioner guide says to link the repo, state clearly what it is, avoid superlatives, use a structured opening post (who you are, what it does, problem, backstory, technical solution, what is different, ask for feedback), and answer every comment. It also warns against booster comments from friends. It gives no timing or traffic numbers. ([Markepear guide](https://www.markepear.dev/blog/dev-tool-hacker-news-launch))

**Product Hunt.**
- Official guide: launches go live at 12:01 am Pacific, hunt your own product, no company accounts, and you may not directly ask for upvotes. It does not publish the ranking formula. ([PH launch guide](https://www.producthunt.com/launch))
- A launch agency's write-up (a seller of launch services, so treat as biased) cites 50 to 300 signups for typical B2B launches and 500 to 1,500 for B2C productivity tools, 50 to 120 hours of prep, and warns that brand-new accounts created on launch day may have votes removed. It says Tuesday to Thursday bring the most traffic and the most competition, and weekends give the best chance of #1 with less traffic. ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-successfully-launch-on-product))
- Product Hunt's audience is early adopters and consumer tools. It is a weak match for a research-heavy forecasting product. I found no evidence either way on 2026 AI-product crowding.

**X.**
- X's open-sourced For You ranker predicts per-action probabilities (like, reply, repost, share, link click, dwell, follow, and negatives such as mute, block, report) and combines them in a weighted sum, with a discount for accounts the viewer does not follow. ([xai-org/x-algorithm](https://github.com/xai-org/x-algorithm), 33.6k stars when fetched) Weights are not given in the README I read.
- Implication: a post that earns replies and dwell from people who follow you outperforms a link drop. This is my inference from the signal list, not a measured result.

**YouTube and newsletters.** I did not verify anything from primary sources. No claims here.

## What it means for Real World

- For the product: the launch artifact is the daily page with one live question, the forecast, its hash and its score. Receipts means a public record with timestamps. It also means the fork-and-simulate demo works without signup.
- For the engineering: launch day will hit the simulate endpoint with anonymous traffic. HN's Show HN rule favors no signup, so the first run has to be cheap and capped (cached ensemble, per-IP limit). At $15 to $60 a night for the update alone, an uncapped public simulator is a cost risk.
- For the business: the YC application is due Nov 2. Launch Oct 27 gives six days of public traffic and comments to cite. The track record will be about 16 days old on launch day, so it cannot impress on length. It can only impress on integrity: hashes published before outcomes.

## Recommendations

1. Make the Show HN post link to the live daily forecast page or the fork demo, not to a landing page or waitlist. Landing pages are explicitly disallowed.
2. Start publishing hashed daily forecasts now, so the public record is at least 16 days old on Oct 27. Order matters because it cannot be backfilled.
3. Write the Show HN title as plain statement of what it is, no superlatives, with open source in the title if the repo is public. Put the structured first comment in place within minutes of posting. Have one person on the thread for the first several hours.
4. Do not ask anyone to upvote. Ask friends to try it and comment only if they have something real to say. Fewer, genuine comments are safer than a burst that trips the ring detector.
5. Cap anonymous simulate runs and show a cached ensemble by default. Decide the cap before launch.
6. Treat Product Hunt as optional. If used, a maker account launching at 12:01 am Pacific with a 3 to 5 minute screen-recorded video and no upvote asks is enough. Skip any paid launch agency.
7. On X, post the first receipt (a hashed forecast and its later score) as a native thread with the chart, and put the link in a reply. This is untested; run it as an experiment.
8. Pick the launch time after checking when comparable Show HNs reached the front page via the Algolia API. I did not find a reliable source on best hour or day.

## Open questions

- What is the best day and hour for a Show HN in 2026? Pull created_at against points for the last 12 months of Show HNs from the Algolia API and compare.
- Do links in X posts get penalised in 2026? Test with two posts, or read the Phoenix weights if released.
- How do newsletters (for example forecasting and AI newsletters) take pitches, and what is their reach? Not researched; needs a follow-up with search.
- Does a 16-day record carry credibility with HN readers who were skeptical of Aaru's 2024 miss? Test the claim in a pre-launch read-through with three outside forecasters.
- Is launching on a Tuesday (Oct 27) right for HN, given competition? Unknown.

## Sources

- [Show HN guidelines](https://news.ycombinator.com/showhn.html), accessed 2026-10-11
- [Hacker News guidelines](https://news.ycombinator.com/newsguidelines.html), accessed 2026-10-11
- [Hacker News FAQ](https://news.ycombinator.com/newsfaq.html), accessed 2026-10-11
- [Undocumented HN behaviours (minimaxir)](https://github.com/minimaxir/hacker-news-undocumented), accessed 2026-10-11
- [Markepear: dev tool Hacker News launch guide](https://www.markepear.dev/blog/dev-tool-hacker-news-launch), accessed 2026-10-11
- [Product Hunt launch guide](https://www.producthunt.com/launch), accessed 2026-10-11
- [Lenny's Newsletter: how to launch on Product Hunt](https://www.lennysnewsletter.com/p/how-to-successfully-launch-on-product), accessed 2026-10-11
- [HN Algolia API: Show HN queries](https://hn.algolia.com/api/v1/search?query=prediction%20market&tags=show_hn&numericFilters=points%3E50), accessed 2026-10-11
- [HN item: Show HN: Is Hormuz open yet?](https://news.ycombinator.com/item?id=47696562), accessed 2026-10-11
- [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm), accessed 2026-10-11
- [twitter/the-algorithm](https://github.com/twitter/the-algorithm), accessed 2026-10-11 (74.0k stars, 2023-era release)
