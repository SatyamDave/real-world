# 10-builder launch program

- Date: 2026-10-11
- Area: product
- Confidence: medium. The launch-platform rules and program terms are from primary pages. The claim that a 10-person cohort drives launch traction is reasoned from founder essays, not measured. The web search budget ran out mid-task, so I used direct page fetches only and found no launch post-mortems.

## Answer

Run the program as ten named people who each ship one public thing on top of the API before Oct 27, not as a community. Recruit from places where people already build forecasting bots and simulations, give them free runs and a slot on the receipts page, and ask for one demo each. Keep it manual: a shared channel, a one-page spec, and a spreadsheet. We have 16 days.

## Findings

**What early-user programs look like in practice.**
- Paul Graham's essay lists the manual tactics of Stripe, Airbnb, Pinterest, Wufoo and Viaweb. Stripe set up a user on the spot ("give me your laptop"). Airbnb's founders went door to door for about 30 days. Pinterest recruited at a conference of design bloggers. Wufoo sent handwritten thank-you notes. Viaweb built merchants' stores for them. Source: [Do Things That Don't Scale](https://paulgraham.com/ds.html).
- He also argues for "something a small number of people want a large amount", and tests it by asking who would use a crappy version one from an unknown team. Source: [How to Get Startup Ideas](https://www.paulgraham.com/startupideas.html). For us: pick builders who already want a world model, not people who find it neat.

**Closest existing builder programs and what they pay.**
- Metaculus runs a bot tournament with $50k per season, new seasons each September, January and May. It also runs a $1k two-week MiniBench and a $7k Market Pulse. The Spring 2026 leaderboard reaches rank 114, and the page says pros narrowly kept their lead over bots. So there is a ready pool of people who build forecasting bots and care about scoring. Source: [Metaculus FutureEval](https://www.metaculus.com/notebooks/38928/q2-ai-benchmark-results/).
- Polymarket's builder program gives routing partners a builder code, gas-free relayer use, and a public leaderboard. Grants are mentioned with no amounts. Source: [Polymarket builder docs](https://docs.polymarket.com/developers/builders/builder-intro). The pattern to copy is the public leaderboard as the reward.
- Manifold allows bots through its API at 500 requests per minute per IP, one key per account, and says the API is alpha. Commercial training on its data needs a license. Source: [Manifold API](https://docs.manifold.markets/api). Manifold is a cheap place for builders to test hooks against our forecasts, but we must not train on its data.
- Vercel's open source program gives $3,600 in platform credits over 3 years, with 29 projects in the Spring 2026 cohort. Applications were closed when I looked. Source: [Vercel OSS program](https://vercel.com/open-source-program). It shows that a credit-plus-cohort offer is normal, and that small cohorts work.
- Anthropic's startup program lists $1,000 in API credits and a free year of Claude Team, but says it is over capacity. It also lists "up to $45,000" of partner discounts. Source: [Claude for Startups](https://claude.com/programs/startups). Do not count on partner credits for our builders.
- Hugging Face Spaces: static Spaces are free, Gradio and Docker Spaces need a paid plan, and free accounts get two ZeroGPU Gradio Spaces. Community GPU grants exist. Source: [Spaces overview](https://huggingface.co/docs/hub/spaces-overview). Builders can host demos there, but Docker Spaces are no longer free, so tell them to use static pages or their own hosting.

**Launch platform rules that shape the demo format.**
- Show HN: it must be something people can run, ideally without sign-up. Landing pages, newsletters and sign-up pages do not qualify. You must not ask friends to upvote or comment. Source: [Show HN rules](https://news.ycombinator.com/showhn.html). HN also says it should not be used primarily for promotion and that you must not solicit upvotes. Source: [HN guidelines](https://news.ycombinator.com/newsguidelines.html).
- Product Hunt: recommends launching at 12:01 am Pacific. You may share the link but not ask directly for upvotes. Ask for visits and comments. Company accounts are banned, and a hunter gives no clear advantage. Source: [Product Hunt launch guide](https://www.producthunt.com/launch).
- Consequence: ten builders posting "please upvote" will get flagged. The builders' value is ten working demos that answer questions in the comments, not votes.

**Deadlines.** YC's on-time deadline for Winter 2027 is Nov 2 at 8pm PT, with decisions by Dec 11 for on-time applicants. The batch runs January to March in San Francisco. Source: [YC apply](https://www.ycombinator.com/apply). The page does not say what the application asks about traction, so I could not confirm that builder demos count.

**What did not work or was not found.**
- The YC library page on first customers and the Lenny's Newsletter first-1000-users post both returned 404. Indie Hackers and the Metaculus tournaments index returned 403. I have no verified outside data on how many builders a launch needs.
- Aaru, Simile and Jev did not get researched here.

## What it means for Real World

- For the product: the unit of the program is a typed `POST /v1/simulate` call plus a trace. Each builder needs a stable API, a seven-day fork that returns in minutes, and a trace they can screenshot. If the trace is confusing to a PM, it is too confusing to demo.
- For the engineering: ten builders means ten API keys, a per-key daily run cap, and a cost meter. Nightly assimilation costs $15 to $60 on Haiku 5.5, and ensembles multiply that. Cap each builder by dollars, not by calls. Builders need a frozen API for 16 days: no breaking changes after Oct 20.
- For the business: builders are the first answer to "who uses it". For YC on Nov 2 we can show ten live demos, public forecast hashes, and one or two real users with quotes. Do not claim retention from a cohort this small.

## Recommendations

1. Pick ten and fill the slots by type, not by count. Suggested mix: three forecasting-bot builders (Metaculus and Manifold bot authors), two social-science or survey researchers, two journalists or data-visualization people, two prediction-market traders, one developer from outside the US or Europe who can test the Western-flattening risk. Write the ten names in a spreadsheet by Oct 13.
2. Recruit by hand over the next four days. Use the Metaculus and Manifold bot communities, direct messages to people who have posted forecasting bots, and personal email. Skip a public application form and skip paid ads. Send each person one sentence, one link and one ask.
3. Offer four things, all cheap to us: a free API key with a dollar cap (suggest $100 each, about $1,000 total; this is my estimate, set it after checking cost per ensemble run), early access starting Oct 17, a named slot on the receipts page, and a direct line to Satyam. Do not offer equity or cash.
4. Ask for one deliverable each by Oct 25: a public demo that runs without sign-up, plus a 60-second screen recording of a fork, a 7-day ensemble and one agent trace. Use a one-page spec so a PM and an engineer both read the same ask.
5. Use three demo formats and no more: a static page calling the API, a notebook using the Python SDK, and a short screen recording. These all run on free hosting.
6. On Oct 27, tell builders to post their own work and answer comments. Do not ask for upvotes on Hacker News or Product Hunt. Post our own Show HN only if the live world can be tried with no sign-up.
7. Run a 15-minute call on Oct 20 and a shared channel. Log every confusing moment as an issue, and fix the top five before launch.
8. Cut the program if fewer than five builders have a working call by Oct 21. Fall back to our own three demos and a launch to the forecasting community only.

## Open questions

- How much does a seven-day ensemble fork cost per run? Needed to set the dollar cap. Ask engineering for a measured number from a staging run.
- Will YC count builder demos as traction? The application page does not say. Check with a YC alum or read the application questions.
- Which forecasting-bot authors will answer a cold message? Unknown. Test with five messages today and count replies by Oct 14.
- What did earlier comparable launches get from a small cohort? I found no post-mortems. Look for founder write-ups after Oct 27 if time allows.

## Sources

- [Do Things That Don't Scale](https://paulgraham.com/ds.html), accessed 2026-10-11
- [How to Get Startup Ideas](https://www.paulgraham.com/startupideas.html), accessed 2026-10-11
- [Show HN rules](https://news.ycombinator.com/showhn.html), accessed 2026-10-11
- [HN guidelines](https://news.ycombinator.com/newsguidelines.html), accessed 2026-10-11
- [Product Hunt launch guide](https://www.producthunt.com/launch), accessed 2026-10-11
- [YC apply](https://www.ycombinator.com/apply), accessed 2026-10-11
- [Metaculus FutureEval](https://www.metaculus.com/notebooks/38928/q2-ai-benchmark-results/), accessed 2026-10-11
- [Polymarket builder docs](https://docs.polymarket.com/developers/builders/builder-intro), accessed 2026-10-11
- [Manifold API](https://docs.manifold.markets/api), accessed 2026-10-11
- [Vercel OSS program](https://vercel.com/open-source-program), accessed 2026-10-11
- [Claude for Startups](https://claude.com/programs/startups), accessed 2026-10-11
- [Hugging Face Spaces overview](https://huggingface.co/docs/hub/spaces-overview), accessed 2026-10-11
