# Economics of polling and surveys: what a simulated answer must beat

- Date: 2026-10-11
- Area: market
- Confidence: medium. Prolific and LLM prices come from primary pages. Panel CPI and Global South field costs come from vendor blogs and small academic costing studies. Real country-level quotes were not available.

## Answer

A simulated answer is cheaper than any human answer by four to five orders of magnitude (about $0.0001 against $1 to $25). It is also faster than any survey mode (minutes against hours or months). Cost and speed are not the fight. The fight is whether the answer is correct, because the cheap human option (opt-in panels) is itself noisy. Real World should sell "a calibrated prior in minutes, checked against humans daily", and spend its small human budget on a daily panel in a few countries rather than trying to match the human survey cost curve.

## Findings

**Prolific (the cheapest credible human source).** The help centre sets an absolute minimum of $8/hour and a recommended $12/hour for participants. The platform fee is 42.857% on top for corporate users and 33.3% for academic and non-profit users; bonuses carry the same fee. Representative samples cost only the standard fee. Screened-out participants get a small payment for screener time. ([Prolific pricing](https://researcher-help.prolific.com/en/articles/445239-what-is-your-pricing)) Worked out: a 5-minute survey at $12/hour is $1.00 reward plus $0.43 fee, so about $1.43 per complete. A 2,000-person daily panel at that rate is roughly $2,900 a day, before any country premium. Prolific says it has over 150,000 active participants in 200+ countries and that datasets finish in about 2 hours on average. Both are company claims, dated April 2024. ([Prolific 10-year post](https://www.prolific.com/resources/celebrating-decade-innovation-community-prolific-10-year-anniversary)) Pool depth per country is not published. Expect thin pools outside the US, UK and Europe.

**Marketplace panels (Cint, Dynata and similar).** None publish rates. Cint's tool suggests a CPI from three inputs only: completes, length of interview, and incidence rate. For new countries it has no model and sends you to an account manager. ([Cint FAQ](https://help.cint.com/docs/suggested-cpi-in-the-marketplace-faq)) One vendor benchmark for consumer samples lists $5 to $12 for 5 minutes, $8 to $20 for 15 minutes and $15 to $35 for 30 minutes, all with incentive included. It gives 2 to 5 days for a standard consumer recruit, 5 to 10 business days for a quote, a 15 to 30% rush premium for 48 to 72 hours, and 20 to 40% more per extra country. It gives no per-country prices. ([CleverX 2026 benchmarks](https://cleverx.com/blog/research-panel-pricing-benchmarks-2026/)) This is a vendor's own table, not an audited rate. I found no public per-country CPI for India, Nigeria, Brazil or Indonesia. The only country index I found is a 2003 ESOMAR relative index (US 242, India 37), too old to use.

**Face-to-face and phone in the Global South (what most global attitude data costs).** Gallup World Poll uses telephone where coverage is at least 80% and face-to-face elsewhere. It runs 160+ countries, typically 1,000+ respondents each, on a semiannual, annual or biennial schedule, about 1 hour face-to-face and 30 minutes by phone. Cost is not published. ([Gallup methodology](https://www.gallup.com/178667/gallup-world-poll-work.aspx)) Afrobarometer uses samples of 1,200 to 2,400 per country, teams of four interviewers plus a supervisor, and a five-day interviewer training. Interviews grew from 63 minutes (Round 7) to about 80 minutes (Round 10). No budget is published. ([Afrobarometer summary](https://allafrica.com/stories/202510090014.html)) The World Values Survey wave 7 ran from mid-2017 and closed 31 December 2021, mostly face-to-face; wave 8 is planned for 2024 to 2026. ([WVS7 catalogue entry](https://catalog.ihsn.org/catalog/12279)) So a global attitude baseline is a multi-year product.

Hard dollar figures exist only in small costing studies. A Malawi study put CATI at $17.40 per completed interview, with IVR used as a screener cutting call attempts from 11.9 to 6.3. ([Tlhajoane 2025](https://onlinelibrary.wiley.com/doi/10.1111/tmi.70005?af=R)) A Nigeria comparison reportedly gave about $25 CATI, $17 IVR and $8 SMS per interview; I only saw a machine-generated summary of it, so treat those as unverified. ([RTI Nigeria study](https://www.rti.org/publication/search-optimal-mode-mobile-phone-surveys-developing-countries-comparison-ivr-sms-cati-nigeria)) Innovations for Poverty Action cites face-to-face at 161% of CATI cost, and remote response rates between 4.5% and 56%. Only about 19% of cold-call numbers connected, against 63% for existing samples. ([IPA review](https://poverty-action.org/blog/what-do-we-really-know-about-phone-surveying-low-and-middle-income-countries))

**Cheap human data is not clean.** Pew found that opt-in online samples carry "bogus respondents". Among opt-in under-30s, 20% agreed "The Holocaust is a myth" against 3% in Pew's probability panel, and 48% opposed legal abortion against 23%. The errors are worst for under-30s and Hispanic adults. ([Pew, March 2024](https://www.pewresearch.org/short-reads/2024/03/05/online-opt-in-polls-can-produce-misleading-results-especially-for-young-people-and-hispanic-adults/)) Trap questions and speeding checks do not reliably catch these respondents, per a National Academies presentation summarised by search results; I did not open that deck. Opt-in is the budget option because probability panels are costly and slow to build, and they still undercount some groups.

**Simulated answer cost.** Claude pricing page shows Haiku 5.5 at $0.10 per million input tokens and $0.50 per million output tokens up to 100K-token prompts, with 50% off for batch. ([Claude pricing](https://claude.com/pricing)) A persona prompt of 1,500 tokens and a 150-token answer costs about $0.000225, or about $0.0001 in batch. One question to 100,000 agents is about $22 at list price. This matches the plan's $15 to $60 a night. It is roughly 6,000 times cheaper than the cheapest Prolific complete and 100,000 times cheaper than a Global South phone interview.

## What it means for Real World

- For the product: Do not pitch "cheaper than a poll". Buyers already accept $1.43 to $12 per complete and a 2 hour to 5 day wait. The credible pitch is a country-by-country answer in minutes with an error bar and a public record. Lead with the countries where human polling is slowest and thinnest: face-to-face countries where a new wave takes months to years.
- For the engineering: Cost per answer is not a constraint. Design for ensembles (10 to 50 runs per question) and re-asking. At $0.0001 per answer, spend tokens on diversity and traces, not on shaving prompts. Budget the nightly update against the $15 to $60 plan and log tokens per run.
- For the business: The binding cost is the human truth set, not inference. Scoring needs fresh human data, and the only sources with country coverage are slow (WVS, Gallup) or paywalled. A daily panel is the moat and the main expense, so size it deliberately.

## Recommendations

1. Set a human-panel budget of about $1,500 to $3,000 a day for launch: 1,000 to 2,000 Prolific completes of 5 minutes at $12/hour (about $1.43 each, VAT extra on the fee). Start with the US, UK, and any pool Prolific shows with enough depth. Confirm per-country availability in Prolific's calculator before committing.
2. Do not plan on Cint or Dynata for launch. No public prices, 5 to 10 business day quotes, and a possible account-team step for new countries. Request one quote for 3 to 5 target countries (for example India, Brazil, Nigeria, Indonesia, Germany) so the pitch has a real number by late October.
3. For non-Prolific countries, use existing human data as the truth set (WVS wave 7, Gallup and Pew public releases, regional barometers) and be honest that these are 1 to 5 years old. Score against them for calibration, not for daily forecasts.
4. Report cost and latency on the receipts page: tokens, dollars and minutes per simulation, next to the human-poll price and turnaround for the same question. Use the figures above with their source and date.
5. Treat opt-in panel data as noisy. Use open-text attention checks, drop the 18 to 29 and Hispanic subgroup claims unless checked against a probability source, and never score a forecast on a single opt-in wave.
6. Keep spend per ensemble capped (for example $0.50 per simulate call) so the public API stays priced well below any human option.

## Open questions

- What do Cint and Dynata actually charge per complete in India, Nigeria, Brazil and Indonesia, and how many completes per day can they deliver? Answer by requesting quotes with a 5 minute, 10 question brief.
- How deep is Prolific's pool by country, and at what daily volume does fill rate fall? Answer with the in-product calculator and a small 100-complete pilot in each target country.
- What does a Gallup World Poll or Afrobarometer country cost per interview? Neither publishes it. Ask funders' evaluations or a fieldwork vendor for a quote.
- Is the Nigeria $8, $17 and $25 split correct? Read the original RTI paper before citing it.
- Does the Haiku 5.5 price page stay stable through launch? Re-check on 2026-10-26.

## Sources

- [Prolific: what is your pricing](https://researcher-help.prolific.com/en/articles/445239-what-is-your-pricing), accessed 2026-10-11
- [Prolific 10-year anniversary post](https://www.prolific.com/resources/celebrating-decade-innovation-community-prolific-10-year-anniversary), accessed 2026-10-11
- [Cint: Suggested CPI FAQ](https://help.cint.com/docs/suggested-cpi-in-the-marketplace-faq), accessed 2026-10-11
- [CleverX: research panel pricing benchmarks 2026](https://cleverx.com/blog/research-panel-pricing-benchmarks-2026/), accessed 2026-10-11
- [Gallup World Poll: how it works](https://www.gallup.com/178667/gallup-world-poll-work.aspx), accessed 2026-10-11
- [Afrobarometer interview duration (allAfrica)](https://allafrica.com/stories/202510090014.html), accessed 2026-10-11 (search result only, page not opened)
- [WVS wave 7 catalogue entry (IHSN)](https://catalog.ihsn.org/catalog/12279), accessed 2026-10-11 (search result only, page not opened)
- [Tlhajoane et al. 2025, IVR in Malawi](https://onlinelibrary.wiley.com/doi/10.1111/tmi.70005?af=R), accessed 2026-10-11 (search result only, page not opened)
- [RTI: IVR, SMS and CATI in Nigeria](https://www.rti.org/publication/search-optimal-mode-mobile-phone-surveys-developing-countries-comparison-ivr-sms-cati-nigeria), accessed 2026-10-11 (search result only, page not opened)
- [IPA: phone surveying in low- and middle-income countries](https://poverty-action.org/blog/what-do-we-really-know-about-phone-surveying-low-and-middle-income-countries), accessed 2026-10-11
- [Pew: online opt-in polls can produce misleading results](https://www.pewresearch.org/short-reads/2024/03/05/online-opt-in-polls-can-produce-misleading-results-especially-for-young-people-and-hispanic-adults/), accessed 2026-10-11
- [Claude pricing](https://claude.com/pricing), accessed 2026-10-11
