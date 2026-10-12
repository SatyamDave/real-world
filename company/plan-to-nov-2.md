# Plan to Nov 2

22 days, Oct 11 to Nov 1. Launch on Oct 27; submit the YC application by Nov 1. The Winter 2027 deadline is Nov 2 at 8:00 p.m. PT ([YC application](../research/business/088-yc-application.md)); we submit a day early so a failed upload is not fatal.

What we launch: a daily question, a receipts page of forecasts hashed before their outcomes, a fork card, and `POST /v1/simulate`. Anything else waits ([CPO lens](../research/lenses/cpo.md), [CEO lens](../research/lenses/ceo.md)).

Each gate below lists the checks that must be true on its date and the kill criterion that applies if they are not. A gate is marked passed, failed or slipped in this file, with evidence, on its date.

## Before the first gate: Oct 11-14

- First hashed forecasts out by Oct 14: daily salted Merkle root chained to the previous day, timestamped, mirrored to a public repo. The first forecasts may come from the plain-LLM baseline, labelled as such ([CEO lens](../research/lenses/ceo.md), [CTO lens](../research/lenses/cto.md), [commit-reveal](../research/engineering/070-commit-reveal-timestamping.md)).
- Licence emails sent to IPUMS, WVS, Pew, Afrobarometer, the GLOPOP-S author, Kalshi and Polymarket ([data licensing](../research/data/060-data-licensing-legal.md), [red team](../research/lenses/red-team.md)).
- 1,000-agent token pilot run, writing one cost-ledger row per call ([CFO lens](../research/lenses/cfo.md)).
- Builder names chosen by Oct 13 ([builders program](../research/product/086-builders-program.md)).
- Founder rulings on name, election questions and the scored row (`decisions-needed.md` items 1-3), because all three must be settled before the first hash.

## Gate 1: Oct 17

Must be true:
- The ledger has published a root every day since the first hash, with no gap.
- The scored-question list, resolution sources and scoring rule are committed and hashed before any forecast on them ([red team](../research/lenses/red-team.md)).
- The API spec is frozen as of Oct 16 ([CEO lens](../research/lenses/ceo.md)).
- The source licence table exists and the loader refuses any source marked "unknown" ([CTO lens](../research/lenses/cto.md)).
- Measured token use from the pilot has replaced the estimates in [`gtm/pricing.md`](../gtm/pricing.md).
- E001-E005 are registered with hashes in [`experiments/REGISTRY.md`](../experiments/REGISTRY.md).
- Builders have keys ([builders program](../research/product/086-builders-program.md)).

Kill criterion: if the ledger is not publishing daily, every other workstream stops until it is; the fork card is the first thing cut from launch scope.

## Oct 18-22

- Engine end to end on GLOPOP-S plus published aggregates, labelled "calibrated to published marginals" ([CEO lens](../research/lenses/ceo.md)).
- Plain-LLM baseline live and scored daily by Oct 20 ([CEO lens](../research/lenses/ceo.md)).
- Nightly spread audit running ([CTO lens](../research/lenses/cto.md)).
- Acceptable-use policy published by Oct 20 ([political ICP](../research/product/082-icp-political.md)).
- API frozen against breaking changes from Oct 20 ([builders program](../research/product/086-builders-program.md)).
- E003 run, since assimilation does not enter the nightly run without it.

## Gate 2: Oct 22

Must be true:
- At least five builders made a working API call by Oct 21 ([builders program](../research/product/086-builders-program.md)).
- The engine runs nightly end to end, inside the $25 budget ([CEO lens](../research/lenses/ceo.md)).
- Measured standard cost per 1,000 agent-steps is known ([CFO lens](../research/lenses/cfo.md)).
- E001 has run and its results are committed, whatever they show.

Kill criteria:
- Fewer than five builders working: cut the program, fall back to our own three demos and a forecasting-community launch ([builders program](../research/product/086-builders-program.md)).
- Engine not running end to end: launch with the plain-LLM baseline as the only forecaster on the receipts page, labelled as such, and the simulation as a preview.
- Measured cost above $0.50 per 1,000 agent-steps: the proposed price changes that week ([CFO lens](../research/lenses/cfo.md)).

## Gate 3: Oct 24

Must be true:
- Demo path frozen ([CEO lens](../research/lenses/ceo.md)).
- Fork card returns in under 30 seconds, and prefilled forks in under 5 ([CPO lens](../research/lenses/cpo.md)).
- Every spend path fails closed under test: per-call cap, per-user balance, nightly ceiling, global free-tier budget ([CFO lens](../research/lenses/cfo.md)).
- Labelling layer live: `simulated: true`, disclosure string, sources and a visible "AI-simulated" label ([CRO lens](../research/lenses/cro.md), [regulation](../research/business/091-regulation.md)).
- Top five confusing moments from builders fixed ([builders program](../research/product/086-builders-program.md)).

Kill criterion: any spend path without a working fail-closed cap is switched off for launch.

## Gate 4: Oct 27, launch

Must be true:
- About 25 forecasts hashed, some already resolved in public, starting with the Brazil runoff on Oct 25 ([CEO lens](../research/lenses/ceo.md), [events calendar](../research/data/059-resolvable-events-calendar.md)).
- The daily page works with no sign-up.
- All public copy passes [`gtm/messaging.md`](../gtm/messaging.md).
- Ten buyer calls done ([CEO lens](../research/lenses/ceo.md)).

Kill criterion: if the daily page cannot be used without sign-up, no Show HN; launch to the forecasting community only ([builders program](../research/product/086-builders-program.md)). The launch sequence is in [`gtm/launch-plan.md`](../gtm/launch-plan.md).

## Gate 5: Nov 1, YC application submitted

Must be true:
- Application submitted, with the demo recorded from the live product and a known-flaws section written from measured numbers ([CEO lens](../research/lenses/ceo.md)).
- Every number in it traces to the ledger, a committed experiment result, or a signed document.
- Buyer commitments reported as they are: target three signed pilots ([CRO lens](../research/lenses/cro.md)); zero is reported as zero.

Kill criterion: none moves the deadline. If a number cannot be sourced, it comes out of the application.
