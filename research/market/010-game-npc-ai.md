# Game and NPC AI companies: traction, pricing, and whether studios would buy a population-simulation API

- Date: 2026-10-11
- Area: market
- Confidence: medium. Inworld pricing and the GDC survey are from primary pages. Convai pricing, Altera's current state and Fable's numbers come from secondary pages, and Convai's own pricing page did not render.

## Answer

Game studios are a poor first market for a world-scale population simulator. The NPC companies sell real-time dialogue to a game's players, not forecasts. The leader, Inworld, has moved away from games, and most developers now view generative AI negatively. Real World should skip games as a customer segment and borrow the technical lessons instead: constrained generation, cost per call, and agent memory.

## Findings

**Inworld has left games.** It raised $50M+ at a $500M valuation led by Lightspeed in August 2023, with about $120M raised in total per Crunchbase ([Synthedia](https://synthedia.substack.com/p/inworld-raises-new-50m-round-hits)). That article names NetEase, Niantic and LG U+ as customers. Today its [homepage](https://inworld.ai) sells six products: realtime TTS, STT, a realtime API, inference, a model router and GPU compute. The named customers are Wishroll/Status, Bible Chat and Talkpal. No game partners are named, and games appear only as one use case in a list. A 2026 third-party guide says the same thing: Inworld "moved away from plug-and-play NPCs" ([Cinevva](https://app.cinevva.com/guides/ai-npcs-dialogue)).

**Inworld's prices are voice prices.** Per its [pricing page](https://inworld.ai/pricing): TTS runs $25 per 1M characters on demand, down to $12.50 on the $1,500/month Growth plan. TTS-2 Flash runs $15 down to $7. STT is $0.15 per hour. LLMs are passed through at cost. There is no NPC or world-simulation SKU. Concurrency is capped, for example 500 concurrent requests on Growth. That is a sign the product is metered by audio, not by agents.

**Convai is small and developer-facing.** Its [docs](https://docs.convai.com) describe a character playground, Unity and Unreal plugins, and "Sim Experiences" where characters move through spaces and use objects. The docs give no pricing. A secondary guide reports a free tier and a $29/month Indie plan with 3,000 interactions ([Cinevva](https://app.cinevva.com/guides/ai-npcs-dialogue)). One low-quality comparison site claims $5M raised and about 41 staff. I could not verify that. NVIDIA's ACE showcase used Convai in 2023 and 2024, which is a demo, not adoption.

**Altera became a productivity company.** Project Sid ([arXiv 2411.00114](https://arxiv.org/abs/2411.00114), 31 Oct 2024) ran 10 to 1,000+ agents in Minecraft on an architecture called PIANO. The authors call the results preliminary. The [GitHub repo](https://github.com/altera-al/project-sid) has 1.4k stars but only the PDF and a demo video. There is no code and no license. Altera is now Fundamental Research Labs. It raised a $33M Series A led by Prosus in August 2025 for Shortcut, a spreadsheet agent, and a general assistant ([Built In SF](https://www.builtinsf.com/articles/fundamental-research-labs-secures-33m-20250805)). The game simulation did not become the business.

**Fable's simulation became a media app.** Fable's "The Simulation" led to Showrunner, which opened in public alpha in July 2025 after a 10,000-user closed alpha. It charges roughly $10 to $40 a month for generation credits, with Amazon's Alexa Fund investing and about 15 staff at launch ([Wikipedia](https://en.wikipedia.org/wiki/Fable_Studio)). That is a consumer entertainment product. It is not an API for studios, and Wikipedia reports no major studio deal as of early 2026.

**What ships in games is narrow.** Krafton's inZOI uses on-device small models via NVIDIA ACE. Where Winds Meet adds chat to side NPCs that cannot change quests. Ubisoft's NEO NPC work is an internal prototype. Cloud latency of 1 to 2 seconds feels like a stall, per [Cinevva](https://app.cinevva.com/guides/ai-npcs-dialogue). Per-line cost scales with players. Unconstrained NPCs invent lore. Studios ship tight prompts, short replies and fixed action sets.

**The buyers are hostile.** The [GDC 2026 State of the Industry](https://gdconf.com/article/gdc-2026-state-of-the-game-industry-reveals-impact-of-layoffs-generative-ai-and-more/) surveyed 2,300+ professionals. 36% use generative AI at work, and only 30% at game studios. 52% say it hurts the industry, up from 30% in 2025 and 18% in 2024. About 7% say it helps. 28% were laid off in the past two years. Studios are cutting, not buying.

**The money is in decision simulation, not games.** Simile, built by Joon Park of the Smallville paper, raised $100M (Series A, Feb 2026) and then $200M+ at $2B (Series B, 30 Jul 2026, Greenoaks). Its named customers are CVS Health, Gallup, Wealthfront, Deloitte, Banco Itaú and Suntory. Games are not mentioned ([Unite.AI](https://www.unite.ai/simile-raises-more-than-200-million-at-a-2-billion-valuation-to-scale-human-behavior-simulations/)). Revenue is only described as up fivefold, with no absolute figure.

**The open-source baseline is free and old.** a16z's [AI Town](https://github.com/a16z-infra/ai-town) is MIT licensed with 10.6k stars. It is a Convex plus PixiJS starter kit that runs llama3 locally. It pauses after 5 idle minutes and has no releases. Any studio wanting a small town of chatty agents can fork it for nothing.

## What it means for Real World

- For the product: Do not build a game mode, NPC SDK or "population for your game" tier. A studio wants hundreds of nearby, in-lore characters answering in under a second. Real World produces 100,000 world-scale agents with daily belief updates. These are different products. The only overlap is "click an agent and ask why", which should stay a trust feature.
- For the engineering: Copy what shipped: constrained actions, short outputs and small cheap models. That fits the $15 to $60 per night budget. Do not copy PIANO's real-time concurrency. Real World is batch, so it needs none of it. Altera's code is unreleased, so there is nothing to reuse.
- For the business: Simile at $2B with Gallup, Deloitte and CVS shows the buyer is enterprise research and decision-making. Inworld's pivot from games to voice, and Altera's pivot to spreadsheets, show that games did not pay. Pitch YC on forecasting and policy, not entertainment. Mentioning "games" invites the Funhouse Mirrors and cost objections without adding revenue.

## Recommendations

1. Remove game studios from the launch customer list and the YC application's market slide. Treat them as a possible later channel only.
2. If one studio asks, offer a one-off design-research simulation (market reaction, economy balance) as a paid pilot, not a new SKU.
3. Position against Simile, not Inworld. Simile validates the market and has no public track record. Real World's hashed daily forecasts are the difference.
4. Adopt the shipped pattern in the agent loop: fixed action set, short structured outputs, small model for most agents, larger model only for sampled "deep" agents. Write this into the engineering spec.
5. Keep AI Town as a reference for the agent-memory and conversation UI. Pull no code without checking its dependencies, since it is built on Convex.
6. Cite the GDC 52% figure in internal risk notes. If the launch is covered by gaming press, expect hostility to anything labelled "AI NPCs".

## Open questions

- Convai's current price and customer list. Its pricing page returned no content. Check the page in a browser or ask Convai sales.
- Whether Inworld's pivot was a decision or a decline. No layoff or pivot announcement was found. Check Inworld's blog and LinkedIn headcount.
- Fundamental Research Labs' funding is reported as $30M by one outlet and $33M by most. Check the original TechCrunch piece.
- Whether any studio would pay for economy or player-behavior forecasting. Interview three live-service studios, since that is a research use, not an NPC use.
- Simile's revenue in absolute terms. Not disclosed.

## Sources

- [Inworld pricing](https://inworld.ai/pricing), accessed 2026-10-11
- [Inworld homepage](https://inworld.ai), accessed 2026-10-11
- [Synthedia: Inworld raises $50M+ at $500M](https://synthedia.substack.com/p/inworld-raises-new-50m-round-hits), accessed 2026-10-11
- [Convai docs](https://docs.convai.com), accessed 2026-10-11
- [Cinevva: AI NPCs and dialogue, 2026 reality check](https://app.cinevva.com/guides/ai-npcs-dialogue), accessed 2026-10-11
- [Project Sid, arXiv 2411.00114](https://arxiv.org/abs/2411.00114), accessed 2026-10-11
- [altera-al/project-sid on GitHub](https://github.com/altera-al/project-sid), accessed 2026-10-11
- [Built In SF: Fundamental Research Labs $33M Series A](https://www.builtinsf.com/articles/fundamental-research-labs-secures-33m-20250805), accessed 2026-10-11 (via search result, page itself not opened)
- [Wikipedia: Fable Studio](https://en.wikipedia.org/wiki/Fable_Studio), accessed 2026-10-11
- [GDC 2026 State of the Game Industry](https://gdconf.com/article/gdc-2026-state-of-the-game-industry-reveals-impact-of-layoffs-generative-ai-and-more/), accessed 2026-10-11
- [Unite.AI: Simile raises $200M+ at $2B](https://www.unite.ai/simile-raises-more-than-200-million-at-a-2-billion-valuation-to-scale-human-behavior-simulations/), accessed 2026-10-11
- [a16z-infra/ai-town on GitHub](https://github.com/a16z-infra/ai-town), accessed 2026-10-11
