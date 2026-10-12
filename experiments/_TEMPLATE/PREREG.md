# ENNN: <title>

- Registered: YYYY-MM-DD
- Owner seat: CEO | CTO | CPO | CRO | CFO
- Rests on: links to research notes and lenses by repo path
- Claim it earns or kills: the line in `gtm/messaging.md`, or the decision it informs

## Hypothesis

One falsifiable sentence, with its direction.

## Primary metric

The single number that decides the hypothesis, how it is computed, and over what unit.

## Secondary metrics

Reported, but they do not decide the hypothesis.

## Data

Sources, snapshot dates, licence status of each, and why the data cannot be in any model's training set (post-cutoff), or why contamination cannot help.

## Baseline

What we compare against, and why a skeptic would choose it.

## Sample size and stopping rule

How many units, why that many, and when the analysis runs. No peeking that changes the plan.

## Analysis plan

The exact test or interval, the split by region and tier, exclusions decided now, and how ties and missing data are handled.

## Kill criterion

What result makes us stop believing, building or claiming what, and what we do instead.

## Cost cap

The most this run may spend, and how the run stops when the cap cannot be checked.

## Command

`make experiment ID=ENNN`
