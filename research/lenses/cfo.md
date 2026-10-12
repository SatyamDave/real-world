# CFO lens: unit economics, burn and the raise

- Date: 2026-10-11
- Seat: CFO
- Notes read in full: business/089-unit-economics.md, product/079-pricing-models.md, engineering/062-llm-cost-choices.md, engineering/068-compute-hosting.md, market/013-api-pricing-benchmarks.md, market/008-polling-economics.md. The rest from the digest.
- Every dollar figure below is an estimate built on unmeasured token counts. The first decision exists to replace them.

## Verdict

The model bill is not what will sink us. At Haiku 5.5 batch prices, the nightly world costs $7-28 (business/089-unit-economics.md), hosting is about $3 a night (engineering/068-compute-hosting.md), and 22 days of the core loop cost less than one hour of a lawyer's time. Three things can sink us. The first is multiplication: free forks, ensembles and 7-day horizons multiply the bill, and one viral post with uncapped forks costs $11k in a day. The second is the human panel, which at the research's suggested size ($1.5-3k a day) is 60-100x the LLM bill. The third is pricing on a token count nobody has measured: if real prompts are 3-5x the assumed size, the proposed $1 per 1,000 price loses money. The fix is boring. Build a cost ledger first, cap every spend path and fail closed, cut the paid panel to a small fixed budget, and launch with pay-as-you-go credits only. On that plan the 22 days cost about $15k cash. The first 12 months cost about $735k, so YC's $500K is roughly 8 months of runway, and a $2M seed is needed by spring 2027.

## Evaluation

