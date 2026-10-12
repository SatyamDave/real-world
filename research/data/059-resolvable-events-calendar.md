# Resolvable events calendar, Oct 15 to Dec 2026

- Date: 2026-10-11
- Area: data
- Confidence: medium. Dates for central banks and US data come from the issuing agencies. Election dates come from Wikipedia snapshots. I could not run web searches (the session's search budget was spent), so there are no market odds and the film calendar is thin.

## Answer

There are enough clean, binary, dated events in the 22 days before launch and the weeks after to pre-register about 25 forecasts. The best set is: Brazil runoff (Oct 25), Serbia, Bulgaria and Israel (Oct 25 to 27), the central banks (Oct 28 to 30), US midterms (Nov 3), New Zealand (Nov 7), Spain (Nov 29) and the Dec central bank round. Real World should hash these forecasts before launch on Oct 27, so the public record already holds events that resolve in front of visitors. Pick events with a free, objective resolution source and a liquid market price to score against.

## Findings

Elections (all dates 2026):

- Oct 25, Brazil presidential runoff. First round on Oct 4: Flavio Bolsonaro 47.03%, Lula 45.16%, turnout 78.92%. The two face each other in the runoff. [Wikipedia](https://en.wikipedia.org/wiki/2026_Brazilian_general_election)
- Oct 25, Serbia early parliamentary election. Vucic dissolved the Assembly. The page says SNS and the Student List are close, with polls split on who leads. [Wikipedia](https://en.wikipedia.org/wiki/2026_Serbian_parliamentary_election)
- Oct 25, Bulgaria presidential election. 27 candidate pairs. Incumbent Iliana Iotova leads; one poll has her at 47.8% against 26.4% for Andrey Gyurov. A runoff is needed without a majority or with turnout under 50%, so the first round may not resolve it. [Wikipedia](https://en.wikipedia.org/wiki/2026_Bulgarian_presidential_election)
- Oct 27, Israel Knesset election, 120 seats. Knesset dissolved Jul 17. Official results due Nov 4. Same day as our launch. [Wikipedia](https://en.wikipedia.org/wiki/2026_Israeli_legislative_election)
- Nov 3, US midterms. All 435 House seats, 35 Senate seats (33 regular plus special elections in Florida and Ohio), 39 governor races. House now 218 R, 214 D, 1 independent, 2 vacancies. Generic ballot averages D+8.4 (50.3 to 41.9) as of Oct 9. [House](https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections)
- Senate: 53 R, 45 D, plus 2 independents who caucus with Democrats. Democratic side needs a net gain of four. Cook rates Michigan, Maine, Alaska, Ohio, Texas, Iowa and Kansas as tossups. Cook projects 47 D-aligned, 46 R, 7 tossups; Sabato 49/47/4; Silver Bulletin 52/46/2. [Senate](https://en.wikipedia.org/wiki/2026_United_States_Senate_elections), [seats overview](https://en.wikipedia.org/wiki/2026_United_States_elections)
- Nov 7, New Zealand general election, announced by Luxon on Jan 21. National-led coalition (ACT, NZ First) against Labour (Hipkins). Poll figures not retrieved. [Wikipedia](https://en.wikipedia.org/wiki/2026_New_Zealand_general_election)
- Nov 29, Spain snap general election. Cortes dissolved Oct 6; chambers reconvene Dec 23. [Wikipedia](https://en.wikipedia.org/wiki/2026_Spanish_general_election)
- Later: Palestine legislative Nov 28, Gambia presidential Dec 5, South Sudan general Dec 22 (all "scheduled" on the [2026 politics page](https://en.wikipedia.org/wiki/2026_in_politics_and_government)). Treat Palestine and South Sudan as likely to slip. I did not verify them.

Central banks (decision day in bold):

- Fed: Oct 27 to **28** (no projections), Dec 8 to **9** (with projections). No November meeting. [Federal Reserve](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm)
- ECB: Oct 28 to **29**, Dec 16 to **17**, each with a press conference. [ECB](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html)
- Bank of Japan: Oct 29 to **30** (with Outlook Report), Dec 17 to **18**. Summary of Opinions Nov 10 and Dec 28. [BOJ](https://www.boj.or.jp/en/mopo/mpmsche_minu/index.htm)
- Bank of England: no October meeting. Next decision **Nov 5** (with Monetary Policy Report), then **Dec 17**. Bank Rate is 3.75%. [BoE](https://www.bankofengland.co.uk/monetary-policy/upcoming-mpc-dates)

US data (8:30 ET unless noted):

- CPI: Oct 14 (September data), Nov 10, Dec 10. Jobs report: Nov 6 (October data), Dec 4. PPI: Nov 13, Dec 15. JOLTS: Nov 3 (10:00), Dec 1. [BLS October](https://www.bls.gov/schedule/news_release/), [November](https://www.bls.gov/schedule/2026/11_sched.htm), [December](https://www.bls.gov/schedule/2026/12_sched.htm)
- GDP Q3 advance and September PCE: Oct 29. GDP second estimate and October PCE: Nov 25. Third estimate and November PCE: Dec 23. [BEA](https://www.bea.gov/news/schedule)
- Note Nov 3 is both election day and a JOLTS release. The jobs report lands three days after.

Box office and film: Box Office Mojo's calendar page lists openings on Oct 16, Oct 23 and Nov 6, but the wide/limited split was unclear in the extract and I cannot vouch for it. [Box Office Mojo](https://www.boxofficemojo.com/calendar/) The 2026 film page gives running worldwide totals as of the week of Oct 9: Spider-Man: Brand New Day $2.51B, The Odyssey $1.77B, Toy Story 5 $1.15B. [Wikipedia](https://en.wikipedia.org/wiki/2026_in_film) I could not confirm December tentpole dates (for example Avengers: Doomsday, Dune: Part Three).

What I could not get: Polymarket's midterm page loaded but showed no House or Senate prices in the extract. Brazil runoff polls, NZ polls and Serbia polls were not in the pages. Cook and Sabato House ratings were not retrieved.

## What it means for Real World

- For the product: The "daily question" and the receipts page need a launch-week list that visitors can watch resolve. Oct 25 to Nov 7 gives about 12 resolutions in 13 days. That is the whole demo of the hash-then-score loop. Forks make sense on the same events: "what if Brazil's runoff turnout drops five points".
- For the engineering: Store each event as one record: id, question, resolution source URL, resolution time and timezone, outcome type (binary, categorical, numeric), and a market price snapshot at hash time. Resolution timing is messy: Israeli results take until Nov 4, US House calls can take days, Bulgaria may need a second round. Define "resolved" in the record before the event, for example "AP call" or "official certified result by date X". Central-bank and BLS events resolve by a single published number, so they are the cheapest to automate.
- For the business: Brier against market price only counts where a liquid market exists. US midterm control, Brazil and Fed decisions will have one. Serbia, Bulgaria and NZ may not. Do not claim to beat markets on events with no price. Report the rest as Brier against a naive baseline and say so.

## Recommendations

1. Seed 25 pre-registered forecasts by Oct 26, hashed and timestamped: Brazil winner and margin band; Serbia largest party; Bulgaria first-round winner and whether a runoff happens; Israel bloc seat count (61+); Fed Oct 28 and Dec 9 decision; ECB Oct 29 and Dec 17; BOJ Oct 30 and Dec 18; BoE Nov 5 and Dec 17; Q3 GDP advance band; October jobs and CPI bands; US House control; US Senate control; five Senate tossup states; NZ largest party; Spain largest party.
2. Add three or four non-election items so the world is not only politics: the Nov 6 payrolls number, the Nov 10 CPI print, and weekend box office. Pull the box office calendar from a primary studio or Box Office Mojo's weekend charts before committing; I have not verified December dates.
3. Write the event record schema first (see Engineering) and review it with both a PM and an engineer. Keep it a flat JSON or a table, not a framework.
4. Use only events whose resolution source is free and machine-readable: central bank web pages, BLS and BEA, official electoral commissions. For disputed or slow results, name the fallback source and the cutoff in the record.
5. Because Western flattening is a stated risk, include at least five non-Western or Global South events in the first 25: Brazil, Serbia, Bulgaria, Israel, Gambia, and BOJ.
6. Re-verify every election date on Oct 20 against the national electoral commission sites; Wikipedia snapshots can lag or be wrong.

## Open questions

- Current prediction-market prices for House, Senate and Brazil. Find out by opening the Polymarket US or Kalshi event pages in a browser and recording the snapshot at hash time.
- Whether the Bulgarian runoff date is fixed and falls inside the window. Check the Central Election Commission site.
- Whether Palestine (Nov 28) and South Sudan (Dec 22) actually hold votes. Check news from GDELT in the week before each.
- December film tentpoles and whether a clean weekend-gross source exists for pre-registering box office.
- Whether a US government data disruption could move BLS dates. The schedules above are current but I did not check for shutdown risk.

## Sources

- [Federal Reserve FOMC calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm), accessed 2026-10-11
- [ECB Governing Council calendar](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html), accessed 2026-10-11
- [Bank of England upcoming MPC dates](https://www.bankofengland.co.uk/monetary-policy/upcoming-mpc-dates), accessed 2026-10-11
- [Bank of Japan MPM schedule](https://www.boj.or.jp/en/mopo/mpmsche_minu/index.htm), accessed 2026-10-11
- [BLS release schedule](https://www.bls.gov/schedule/news_release/), [November](https://www.bls.gov/schedule/2026/11_sched.htm), [December](https://www.bls.gov/schedule/2026/12_sched.htm), accessed 2026-10-11
- [BEA release schedule](https://www.bea.gov/news/schedule), accessed 2026-10-11
- [Wikipedia: 2026 in politics and government](https://en.wikipedia.org/wiki/2026_in_politics_and_government), accessed 2026-10-11
- [Wikipedia: 2026 Brazilian general election](https://en.wikipedia.org/wiki/2026_Brazilian_general_election), accessed 2026-10-11
- [Wikipedia: 2026 Israeli legislative election](https://en.wikipedia.org/wiki/2026_Israeli_legislative_election), accessed 2026-10-11
- [Wikipedia: 2026 Serbian parliamentary election](https://en.wikipedia.org/wiki/2026_Serbian_parliamentary_election), accessed 2026-10-11
- [Wikipedia: 2026 Bulgarian presidential election](https://en.wikipedia.org/wiki/2026_Bulgarian_presidential_election), accessed 2026-10-11
- [Wikipedia: 2026 New Zealand general election](https://en.wikipedia.org/wiki/2026_New_Zealand_general_election), accessed 2026-10-11
- [Wikipedia: 2026 Spanish general election](https://en.wikipedia.org/wiki/2026_Spanish_general_election), accessed 2026-10-11
- [Wikipedia: 2026 US elections](https://en.wikipedia.org/wiki/2026_United_States_elections), [House](https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections), [Senate](https://en.wikipedia.org/wiki/2026_United_States_Senate_elections), accessed 2026-10-11
- [Wikipedia: 2026 in film](https://en.wikipedia.org/wiki/2026_in_film), accessed 2026-10-11
- [Box Office Mojo calendar](https://www.boxofficemojo.com/calendar/), accessed 2026-10-11
- [Polymarket elections](https://polymarket.com/elections), accessed 2026-10-11
