# Historical precedents and failures: Simulmatics, SocialSim, ACE, Cambridge Analytica, Google Flu Trends

- Date: 2026-10-11
- Area: business
- Confidence: medium. Simulmatics, Google Flu Trends and Cambridge Analytica are well documented. SocialSim outcomes could not be found, and ACE numbers come from secondary pages. The web search budget ran out mid-task, so only direct page fetches were possible.

## Answer

Four of the five precedents are warnings, and one is a template. Simulmatics, Google Flu Trends and Cambridge Analytica all sold a model of people as more powerful than the evidence supported, and each ended in public discredit. The Good Judgment Project (IARPA ACE) won by scoring forecasts openly, against a baseline, over many resolved questions. Real World should copy that, and should never claim the simulator "predicts" before the track record exists.

## Findings

**Simulmatics (1959-1970).** Founded in February 1959 in New York by ad executive Ed Greenfield, running FORTRAN on IBM 704s. Its 1960 "People Machine" modeled 480 voter categories for Kennedy. Historian Jill Lepore judged most results to be common sense. No accuracy figure is on record. The firm went public in 1961 after a Harper's piece (written by a Simulmatics employee posing as a freelance writer) turned it into a sensation. It then moved to Vietnam village studies for ARPA (from 1966) and a $221,000 Kerner Commission riot-media contract (1967), where commissioners questioned the rigor. It ceased operating in 1970 amid bad publicity and money trouble. [Wikipedia: Simulmatics Corporation](https://en.wikipedia.org/wiki/Simulmatics_Corporation)

**DARPA SocialSim.** The program aimed at "high-fidelity computational simulation of online social behavior", combining bottom-up accuracy with top-down scale. DARPA's page says the program is complete, names no performers, metrics or results, and is no longer maintained. [DARPA: Computational Simulation of Online Social Behavior](https://www.darpa.mil/program/computational-simulation-of-online-social-behavior) Note the scope: it simulated information spread on platforms, not whole societies.

