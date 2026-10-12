# What made simulation products go viral

- Date: 2026-10-11
- Area: product
- Confidence: medium. Star counts, licenses, dates and Polis case-study numbers were read from primary pages. Chirper, The Simulation/Showrunner and Twitter sims could not be verified (search budget ran out, fetched pages had no numbers), so claims about them are marked as unverified.

## Answer

The simulations that spread did one thing: they showed a small, legible story that a stranger could understand in ten seconds (a Valentine's party that agents organised themselves) and then handed people the code or a button to run their own. Pure scale (1,000+ agents in Project Sid) won attention from researchers but did not win a crowd. Real World should ship one shareable artifact per fork (a one-screen "what changed" card plus a replayable trace), make the daily question the retention loop, and treat the globe as decoration, not the product.

## Findings

**Smallville (Park et al., April 2023).** 25 agents in a Sims-like town, two simulated days. One user-seeded idea, a Valentine's Day party, produced invitations, new acquaintances, dates and a shared arrival ([arXiv 2304.03442](https://arxiv.org/abs/2304.03442)). That is the share artifact: one sentence of setup, one surprising outcome. The paper reported no quantitative metrics in the abstract; believability came from crowdworker ratings and ablations ([Stanford HAI](https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior)). The Stanford write-up notes strong interest from game companies and startups after the April draft. The code repo has 22,214 stars, Apache-2.0, created 2023-07-23 ([GitHub API](https://api.github.com/repos/joonspk-research/generative_agents)). The demo is not click-and-go: replay is "primarily intended for debugging", and a proper demo needs a compress step first ([repo](https://github.com/joonspk-research/generative_agents)). So the paper and its screenshots went viral, not the product experience.

**AI Town (a16z, July 2023).** A starter kit inspired by Smallville, built on Convex, MIT license, 10.6k stars, 1.2k forks, created 2023-07-16, still pushed 2026-08-26 ([repo](https://github.com/a16z-infra/ai-town), [API](https://api.github.com/repos/a16z-infra/ai-town)). It spread because it was forkable in minutes: local llama3 via Ollama, Docker Compose, Fly.io, one-click Pinokio. It gave builders a toy, not an audience a story. I found no evidence of a consumer audience; the stars are builders.

**Project Sid (Altera, Oct 31 2024).** 10 to 1,000+ agents in Minecraft. Agents took specialised roles, followed and changed shared rules, and passed on cultural and religious practices ([arXiv 2411.00114](https://arxiv.org/abs/2411.00114)). The repo `altera-al/project-sid` has 1.4k stars, 2 commits, a PDF and a demo video, no code to run ([repo](https://github.com/altera-al/project-sid)). Lesson: a video plus a claim of emergence gets attention, but with nothing to touch it did not turn into a community. It is also a warning for us: "emergent civilisation" claims invite the variance-collapse and cherry-picking critique.

**Polis.** The one product here with real retention in the field. Participants vote agree, disagree or pass on short statements and can add their own. The algorithm clusters voters into opinion groups and surfaces consensus and divisive statements; there are no replies ([compdemocracy.org](https://compdemocracy.org/polis/)). Case-study sizes: vTaiwan 200,000+, Aufstehen Germany 33,547, UNDP youth 30,000+, Uruguay 16,000+, Bowling Green 2,000 ([case studies](https://compdemocracy.org/Case-studies/)). Repo: 1.2k stars, AGPL-3.0 ([GitHub API](https://api.github.com/repos/compdemocracy/polis)). Why it works: a vote takes two seconds, the group map shows "where am I relative to others" immediately, and a sponsor (a city, a firm) supplies the audience. It was never viral on social media. It spread through institutions.

**Generative agents from interviews (Park et al., Nov 2024).** 1,052 Americans, two-hour interviews. Interview-grounded agents reached 83% of participants' own two-week test-retest consistency on held-out GSS items; combined with surveys, 86%; demographics-only, 74% ([arXiv 2411.10109](https://arxiv.org/abs/2411.10109)). This is the moat claim for opt-in twins, and it is also a shareable "you vs your twin" mechanic.

**Not verified.** Chirper.ai's home page now sells a token (CHIRP) and wallet login and shows no user or bot numbers ([chirper.ai](https://chirper.ai/)); I could not confirm launch date or counts. The Fable "The Simulation" site only redirects to Showrunner and shows no numbers ([fablesimulation.com](https://www.fablesimulation.com/blog)). I could not verify any Twitter-sim claims or the South Park episode figures. Do not cite them in the YC application without a source.

**Pattern across all five.**
1. A one-sentence setup and a surprising result. Valentine's party beats "25 agents".
2. A cheap way in: fork in minutes (AI Town), vote in two seconds (Polis).
3. Spectators were not retained anywhere I could find. The retained users (Polis) had a stake and a sponsor.
4. Open code produced stars, not daily users. Stars measure builders.
5. Scale alone (Sid) did not create participation.

## What it means for Real World

- For the product: the share artifact is a fork card, not a globe screenshot: "Event: chip shortage doubles phone prices. Day 7: segment X shifts Y points, ensemble spread Z, click an agent to see why." One sentence in, one number out, one link that reopens the fork. The daily question is the Polis-style loop (two-second vote, then see where you sit among simulated and real respondents). The daily human panel doubles as retention and as moat data.
- For the engineering: every fork must be a stable, replayable URL with a stored trace, because Smallville's replay was debug-grade and that capped its reach. Render the card server-side as a static image/OG tag so it travels on X and Slack. Keep the first fork under about 30 seconds, or it will not be tried.
- For the business: viral reach is a spike, not a business. Polis-style sponsors (newsrooms, NGOs, firms) paid for convened audiences. Plan the first customers as institutions who embed a daily question, and use the public hashed track record as the credibility that a Sid-style claim lacks.

## Recommendations

1. Define the share artifact before the globe: a fork card (setup sentence, top three segment shifts, ensemble spread, link). Ship its OG image render by Oct 20.
2. Make "fork today's world" one click with a prefilled event, and cache the 7-day ensemble for the three most common prompts so the first run is fast and cheap.
3. Build the daily question as a two-second agree/disagree/pass vote on the receipts page, with a simulated-vs-human comparison shown right after. Track return rate at day 7 and day 30, not stars.
4. Store a replayable trace per fork and per agent "why", public by default for forks, so a click-through always works.
5. Open-source the SDK and a minimal fork-runner (AI Town style, one-command start) for builder reach, but keep assimilation pipelines and the hashed record as the moat. Count stars separately from daily active users.
6. Avoid "emergent civilisation" language. Show calibration (Brier vs market) instead; it is checkable and Project Sid's claims are not.
7. Pick one sponsor-style pilot (a newsroom or research group) to embed the daily question before Oct 27.

## Open questions

- Actual traffic and retention for AI Town, Chirper and Showrunner. Ask the founders, or find Convex/a16z posts and Similarweb data.
- Whether the Smallville moment was driven by the paper, the demo video or press. Check April 2023 social posts and Hacker News threads with the Wayback Machine.
- Whether spectators will return daily to a forecast product with no personal stake. Test with a 14-day waitlist of the daily question.
- Whether a forecast card with a wrong call spreads more than a right one (contrarian screenshots). Unknown; watch for it after launch.

## Sources

- [Generative Agents: Interactive Simulacra of Human Behavior (arXiv 2304.03442)](https://arxiv.org/abs/2304.03442), accessed 2026-10-11
- [Stanford HAI: Computational agents exhibit believable humanlike behavior](https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior), accessed 2026-10-11
- [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents), accessed 2026-10-11
- [GitHub API: generative_agents](https://api.github.com/repos/joonspk-research/generative_agents), accessed 2026-10-11
- [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town), accessed 2026-10-11
- [GitHub API: ai-town](https://api.github.com/repos/a16z-infra/ai-town), accessed 2026-10-11
- [Project Sid (arXiv 2411.00114)](https://arxiv.org/abs/2411.00114), accessed 2026-10-11
- [altera-al/project-sid](https://github.com/altera-al/project-sid), accessed 2026-10-11
- [Polis, Computational Democracy Project](https://compdemocracy.org/polis/), accessed 2026-10-11
- [Polis case studies](https://compdemocracy.org/Case-studies/), accessed 2026-10-11
- [GitHub API: compdemocracy/polis](https://api.github.com/repos/compdemocracy/polis), accessed 2026-10-11
- [LLM Agents Grounded in Self-Reports (arXiv 2411.10109)](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Chirper.ai](https://chirper.ai/), accessed 2026-10-11
- [Fable Simulation blog](https://www.fablesimulation.com/blog), accessed 2026-10-11
