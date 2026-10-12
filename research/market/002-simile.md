# Simile (Stanford/Joon Park spinout)

- Date: 2026-10-11
- Area: market
- Confidence: medium. Funding and customers are reported consistently by several outlets and Simile's own site. Revenue, headcount and real accuracy are not public, and every accuracy number is Simile's own.

## Answer

Simile is real and well funded: $100M Series A (Feb 2026, Index Ventures) and $200M Series B at a $2B post-money valuation (30 Jul 2026, Greenoaks led). It sells enterprise "simulations" of customers to companies like CVS Health, not a public daily world model. Its method is the most credible in the field, but it is aimed at "what do these people say about my product", not at forecasting world events with a public record. Real World should not fight Simile on enterprise panels. It should own what Simile does not do: global scope, daily assimilation, open fork-and-run, and a hashed public track record.

## Findings

**Funding.**
- Series A: $100M, led by Index Ventures, with Bain Capital Ventures, A* and Hanabi Capital. Angels include Fei-Fei Li and Andrej Karpathy. Valuation was not disclosed. It emerged from stealth in February 2026 ([Implicator](https://implicator.ai/the-stanford-team-that-invented-generative-agents-wants-to-kill-the-focus-group/), [Gizmodo](https://gizmodo.com/an-ai-company-apparently-inspired-by-the-sims-wants-to-revolutionize-public-opinion-research-2000731038)).
- Series B: $200M at $2B post-money, announced 30 Jul 2026, about five months after the A. Greenoaks led, per the New York Times as relayed by [The Next Web](https://thenextweb.com/news/simile-200-million-agentic-twins-ai-market-research). Simile's own page lists the same round ([simile.com](https://www.simile.com/)). One outlet says revenue grew 5x in those five months and gives no absolute figure ([ai2.work](https://ai2.work/blog/simile-s-200m-bet-agentic-twins-come-for-the-focus-group-era)). Total raised is about $300M.
- So the "$200M at $2B" in our brief is correct. It is the Series B, not the first round.

**Team.** Joon Sung Park (CEO, lead author of the 2023 Generative Agents paper), Percy Liang (Chief Scientist, Stanford CRFM, HELM), Michael Bernstein (Stanford professor; titled Chief Data Officer on the site, Chief Product Officer in some press), plus a business co-founder (Lainie/Elaina Yallen, ex-BCG, Hebbia). In February the team was reported at about ten people ([Implicator](https://implicator.ai/the-stanford-team-that-invented-generative-agents-wants-to-kill-the-focus-group/)). Current headcount is not public.

**Product.** Enterprise platform. A client defines a question, Simile builds a population of agents, runs the simulation and returns answers. The site lists: simulations across concept, price and message variants; populations built from real people plus proprietary behavior datasets; a confidence model that tags each result with predicted accuracy; data-drift tracking with re-collection; and bring-your-own-data models. The site has no API docs and no pricing page ([simile.com](https://www.simile.com/)). Press reports pricing scales with panel size, "the larger the panel, the higher the price" ([TNW](https://thenextweb.com/news/simile-200-million-agentic-twins-ai-market-research)).

**Customers.** The site names CVS Health, Wealthfront, Banco Itau, Suntory Beverages & Food, Gallup, Garnett Station Partners and Deloitte (logo only). CVS is the deepest case: about 400,000 twins built from 2.9M consented responses, used on adherence and store-display questions. Gallup supplies a representative panel and plans to resell 1,000+ twins. Wealthfront claims 15x wider qualitative research scope. Some named customers may be pilots; revenue is undisclosed.

**Methods.** This is the part to respect.
- The base paper is [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals](https://arxiv.org/abs/2411.10109) (arXiv 2411.10109, Nov 2024). It used 1,052 Americans, each given a two-hour interview. Agents matched held-out GSS answers at 83% (interview only), 82% (survey only) and 86% (combined) of the person's own two-week test-retest consistency. Demographics-only agents scored 74%. Interview grounding also narrowed accuracy gaps across racial and ideological groups.
- Simile's site adds: fine-tuning on 2.9M responses from 210 experiments improved alignment on unseen studies by 26% over the base model, and 7,000+ validation evaluations run weekly against real humans.
- Note what 85% means. It is accuracy relative to how consistently people answer themselves, on survey items. It is not forecast accuracy on real outcomes.

**Criticism.**
- Every headline number (85-99%) is self-reported and not independently audited ([TNW](https://thenextweb.com/news/simile-200-million-agentic-twins-ai-market-research)).
- TechCrunch called the goal of simulating all eight billion people "preposterous" (via [ai2.work](https://ai2.work/blog/simile-s-200m-bet-agentic-twins-come-for-the-focus-group-era), second-hand, not opened at source).
- Synthetic panels tend toward agreeable "textbook" answers and overstate willingness to pay (same source).
- Interview-grounded agents are expensive to build: two hours per person. They also come from a US sample. Nothing found shows a non-US validation.
- Competitors named: Aaru (about $1B headline valuation, population-scale forecasting), Artificial Societies (YC), Helm, Evidenza, Qualtrics Edge Audiences.

## What it means for Real World

- For the product: Simile sells private answers to a paying client. We sell a public, daily, forkable world with receipts. Different buyer, different promise. Do not copy the "focus group replacement" framing. Do copy the confidence tag per result: show predicted reliability next to each forecast and each fork.
- For the engineering: Simile's edge is depth (about 1,000 interviewed people, then fine-tuned). Ours is breadth (100,000 census-sampled agents, many countries). Their own numbers show demographics-only agents lose about 10 points to interview-grounded ones. Plan for that: our census agents are the weak tier, and opt-in twins are the strong tier. Say so in the docs. Their method is published, so we can reuse the interview-grounding recipe for twins.
- For the business: $2B and $300M in five months means investors already believe in the category, which helps the YC story ("proven category, nobody does the public track record"). It also means Simile can outspend us on anything enterprise. Aaru's missed 2024 call and Simile's unaudited claims are the opening: a hashed, unbackfillable record is the one thing money cannot buy retroactively.

## Recommendations

1. Position as "public forecasting infrastructure", not "synthetic respondents". One sentence on the landing page: Simile and Aaru sell private simulations; Real World publishes forecasts before outcomes and scores them in public.
2. Ship a per-forecast confidence field in `POST /v1/simulate` (ensemble spread plus a historical Brier band for that question type). This matches Simile's confidence-model idea at near-zero cost.
3. Report agent grounding tier on every run: demographic-only, survey-conditioned, or interview twin. Show the accuracy gap honestly, using Simile's 74% vs 86% figure from the paper as the expected direction.
4. Budget for the twin pipeline using the Park et al. recipe (interview plus survey), starting with a small opt-in cohort. Do not try to match their 2.9M-response fine-tune before launch.
5. Do not claim "85% accurate" anywhere. Publish Brier vs market price only, so our claims stay checkable.
6. Watch Simile monthly for: a public API, a forecasting or polling product, non-US panels, and any public prediction record. Any of these would collide with us directly.

## Open questions

- Revenue and headcount. Not public. Check the Index and Greenoaks write-ups and any later press.
- Whether Simile has an API or developer tier. The site shows none. Test by requesting a demo or reading its changelog.
- Whether Simile has any public, pre-registered forecasts. None found. A search of its blog and social accounts would settle it.
- Non-US validation. None found; the 1,052-person sample is American. Ask in Gallup partnership coverage whether the panel is global.
- Title of Bernstein and Yallen's name spelling differ across sources. Low impact; confirm on the team page before we cite.
- TechCrunch's original critique was not opened. Fetch it before quoting.

## Sources

- [Simile homepage](https://www.simile.com/), accessed 2026-10-11
- [To find out what customers think, this $2bn startup asks their AI twins, The Next Web](https://thenextweb.com/news/simile-200-million-agentic-twins-ai-market-research), accessed 2026-10-11
- [The Stanford team that invented generative agents wants to kill the focus group, Implicator](https://implicator.ai/the-stanford-team-that-invented-generative-agents-wants-to-kill-the-focus-group/), accessed 2026-10-11
- [An AI company apparently inspired by The Sims wants to revolutionize public opinion research, Gizmodo](https://gizmodo.com/an-ai-company-apparently-inspired-by-the-sims-wants-to-revolutionize-public-opinion-research-2000731038), accessed 2026-10-11
- [Simile's $200M Bet, ai2.work](https://ai2.work/blog/simile-s-200m-bet-agentic-twins-come-for-the-focus-group-era), accessed 2026-10-11
- [Simile raises $200M Series B at $2B valuation, RuntimeWire](https://runtimewire.com/article/simile-raises-200m-series-b-2b-valuation), accessed 2026-10-11
- [LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
