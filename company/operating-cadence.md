# Operating cadence

Few rituals, each with an output someone can check.

## Every day

| When (UTC) | Ritual | Output | Owner | Source |
| --- | --- | --- | --- | --- |
| Before 08:00 | Publish the daily hashed call: today's forecasts in a salted Merkle root chained to yesterday's, timestamped and mirrored | The day's root on the public page and in the mirror; a dead-man alert fires if it is missing at 08:00 | CTO | [CTO lens](../research/lenses/cto.md), [commit-reveal](../research/engineering/070-commit-reveal-timestamping.md) |
| After the nightly run | Read the spread audit and the cost ledger against caps | Any segment outside 0.8-1.2 flagged; any cap hit reviewed the same day | CTO, CFO | [CEO lens](../research/lenses/ceo.md), [CFO lens](../research/lenses/cfo.md) |
| After scoring | Score newly resolved questions; reveal their salts | Receipts page updated with n and intervals, misses included | CEO | [forecast scoring](../research/science/030-forecast-scoring.md) |
| End of day | Changelog: one dated entry listing every merged PR and what it measurably improved, plus any gate result | A new dated entry in `CHANGELOG.md` at the repo root, created by the first entry; old entries are never edited | CEO | [root `CLAUDE.md`](../CLAUDE.md) |

A missed daily root is an incident: write down why the same day and fix the cause before the next run.

## Every week

| Day | Ritual | Output | Owner | Source |
| --- | --- | --- | --- | --- |
| Monday | Research review: which notes went stale, which decisions their new evidence touches, which items in `decisions-needed.md` are ready for the founder | A list of notes to update and decision records to write, as issues | CEO | [`research/CLAUDE.md`](../research/CLAUDE.md) |
| Monday | Metrics review against [`north-star.md`](north-star.md) and the gates in [`plan-to-nov-2.md`](plan-to-nov-2.md) | Current values with dates in `north-star.md` | CEO | [`north-star.md`](north-star.md) |
| Monday | Risk review against [`risks.md`](risks.md) | Changed rows, with evidence | CRO | [`risks.md`](risks.md) |
| Weekly | Canary questions re-run to detect model drift; model ids pinned and logged with every hash | Canary results committed | CTO | [silicon samples](../research/science/016-silicon-samples.md) |
| Weekly | Check that ensemble spread is calibrated | Spread-skill numbers committed | CTO | [data assimilation for ABMs](../research/science/022-data-assimilation-abm.md) |
| Weekly | Founder-call tally: calls held, what they last shipped, what really happened, tests marked | Updated counts in `north-star.md` input 5 | CPO | [0016](../research/decisions/0016-icp-audiences.md) |
| Weekly, Nov 3 onward for four weeks | One named public post | The post, linking committed results only | CPO | [API launch playbooks](../research/product/078-api-launch-playbooks.md), [CPO lens](../research/lenses/cpo.md) |

## Every month

- Re-run the external benchmark submissions and record the rank we did not grade ourselves ([CEO lens](../research/lenses/ceo.md)).
- Runway at trailing 30-day net burn; below 6 months without a seed term sheet, the paid panel and the second hire stop ([CFO lens](../research/lenses/cfo.md)).
