# Regulation: EU AI Act, GDPR for twins, US state AI laws, CFTC

- Date: 2026-10-11
- Area: business
- Confidence: medium. EU and CFTC points rest on primary pages I opened. The Colorado status and the exact US-state picture could not be confirmed (web search budget ran out; the Colorado bill page was a 2024 snapshot). This is research, not legal advice.

## Answer

Real World is lightly regulated if it stays a research-style forecasting service with synthetic agents and no real personal data in outputs. The two live obligations are EU AI Act Article 50 (mark synthetic outputs, label deepfakes) and GDPR for opt-in twins. Read prediction markets as data only. Never trade, never take bets, never route money. Launch Oct 27 with a labelling layer, a no-real-person rule for the public fork feature, and a consent-first twin design.

## Findings

**EU AI Act, transparency (Article 50).** Applies from 2 August 2026, so it is already in force. [Article 50](https://artificialintelligenceact.eu/article/50/) says providers of systems that generate synthetic audio, image, video or text must mark outputs in a machine-readable format so they are detectable as artificial. Deployers must disclose deepfakes. Deployers who publish AI text to inform the public on public-interest matters must disclose it, unless a human reviewed it and someone holds editorial responsibility. Systems that talk to people must make clear they are AI. Systems placed on the market before 2 Aug 2026 have until 2 Dec 2026 for the marking duty ([timeline](https://artificialintelligenceact.eu/implementation-timeline/)). We launch after Aug 2, so we get no grace.

**Code of practice.** The Commission's final code on marking and labelling AI-generated content was published after 10 June 2026. The Commission and AI Board call it an adequate voluntary tool. About 190 organisations had signed by end of July 2026. Signing is voluntary, the Article 50 duties are not ([Commission page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)).

**Fines.** Article 50 breaches: up to EUR 15M or 3% of worldwide turnover, whichever is higher. For SMEs and startups the lower of the two applies. Prohibited practices: EUR 35M or 7% ([Article 99](https://artificialintelligenceact.eu/article/99/)).

**Reach and exemptions.** The Act covers non-EU providers when the output is used in the EU ([Article 2](https://artificialintelligenceact.eu/article/2/)). Systems built solely for scientific research are excluded. Pre-market research is excluded, but not real-world testing. The open-source exemption does not cover Article 50. So a public API and a public web app are in scope; an internal research model alone would not be. Our globe, forks and receipts page are public, so assume in scope.

**High-risk rules are not our problem yet.** Annex III obligations apply from 2 Dec 2027 and Annex I from 2 Aug 2028 per the timeline page. Forecasting public opinion is not an Annex III use by itself. It becomes one if a customer uses output for employment, credit or similar decisions about individuals. The Article 5 ban list is relevant to one point: manipulation. Keep the product descriptive (what a population might think), not a persuasion tool tuned to move real people.

**GDPR and twins.** The synthetic population built from census microdata and attitude surveys is aggregate or already anonymised, which keeps it largely outside GDPR if we never publish rows that single out a person. Opt-in twins are different: interview transcripts are personal data and often special category (political opinions, religion, health are all in [Article 9](https://gdpr-info.eu/art-9-gdpr/)). Explicit consent is the clean basis. Research exceptions in Article 9(2)(j) need an EU or member-state legal basis and [Article 89](https://gdpr-info.eu/art-89-gdpr/) safeguards, which a startup cannot lean on casually. The EDPB's [Opinion 28/2024](https://www.edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf) (Dec 2024) says a model is anonymous only if extraction of personal data and obtaining it through queries are both "insignificant." It also says unlawfully processed training data can taint a model's later use. Practical read: a twin fine-tuned or prompted on a person's interview is personal data, full stop. It needs deletion on request, export, and a documented purpose.

**US states.**
- Colorado SB24-205 imposes duties on developers and deployers of high-risk systems that make consequential decisions, plus an AI-disclosure duty. SB25B-004 moved the date to 30 June 2026 ([bill](https://leg.colorado.gov/bills/sb25b-004)). That date has passed and I could not confirm whether it moved again. We are not a consequential-decision system.
- California SB 53 (signed 29 Sep 2025) targets large frontier developers: published frameworks, incident reporting, whistleblower protection, AG-enforced penalties ([governor's release](https://www.gov.ca.gov/2025/09/29/governor-newsom-signs-sb-53-advancing-californias-world-leading-artificial-intelligence-industry/)). We call third-party models; we are not a frontier developer. No action.
- Chatbot-disclosure and deepfake laws exist in several states. Colorado's rule requires telling consumers they are talking to AI. "Click any agent to ask why" is a chat with an AI persona: label it.

**CFTC.** On 9 Oct 2026 the CFTC proposed adding sports, politics, cultural and weather event contracts to the definition of "swap" (release 9310-26); comments are due 30 days after Federal Register publication ([press release](https://www.cftc.gov/PressRoom/PressReleases/9310-26)). Chairman Selig calls these "commodity derivatives squarely within the CFTC's regulatory remit." A 22 Sep 2026 staff advisory targets "mention markets" and is aimed at exchanges, not data users ([advisory](https://www.cftc.gov/PressRoom/PressReleases/9302-26)). Enforcement in the same list includes insider trading and manipulation in event contracts ([releases](https://www.cftc.gov/PressRoom/PressReleases)). Reading public market prices and scoring against them does not make us a regulated party. Placing orders, pooling money, or letting users bet on our forecasts would.

## What it means for Real World

- For the product: Put a visible "AI-simulated, not real people" label on every agent card, fork result and chart. Add an AI-persona notice on the "ask why" panel. Ban naming real individuals in fork events on the public site; deepfake labelling gets messy fast otherwise. Twins are opt-in with explicit consent, a delete button and an export button.
- For the engineering: Add machine-readable provenance to every API response and published text (a `synthetic: true` field plus a C2PA or signed metadata block for any generated image or media; for text, a response header and field is the realistic minimum). We already hash forecasts, so reuse that signing step. Keep twin data in its own store with per-person keys so deletion is real. Strip direct identifiers before anything touches a prompt or log.
- For the business: Get a one-page legal memo from an EU-qualified lawyer before the YC application; investors will ask. Treat the code of practice as the safe harbor and sign it if cheap. Skip trading on prediction markets entirely. No licence work needed for read-only market data, but check each venue's API terms.

## Recommendations

1. Ship the labelling layer before Oct 27: banner text, `synthetic` field in `/v1/simulate`, signed provenance header. Owner: engineering, 2 days.
2. Write a one-page "What this is and is not" page (simulation, not prediction of any individual, not decision-grade for hiring or credit). Add the same line to API terms. Owner: PM.
3. API terms: forbid use for decisions about individuals (employment, credit, insurance, housing) so we stay out of Annex III and Colorado high-risk territory.
4. Twin consent flow: explicit, granular, revocable, with deletion within 30 days and a stated purpose. Do not launch twins to the public until this exists; if short on time, launch Oct 27 without twins.
5. Public forks: block real named persons and sexual or violent deepfake-style prompts; reuse the model provider's moderation. Log the block.
6. Read-only markets: document in the repo that we consume price data only, never trade, never custody funds. Revisit if anyone proposes "bet on our forecast."
7. Sign the EU labelling code of practice if the effort is under a day; otherwise follow its text.
8. Hire counsel for a 2-hour review of items 1 to 4 once, with a budget cap.

## Open questions

- Is text output "marked" by a header and field, or does the code of practice require in-text watermarking? Read the final code's Section 1 text; ask counsel.
- Did Colorado delay or amend SB24-205 again in 2026? Check the General Assembly bill search for 2026 sessions.
- Does a simulated persona built from public survey data ever count as personal data under the EDPB test? Likely no, but an expert should confirm for small-country strata where cells are tiny.
- Do Kalshi and Polymarket API terms allow storing and republishing prices in our public scoring page? Read each venue's terms.
- Final text and effective date of the CFTC swap-definition rule, and whether it affects data republishers. Read the Federal Register NPRM.
- Other jurisdictions (UK, China's AI labelling rules, India) were not covered. A global product needs a pass on at least China and India.

## Sources

- [EU AI Act Article 50](https://artificialintelligenceact.eu/article/50/), accessed 2026-10-11
- [EU AI Act implementation timeline](https://artificialintelligenceact.eu/implementation-timeline/), accessed 2026-10-11
- [EU AI Act Article 99, penalties](https://artificialintelligenceact.eu/article/99/), accessed 2026-10-11
- [EU AI Act Article 2, scope](https://artificialintelligenceact.eu/article/2/), accessed 2026-10-11
- [Commission page, code of practice on AI-generated content](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content), accessed 2026-10-11
- [EDPB Opinion 28/2024 (PDF)](https://www.edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf), accessed 2026-10-11
- [GDPR Article 9](https://gdpr-info.eu/art-9-gdpr/), accessed 2026-10-11
- [GDPR Article 89](https://gdpr-info.eu/art-89-gdpr/), accessed 2026-10-11
- [Colorado SB25B-004](https://leg.colorado.gov/bills/sb25b-004), accessed 2026-10-11
- [Colorado SB24-205](https://leg.colorado.gov/bills/sb24-205), accessed 2026-10-11
- [California governor on SB 53](https://www.gov.ca.gov/2025/09/29/governor-newsom-signs-sb-53-advancing-californias-world-leading-artificial-intelligence-industry/), accessed 2026-10-11
- [CFTC press release 9310-26](https://www.cftc.gov/PressRoom/PressReleases/9310-26), accessed 2026-10-11
- [CFTC staff advisory 9302-26](https://www.cftc.gov/PressRoom/PressReleases/9302-26), accessed 2026-10-11
- [CFTC press releases index](https://www.cftc.gov/PressRoom/PressReleases), accessed 2026-10-11
