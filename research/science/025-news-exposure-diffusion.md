# News exposure and diffusion: who hears which event

- Date: 2026-10-11
- Area: science
- Confidence: medium. The Reuters and attention-decay numbers were read on the source pages. The network-cascade numbers are from the abstract only, and the Bakshy Facebook paper could not be opened (search budget ran out, Science returned 403).

## Answer

Decide exposure with a simple two-step rule, not a graph simulation. Step one: each agent gets a daily chance of hearing an event from broadcast channels, set by country, age and channel (Reuters Digital News Report shares). Step two: a small peer-spread chance (independent cascade) and an attention decay over hours. Skip a 100,000-node social graph for v1. We have no real network data for most countries, and the broadcast layer carries most of the signal.

## Findings

**Media diet varies enormously by country, and the data is online-only.**
- The 2025 Digital News Report covers 48 markets. Global weekly news use by platform: Facebook 36%, YouTube 30%, Instagram 19%, WhatsApp 19%, TikTok 16%, X 12% ([Executive summary](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary)).
- Country spread is large. TikTok for news is 49% in Thailand and 40% in Malaysia. US social/video (54%) passed TV (50%) for the first time. Japan has 11% news avoidance, Bulgaria 63%. Age matters: 44% of 18-24s say social/video is their main news source.
- Fieldwork was by YouGov online panels, mid-January to end of February 2025, weighted to census targets ([Methodology](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/methodology)).
- The blunt part: India, Kenya, Nigeria and South Africa represent younger English speakers, not the nation. Kenya and Nigeria are ages 18-50 only. Where internet penetration is low, the online sample is a poor stand-in for the country. This is exactly the "Western flattening" risk, and it sits inside our exposure layer.
- The methodology page does not state a data licence. A "Country and market data" page exists. We have not confirmed a downloadable microdata file or reuse terms.