**IARPA ACE (June 2010 to June 2015).** Goal was to "dramatically enhance the accuracy, precision, and timeliness of intelligence forecasts" through elicitation, aggregation and representation. The Good Judgment Project, led by Philip Tetlock, was funded around July 2011 and won the 2013 tournament. [Wikipedia: ACE](https://en.wikipedia.org/wiki/Aggregative_Contingent_Estimation_Program) [IARPA: ACE](https://www.iarpa.gov/research-programs/ace) Secondary reporting says GJP was 35% to 72% more accurate than other research teams, used thousands of volunteers, scored with Brier scores on about 100 to 150 questions per year, and built up to 260 superforecasters. [Wikipedia: Good Judgment Project](https://en.wikipedia.org/wiki/The_Good_Judgment_Project) Top forecasters were reported about 30% better than intelligence analysts. [Wikipedia: Superforecaster](https://en.wikipedia.org/wiki/Superforecaster) I did not open a primary ACE paper, so treat the percentages as unverified. One 2021 study cited there found that filtering noise mattered more than reducing bias or finding more information.

**Google Flu Trends (2008-2015).** Launched by Google.org in 2008 with a claimed 97% accuracy against CDC data. It overestimated flu "consistently" from 2011 to 2013, and in one 2012 interval predicted twice the doctor visits the CDC recorded. Google stopped publishing in August 2015. [Wikipedia: Google Flu Trends](https://en.wikipedia.org/wiki/Google_Flu_Trends) The primary diagnosis is Lazer, Kennedy, King and Vespignani, Science, 14 March 2014. They name two failures: "big data hubris" (treating big data as a substitute for, not a supplement to, measured data) and algorithm dynamics (Google's own search changes and media-driven searches shifted the signal). GFT matched 50 million search terms to a small number of flu seasons, so spurious matches were likely. It missed the 2009 H1N1 pandemic entirely, and ran high in 100 of 108 weeks from August 2011. Errors were autocorrelated and seasonal. Simple lagged CDC data beat it, and combining GFT with lagged CDC data beat both. [Lazer et al., Science 343:1203 (PDF)](https://gking.harvard.edu/files/gking/files/0314policyforumff.pdf)

**Cambridge Analytica (to May 2018).** Facebook confirmed data on up to 87 million users, from only about 270,000 app installs. The firm claimed personality profiles of about 230 million US adults. Executives later conceded it "never used psychographics" in the Trump campaign (NYT, 2017), the Cruz campaign dropped it after its models failed to find supporters, and political scientists such as Eitan Hersh called the claims empty. It closed 1 May 2018. Penalties were for data misuse: a $5 billion FTC fine on Facebook (July 2019), a 500,000 pound UK fine, and a $725 million Meta class-action settlement (December 2022). The UK investigation found no meaningful Brexit role. [Wikipedia: Cambridge Analytica](https://en.wikipedia.org/wiki/Cambridge_Analytica) [Wikipedia: Facebook-Cambridge Analytica scandal](https://en.wikipedia.org/wiki/Facebook%E2%80%93Cambridge_Analytica_data_scandal)

## What it means for Real World

- For the product:
  - Accuracy claims need a baseline, as with GFT's lagged CDC data. Our "Brier vs market price" scoreboard is that baseline. Add a second, dumber baseline: yesterday's value, or last week's poll. If the simulator cannot beat persistence, say so on the receipts page.
  - Scope the pitch to what is scored. "Calibrated forecasts of resolvable questions, with receipts" is defensible. "A simulation of the world" invites the Simulmatics and Cambridge Analytica comparison.
  - Ship the "why did this agent say that" trace as explanation, not as proof. Simulmatics's output was largely common sense, and our traces will be the same unless they carry evidence.
- For the engineering:
  - GFT's failure mode was overfitting a few seasons with a huge feature space. Daily assimilation of GDELT, trends and polls has the same risk. Fix feature choices before looking at scores, and keep a holdout window.
  - Algorithm dynamics apply to us: news sources, market structure and our own model versions change. Log model and prompt version on every hashed forecast so score changes can be attributed.
  - Errors will be autocorrelated. Monitor residuals week over week, and recalibrate against the last known real observation, as the Science paper's combined model did.
- For the business:
  - Simulmatics and Cambridge Analytica were destroyed by data provenance and ethics, not accuracy. Census microdata, survey licenses and opt-in twins need written terms before launch. Never describe individual-level prediction or voter targeting.
  - Do not sell influence. Political persuasion claims were mostly marketing even for Cambridge Analytica, and they brought regulators.
  - The hashed, public track record is the one moat among these precedents that holds up, because GJP's credibility came from scored questions that cannot be backfilled.

## Recommendations

1. Put a "baselines" row on the receipts page from day one: market price, persistence, and last poll. Show Brier for all three next to ours. Owner: engineering.
2. Write a one-page claims policy for the site, API docs and YC application: what we forecast, what we do not (individuals, voter targeting, persuasion). Owner: PM.
3. Store model version, prompt version, data cutoff and feature set with every hashed forecast, so drift is attributable. Owner: engineering.
4. Pre-register the question list and scoring rule before the Oct 27 launch. Choose the metrics now, not after seeing results. Owner: PM.
5. Add a data-license checklist (IPUMS, WVS, Gallup, Pew, GDELT terms; consent for twins) as a launch gate. Owner: PM with counsel.
6. Report the track record honestly at launch: with 17 days of history it will be thin. Say how many resolved questions it covers rather than quoting a headline number.

## Open questions

- What did SocialSim actually achieve and measure? DARPA's page is empty. Find the performer papers (published 2018-2021) and read their reported error metrics.
- Are the ACE numbers (35-72% over other teams, 30% over analysts) correct? Read Mellers et al. (Psychological Science, 2014) and the ACE tournament papers directly.
- Lepore's *If Then* (2020) likely documents Simulmatics's accuracy more precisely than Wikipedia. Read it or a review before using the "common sense" line in any public material.
- Which stated Aaru and Simile claims are checkable? Not covered here; the competitor notes should do it.

## Sources

- [Simulmatics Corporation, Wikipedia](https://en.wikipedia.org/wiki/Simulmatics_Corporation), accessed 2026-10-11
- [Computational Simulation of Online Social Behavior, DARPA](https://www.darpa.mil/program/computational-simulation-of-online-social-behavior), accessed 2026-10-11
- [ACE program, IARPA](https://www.iarpa.gov/research-programs/ace), accessed 2026-10-11
- [Aggregative Contingent Estimation Program, Wikipedia](https://en.wikipedia.org/wiki/Aggregative_Contingent_Estimation_Program), accessed 2026-10-11
- [The Good Judgment Project, Wikipedia](https://en.wikipedia.org/wiki/The_Good_Judgment_Project), accessed 2026-10-11
- [Superforecaster, Wikipedia](https://en.wikipedia.org/wiki/Superforecaster), accessed 2026-10-11
- [Google Flu Trends, Wikipedia](https://en.wikipedia.org/wiki/Google_Flu_Trends), accessed 2026-10-11
- [The Parable of Google Flu, Lazer et al., Science 2014 (PDF)](https://gking.harvard.edu/files/gking/files/0314policyforumff.pdf), accessed 2026-10-11
- [Cambridge Analytica, Wikipedia](https://en.wikipedia.org/wiki/Cambridge_Analytica), accessed 2026-10-11
- [Facebook-Cambridge Analytica data scandal, Wikipedia](https://en.wikipedia.org/wiki/Facebook%E2%80%93Cambridge_Analytica_data_scandal), accessed 2026-10-11
