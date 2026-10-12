# Decisions needed

Open product decisions only the founder can make, ordered by when they block work. Each lists the options the lenses argued for and what waits on it. When the founder decides, write a decision record in `research/decisions/` and remove the item in the same PR.

## Before the first hash (by Oct 14)

<!-- Item 1 (launch name) was decided on 2026-10-12: see research/decisions/0004-launch-name-real-world.md. Remaining items keep their numbers so references elsewhere (company/risks.md, company/plan-to-nov-2.md) stay correct. -->

2. **Election questions in launch week.** Launch-week events are mostly elections, and the safety note bans election-result calls during voting. Options: allow aggregate election forecasts committed before polls open, or run launch week on central banks and data releases only. Blocks: the first question list. ([red team](../research/lenses/red-team.md), [abuse and safety](../research/engineering/074-abuse-and-safety.md), [events calendar](../research/data/059-resolvable-events-calendar.md), [political ICP](../research/product/082-icp-political.md))
3. **Which forecast is the headline row.** Options: a blind forecast that never sees market prices, with the assimilated forecast as a labelled second row; or the assimilated forecast as headline. [E004](../experiments/E004/PREREG.md) is registered with the blind forecast as primary; choosing otherwise means registering a new experiment before any question resolves. ([red team](../research/lenses/red-team.md), [prediction markets](../research/market/005-prediction-markets-landscape.md), [data assimilation for ABMs](../research/science/022-data-assimilation-abm.md))
13. **Sign off the first real question list.** [`data/questions/2026-10-proposed.json`](../data/questions/2026-10-proposed.json) holds 29 drafted questions for Oct 14 to Nov 30 across the 16 countries; 8 have dates that could not be confirmed on the official site and 3 are elections that wait on item 2. Options: approve it as is, approve it after dropping or editing questions, or reject it. Approving means setting `"status": "approved"` and committing the file's sha256 before the first forecast; after that the list never changes. Blocks: forecasting on real questions instead of fixtures. ([question lists](../data/questions/README.md), [events calendar](../research/data/059-resolvable-events-calendar.md), [0002](../research/decisions/0002-benchmark-and-receipts.md))

## Before Gate 1 (Oct 17)

4. **Showing market prices before the terms are read.** Options: show the price at commit as a number with a source link (CRO), or show nothing until someone has read the Kalshi and Polymarket terms (red team). ([CRO lens](../research/lenses/cro.md), [red team](../research/lenses/red-team.md), [prediction market APIs](../research/data/051-prediction-market-apis.md))
5. **Spread audit threshold.** Options: flag or fail the run below 0.7 ([failure modes](../research/science/018-failure-modes.md), [red team](../research/lenses/red-team.md)), or require the band 0.8-1.2 ([CEO lens](../research/lenses/ceo.md), [CTO lens](../research/lenses/cto.md)). E002 reports both.
6. **Retrospective hindcasts.** Some notes ban backtests because models have seen the past; others ask for a 90-day hindcast. Options: allow hindcasts in internal engineering only, labelled retrospective, or ban them. ([forecast scoring](../research/science/030-forecast-scoring.md), [benchmark design](../research/science/097-benchmark-design.md), [data assimilation for ABMs](../research/science/022-data-assimilation-abm.md), [red team](../research/lenses/red-team.md))

## Before pricing is published (by Gate 2, Oct 22)

7. **Free fork allowance.** Options: 3 a day ([CEO lens](../research/lenses/ceo.md), [CTO lens](../research/lenses/cto.md), [CRO lens](../research/lenses/cro.md)); 3 a month at 200 agents ([CFO lens](../research/lenses/cfo.md)); or a dollar cap per fork with the sample sized to fit ([CPO lens](../research/lenses/cpo.md)). Until decided, the API runs provisional defaults: 20 forks a day per address (`FORK_ANON_PER_DAY`), $0.50 per fork (`FORK_MAX_COST_USD_DEFAULT`) and $10 a day across all forks (`FORK_DAILY_BUDGET_USD`), in `engine/rw/settings.py`; these are placeholders, not a choice among the options.
8. **Pro plan at launch.** Options: $49 a month with 50,000 agent-steps ([pricing models](../research/product/079-pricing-models.md), [CRO lens](../research/lenses/cro.md)), or pay-as-you-go credits only until there is usage data ([CFO lens](../research/lenses/cfo.md), [CPO lens](../research/lenses/cpo.md)).
9. **The insights-team pilot offer.** Approve or change $7,500 for 6 weeks, converting to $2,000 a month, before the first buyer call quotes it. ([CRO lens](../research/lenses/cro.md), [`gtm/pricing.md`](../gtm/pricing.md))

## Before launch (Oct 27)

10. **Paid human panel before YC.** Options: about $5k of Prolific completes from Oct 20 ([CFO lens](../research/lenses/cfo.md)), or none beyond a small retention pilot, with daily-question answers as the panel ([CEO lens](../research/lenses/ceo.md), [CPO lens](../research/lenses/cpo.md), [red team](../research/lenses/red-team.md)).
11. **What daily-question data stays proprietary.** The panel is the one data asset that compounds; decide what is published and what is kept before the first answer is collected. ([VC lens](../research/lenses/vc.md), [moat theory](../research/business/092-moat-theory.md))
12. **The north-star metric.** Confirm or replace the choice in [`north-star.md`](north-star.md).
13. **One shared theme file for the landing page and the app.** `web/src/styles/tokens.css` is a copy of `landing/src/styles/tokens.css` from the unmerged landing PRs (#20, #23, #25), and the IBM Plex files are copied too. Options: once those PRs land, move the tokens and fonts into one shared file both apps import, or keep two copies that must change together. Blocks: any palette or type change after the landing PRs merge.
