# Launch plan: Oct 27, 2026

**Since [0016](../research/decisions/0016-icp-audiences.md):** launch to consumer founders where they are: Show HN, Product Hunt, founder communities and YC's network, with one live demo: a visitor writes a one-line product idea, pastes a message, reads the 27 segments and the plain baseline, and sees the test sealed. One public proof moment beats a tour ([market/004](../research/market/004-jev-typesafe.md), [consumer wedge](../research/product/108-consumer-wedge.md)). Ten founder calls before Oct 27 are the first evidence: what they last shipped, where, and what really happened. The track record below is the proof a skeptic reaches from the "Public record" link; it is not the headline.

What faces the public is the track record and the message test together: a visitor with no account can run a test, and can see forecasts we hashed before their outcomes existed, some already resolved in public, next to the market price and a plain-LLM baseline ([CEO lens](../research/lenses/ceo.md), [CPO lens](../research/lenses/cpo.md)). The company-wide gates and kill criteria live in [`company/plan-to-nov-2.md`](../company/plan-to-nov-2.md); this file covers what faces the public.

## The track record

1. **Receipts.** Each row: question, hash, commit time, our probability, the market price at commit, the persistence and plain-LLM baselines, the outcome, Brier, and n. A constant 50% scores 0.25, and the page says so. No pooled headline number; results split by region and tier ([CPO lens](../research/lenses/cpo.md), [forecast scoring](../research/science/030-forecast-scoring.md), [trust](../research/product/087-trust-and-explainability.md)).
2. **One fork.** A prefilled event, cached, with a share card: one setup sentence, the top three segment shifts, the ensemble band and a replay URL ([viral simulations](../research/product/076-viral-simulations.md), [CPO lens](../research/lenses/cpo.md)).
3. **One agent.** "What moved this agent" from the structured trace, and "in its own words" labelled as a simulated account, not the cause ([trust](../research/product/087-trust-and-explainability.md)).

Why the record is the proof: no funded competitor publishes a forward, hashed, scored record ([Aaru](../research/market/001-aaru.md), [Simile](../research/market/002-simile.md), [vendors](../research/market/003-synthetic-research-vendors.md)), and Show HN posts that people could touch beat posts that led with a method ([launch channels](../research/product/084-launch-channels.md)).

## Sequence

| Date | Step | Owner | Source |
| --- | --- | --- | --- |
| Oct 11-14 | First hashed forecasts, including events that resolve around launch: the Brazil runoff and the Serbia and Bulgaria votes (Oct 25) and the central-bank decisions (Oct 28-30). Election questions follow the founder's ruling in `company/decisions-needed.md` | CEO | [events calendar](../research/data/059-resolvable-events-calendar.md), [CEO lens](../research/lenses/ceo.md) |
| Oct 13 | Builder names chosen | CPO | [`builders-program.md`](builders-program.md) |
| By Oct 20 | Acceptable-use policy published; API frozen for builders | CRO, CTO | [political ICP](../research/product/082-icp-political.md), [builders program](../research/product/086-builders-program.md) |
| Oct 20-26 | Five newsrooms offered a co-published piece on one hashed forecast | CPO | [games and media ICP](../research/product/083-icp-games-media.md) |
| Oct 24 | Demo path frozen | CPO | [CEO lens](../research/lenses/ceo.md) |
| Oct 25 | Brazil runoff resolves in public on the receipts page; builder demos due | CEO | [events calendar](../research/data/059-resolvable-events-calendar.md), [builders program](../research/product/086-builders-program.md) |
| Oct 27 | Show HN pointing at the live message test; builders post their own work | CEO | [launch channels](../research/product/084-launch-channels.md) |
| Oct 28-30 | Central banks resolve on the receipts page | CEO | [events calendar](../research/data/059-resolvable-events-calendar.md) |
| Nov 3 onward | One named post a week for four weeks | CPO | [API launch playbooks](../research/product/078-api-launch-playbooks.md), [CPO lens](../research/lenses/cpo.md) |

Re-verify every event date before hashing a question on it ([CEO lens](../research/lenses/ceo.md)).

## Channels

| Channel | Role | Rules |
| --- | --- | --- |
| Show HN | Primary | Link the live message test or the public record, never a landing page or waitlist. Plain title, no superlatives. Structured first comment within minutes. A founder on the thread for hours. Never ask anyone to upvote ([launch channels](../research/product/084-launch-channels.md)) |
| Builders' own posts | Secondary | Each posts their own demo and answers comments ([builders program](../research/product/086-builders-program.md)) |
| Forecasting communities (Metaculus, Manifold) | Recruitment and launch audience | Fallback launch audience if the builders program is cut ([builders program](../research/product/086-builders-program.md)) |
| X | Experiment | Post the first receipt, a hashed forecast and its later score, as a native thread with the chart and the link in a reply; untested ([launch channels](../research/product/084-launch-channels.md)) |
| Newsrooms | Distribution | Free co-published pieces, two published is success ([games and media ICP](../research/product/083-icp-games-media.md)) |
| Product Hunt | Founder audience | A day of effort; the audience is consumer founders ([launch channels](../research/product/084-launch-channels.md)) |
| External benchmarks | Credibility | Submit the plain-LLM baseline to ForecastBench and Metaculus MiniBench for a rank we did not grade ([CEO lens](../research/lenses/ceo.md), [VC lens](../research/lenses/vc.md)) |

## Launch-day checks

- The message test and the public record work with no sign-up; otherwise no Show HN ([builders program](../research/product/086-builders-program.md)).
- Anonymous fork runs are capped and served from cache by default, with the cap decided before launch ([launch channels](../research/product/084-launch-channels.md)).
- Every output carries "AI-simulated", its coverage tier and its spread ([regulation](../research/business/091-regulation.md), [coverage tiers](../research/data/099-country-coverage-tiers.md)).
- All public copy passes [`messaging.md`](messaging.md).

## Founder calls in parallel

Ten calls with consumer founders before Oct 27, each asking what they last shipped, what really happened, and how they checked the message first ([CEO lens](../research/lenses/ceo.md)). Answers go in the YC application; see [`icp.md`](icp.md).

## Unknowns

- The best hour and day to post: no reliable source found; check comparable Show HNs through the Algolia API first ([launch channels](../research/product/084-launch-channels.md)).
- Whether founders mark their tests: measured as the share who mark within 14 days of a sealed test ([0016](../research/decisions/0016-icp-audiences.md)).