**Attention to one story dies fast.**
- Wu and Huberman tracked about 1 million Digg users and 29,864 popular stories. Novelty decays as a stretched exponential, r_t ~ exp(-0.4 t^0.4), with a half-life of 69 minutes, and the decay factor is below 0.03 after about 3 hours ([PNAS 2007](https://pmc.ncbi.nlm.nih.gov/articles/PMC2077036)).
- Attention is speeding up. Top-50 Twitter hashtags stayed 17.5 hours in 2013 and 11.9 hours in 2016. Weekly tweets with top hashtags doubled from about 2 million to 4 million. This holds for items like hashtags, books, movies, Google and Reddit. It is weak for citations and Wikipedia. The authors stress it is collective attention, not individual, and the fit weakens for lower-ranked topics ([Lorenz-Spreen et al., Nat Commun 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6465266)).

**Spread between people is rare and heavy-tailed.**
- Vosoughi, Roy and Aral studied about 126,000 stories, about 3 million people, about 4.5 million shares, 2006-2017. Falsehood went farther and faster than truth, was 70% more likely to be retweeted, and bots spread both at the same rate. The top 1% of false cascades reached 1,000 to 100,000 people, while truth rarely passed 1,000 ([MIT Media Lab](https://www.media.mit.edu/publications/the-spread-of-true-and-false-news-online/), [MIT Sloan](https://mitsloan.mit.edu/press/false-news-spreads-widely-and-easily), [paper PDF](https://politics.media.mit.edu/papers/Vosoughi_Science.pdf)). Twitter only, English-heavy, and tied to fact-checked stories.
- Kempe, Kleinberg and Tardos define the two standard models. Independent cascade: each newly informed person gets one try at each neighbour with a fixed probability. Linear threshold: a person acts once the weighted share of informed neighbours passes a random threshold. Picking the best seed set is NP-hard, and greedy gets within 63% of optimal ([Theory of Computing 2015](https://theoryofcomputing.org/articles/v011a004/)). Note this literature is about choosing seeds, not about calibrating to real country networks.

**GDELT can tell us how widely an event was covered.**
- GDELT 2.0 updates every 15 minutes, translates 65 languages, and its Mentions table records each article mention with a timestamp, so we can see how an event spreads across outlets ([GDELT blog](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/)). Data is described as free and open, but the terms text was not visible ([GDELT data](https://www.gdeltproject.org/data.html)).

**LLM simulators exist but prove little here.**
- OASIS claims up to one million agents and reproduces information spreading, polarization and herd effects on X and Reddit-style platforms ([arXiv 2411.11581](https://arxiv.org/abs/2411.11581)). The abstract lists no limitations. Treat this as a demo of scale, not validation.

## What it means for Real World

- For the product: "who heard it" must be visible on the agent card ("heard via: WhatsApp, day 2" or "did not hear"). A PM can read this. It also answers the "click any agent, ask why" promise, since non-exposure is often the honest reason an agent did not change.
- For the engineering: exposure is a pure function, `heard(agent, event, day) -> {channel, hour} | none`, seeded and logged. Cost is near zero because it runs before any LLM call. Only agents who heard the event get a model call. This directly cuts the $15-60 nightly cost.
- For the business: the exposure layer is a defensible, scoreable part of the track record, because GDELT mentions give an observed coverage curve to check against each night. The Reuters coverage gaps are a real limit on global claims, so state them on the receipts page.

## Recommendations

1. Build a table `channel_reach[country, age_band, channel]` from the Reuters 2025 country pages. Mark each row `survey`, `imputed` or `none`. For countries with no Reuters data or unrepresentative samples (India, Kenya, Nigeria, South Africa and all unsurveyed countries), impute from internet penetration times regional neighbours and flag the agent as low-confidence.
2. Implement broadcast exposure first: p(hear) = channel_reach x event_salience x attention(t). Salience comes from GDELT mention volume and tone for that event in the agent's country and language.
3. Use one attention curve with a half-life parameter, default about 1 day for the daily tick, and keep it a config value. The Digg 69-minute figure is for single stories on a front page. Applying it to a daily cycle is our judgment call, so fit the half-life to GDELT mention decay per event class during the first two weeks of live data.
4. Separate "heard" from "still acting". Attention decays in hours, but a price shock keeps affecting behaviour. Do not let the decay curve erase the effect on beliefs.
5. Add peer spread as a single independent-cascade pass over agents grouped by country, age and cohort, with one tunable p per country. Do not build a social graph until backtests show broadcast alone misses.
6. Backtest the exposure layer alone against GDELT mention curves for 20 past events before wiring it to belief updates.
7. Check the Reuters data licence by email before we ship any derived table in the public repo.

## Open questions

- Is Reuters country data downloadable, and may we redistribute derived shares? Ask the Reuters Institute; read the Country and market data page.
- What is the right p for peer spread outside Twitter, especially on WhatsApp and Telegram, where cascades are invisible? No source found. Test by fitting to observed event coverage.
- Does the Bakshy et al. 2015 Facebook result (ranking versus own choice) change how we split feed exposure from self-selection? Not opened, read it first.
- Does GDELT's 65-language translation coverage under-count news in smaller languages, making "none heard" too common in the global south? Compare GDELT mention counts to local outlets for a few events.

## Sources

- [Digital News Report 2025, Executive summary](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary), accessed 2026-10-11
- [Digital News Report 2025, Methodology](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/methodology), accessed 2026-10-11
- [Wu and Huberman, Novelty and Collective Attention, PNAS 2007](https://pmc.ncbi.nlm.nih.gov/articles/PMC2077036), accessed 2026-10-11
- [Lorenz-Spreen et al., Accelerating dynamics of collective attention, Nat Commun 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6465266), accessed 2026-10-11
- [Vosoughi, Roy, Aral, The spread of true and false news online (MIT Media Lab page)](https://www.media.mit.edu/publications/the-spread-of-true-and-false-news-online/), accessed 2026-10-11
- [MIT Sloan press release on the same study](https://mitsloan.mit.edu/press/false-news-spreads-widely-and-easily), accessed 2026-10-11
- [Vosoughi et al. paper PDF (partial text)](https://politics.media.mit.edu/papers/Vosoughi_Science.pdf), accessed 2026-10-11
- [Kempe, Kleinberg, Tardos, Theory of Computing 2015](https://theoryofcomputing.org/articles/v011a004/), accessed 2026-10-11
- [GDELT 2.0 announcement](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [OASIS, arXiv 2411.11581](https://arxiv.org/abs/2411.11581), accessed 2026-10-11
