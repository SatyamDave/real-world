# Acceptable use

Real World simulates groups of synthetic people and publishes scored forecasts. It is not a tool for testing political messages or for imitating real people. These rules apply to every fork, in the web app and through `POST /v1/simulate`.

## The rules

1. **No persuasion testing on elections or candidates.** Do not use a fork to find which message, ad, slogan or framing moves voters, or how to shift support for a candidate, party or ballot measure.
2. **No real private people.** Do not name, describe or imitate a real private individual in an event. Agents are sampled from a synthetic population calibrated to published marginals; none of them is a real person.
3. **Outputs are labelled simulated.** Every result says `simulated: true` and carries a disclosure. Do not remove the label when you quote, share or republish a result.

## Election window

From 2026-10-27 to 2026-11-04 (UTC, both days included), around the US midterm elections on 2026-11-03, a fork event that names a party, candidate or ballot measure is refused, even when it is not persuasion testing. The dates are `ELECTION_WINDOW` in `engine/rw/settings.py`.

## What happens to a fork that breaks a rule

The fork does not start. A refusal from the rule pass costs nothing; one from the classification costs only that one call. The API answers `422` with a stable `code` and a plain `detail`; the web app shows the detail under the event box.

| `code` | Rule |
| --- | --- |
| `private_person` | No real private people |
| `election_persuasion` | No persuasion testing on elections or candidates |
| `election_window` | Election window |

The check runs a fixed rule pass and then one short model classification of the event text. If the classification cannot run, the API answers `503` and starts nothing. A refused request writes no job.

## Why

[research/engineering/074](../research/engineering/074-abuse-and-safety.md) (persuasion testing is the main abuse risk; election window), [research/product/082](../research/product/082-icp-political.md) (no campaign work), [research/business/091](../research/business/091-regulation.md) (keep the product descriptive, not a persuasion tool), [research/lenses/cro.md](../research/lenses/cro.md) (policy by Oct 20).
