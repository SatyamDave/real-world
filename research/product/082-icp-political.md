# ICP and ethics: political campaigns and consultants

- Date: 2026-10-11
- Area: product
- Confidence: medium. The EU and Anthropic policy text, the NCSL state count and the platform reactions were opened. The FCC robocall ruling and the EU AI Act penalty tiers could not be fetched, and the web search budget ran out before I could try other sources.

## Answer

Do not sell to campaigns or political consultants at launch. Serve elections only as public, aggregate forecasting (the daily question, the receipts page), and write that down as a product rule. The legal exposure is real in the US states, the EU and the model-provider policies we depend on. The commercial upside is small next to what a campaign customer does to the public track record, which is the moat.

## Findings

**US states.** NCSL, updated 9 Oct 2026, says [31 states have enacted laws on deepfakes in political messaging](https://www.ncsl.org/elections-and-campaigns/artificial-intelligence-ai-in-elections-and-campaigns). Twenty-eight require a label on manipulated or AI-generated media. Colorado and Utah also require metadata disclosure. Windows vary: 90 days before an election is common, 60 in Colorado and Montana, 45 in Kentucky, 30 in Texas. Minnesota and Texas ban some deepfakes in a pre-election window. Maryland bans deceptive election deepfakes year-round. Enforcement is mostly civil, with some misdemeanor and felony penalties. California's and Hawaii's laws were found unconstitutional, and courts enjoined Montana's and Vermont's. These laws target synthetic content about candidates. A simulator that outputs numbers does not make that content. A customer who uses our agent-written reactions to draft ads could.

**EU AI Act.** [Annex III point 8(b)](https://artificialintelligenceact.eu/annex/3/) makes high-risk any AI system "intended to be used for influencing the outcome of an election or referendum" or voting behaviour. It excludes systems whose output natural persons are not directly exposed to, "such as tools used to organise, optimise or structure political campaigns from an administrative or logistical point of view." Plain reading: internal turnout logistics are out. A tool sold to find which message moves which voter is in the grey zone, and a regulator could call it influence. That is my reading, not a ruling. [Article 5(1)(a)](https://artificialintelligenceact.eu/article/5/) separately bans manipulative or deceptive techniques that cause significant harm, in force since 2 Feb 2025. I could not open the penalty text.

**EU political advertising.** [Regulation (EU) 2024/900](https://en.wikipedia.org/wiki/Regulation_(EU)_2024/900) applies mostly from 10 Oct 2025. It bans targeting on special categories of data such as political opinion, ethnicity and health, and bans targeting minors. Per the same page, Google left the EU political ad market and Meta suspended political and issue ads there from October 2025. That page carries an AI-generated-text warning, so check EUR-Lex before citing it externally; EUR-Lex itself would not load. The signal for us: the biggest ad platforms judged EU political work not worth the compliance cost.

**Model providers.** Anthropic's [usage policy](https://www.anthropic.com/legal/aup) bans false or misleading information in political and electoral contexts, at-scale automated messages to voters that hide their artificial origin, and content that falsely appears to come from a candidate or campaign. It does not mention targeted political persuasion directly, but it bars deceptive techniques that distort behaviour. We run on Anthropic models, so a campaign customer could put our own supply at risk. I could not open OpenAI's policy (403).

**Precedent for harm.** The Biden-voice robocall in New Hampshire in Jan 2024 was made by a consultant, per [Wikipedia](https://en.wikipedia.org/wiki/Artificial_intelligence_and_elections). The FCC then ruled AI voices in robocalls fall under the TCPA. I know that ruling is dated February 2024 from memory; I could not open it. Political consultants are the people regulators are already looking at.

**What does not work.** Simulated persuasion is the weakest part of the product. Funhouse Mirrors-style variance collapse and Western flattening hurt most in elections, where a few points matter and the population is local. Aaru missed the 2024 election. A campaign buyer judges us on one race, which we can lose publicly. Campaign data is also confidential, so a campaign cannot be a public, hashed forecast.

## What it means for Real World

- For the product: keep election questions in the public daily cycle. Output is aggregate and typed: share, segment and spread. No per-person targeting list, no generated persuasive copy, no "which message works on this agent" view. Fork-and-drop-an-event stays open, but event text that names a candidate or an election runs with the same aggregate-only output.
- For the engineering: add a policy check at `POST /v1/simulate` that flags named candidates, parties and elections, and drops segment granularity below a floor (for example, no segment under a minimum agent count). Log the flag in the trace. Fail closed on a check that could not run. Agent "why" traces must not emit text written as a campaign message.
- For the business: the ICP is research teams, newsrooms, policy and corporate-strategy groups, and forecasters, all of whom can sit under a public track record. Campaign revenue is a distraction before the YC application. A refusal also gives us a clean line for investors and reviewers: public forecasting only, no persuasion tooling.

## Recommendations

1. Write a one-page acceptable-use policy by Oct 20: no voter-level targeting, no content generation for campaigns, no use to influence an election outcome, aggregate outputs only. Link it from the API docs and the signup page.
2. Add the segment-size floor and the named-candidate flag to `/v1/simulate` before launch on Oct 27. One test per rule.
3. Decline paid political-consultant and campaign accounts for now; log inbound requests in a sheet to measure demand later.
4. Put election forecasts on the public receipts page with hashes like every other question, so political work builds the record rather than leaking it.
5. Get a lawyer's read on Annex III 8(b) and the state laws before any change to this stance. Budget one hour, not a retainer.
6. Add the election-disclosure line to the daily-question page: simulated, aggregate, not a poll.

## Open questions

- FCC February 2024 TCPA ruling: confirm wording and vote from fcc.gov or the Federal Register. Both URLs I tried failed.
- Does message-testing sit inside Annex III 8(b)? Ask counsel; check Commission guidance.
- Do the high-risk obligations apply on their original date, or has the EU delayed them? I did not verify. Check the Commission AI Act page.
- Does Anthropic's policy allow aggregate election forecasting? Ask Anthropic trust and safety in writing; the policy text suggests yes but is not explicit.
- Is there paying demand outside campaigns, for example PACs, pollsters and advocacy groups? Talk to five pollsters this week.

## Sources

- [NCSL: AI in elections and campaigns](https://www.ncsl.org/elections-and-campaigns/artificial-intelligence-ai-in-elections-and-campaigns), accessed 2026-10-11
- [EU AI Act, Annex III](https://artificialintelligenceact.eu/annex/3/), accessed 2026-10-11
- [EU AI Act, Article 5](https://artificialintelligenceact.eu/article/5/), accessed 2026-10-11
- [Regulation (EU) 2024/900 (Wikipedia summary)](https://en.wikipedia.org/wiki/Regulation_(EU)_2024/900), accessed 2026-10-11
- [Anthropic Usage Policy](https://www.anthropic.com/legal/aup), accessed 2026-10-11
- [Wikipedia: Artificial intelligence and elections](https://en.wikipedia.org/wiki/Artificial_intelligence_and_elections), accessed 2026-10-11
- [Brennan Center: regulating AI deepfakes in politics](https://www.brennancenter.org/our-work/research-reports/regulating-ai-deepfakes-and-synthetic-media-political-arena), accessed 2026-10-11 (an older snapshot, only four states; superseded by NCSL)
