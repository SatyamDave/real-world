# Moat theory for AI products: which of our moat layers hold

- Date: 2026-10-11
- Area: business
- Confidence: medium. The a16z and NfX claims are read from the primary pages. The scoring of our layers is my judgment, not tested. The WebSearch budget ran out mid-task, so I could not open Helmer's full list of powers or any track-record-as-moat essay.

## Answer

Raw data is a weak moat, and both a16z and NfX say so. Of our layers, only the public hashed track record is a true time-locked asset, and it is worth nothing until it has hundreds of resolved questions. The daily panel is the best real data asset. The daily pipeline and the twins are copyable. For the YC application, pitch the track record and panel as the moat. Pitch the pipeline as the way we earn them.

## Findings

**Data is a weak moat by default.** a16z's "The Empty Promise of Data Moats" says most "data network effects" are scale effects. Real network effects need participants to interact. More data does not do that. The authors say scale effects can reverse: data gets costlier to collect, and each new batch adds less. In their support-bot example, coverage plateaued near 40% of use cases. Data also goes stale, and rivals collect similar data. Their line: "defensibility is not inherent to data itself." They say data helps when it is proprietary or hard to get. [a16z, Empty Promise of Data Moats](https://a16z.com/the-empty-promise-of-data-moats/)

**NfX agrees, with a narrow exception.** NfX defines a data network effect as value that rises with data, where more usage yields more data. It calls most of them asymptotic, because past some size the algorithm stops improving. Waze is the strong case: users keep real-time data fresh. Experian is the counter-case: more data helps, but usage adds none, so it is only scale. NfX ranks data effects ninth of its 16 types. [NfX, network effects manual](https://www.nfx.com/post/network-effects-manual), [NfX, bible](https://www.nfx.com/post/network-effects-bible)

**AI companies have shallow moats.** a16z estimates AI gross margins at 50-60%, against 60-80%+ for SaaS. It says model architectures are mostly open, data is often customer-owned or public, and moats are "shallower than many expected." [a16z, The New Business of AI](https://a16z.com/the-new-business-of-ai-and-how-its-different-from-traditional-software/)

**Our inputs are public.** GDELT is free for any commercial use, with attribution required. Anyone can build our news ingest. [GDELT terms](https://www.gdeltproject.org/about.html)

**Our twin evidence is thin.** Park et al. built agents for 1,052 Americans from two-hour interviews. On held-out GSS items, agents reached 83% of the person's own test-retest consistency (86% with surveys added). Demographics-only agents reached 74%. The authors note that adding sources gives only modest gains. [Park et al., arXiv 2411.10109](https://arxiv.org/abs/2411.10109)

**Competitors are funded and shipping.** Simile's site announces a $200M Series B at a $2B valuation. Its named customers include CVS Health, Gallup and Deloitte. Aaru claims a 2,993-question validation with mean TVD 7.62% and MAE 3.53%, which is its own claim. Both sell simulations to enterprises. Neither page mentions a public, hashed, time-stamped record. [Simile](https://www.simile.com/), [Aaru](https://aaru.com/)

**Helmer.** His framework defines a power as conditions that create "persistent differential returns." The site did not list the seven powers when fetched, so I do not cite the list here. [7 Powers](https://7powers.com/)

## What it means for Real World

The brief names four layers. I count the "learn from misses" loop as the fifth. Scores below are my judgment.

| Layer | Moat type | Holds? |
|---|---|---|
| Daily assimilation pipeline | Process, plus public inputs | Weak. A funded rival copies it in weeks. |
| Daily human panel | Proprietary data, scale effect | Moderate to strong, if it grows and stays longitudinal. |
| Opt-in twins | Per-person data, switching cost | Weak today. Park's gain over demographics is about 12 points on one US sample. |
| Public hashed track record | Time lead, cannot be backfilled | Strong in principle, empty at launch. |
| Learn-from-misses loop | Accumulated calibration | Weak alone. It is a private edge only while it improves the record. |

- For the product: the moat only forms if usage produces fresh, resolvable data. Forking and "ask an agent why" produce nothing that resolves against reality, so they are demand, not moat. The daily question is the loop that can behave like Waze. Users answer it. The answers feed the panel. The panel improves the forecast. The better forecast brings more users. Freshness is the point: a16z's staleness argument cuts for us, since a rival cannot copy today's opinions from a snapshot.
- For the engineering: store every forecast with its hash, timestamp, model version and market price at forecast time. Never rewrite a row. Store panel responses with timestamps and country. This is the only data that cannot be rebuilt later, so it needs the most care.
- For the business: at launch our record is 22 days old. That is too few resolved questions to say we beat market price. The lead a record gives is the days elapsed, and a rival can start publishing tomorrow. The moat is real but thin. Say so to YC rather than overclaim. Aaru's missed 2024 election and Simile's $2B valuation both show buyers pay before a record exists. A public record is a differentiator in the sales story more than a barrier.

## Recommendations

1. Start the hashed ledger now, before launch. Every day published before Oct 27 adds to the lead. Publish a daily batch hash to a place we do not control, such as a public repo commit or a timestamping service.
2. Make the daily question the core loop. Users answer it, and the answers join the panel. Track panel size, country coverage and retention per day as the headline moat metrics.
3. Report Brier score against market price on every resolved question, including losses, plus a count of resolved questions. Show no ranking claim until the count supports one.
4. Do not pitch the pipeline, GDELT ingest or twins as moats. Pitch them as cost of entry. Keep the twins opt-in and treat them as a retention feature for panelists.
5. Pick a data-sharing posture for the panel before launch. Decide what stays proprietary and what is released. Panel data that is free to download is not a cornered resource.
6. Run a kill check in January: if the panel is under a size a PM can name in advance, or the record is not beating market on resolved questions, drop the moat claim from the pitch.

## Open questions

- How many resolved questions are needed before a Brier gap against market price is statistically distinguishable from noise? Answer by simulating with our own question mix and a reasonable base rate.
- Can a competitor credibly backdate a record? Check whether third-party timestamping services are accepted as proof. Not researched.
- Do panelists return daily without payment? Run a 100-person pilot before launch and measure week-two retention.
- Helmer's full list of powers and any essay that treats a public track record as a moat were not read. Rerun the search when budget allows.
- Polymarket and Kalshi reuse terms for market prices were not found. Read both terms of service, since our scoring depends on them.

## Sources

- [The Empty Promise of Data Moats, a16z](https://a16z.com/the-empty-promise-of-data-moats/), accessed 2026-10-11
- [The New Business of AI, a16z](https://a16z.com/the-new-business-of-ai-and-how-its-different-from-traditional-software/), accessed 2026-10-11
- [The Network Effects Manual, NfX](https://www.nfx.com/post/network-effects-manual), accessed 2026-10-11
- [The Network Effects Bible, NfX](https://www.nfx.com/post/network-effects-bible), accessed 2026-10-11
- [7 Powers, Hamilton Helmer](https://7powers.com/), accessed 2026-10-11
- [GDELT terms of use](https://www.gdeltproject.org/about.html), accessed 2026-10-11
- [Generative Agent Simulations of 1,000 People, arXiv 2411.10109](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Aaru](https://aaru.com/), accessed 2026-10-11