**Costs per surface (my arithmetic on the notes' prices; measure before trusting).**

| Surface | Unit | Cost estimate | Source |
|---|---|---|---|
| Nightly world, 100k agents, 1 call each, batch, cached prefix | per night | $7-14 (3 samples: $21-42) | business/089-unit-economics.md |
| Nightly world, archetype-first (2,000 archetypes x 5 samples x 10 questions) | per night | about one full pass, $7-14 | science/028-large-scale-llm-sims.md, science/019-calibration-methods.md |
| Daily ensemble K=20 on 5k-agent subsamples | per night | about one full pass | engineering/066-ensembles.md |
| Agent-step (agent x simulated day x ensemble member) | per 1,000 | $0.13 batch, $0.265 standard | business/089-unit-economics.md |
| Free fork, 200 agents x 7 days x 1 member | per fork | $0.37 | business/089-unit-economics.md |
| Paid fork, 1,000 x 7 x 5 | per run | $4.64 batch, $9.28 standard | business/089-unit-economics.md |
| Full fork, 100k x 7 x 5 | per run | $350-600 | market/013-api-pricing-benchmarks.md, engineering/061-system-architecture.md |
| Ask why | per click | $0.0009 Haiku, about $0.01-0.02 Sonnet | engineering/062-llm-cost-choices.md |
| Compute (Modal fan-out) | per night | about $3 | engineering/068-compute-hosting.md |
| Human panel complete, Prolific 5 min | per complete | $1.43 | market/008-polling-economics.md |
| LLM-only baseline forecast, frontier + search | per forecast | $2-5 (FutureSearch comp) | market/006-ai-forecasting-companies.md |

The pattern is clear. Inference costs are a rounding error per answer and a real risk in aggregate, because every product knob (agents, days, members, samples, free users) multiplies them. Human answers cost four orders of magnitude more per answer. Infra does not matter.

**Where the notes disagree, and my ruling.**
- Three names for one meter: "agent-days" (market/013-api-pricing-benchmarks.md), "agent-answers" (product/079-pricing-models.md) and "agent-steps" (business/089-unit-economics.md). We use one: the **agent-step**, meaning one agent, one simulated day, one ensemble member. 1 credit = 1,000 agent-steps.
- The free fork allowance ranges from "3 per day" (089) to "3 a month at 1,000 agents" (079). 3 a day at $0.37 is $33 per user per month, which is unaffordable. 3 a month at 1,000 agents is $5.60, not the "$0.50" that 079 claims. My ruling: 3 a month, 200 agents, 1 member, about $1.11 a month at most, in line with the under-$1 target in 013.
- Pro at $49 (079) against pay-as-you-go only (013, product/078-api-launch-playbooks.md). If prompts come in 3-5x larger than assumed, which 079 itself warns about, 50,000 included steps cost $40-66 against a $49 price. We launch with no subscription.

**Revenue.** I plan on $0 through month 6. No vendor in the category publishes self-serve prices, no buyer interview exists, and YC will judge traction on scored forecasts, not on dollars (market/003-synthetic-research-vendors.md). Any revenue is upside and does not count toward runway.

## Top 10 decisions and demands, in priority order

1. **Build the cost ledger and run the measurement before any price is published.** One row per LLM call: model, input, cached and output tokens, cost in integer micro-dollars, purpose (nightly, free, paid, internal), and user. Run 1,000-2,000 real calls in five or more languages with thinking at its lowest setting. Every number in this lens is a guess until that run exists. (business/089-unit-economics.md, engineering/062-llm-cost-choices.md, engineering/073-multilingual-agents.md)

2. **Every spend path fails closed, with four caps.** A per-call `max_cost`, checked against an estimate before the run. A per-user monthly balance. A nightly ceiling: budget $25, alert at $60, hard stop at $100. A global daily free-tier budget: when it runs out, anonymous and free users get cached forks only. If a cap check errors, the run is refused. (business/089-unit-economics.md, market/013-api-pricing-benchmarks.md, engineering/074-abuse-and-safety.md)

3. **Set the pricing floor from the ledger, not from a note.** List price is $1 per 1,000 agent-steps, but only if measured standard cost is $0.33 or less per 1,000, which keeps gross margin at 67% or more before Stripe fees. If measured cost is higher, the price rises to 3x measured standard cost. We never price below 3x. Batch savings stay as margin. (business/089-unit-economics.md, product/079-pricing-models.md)

4. **Launch on pay-as-you-go credits only.** Credits do not expire. The minimum top-up is $20, not $5, because Stripe takes 8.9% of a $5 charge. No Pro plan, annual plan or enterprise tier until there are 100 paid runs. "Talk to us" covers anything above 1M steps a month. Use Stripe Checkout for fixed packs and keep our own `usage_events` table as the record; no Metronome. (market/013-api-pricing-benchmarks.md, product/078-api-launch-playbooks.md, product/079-pricing-models.md)

5. **Cap the paid human panel at $5k before YC.** Run 250 Prolific completes a day from Oct 20 to Nov 2 in the deepest pools: about $360 a day, $5k in total. After that, $9k a month (200 a day) until the January kill check. The free daily question is the scalable panel; the paid panel is the correction set. Request one Cint quote for India, Brazil and Nigeria so the pitch has a real number, and buy nothing from them. (market/008-polling-economics.md, business/092-moat-theory.md, science/019-calibration-methods.md)

6. **The engine is archetype-first and distribution-first, which is a cost decision as much as a science one.** About 2,000 archetype calls per question per night, with agents sampled from the distributions those calls return. The LLM is called only for exposed agents, and forks are cached by an input hash so an identical fork costs nothing. That keeps 3-5 samples (the fix for variance collapse) inside the single-pass budget instead of tripling it. (science/028-large-scale-llm-sims.md, science/025-news-exposure-diffusion.md, engineering/072-replay-and-caching.md)

7. **Tier forks by price.** Anonymous users get cached forks only. Free signed-in users get 3 a month at 200 agents with 1 member. Paid forks go up to 5,000 agents and 10 members. No full-population fork is sold at launch, and every response states the agent count actually sampled. Concurrency and ensemble caps scale with lifetime spend. (business/089-unit-economics.md, engineering/061-system-architecture.md, market/013-api-pricing-benchmarks.md)

8. **One-off launch budgets are fixed and tracked.** $1,000 in API credit for the 10 builders ($100 each, enforced by a key cap). A $2,000 reserve for launch-week free usage. $800 for the LLM-only baseline forecaster and Metaculus MiniBench (bench capped at $150). $3,000 for counsel: data licensing, trademark knockout and the labelling and terms review, booked as a single block. (product/086-builders-program.md, science/021-llm-forecasting.md, market/006-ai-forecasting-companies.md, data/060-data-licensing-legal.md, business/091-regulation.md, product/085-naming-trademark.md)

9. **Raise about $2M after Demo Day, against the track record.** Take YC's standard $500K: $125K for 7% plus the uncapped MFN SAFE. On the 12-month plan below that is about 8 months of runway, so the seed must close by April 2027, sized for 24 months at about $80k a month. Ask Anthropic and Modal for startup credits this week; they offset the only variable cost line we cannot cap to zero. (business/088-yc-application.md, business/090-seed-comps.md, engineering/068-compute-hosting.md)

10. **Hire two people in 12 months, not five.** First the forecasting and evaluation scientist (from January), then the data and pipeline engineer (from February). The simulation, full-stack and panel-ops roles wait for the seed. At about $15k a month loaded, each hire costs more than a year of nightly LLM spend. (business/094-team-and-advisors.md)

## Burn

**22 days (Oct 11 to Nov 2), cash, founders unpaid.**

| Line | Amount |
|---|---|
| Nightly LLM, 22 x $25 budget (ceiling 22 x $60 = $1,320) | $550 |
| Pilots, bake-offs, language A/B, spikes | $500 |
| LLM baseline forecaster + MiniBench | $800 |
| Human panel (decision 5) | $5,000 |
| Builders' credits | $1,000 |
| Launch free-usage reserve | $2,000 |
| Infra (Modal, Neon, Workers, R2) | $150 |
| Counsel | $3,000 |
| Domain hedge + one USPTO filing | $500 |
| **Subtotal** | **$13,500** |
| 10% contingency | $1,350 |
| **Total** | **about $15,000** |

**12 months (Nov 2026 to Oct 2027), assuming the YC deal and no revenue.**

| Line | Per month (steady) | 12-month |
|---|---|---|
| Two founders, modest salaries | $16,000 | $192,000 |
| Two hires from Jan and Feb, loaded | $30,000 | $285,000 |
| Paid human panel | $9,000 | $108,000 |
| LLM: nightly, ask why, audits, internal | $1,800 | $22,000 |
| Free-tier cost (global cap) | $2,000 | $24,000 |
| Data licence reserve (Gallup quote or WVS commercial terms) | $2,000 | $24,000 |
| Infra, tools, legal, accounting | $2,500 | $30,000 |
| Contingency | | $45,000 |
| **Total** | **about $65,000** | **about $735,000** |

Paid usage is excluded from these lines because at a margin of 67% or more it funds itself. The panel is the biggest line we control. If the January kill check fails (panel not growing, no edge over the market on resolved questions; business/092-moat-theory.md), the panel is cut to zero, saving $9k a month.

## What to cut

- A paid panel of 1,000-2,000 completes a day before YC ($33-66k over 22 days). Cut to decision 5.
- Cint and Dynata purchases, and a Gallup World Poll licence before launch. Get quotes only.
- Opt-in twins at about $90-100 per person in participant pay (science/017-generative-agents.md). Post-launch, tens of agents, separate budget.
- Self-hosting GPUs or open-weight models. An H100 costs $64-95 a day, more than the nightly bill (engineering/062-llm-cost-choices.md). Revisit when Anthropic spend passes $3k a month.
- Full-population forks, uncapped free forks, and "100,000 agents" wording on forks.
- Subscriptions, Pro, annual and enterprise tiers, and Metronome.
- The $50 X API test and DataForSEO at up to $300 a month (data/052-search-and-attention.md, data/055-social-media-data.md). Wikipedia pageviews and GDELT are free.
- Temporal, Dagster, Kubernetes, AWS, and a second hosting platform.
- Hires three to five before the seed.
- Game-studio and political-campaign revenue lines (market/010-game-npc-ai.md, product/082-icp-political.md).

## The three numbers I will watch

1. **Measured standard cost per 1,000 agent-steps**, from the ledger, every day. Green at $0.33 or less, which keeps the $1 price at 67% margin or more. Above $0.50 the price changes that week.
2. **Daily LLM spend by purpose (nightly, free, paid, internal) against its cap.** Nightly at $25 or less. Free spend under the global cap, with no single account above $1.11 a month. Any cap hit gets reviewed the same day.
3. **Runway in months at trailing 30-day net burn.** It must stay at 6 months or more. Below 6 months without a signed seed term sheet, the panel and the second hire stop.
