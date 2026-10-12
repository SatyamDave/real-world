# Abuse and safety for a public world simulator

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Legal and policy facts come from the primary pages I opened. The web search budget ran out, so I could not check case law, other labs' policies, or recent misuse incidents. Nothing here is legal advice.

## Answer

The main abuse risk is not fake content. It is people using the simulator as a free message-testing machine for persuasion, and using named-person simulation to put words in real people's mouths. Real World can ship by Oct 27 with a small set of hard rules: simulate groups, never named people; refuse persuasion optimization and election-night "call it" content; stamp every output as a simulation in the schema itself; and rate limit by API key and by spend, not by IP. Do not build a moderation platform. Build five rules, one schema field, and one log.

## Findings

**Persuasion testing is a real capability, and the uplift is in the tuning, not the model.** Hackenburg et al. ran three experiments with 76,977 people, 19 LLMs and 707 political issues. Persuasion post-training raised persuasiveness by up to 51 percent and prompting by up to 27 percent. Personalization and model scale mattered less. Methods that raised persuasion also lowered factual accuracy. [arXiv 2507.13919](https://arxiv.org/abs/2507.13919). Implication: a simulator that lets a user try ten message variants on 100,000 synthetic voters and keep the winner is an optimizer for exactly this. The output is a ranking, and the ranking is the harm.

**Simulated respondents are credible enough to be misused.** Argyle et al. showed GPT-3 conditioned on demographic backstories can mimic subgroup response distributions ("algorithmic fidelity"). [arXiv 2209.06899](https://arxiv.org/abs/2209.06899). Park et al. built agents for 1,052 Americans from two-hour interviews; they matched 83 to 86 percent of the participants' own test-retest consistency on held-out survey items, versus 74 percent for demographics only. [arXiv 2411.10109](https://arxiv.org/abs/2411.10109). The abstract says nothing on consent or safeguards, so I could not confirm what the paper says there. Opt-in twins are the exact product that raises the consent question.

**Election content is regulated, unevenly, and mostly about deceptive media.** NCSL counts 31 US states with laws on deepfakes in political messaging: 3 prohibit (Minnesota, Texas, Maryland), 28 require disclosure, with windows from 30 days (California) to 120 days (Tennessee) before an election, and some with no window. Courts are pushing back: a California law was struck down, a Hawaii law permanently enjoined, and Montana and Vermont got preliminary injunctions. [NCSL](https://www.ncsl.org/elections-and-campaigns/artificial-intelligence-ai-in-elections-and-campaigns). Takeaway: these laws target synthetic audio, image and video presented as real. A forecast labeled as a simulation is outside the core target, but a "simulated voter reaction" quote attributed to a named politician is not.

**Provider policy is what bites first.** The Anthropic usage policy page I opened shows an effective date of Nov 12, 2026. It bans false or misleading information about candidates and voting, content that falsely appears to come from a candidate, official or campaign (including undisclosed synthetic media), concealing the sponsor of messaging meant to influence opinion, and impersonating real people. Parody and fiction that is clearly disclosed are excluded. Persuasion is not a named category; the closest rule is manipulative techniques that impair decision-making. [Anthropic usage policy](https://www.anthropic.com/legal/aup). Real World runs on a model vendor's API, so a user who gets us to generate sponsor-hiding persuasion copy puts our vendor account at risk, not just our reputation. I could not open OpenAI's policy (HTTP 403).

**EU labeling rules apply now.** AI Act Article 50 applies from 2 Aug 2026. Providers of systems that generate synthetic audio, image, video or text must mark outputs machine-readably. Deployers must disclose deepfakes and AI-generated text published to inform the public on matters of public interest, unless a human edited it and holds editorial responsibility. [Article 50](https://artificialintelligenceact.eu/article/50/). Fines for transparency breaches go up to EUR 15M or 3 percent of turnover; for SMEs and startups the cap is whichever is lower. [Article 99](https://artificialintelligenceact.eu/article/99/). A public daily forecast page is plausibly "text on a matter of public interest," so label it.

**Machine-readable marking is weak for text.** The C2PA 2.2 spec lists image, video, PDF, audio-container and similar formats as embeddable assets. Plain text and JSON are not listed as asset types; JSON and CBOR are only manifest encodings. Soft bindings (fingerprints or watermarks) can re-link stripped content, but are "not statistically unique." [C2PA 2.2](https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html). So for an API returning JSON, the practical marking is a required field in the response plus a signed record on our side. Do not promise a watermark.

**Personal data law reaches "simulating real people."** GDPR personal data is any information relating to an identifiable person, and profiling includes forecasting someone's preferences or behavior. [Art. 4](https://gdpr-info.eu/art-4-gdpr/). Political opinions are a special category, processable mainly with explicit consent or when the person made them manifestly public. [Art. 9](https://gdpr-info.eu/art-9-gdpr/). A twin built from someone's interview, or an agent "modeling" a named politician's inferred views, sits here. Census-sampled synthetic agents with no link to a real person are far safer.

**Rate limiting: IP is the wrong key and the tools are loose.** Cloudflare's Workers binding counts per key in 10 or 60 second windows, per location, and is "permissive and eventually consistent"; the docs advise against IP keys. [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/). Cloudflare WAF rules on Free count only by IP, one rule, 10 second window; header-based counting needs Enterprise. [WAF rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/). Rate limits stop bursts. They do not stop a patient user running 40 messages through one key over a week. Only a spend and run quota does that.

## What it means for Real World

- For the product: Make "fork a world and drop in an event" safe by default. Events are shocks to the world (a chip shortage), not messages aimed at a group. Show results as segment distributions with ensemble spread, never as "this message wins." The public receipts page is the strongest safety feature: hashed, scored forecasts make us a forecaster, not a campaign tool.
- For the engineering: Put the safety in the typed schema. Every `/v1/simulate` response carries `simulated: true`, a `world_id`, a model and seed record, and a human-readable `disclosure` string. Add an input classifier on the event text only (cheap, one call), not on every agent step. Log every run with key ID and event text so abuse is traceable.
- For the business: Our vendor terms are the binding constraint, and they change (the policy I read takes effect Nov 12). The YC pitch should say: we simulate populations, we publish scored forecasts, we refuse persuasion optimization. That is a differentiator against message-testing vendors, and it keeps the vendor account safe.

## Recommendations

1. Write a one-page acceptable use policy before launch, with five rules: no named private individuals; no named public figures speaking in first person; no persuasion ranking of messages targeted at voters; no election-result calls during voting hours; no use to build deceptive campaigns. Link it from the API docs and the app footer.
2. Ban named-person simulation in v1. Agents are census-sampled and anonymous. Click-an-agent "why" shows the profile and reasoning trace, never a real name. Ship opt-in twins only with explicit consent text, deletion, and a political-opinion flag, and gate them behind a later release.
3. Add a `disclosure` and `simulated: true` field to every typed output in the OpenAPI spec and both SDKs, and render a fixed "Simulation, not a poll or prediction of a real person" banner on every globe, fork and receipts page. Add the label to shared images and exported links.
4. Block A/B message testing structurally. Reject a simulate request whose event field contains several variants aimed at one segment, or return only the aggregate across variants with no per-variant ranking. Start with a prompt classifier and a regex; tune from logs.
5. Rate limit on three layers: a Workers rate-limit binding keyed by API key (burst), a daily simulated-agent-days quota per key (cost and slow abuse), and a hard cap on ensemble size and forks per day for free keys. Fail closed if the quota check errors.
6. Election window mode: from 7 days before a national election in any country with an event, show forecasts with wider intervals and delay publication of vote-share numbers on election day itself. Keep it a config flag, not a system.
7. Keep an abuse log: key, IP, event text, classifier decision, output hash. Review it weekly during the first month. Add a takedown address and a two-day response commitment.
8. Check the vendor's policy text against our six launch surfaces once before Oct 27, and re-check on Nov 12.

## Open questions

- What do OpenAI and Google policies say on political persuasion and simulation? Fetch each policy page with a browser session; I got a 403.
- Is a signed daily forecast page "AI-generated text on public-interest matters" under Article 50(4)? Ask counsel; it likely turns on the editorial-responsibility exemption.
- Did the Park et al. participants consent to agent release, and on what terms? Read the full paper and the Agent Bank access terms before designing twin consent.
- Real misuse patterns for message-testing tools (Aaru, other synthetic-panel vendors) and past enforcement (for example the 2024 fake Biden robocall) are not verified here. Search again if the budget allows.
- How do countries with strict election-coverage blackout rules (France, India, others) treat published forecasts? Needs per-country review before we label the world "global."

## Sources

- [Anthropic usage policy](https://www.anthropic.com/legal/aup), accessed 2026-10-11
- [EU AI Act Article 50](https://artificialintelligenceact.eu/article/50/), accessed 2026-10-11
- [EU AI Act Article 99](https://artificialintelligenceact.eu/article/99/), accessed 2026-10-11
- [NCSL, AI in elections and campaigns](https://www.ncsl.org/elections-and-campaigns/artificial-intelligence-ai-in-elections-and-campaigns), accessed 2026-10-11 (read first 100,000 of 120,601 characters)
- [Hackenburg et al., The Levers of Political Persuasion with Conversational AI](https://arxiv.org/abs/2507.13919), accessed 2026-10-11
- [Park et al., LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals](https://arxiv.org/abs/2411.10109), accessed 2026-10-11
- [Argyle et al., Out of One, Many](https://arxiv.org/abs/2209.06899), accessed 2026-10-11
- [C2PA Specification 2.2](https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html), accessed 2026-10-11 (first 100,000 of 579,297 characters; threat sections not read)
- [GDPR Article 4](https://gdpr-info.eu/art-4-gdpr/), accessed 2026-10-11
- [GDPR Article 9](https://gdpr-info.eu/art-9-gdpr/), accessed 2026-10-11
- [Cloudflare Workers rate limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), accessed 2026-10-11
- [Cloudflare WAF rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/), accessed 2026-10-11
