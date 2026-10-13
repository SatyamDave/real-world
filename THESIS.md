# Thesis: why Real World can become the best consumer message-testing product, and what has to be true

Date: 2026-10-13. The decision this argues for is [research/decisions/0017-moats.md](research/decisions/0017-moats.md). Product facts come from [0016](research/decisions/0016-icp-audiences.md) and the founder's ruling of 2026-10-13. Every web source was opened on 2026-10-13 unless marked otherwise; facts from repo notes link the note.

## The argument in one paragraph

A consumer founder can already get a fast opinion on a message from ChatGPT for free, a small human poll for $15-500, or a live ad test that needs a product, traffic and a week. None of them tells the founder how often that kind of answer turns out right. Real World seals each prediction before the outcome exists, scores it against a plain baseline and the founder's gut once the founder marks what really happened, and, if founders opt in, pools those outcomes so each founder's next test in a category is calibrated on what happened to everyone else's. The engine is copyable. The marked outcomes, the calibration built from them and a public record nobody can backfill are not, and they grow only with use. That is the whole bet. Today it is a bet: the record of marked tests is empty, the engine is uncalibrated, and whether the 27 segments beat a single prompt is an open, pre-registered question ([E010](experiments/E010/PREREG.md)).

## The premise

Nikita Bier posted on 2026-10-11 that technical moats are mostly over and that the durable ones are proprietary data, network effects and a physical component ([post](https://x.com/nikitabier/status/2109497987055640958); wording as relayed in the founder's brief and a search result, the X page was not opened; [Dealroom's summary](https://dealroom.co/news/x-2109497987055640958-nikita-bier-technical-moats-are-mostly-over-only-proprietary-data-networ/) was). The repo's own moat note reached the same view a day earlier: raw data is a weak moat, the pipeline is copyable, and only a time-locked record and fresh, resolvable data hold ([business/092](research/business/092-moat-theory.md)). This thesis takes the three moats one at a time and says which ones Real World can have.

## What the product is on 2026-10-13

- A founder writes the idea in one line, the ideal consumer in plain words, and the message.
- The engine expands the ideal consumer into 27 segments (attitude to new products x price sensitivity x category familiarity) and asks many simulated consumers per segment one Jev decision call each, in parallel; 1,080 by default, up to 10,800 ([0016](research/decisions/0016-icp-audiences.md) rule 1a).
- Every test also runs one plain baseline call with no segments ([0016](research/decisions/0016-icp-audiences.md) rule 3).
- Backtest takes up to 10 messages the founder already shipped, with what happened, and stores nothing ([0016](research/decisions/0016-icp-audiences.md) rule 4).
- Marking a sealed test records Landed or Flopped and an optional real metric, once; the database refuses any later change (`api/rw_api/sql/tests.sql`).
- The engine also publishes daily forecasts of real events, sealed before the outcome and scored in public ([0012](research/decisions/0012-will-it-land-and-call-it.md), [0002](research/decisions/0002-benchmark-and-receipts.md)).
- Free in beta; enterprise only on request.

## What is true today and what is not

| Claim | True today? | Evidence or how we would find out |
| --- | --- | --- |
| Each sealed test cannot change after it is made | Yes | Triggers in `api/rw_api/sql/tests.sql` refuse updates to a sealed row and any change after a mark |
| The engine beats a plain prompt on real outcomes | Unknown | [E010](experiments/E010/PREREG.md) runs once at 100 eligible marked tests |
| The engine beats the founder's gut | Unknown | Same experiment, second test |
| There is a body of marked outcomes | No. Zero marked tests | `post_tests` table; [company/north-star.md](company/north-star.md) records 0 |
| Results are calibrated | No. The product says "Uncalibrated until 100 marked tests" | [product/will-it-land.md](product/will-it-land.md) |
| Founders' marks improve other founders' tests | No. Marks are private and nothing pools them | This record's change list, items 2 and 6 |
| The public record has a long history | No. It started in October 2026 | [business/092](research/business/092-moat-theory.md) |
| A physical component exists | No | Section "Moat 3" below |

## Moat 1: proprietary data

**The row.** One marked test produces: the message, the idea, the ideal consumer, the engine's intent for each of 27 segments, the baseline intent, the founder's gut, the outcome (Landed or Flopped) and, if given, a real metric such as a signup rate. The seal fixes the predictions before the outcome exists, so the row cannot be faked after the fact, and it exists only because a founder tested before shipping and came back after. A rival with more money can copy the engine; it cannot buy last month's marks.

**Why outcome rows, and not more simulated answers.** Simulated respondents reproduce averages and rank orders but compress variance and stereotype groups ([science/016](research/science/016-silicon-samples.md), [science/018](research/science/018-failure-modes.md)). Independent replications find 12-15 point errors per question: Pew's best model averaged about 12 points, Verasight 14.5 ([market/003](research/market/003-synthetic-research-vendors.md)). The best published results come from conditioning on real human data: Park et al.'s agents built from interviews reached 83% of people's own two-week test-retest consistency, against 74% from demographics alone ([arXiv 2411.10109](https://arxiv.org/abs/2411.10109)); fine-tuning on survey answer distributions cut the gap to held-out subgroups by up to 46% ([SubPOP, arXiv 2502.16761](https://arxiv.org/abs/2502.16761)); semantic-similarity rating reached 90% of human test-retest reliability on 57 personal-care concept surveys with 9,300 human responses ([arXiv 2510.08338](https://arxiv.org/abs/2510.08338)). Every one of these is measured against what people say, not what they later do. Stated intention explains only part of behaviour: in Sheeran's meta-analysis of 422 studies the intention-behaviour correlation was about 0.53 ([Sheeran and Webb 2016](https://eprints.whiterose.ac.uk/107519/)), and stated purchase intent differs from later purchase rates in aggregate, not only per person ([Morwitz 2014](https://dx.doi.org/10.1561/1700000036)). A row that ties a prediction to what the market actually did is the target none of these datasets have.

**How it compounds.**
1. Calibration. Decision [0008](research/decisions/0008-self-improving-loop.md) already defines a Platt map fitted on resolved cases and promoted only when it beats the incumbent on a fresh holdout with a bootstrap interval below zero. Its gate needs 50 training and 30 holdout cases (`IMPROVE_MIN_TRAIN_QUESTIONS`, `IMPROVE_HOLDOUT_QUESTIONS` in `engine/rw/settings.py`). One founder will rarely mark 80 tests; a pool of founders in one category can. The same note warns that richer maps, such as isotonic or per-segment ones, overfit below roughly 200-1,000 cases ([engineering/104](research/engineering/104-self-improving-loop.md)).
2. Segment weights. [0016](research/decisions/0016-icp-audiences.md) weights the 27 segments equally because the real mix is unknown. With enough marks in a category, the weights that best predict Landed or Flopped can be fitted instead of guessed. That is 27 parameters per category, so it needs several hundred marks per category at least (an estimate from the usual events-per-parameter rule, not a measurement), and it goes through 0008's gate like any other parameter.
3. An owned model. Decision [0010](research/decisions/0010-survey-finetuned-model.md) trains an open model on licensed survey answer distributions. Marks are human outcomes, not model outputs, so they are eligible targets under its rule; they enter only after the founder decides consent covers it.

**Consent and privacy rules.** Under 0017:
- Pooling is opt-in per test at the moment of marking, off by default. A founder's test stays theirs unless they choose otherwise.
- The shared row holds the category, the sealed numbers, the outcome and the metric. It never holds the message text, the idea, the ideal-consumer description, the account id or the email. Founders' unreleased messages are often confidential, and text is the field most likely to carry personal data.
- Pseudonymised data is still personal data for anyone who holds the link back ([ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/pseudonymisation/)), so the shared row keeps no link to the account once written; withdrawal is handled by a per-test token the founder holds, and a withdrawn row leaves every later fit and benchmark.
- Opted-in backtests are retrospective: the model may have seen those messages or their results. They count toward benchmarks only, never toward a calibration holdout, E010 or the public record.
- Benchmarks show only when enough distinct founders contributed (proposed: 20 rows from 5 accounts; a choice, not an evidence-based threshold). Comparable products enforce floors too: Mailchimp's benchmarks use only campaigns sent to at least 1,000 subscribers ([Mailchimp](https://www.mailchimp.com/resources/email-marketing-benchmarks/)), and Klaviyo compares an account with about 100 similar companies and needs 25 sends first ([Klaviyo](https://help.klaviyo.com/hc/en-us/articles/360050110072-Guide-to-Benchmarks-in-Klaviyo)). Neither documents an opt-in; ours does.
- [product/privacy.md](product/privacy.md) changes in the same PR that adds the opt-in.
- Open: a map fitted on Jev's intents may be barred by TypeSafe's MCA §2.3(b) ([company/decisions-needed.md](company/decisions-needed.md) item 14). Until a legal read says otherwise, pooled calibration fits the baseline and the owned model only.

## Moat 2: network effects, stated precisely

A network effect means one user's use makes the product better for other users. a16z argues that most "data network effects" are really scale effects with diminishing returns, and that data goes stale ([a16z](https://a16z.com/the-empty-promise-of-data-moats/)). NFX keeps data network effects as one of its 16 types but only where usage itself generates the data, and calls them asymptotic ([NFX](https://www.nfx.com/post/network-effects-manual)). By that test:

| Mechanism | What kind it is | Its ceiling |
| --- | --- | --- |
| Pooled calibration: founder A's mark recalibrates founder B's next test in the same category | A data network effect in NFX's sense: the usage (testing and marking) produces the data that improves other users' results | Per category, a two-parameter map stops improving after a few hundred marks; the effect then rests on freshness (consumer taste moves) and on the next category |
| Category benchmarks: "Messages like yours in <category> landed X of n times" | Same kind, weaker: it gives context, not a better prediction | Once a benchmark's interval is tight, more rows add little |
| Public page per sealed test, shared by the founder | Distribution, not a network effect: a shared page brings new founders but does not improve anyone's test | None as a loop, but it is how the pool grows |
| The daily public record of sealed forecasts | A trust asset tied to elapsed time, not a network effect | A rival can start its own record any day; it cannot backdate one |
| More founders running tests without marking | Scale only, and only on cost | None of it improves predictions |

The closest outside example is Stripe Radar: every merchant's fraud outcomes train the model that protects every other merchant, and Stripe says 92% of charges come from a card already seen on its network ([Stripe Radar](https://stripe.com/radar)). Waze is the canonical case where users keep the data fresh ([Waze](https://en.wikipedia.org/wiki/Waze)). Experian is NFX's counter-example: more data helps, but consumers' usage does not add it, so it is scale ([NFX](https://www.nfx.com/post/network-effects-manual)). Real World's pooled calibration has Stripe's shape only if founders both mark and opt in; without the opt-in it has none.

## Moat 3: a physical component

There is none, and none is planned. Real World is software that calls rented models. A kiosk, device or owned panel would be invented for this document, and the brief rules that out.

The closest durable substitute is the public record with an external time anchor. Each day's forecasts are hashed into a Merkle root and the root is anchored outside our control ([engineering/070](research/engineering/070-commit-reveal-timestamping.md)); OpenTimestamps, for example, proves that data existed before a point in time by anchoring its hash to Bitcoin, without trusting the publisher ([OpenTimestamps](https://opentimestamps.org/)). Elapsed time is the one input no funding round buys, and scored public records are how forecasters earn trust; the Good Judgment Project scored its forecasters with Brier scores on tracked outcomes ([Superforecasting](https://en.wikipedia.org/wiki/Superforecasting)). This is a trust asset, not a barrier: a rival can start the same clock tomorrow ([business/092](research/business/092-moat-theory.md)).

The one real-world signal that would make the data stronger is verified outcomes: a founder connects a read-only source (an analytics, payments or ad account) and the real metric is read from it instead of typed. A typed mark can be wrong or wishful; a read metric cannot be chosen after the fact. It is not physical, and it is not in the change list below because self-reported marks have not yet been shown to be the problem. It becomes the next step if E010's data shows marks that contradict their own metrics.

## The market, and why a founder would switch

What a consumer founder can use today, with list prices read on the vendors' own pages:

| Option | What it costs | What it does not give |
| --- | --- | --- |
| Ask a chatbot | Free or a subscription | Any measure of how often it is right; this is the baseline every Real World test also runs |
| PickFu poll | From $1 per response, 15 to 500 responses ([PickFu](https://www.pickfu.com/pricing)) | A link from stated preference to what happened after launch |
| Pollfish | From $0.95 per complete self-serve; full service from $5,000 a project ([Pollfish](https://www.pollfish.com/pricing/)) | Same |
| Prolific | Participant pay plus a 42.857% fee for companies ([Prolific](https://researcher-help.prolific.com/en/articles/445239-what-is-your-pricing)) | Same, and the founder writes and screens the study |
| Lyssna | Growth plan $166 a month, panel recruitment extra ([Lyssna](https://www.lyssna.com/pricing/)) | Same |
| Wynter | Pro $20,000 a year; the example test on the page costs $1,599; aimed at B2B ([Wynter](https://www.wynter.com/pricing)) | Built for B2B buyers, priced for teams |
| Synthetic-research vendors (Simile, Aaru, Synthetic Users, Electric Twin, Artificial Societies) | Enterprise contracts; Synthetic Users starts at $12,500 a year; Simile announced $200M at a $2B valuation ([market/003](research/market/003-synthetic-research-vendors.md), [business/092](research/business/092-moat-theory.md)) | A public, sealed, scored record; each reports its own accuracy |
| AI interview platforms (Listen Labs: $69M Series B, customers include Microsoft and Sweetgreen) ([Pear](https://pear.vc/listen-labs-series-b/)) | Enterprise | Fast results for a pre-launch founder with no budget |
| A live A/B or ad test | Needs a live product, traffic and days of spend; Google Optimize, the free option, shut down on 2023-09-30 ([Google](https://support.google.com/analytics/answer/12979939?hl=en)); Meta's own figure for a minimum useful test was not found | An answer before launch |

The funded synthetic-research companies sell to enterprises. Self-serve consumer founders sit between a free chatbot and a $15-500 human poll. Why one would switch to Real World, in order of how much we can show today:

1. It answers before there is a product to put traffic on, and costs nothing in beta.
2. It shows the plain baseline beside the segment answer, so the founder can see whether the extra structure adds anything; no vendor in the table does this.
3. It tells them how often answers like this one were right, first on their own marks, then, with pooling, on everyone's in their category. This is the reason that grows with use and the one a chatbot cannot match. It does not exist until founders mark and opt in.

Two things we do not know: how many consumer founders exist to reach (no sourced count was found for Product Hunt launches, indie founders or DTC brands; Shopify says only "millions" of merchants ([Shopify](https://www.shopify.com/investors))), and what they will pay after beta. We would find the first from the sign-up and test counts of the first 60 days, and the second only by charging.

## What kills the thesis

Each trigger is observable and is written into [0017](research/decisions/0017-moats.md) or the records it rests on.

1. E010 at 100 marked tests: the engine's Brier is not below the baseline's ([E010](experiments/E010/PREREG.md)). Then the 27 segments add nothing a single prompt does not; the product leads with the baseline and the data moat is a calibration layer on a plain prompt, which a rival with the same marks could match.
2. Fewer than 1 in 10 founders who run a test mark it within 14 days ([0016](research/decisions/0016-icp-audiences.md)). Then no outcome data accrues and there is no moat of any kind.
3. After 300 marks, fewer than 30% are opted into the shared record. Then no category reaches 0008's 80-case gate in a useful time, and pooling falls back to the founder's own data.
4. The first category to reach 80 shared marks fails 0008's promotion gate. Then pooled calibration does not improve tests, and the network-effect claim is withdrawn.
5. A legal read of MCA §2.3(b) bars a map fitted on Jev intents ([decisions-needed](company/decisions-needed.md) item 14). Then calibration runs only on the baseline and an owned model, and the owned model's E009 becomes the critical path.
6. Ten founders say the three dimensions do not describe their customers, or five a month ask for business buyers ([0016](research/decisions/0016-icp-audiences.md)).
7. E010 reaches no result by 2027-06-30 for lack of marks ([E010](experiments/E010/PREREG.md)).

## The product changes the moats require, in order

Each is one PR, built by other agents, with its product spec changed in the same PR.

1. **Category on every test.** The founder picks one category from 0016 rule 6's list at step 0; it is sealed with the test. Pooling and benchmarks need it, and it costs one field.
2. **"Add this result to the shared record" on marks.** Off by default, per test, chosen at the moment of marking. Writes a shared row with the category, sealed numbers, outcome and metric, and none of the message, idea, ideal consumer, account id or email. Withdrawal by a per-test token. [product/privacy.md](product/privacy.md) updated in the same PR.
3. **The same opt-in on backtests.** Rows labelled retrospective; used for benchmarks only.
4. **Category benchmarks on results.** "Messages in <category> on the shared record: landed X of n", with n and an interval, shown only above the contribution floor.
5. **A public page per sealed test, if the founder chooses.** Shows the seal, the predictions, the baseline and, once marked, the outcome; message text only if the founder includes it. This is distribution.
6. **Pooled per-category calibration through 0008's gate.** Needs its own pre-registered experiment and the answer to item 14 before it is built; fits the baseline first if E010 says so.
7. **Marks as training targets for 0010's owned model.** Only after the founder decides consent covers it, and only rows opted in after that decision.

Verified outcomes from a founder's own systems stay out of this list until the data shows typed marks are the weak point.
