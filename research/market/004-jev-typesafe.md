# Jev / TypeSafe AI: what it is and what to copy

- Date: 2026-10-11
- Area: market
- Confidence: medium. Product, API and pricing are verified on TypeSafe's own docs. Funding beyond the $40M seed is one press report. Performance claims are vendor-only.

## Answer

Jev is not a simulation competitor. It is a fast, cheap classifier: you send text plus typed questions, and you get back choices, scores or yes/no probabilities. It does not model populations, time or interventions. We should treat it as a possible component and as a launch playbook, and we should copy its typed output contract, not its claims.

## Findings

**What it is.** TypeSafe AI came out of stealth on 15 Sep 2026 with Jev, which it calls the first "System One" model. It takes "unstructured state in, typed probabilistic decisions out" and does not write text, code or explanations ([The Register](https://www.theregister.com/a/5296711), [DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-jev)). Questions are scored in parallel, not token by token. The training method is called RLCD (Reinforcement Learning for Calibrated Decisions). The architecture is undisclosed. Outside observers suspect a transformer on an open-weight base, which is unverified.

**People and money.** Founders are Diogo Almeida (CEO, ex-OpenAI, credited with co-inventing RLHF), Erik Gafni and Sasha Sheng ([RuntimeWire](https://runtimewire.com/article/diogo-almeida-typesafe-jev-40m-seed-pong)). Seed was $40M led by DCVC, at a reported valuation near $200M. Bloomberg reported on 9 Oct 2026 about $870M at $7.5B, led by Andreessen Horowitz ([RuntimeWire](https://runtimewire.com/article/typesafe-jev-reported-870m-financing)). The company has not confirmed it, and the closing date is unknown. No customers, revenue or production volume are public ([remio](https://www.remio.ai/post/typesafe-ai-funding-talks-test-whether-jev-can-justify-a-10-billion-valuation)).

**API shape.** Verified in the [quickstart](https://docs.typesafe.ai/introduction/quickstart):
- `POST https://api.typesafe.ai/v1/systemone`, bearer key from console.typesafe.ai.
- Body: `state` (text or JSON), `model` (`jev-latest`, currently `jev-1.13.0`), and `questions`, a map of named questions.
- Three question types: `choice`, `score`, `noul` (yes/no probability). Each has `instructions`; `choice` and `score` also take `criteria`.
- Response: `answers` keyed by question id, each with the answer, `probabilities`, and for choice/score a `confidence` from 0 to 1, plus `usage`.
- Python SDK `typesafe-sdk` (Python 3.10+). A TypeScript SDK, Vercel AI SDK provider, LiteLLM and Portkey proxies are reported ([LiteLLM](https://docs.litellm.ai/blog/typesafe_jev)).

**Confidence is a formula, not a calibration proof.** For choice it is (p_max − 1/n) / (1 − 1/n). The [docs](https://docs.typesafe.ai/confidence) say it is "one reasonable way to summarize a distribution" and do not describe calibration against accuracy.

**Pricing.** $0.042 per million input tokens, output free ($42 per billion) ([typesafe.ai](https://typesafe.ai)). Vendor demo: $0.000081 and 0.114s per call versus $0.013880 and 8.566s for an LLM. The headline "193.6x faster, 444.6x cheaper" does not match that demo pair, which is about 75x faster and 171x cheaper. Access is early access with a waitlist. It is also in DigitalOcean's catalog.

**What the launch did.**
- One sharp category name ("System One") and one plain claim: typed answers software can act on.
- A public price per billion tokens, a latency number, and a side-by-side demo page.
- A live Pong demo by Ably Labs: 47 decisions in 12 seconds, versus two or three for frontier chat models ([RuntimeWire](https://runtimewire.com/article/diogo-almeida-typesafe-jev-40m-seed-pong)).
- Day-one distribution through gateways (Vercel AI Gateway, LiteLLM, Portkey, DigitalOcean) and an SDK, so trying it took minutes.
- Docs with real request and response JSON and an `llms.txt` index.

**What did not hold up.**
- "Zero hallucinations" is true by schema, not by accuracy. The Register called the comparison unfair. It can still pick the wrong option ([The Register](https://www.theregister.com/a/5296711)).
- Benchmark labels came from other LLMs, not humans, and the workflows were TypeSafe's own ([remio](https://www.remio.ai/post/typesafe-ai-funding-talks-test-whether-jev-can-justify-a-10-billion-valuation)). Launch-week tests were mixed: faster and cheaper, but Gemini was slightly more accurate in one.
- Secondary blogs report antirez calling it narrow and a quick open-source clone matching it in-domain. I could not confirm either from a primary source ([BestHub](https://www.besthub.dev/articles/jev-goes-viral-redis-creator-hits-brakes-most-developers-don-t-need-it-42af3b55216e)).

## What it means for Real World

- For the product: Jev answers "classify this item." We answer "what happens to a population if X." Keep that line in our copy. A fork-and-run result should carry per-segment probabilities and a spread, in the same plain shape as Jev's `probabilities`.
- For the engineering: Jev could be a cheap per-agent classifier (stance, yes/no on an event), but its output is a single-pass distribution with no reasoning trace, and our "click any agent to ask why" needs a trace. Its confidence formula is simple enough to copy for our own outputs. Do not depend on an early-access vendor for the nightly path.
- For the business: TypeSafe shows investors will pay for "typed, calibrated, cheap" and a clear category. Our moat is different: a public hashed track record. Their weak point is unproven calibration. Ours can be proven, because we publish before outcomes and score against market price.

## Recommendations

1. Define `/v1/simulate` responses as typed, documented JSON (probabilities, segments, ensemble spread, trace), with the example request and response on the docs home page, as TypeSafe does.
2. Ship an SDK plus a one-curl quickstart on launch day, and publish `llms.txt` for the docs.
3. Publish a price per unit and a latency or cost-per-run number on the site. State our $15-60 per night cost honestly.
4. Do not claim "no hallucinations" or any multiple-x claim. Our claim is Brier score versus market price, with labels we did not generate ourselves.
5. Run a one-day spike calling Jev for a cheap stance classifier on GDELT headlines, and compare it with Haiku on 200 hand-labelled items. Keep it only if it is clearly cheaper at equal accuracy.
6. Build one public live demo people can poke on launch day (the Pong demo did this for them), such as the fork-an-event box on the globe.

## Open questions

- Is the $870M round real and closed? Check for a TypeSafe announcement or a second outlet.
- Does Jev calibration hold on non-English or non-Western text? Test on a small multilingual set.
- Does TypeSafe plan simulation or forecasting products? Check their jobs page and docs changelog.
- Early-access terms, rate limits and waitlist time are undocumented. Ask via console.typesafe.ai.

## Sources

- [TypeSafe AI home](https://typesafe.ai), accessed 2026-10-11
- [TypeSafe docs: quickstart](https://docs.typesafe.ai/introduction/quickstart), accessed 2026-10-11
- [TypeSafe docs: confidence](https://docs.typesafe.ai/confidence), accessed 2026-10-11
- [TypeSafe docs: Noul](https://docs.typesafe.ai/primitives/noul), accessed 2026-10-11
- [The Register, 16 Sep 2026](https://www.theregister.com/a/5296711), accessed 2026-10-11
- [RuntimeWire: $40M seed](https://runtimewire.com/article/diogo-almeida-typesafe-jev-40m-seed-pong), accessed 2026-10-11
- [RuntimeWire: reported $870M](https://runtimewire.com/article/typesafe-jev-reported-870m-financing), accessed 2026-10-11
- [remio: funding talks](https://www.remio.ai/post/typesafe-ai-funding-talks-test-whether-jev-can-justify-a-10-billion-valuation), accessed 2026-10-11
- [LiteLLM Jev blog](https://docs.litellm.ai/blog/typesafe_jev), accessed 2026-10-11
- [DigitalOcean: What is Jev](https://www.digitalocean.com/resources/articles/what-is-jev), accessed 2026-10-11
- [Let's Data Science launch note](https://letsdatascience.com/news/typesafe-ai-launches-jev-decision-model-889a38c0), accessed 2026-10-11
- [BestHub on antirez critique](https://www.besthub.dev/articles/jev-goes-viral-redis-creator-hits-brakes-most-developers-don-t-need-it-42af3b55216e), search snippet only, secondary, accessed 2026-10-11
