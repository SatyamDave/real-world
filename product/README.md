# Product

One file per product surface. Each spec is short and answers the same questions in the same order, so a PM and an engineer read the same thing:

1. **What it does**, in one paragraph a user would understand.
2. **Who it is for** and the moment they reach for it.
3. **How we know it works**: the measurable outcome and the automated check that proves it.
4. **What it is not**: the cut list for this surface.
5. **Where the code lives**: the folder that owns it, and the research notes it rests on.

A PR that changes what a surface does updates its spec in the same PR.

## How people use it

Real World is "Simulations with receipts.": AI simulates how the world reacts to the news, and every forecast is sealed before the outcome and scored in public. Four people use it, and each page offers one next action.

- **Daily-question visitor.** Answers today's question on `/`, taps "See how the world answered" to reach `/questions/{id}`, then "Fork today's world" and, on the fork card, "Run this from your code". Specs: [daily-question.md](daily-question.md), `question.md`, [web-app.md](web-app.md).
- **Receipts and forecasting skeptic.** Opens `/receipts`, verifies the hashes in the browser, then reads `/scores` for skill with n and an interval and `/research` for the papers and experiments. Specs: [receipts.md](receipts.md), `scores.md`, `research.md`.
- **Analyst forking events.** Forks today's world from `/`, reads the segments and the trace on the fork card, then repeats the fork from the API; `/world` and `/cycle` show the snapshot and the run behind it. Specs: [simulate-api.md](simulate-api.md), `world-page.md`, [cycle.md](cycle.md), [world.md](world.md).
- **Developer on the API with a capped key.** Starts at `/docs`, requests a key with a dollar cap, and runs the SDK quickstart; every refusal is one sentence and every output is labelled AI-simulated. Specs: [simulate-api.md](simulate-api.md), [sdks.md](sdks.md).

- **Signed-in person.** Makes a free account with an email, answers up to four onboarding questions, and returns to a home that opens on their briefing, then forks, their track record and, for builders, self-serve API keys; the surfaces above stay open as the proof layer ([decision 0011](../research/decisions/0011-consumer-product-and-api.md)). Specs: [accounts.md](accounts.md), [onboarding.md](onboarding.md), [home-and-briefing.md](home-and-briefing.md), [forks.md](forks.md), [track-record.md](track-record.md), [developer.md](developer.md).

Journey page by page: [gtm/messaging.md](../gtm/messaging.md#user-journeys). The specs in code font (`question.md`, `scores.md`, `research.md`, `world-page.md`) land in their own PRs.
