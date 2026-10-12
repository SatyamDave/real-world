# Alternative data buyers in finance

- Date: 2026-10-11
- Area: market
- Confidence: medium. Market size and price ranges come from Neudata and one survey press release, and several figures are 2019-2020. Proof requirements rest mostly on vendor blogs with a stake in the answer. I found no public price for sentiment or forecast vendors such as RavenPack.

## Answer

Funds buy alternative data in large amounts, but the market is smaller and slower-growing than headline reports say. They will not pay for a forecast on trust. They want point-in-time history, which a track record that starts on launch day cannot supply. Real World should not sell to funds by Nov 2. It should publish a hashed, timestamped record that a fund could later use as that history, and treat finance as a year-two channel.

## Findings

**Market size depends on who is counting.**
- Neudata estimates investment managers spent about $2.8bn on alternative data in 2025. [Neudata, Feb 2026](https://www.neudata.co/intelligence/the-state-of-the-alternative-data-market-in-2026). The page gave no breakdown, and the press snippet says growth was 17%. I did not verify the growth figure on the page.
- An earlier Neudata press release put 2025 at up to $15.4bn. The later report revised the figure down, so ignore the earlier one.
- IMARC says $12bn in 2025 and $168bn by 2034. Technavio and Business Research Company numbers do not reconcile with each other. These reports define the market to include software, staff and infrastructure. Do not put them in a pitch deck.
- The old AlternativeData.org figures were $232M (2016), $1.1B projected for 2019 and $1.7B projected a year later. [HedgeFund Alpha](https://hedgefundalpha.com/strategies/data-costs-are-huge-and-theres-nothing-anybody-can-do-about-it/). Those forecasts are far above what Neudata now measures.

**How much a fund spends.**
- A 2026 Exabel survey of senior investment staff in the US, UK, Hong Kong and Singapore (about $2.4tn AUM, respondent count not stated) found 84% spend $500k-$2.5M a year on datasets and 4% spend more. 94% expect spending to rise. [Exabel via IT Edge News](https://www.itedgenews.africa/alternative-data-spending-set-to-surge-as-94-of-fund-managers-boost-budgets-exabel-research-reveals)
- Neudata's 2020 pricing research: yearly subscriptions run from under $25k to $500k+. About 30% of transactional data costs over $150k. Sentiment data is cheaper: about 30% of sentiment subscriptions cost under $25k. [Institutional Investor, 2020](https://www.institutionalinvestor.com/article/2bsx5x6m2pew8jzgavmyo/corner-office/how-much-are-managers-paying-for-data)
- Neudata says over 50% of datasets cost under $50k a year. [Neudata](https://www.neudata.co/alternative-data-news/alt-data-usage-ticks-up-among-hedge-fund-managers) A buyer-side guide gives $15k to $500k+. [Guideline](https://www.guideline.ai/capital-markets-seo/alternative-data-pricing) The Guideline page is a vendor page and gave no per-vendor prices.
- Search-snippet figures I could not open: buyers average 20 vendors and $1.6m a year (about $80k per dataset), and large multi-strategy funds average $5m across 43 vendors. Treat these as unverified.
- Neudata's earlier survey (100 hedge funds, $720bn AUM): 53% use alt data. Long/short equity funds favour sentiment, reviews and payments data. The top obstacles were infrastructure for unstructured data, backtesting history and finding quality datasets. [Neudata](https://www.neudata.co/alternative-data-news/alt-data-usage-ticks-up-among-hedge-fund-managers)
- RavenPack and similar sentiment vendors publish no prices. Datarade says "contact us." I found no number.

**What proof funds require.**
- Quants ask whether a dataset is point-in-time before they evaluate anything else. Backfilling with a newer method creates look-ahead bias. Delisted names vanish from feeds. One vendor says buyers pay 2-3x more for a verified point-in-time version and cites an anonymous fund seeing 15% more alpha. Both claims are from vBase, which sells point-in-time verification, so they are promotional. [HedgeFund Alpha / vBase](https://hedgefundalpha.com/education/why-quants-pay-more-for-point-in-time-data/)
- Funds do not accept the vendor's own accuracy numbers. Analysts rerun the data against their own models, and usefulness varies by team inside a fund. [Data Observatory](https://dataobservatory.substack.com/p/the-quagmire-of-backtesting-alternative)
- The usual sequence is vendor diligence, then a trial agreement, then paid access. [SS&C/AIMA](https://www.aima.org/static/3f134b9c-306b-4a66-af72446d6b5ea1f7/SSC.pdf) I did not open the PDF, so this comes from a search summary. The SEC criticised weak adviser diligence on alt-data vendors in an April 2022 risk alert, also from the search summary.
- I found no published minimum history length. Vendors claim 1-2 years is too short, but that is marketing.

**Prediction markets are moving toward the same buyers.**
- Kalshi raised $1bn at a $22bn valuation (May 7, 2026). Institutional volume is up 800% in six months, and it is targeting hedge funds and asset managers. The article does not mention data licensing. [The Block](https://www.theblock.co/post/400413/kalshi-hits-22-billion-valuation-after-1-billion-raise-led-by-coatue) Funds can already get market-implied probabilities from the source, which is the benchmark Real World scores itself against.

## What it means for Real World

- For the product: A fund wants a time series of probabilities, with entity IDs and a publication timestamp, not a globe. The receipts page and the hashed forecasts are the finance-facing product. Add a bulk export of every forecast with its hash, publish time and later outcome. Do not build a finance UI.
- For the engineering: Every stored forecast needs an immutable publish timestamp, a model and prompt version, and a never-overwritten row. Revisions go in as new rows. Do not backfill history with a newer model under the same label. That is exactly the bias buyers screen for, and it would also damage the "cannot be backfilled" claim.
- For the business: Funds spend $0.5-2.5M a year across about 20 vendors, so one dataset is a $25-150k deal. That is a real but small price, and one sale takes months and a trial. A 22-day-old track record does not meet the buyer's bar. Sentiment-type data is the cheaper tier. Do not state a market size above Neudata's $2.8bn in the YC application.

## Recommendations

1. Make the export a day-one deliverable: `forecast_id, question, probability, market_price_at_publish, published_at, hash, resolved_at, outcome, model_version`. Owner: engineering.
2. Store forecasts append-only and publish the hash chain externally (a public repo or log) so a buyer can verify the timestamps without trusting us.
3. Use $2.8bn (Neudata, investment managers, 2025) as the only market-size figure in the YC draft, and label per-fund spend as $0.5-2.5M (Exabel 2026).
4. Do not pitch funds before launch. After launch, offer free read access to the forecast history to three or four quant or macro funds as a "shadow period" trial, since that is how buyers test data anyway.
5. Compare against Kalshi and Polymarket prices at publish time, and report where we are worse. A buyer will do that comparison first.
6. Keep finance out of the pricing page until we have six months of resolved forecasts.

## Open questions

- What does a fund pay for sentiment or forecast data specifically (RavenPack, Bloomberg, others)? Ask Neudata for the Scout metadata, or talk to two buyers.
- Do funds treat a simulated-population forecast as a signal, or just as one more poll? Needs buyer interviews.
- How many resolved questions does a macro fund need before a trial is worth their time? Not published. Ask in the same interviews.
- Do Kalshi or Polymarket sell historical data, and at what price? I found no primary source.
- The $1.6m / 20 vendors and $5m / 43 vendors figures need the original Neudata report.

## Sources

- [The state of the alternative data market in 2026, Neudata](https://www.neudata.co/intelligence/the-state-of-the-alternative-data-market-in-2026), accessed 2026-10-11
- [Alt data usage ticks up among hedge fund managers, Neudata](https://www.neudata.co/alternative-data-news/alt-data-usage-ticks-up-among-hedge-fund-managers), accessed 2026-10-11
- [Alternative data spending set to surge, Exabel research (IT Edge News)](https://www.itedgenews.africa/alternative-data-spending-set-to-surge-as-94-of-fund-managers-boost-budgets-exabel-research-reveals), accessed 2026-10-11
- [How much are managers paying for data, Institutional Investor](https://www.institutionalinvestor.com/article/2bsx5x6m2pew8jzgavmyo/corner-office/how-much-are-managers-paying-for-data), accessed 2026-10-11
- [Alternative data pricing, Guideline](https://www.guideline.ai/capital-markets-seo/alternative-data-pricing), accessed 2026-10-11
- [Why quants pay more for point-in-time data, HedgeFund Alpha](https://hedgefundalpha.com/education/why-quants-pay-more-for-point-in-time-data/), accessed 2026-10-11
- [The quagmire of backtesting alternative data, Data Observatory](https://dataobservatory.substack.com/p/the-quagmire-of-backtesting-alternative), accessed 2026-10-11
- [Data costs are huge, HedgeFund Alpha](https://hedgefundalpha.com/strategies/data-costs-are-huge-and-theres-nothing-anybody-can-do-about-it/), accessed 2026-10-11
- [Kalshi hits $22 billion valuation, The Block](https://www.theblock.co/post/400413/kalshi-hits-22-billion-valuation-after-1-billion-raise-led-by-coatue), accessed 2026-10-11
- [IMARC alternative data market](https://www.imarcgroup.com/alternative-data-market), from search result only, accessed 2026-10-11
- [SS&C/AIMA due diligence note](https://www.aima.org/static/3f134b9c-306b-4a66-af72446d6b5ea1f7/SSC.pdf), from search summary only, accessed 2026-10-11
