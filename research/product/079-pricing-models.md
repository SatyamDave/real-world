# Pricing models for a simulation product

- Date: 2026-10-11
- Area: product
- Confidence: medium. Vendor pricing pages and model prices were opened and read. Aaru, Simile and Electric Twin publish no prices, and the search budget ran out, so competitor price points are thin. The margin math is my arithmetic on stated assumptions.

## Answer

Sell by the unit that costs us money: the agent-answer, bundled into credits. Make the daily world, the receipts page and a small monthly credit grant free, because the public track record is the marketing. Charge credits for forks and API runs, with seats free. At launch, price 1,000 agent-answers at about $1 and put one Pro plan at $49/month. Do not copy the enterprise sales motion of Simile or Synthetic Users before there are customers.

## Findings

Our cost per answer is tiny. [Anthropic's pricing page](https://claude.com/pricing) lists Haiku 5.5 at $0.10 per million input tokens and $0.50 per million output tokens (prompts up to 100K). Cache reads are $0.01 per million and batch is 50% off. [OpenAI's pricing page](https://developers.openai.com/api/docs/pricing) lists gpt-6-luna at the same $0.10 / $0.50, also with a roughly 50% batch discount.

My arithmetic: one agent-answer with 800 input and 150 output tokens costs about $0.000155. That is $0.16 per 1,000 answers, or $0.08 on batch. A nightly pass over 100,000 agents is about $15.50 at those sizes, which matches the $15-60 range in the plan once prompts get longer.

A fork is the expensive product. 100,000 agents for 7 days with a 5-member ensemble is 3.5 million answers, about $540 standard or $270 batch. That cannot be free and cannot be flat-rate. A 5,000-agent sample for 7 days with 3 members is 105,000 answers, about $16.

Competitors mostly hide prices. [Simile's site](https://www.simile.com/) names CVS Health, Gallup, Itau and Deloitte, announces a $200M Series B at a $2B valuation, and shows only a "Run a simulation" button. [Aaru's site](https://www.aaru.com) shows a contact form and a customer login. That means enterprise sales, not self-serve.

The one public synthetic-research price list is [Synthetic Users](https://www.syntheticusers.com/pricing): annual plans from $12,500/year, one pool of Research Tokens, unlimited seats, up to 20% of unused tokens roll over, and $2-60 per interview depending on question count and stimulus. Its [homepage](https://www.syntheticusers.com) quotes "85-92% synthetic-organic parity" from its own comparison studies, with no sample sizes on the page. That is a vendor claim, not evidence. Its pricing structure is still the closest reference: credits pool, seats free.

Credits with free seats are now normal for AI products. [Lovable](https://lovable.dev/pricing) has a free tier of 5 build credits a day (up to 30 a month), says plans are "priced by the credits they include, not by seats", gives unlimited workspace members, and lets owners set per-member credit limits. Monthly credits expire after two months and top-ups last 12 months.

Pay-per-call pricing with a monthly free grant works for developer APIs. [Exa](https://exa.ai/pricing) charges $4-15 per 1,000 requests, has no subscription or minimum, and resets a free $10 balance on the first of each month. [Replicate](https://replicate.com/pricing) is pay-per-use with no stated free tier.

Billing plumbing exists. [Stripe's usage-based billing docs](https://docs.stripe.com/billing/subscriptions/usage-based) now recommend Metronome for new integrations, including prepaid credits and credit burndown. Basic Billing Meters only reconciles usage at invoice time, with no real-time view.

Inputs we use are free to read. [GDELT](https://gdeltproject.org/data.html) says its database is "100% free and open"; I could not read its redistribution terms. [Polymarket's rate-limit page](https://docs.polymarket.com/api-reference/rate-limits) lists IP-based limits on market-data endpoints, for example 300 requests per 10 seconds on Gamma `/markets`, but does not state whether a key is required. I could not open the Metaculus API terms (the page lists topics only) or Good Judgment's (HTTP 403).

What does not work. Flat-rate "unlimited simulations" loses money on one heavy user. Per-seat pricing fights the "PM and engineer both work on it" goal. Per-agent pricing is confusing because a "run" can be 50 or 500,000 agents. Annual contracts at $12,500 need a sales call we do not have by Oct 27.

## What it means for Real World

- For the product: free users see the daily world, the daily question and the receipts page without signing in. Signing in gives a monthly credit grant, enough for a few small forks. The credit price shown on screen before a run is the cost, so a PM can read it.
- For the engineering: meter at one place, the call that writes an agent-answer. Log user, run id, model, tokens and credits. Cache the persona prefix (90% cheaper reads) and batch ensemble members. Estimate credits before a run starts and refuse a run that exceeds balance. This fails closed, in line with the house rule on spend.
- For the business: gross margin is high at API prices, but real prompts with traces and context will be 3-5x my 800/150 assumption. Price at roughly 6x raw cost on a short prompt so the margin survives. The public track record is the acquisition channel, so do not paywall it.

## Recommendations

1. Free tier, no card: daily world, daily question, receipts, 3 forks a month at up to 1,000 agents and 7 days. About $0.50 of cost per user per month at most.
2. One paid plan, Pro, $49/month: includes 50,000 agent-answers, API key, ensembles up to 10, trace download, free seats. Overage at $1 per 1,000 answers. Top-up packs ($20, $100) that last 12 months.
3. API is the same credits. `POST /v1/simulate` returns the credit cost in the response header and accepts a `max_credits` field. No separate API plan at launch.
4. Charge by agent-answer internally, show credits externally. One credit equals 1,000 agent-answers. State the conversion in the docs table, one row per feature.
5. Defer enterprise and annual plans. Put a "Talk to us" link for 1M+ answers per month, as the competitors do, and price it by hand.
6. Use Stripe Billing credits or Metronome, not a custom ledger. Keep our own `usage_events` table as the record, as the credit balance depends on it.
7. Re-check price after the first 100 paid runs: compare real tokens per answer against the 800/150 assumption.

## Open questions

- Real tokens per agent-answer including persona, news context and trace. Find out by logging a 1,000-agent test day.
- What Simile, Aaru and Electric Twin charge. Ask one customer or request a demo; the sites give nothing.
- Whether Polymarket, Metaculus and Good Judgment data can be redistributed inside a paid product. Read each terms page before the Brier-vs-market receipts are paywalled or resold.
- Willingness to pay at $49. No customer interview exists yet. Test with five forkers in the first week.
- Whether the free fork allowance gets abused by sign-up farming; needs a per-account and per-IP cap.

## Sources

- [Claude API pricing](https://claude.com/pricing), accessed 2026-10-11
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), accessed 2026-10-11
- [Synthetic Users pricing](https://www.syntheticusers.com/pricing), accessed 2026-10-11
- [Synthetic Users home](https://www.syntheticusers.com), accessed 2026-10-11
- [Simile](https://www.simile.com/), accessed 2026-10-11
- [Aaru](https://www.aaru.com), accessed 2026-10-11
- [Lovable pricing](https://lovable.dev/pricing), accessed 2026-10-11
- [Exa pricing](https://exa.ai/pricing), accessed 2026-10-11
- [Replicate pricing](https://replicate.com/pricing), accessed 2026-10-11
- [Stripe usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based), accessed 2026-10-11
- [GDELT data](https://gdeltproject.org/data.html), accessed 2026-10-11
- [Polymarket rate limits](https://docs.polymarket.com/api-reference/rate-limits), accessed 2026-10-11
