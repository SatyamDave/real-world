# Aaru deep dive

- Date: 2026-10-11
- Area: market
- Confidence: medium. Funding, customers and the election miss are reported by TechCrunch, Fortune, Semafor and EY. Pricing, headcount and architecture are not public, and ARR is a single anonymous source.

## Answer

Aaru is a sales-led enterprise simulation vendor for consumer and financial-services research, not a world model. It raised a Series A of more than $50M in December 2025 at a $1B headline valuation (blended lower), with ARR under $10M. Real World should not copy its business. It should exploit the two things Aaru does not offer: a public, hashed track record and open scoring against market prices.

## Findings

**Company and money.**
- Founded March 2024 by Cameron Fink (CEO), Ned Koh (president, 21 as of June 2026) and John Kessler. ([TechCrunch](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation/), [Fortune](https://fortune.com/2026/06/17/aaru-cofounder-ned-koh-ai-startup-sales-pitch-do-not-trust-us/))
- Series A, December 2025, led by Redpoint. TechCrunch's sources say "above $50M". Some investors paid a $1B valuation and others a lower price, so the blended valuation is below $1B. Aaru and Redpoint did not comment.
- Earlier money from A*, Abstract, Felicis, General Catalyst, Accenture Ventures (March 2025, amount undisclosed) and Z Fellows. ([DRNO](https://www.mrweb.com/drno/news37971.htm))
- Fortune cites PitchBook for about $88M raised in total.
- ARR is below $10M per one TechCrunch source. Aaru has not confirmed it.

**What they sell.**
- A simulation platform of "statistically representative" agent populations, each with traits like age, income, zip code and gender. They survey the agents instead of people. Five use cases are listed: product innovation, marketing and brand, audience segmentation, scenario planning, strategic communications. ([aaru.com](https://aaru.com))
- "Lumen" is the flagship model name used in the Accenture announcement. Aaru's own homepage does not mention it.
- No public pricing and no public API. The site offers "Contact us" and a customer login. A third-party blog guesses six to seven figures a year; treat that as a guess.
- Two example validations on the site and in Fortune: the NYC mayoral primary (about 2M voters, "within 2,000 votes") and a replication of EY's 2025 Global Wealth Management study (3,600 investors, 30+ markets) in one day. The site also claims a mean TVD of 7.62% and MAE of 3.53% across 2,993 questions. No paper or data accompanies these numbers.

**Customers and channels.**
- Named by Fortune: EY, Accenture, Interpublic Group, McDonald's, Boston Beer, A24, Bayer, plus Spindrift for a product launch. Political campaigns are mentioned by TechCrunch.
- EY US announced an alliance on 30 September 2026, starting in financial services: messaging, pricing offers, sales strategy and M&A impact. The press release gives no accuracy figure. ([EY](https://www.ey.com/en_gl/newsroom/2026/09/ey-announces-alliance-with-aaru-to-help-organizations-drive-growth-with-greater-confidence-through-behavioral-simulation))
- Breakwater uses it for a quarterly tracker of 71 judgments across 40,000 simulated investors.
- Distribution runs through consultancies. That is a business model, not a data moat.

**Methods, as far as public.**
- In 2024 each AI character got a news diet matched to its demographic profile and was asked how it would vote. ([Semafor](https://semafor.com/article/11/06/2024/ai-startup-aaru-defends-using-artificial-intelligence-for-polling))
- Fortune says they train on behavioral outcomes (election results, purchases) rather than stated intent. Koh would not disclose the architecture or how partisanship is controlled.

**The 2024 election miss.**
- Aaru built seven swing-state avatars for Semafor and gave Harris a narrow Electoral College win, which Fink put at 53-47. Trump won 312 to 226.
- Its state odds had Trump ahead in Arizona (73.3%), North Carolina (62.1%) and Georgia (61.8%), and Harris ahead in Michigan, Nevada, Pennsylvania and Wisconsin. Trump won all seven. ([TASS summary of the Semafor piece](https://tass.com/world/1867015/amp); the state odds are secondary-sourced.)
- Semafor wrote that Aaru "got most of its predictions wrong." Fink replied that it was within the margin of error and that Nebraska was almost exact.
- I found no public scoring against market prices and no pre-registered hash for this forecast.

**Admitted limits (Fortune, June 2026).**
- Aaru could not predict simulated Trump or Powell behavior even with extensive public statements.
- Koh: "There's just so much variance."
- A Cornell-led study found AI respondents flatten portrayals of marginalized groups. That is our flattening risk, and Fortune reports it in a piece about Aaru.
- The EY test shows the bias plainly. Humans said 82% would keep their parents' wealth manager, real retention is 20 to 30%, and Aaru's agents said about 40%. That is closer to reality than the survey, but still double the true rate.

## What it means for Real World

- For the product: Aaru answers "what will this segment say about my product". It does not offer open forks, a daily question, or a click-any-agent trace. Our public surfaces are the opposite of their closed engagements.
- For the engineering: Their weak spot is variance and calibration. Our ensemble spread and daily Brier scoring directly address what Koh concedes. We need the ensemble outputs to carry honest uncertainty, not a 53-47 point call.
- For the business: Aaru sells six-to-seven-figure consultancy deals. We cannot match that sales motion in 22 days and should not try. A free public track record is something their model structurally cannot offer, because their election call would have been scored badly.

## Recommendations

1. Position as "the public, scored alternative". The pitch line is that every forecast is hashed before the outcome and scored against market price. Aaru cannot make that claim for 2024.
2. Include a "Why we are not Aaru" paragraph in the YC application. Cite the Semafor miss, the 40% vs 20-30% EY result and Koh's own variance quote. Use quotes sparingly and link them.
3. Build the receipts page first. Hash, timestamp, Brier versus market, for each daily question. It is the one surface a funded competitor has not shipped.
4. Reproduce their two checkable validations in our own terms: a held-out past election and a past survey wave, run blind. Publish error as TVD and MAE so numbers are comparable with their claimed 7.62% and 3.53%.
5. Report ensemble spread on every output. Never present a point estimate without a band.
6. Do not chase enterprise or consultancy channels before launch. Revisit after the Oct 27 launch if inbound arrives.

## Open questions

- Is Aaru's ARR really under $10M, and what is the headcount? Check LinkedIn headcount and any later funding news.
- What is the real price? Ask a buyer or a consultancy contact.
- Did Aaru publish any scoring of 2025 or 2026 elections or the Nov 2025 NYC result in detail? Search for a methodology paper or a Semafor follow-up.
- Is "Lumen" still the product name in 2026? The homepage no longer uses it.
- The $1B headline against a lower blended value: the exact blended number is not reported.

## Sources

- [Sources: AI synthetic research startup Aaru raised a Series A at a $1B headline valuation (TechCrunch)](https://techcrunch.com/2025/12/05/ai-synthetic-research-startup-aaru-raised-a-series-a-at-a-1b-headline-valuation/), accessed 2026-10-11
- [21-year-old AI startup cofounder's sales pitch to clients: "Do not trust us" (Fortune)](https://fortune.com/2026/06/17/aaru-cofounder-ned-koh-ai-startup-sales-pitch-do-not-trust-us/), accessed 2026-10-11
- [EY announces alliance with Aaru](https://www.ey.com/en_gl/newsroom/2026/09/ey-announces-alliance-with-aaru-to-help-organizations-drive-growth-with-greater-confidence-through-behavioral-simulation), accessed 2026-10-11
- [Aaru homepage](https://aaru.com), accessed 2026-10-11
- [AI startup Aaru defends using AI for polling (Semafor)](https://semafor.com/article/11/06/2024/ai-startup-aaru-defends-using-artificial-intelligence-for-polling), accessed 2026-10-11
- [Accenture Ventures backs Aaru (DRNO, 2025-03-05)](https://www.mrweb.com/drno/news37971.htm), accessed 2026-10-11
- [Further funding for Aaru (DRNO)](https://www.mrweb.com/drno/news39165.htm), accessed 2026-10-11
- [AI predicts Harris' victory over Trump (TASS)](https://tass.com/world/1867015/amp), accessed 2026-10-11 (search snippet only, state odds not opened)
- [Aaru AI Review 2026 (FishDog, a competitor)](https://fish.dog/news/aaru-ai-review-2026-the-prediction-startup-and-where-it-fits), accessed 2026-10-11
