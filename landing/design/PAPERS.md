# Papers behind the research section

Every entry was opened by a verification pass on 2026-10-13, and the notes below say what was and was not opened. Rules for the public page ([sections.ts](../src/copy/sections.ts), `PAPERS`): these are other people's results, never ours; no number goes on the page unless the source was re-opened for it; no sentence implies Real World's own accuracy ([gtm/messaging.md](../../gtm/messaging.md)); at most one short quote per source. The page currently carries no figure at all.

Verdicts: KEEP, KEEP_WITH_CAVEAT (secondary sources only), KEEP_CORRECTED (the popular paraphrase was wrong). Entries whose figures came through a fetch summary are marked "re-check before use".

| # | Source | Verdict | On the page |
| --- | --- | --- | --- |
| 1 | Joon Sung Park et al., 2023, Generative Agents: Interactive Simulacra of Human Behavior | KEEP | yes |
| 2 | Joon Sung Park et al., 2024, LLM Agents Grounded in Self-Reports Enable General-Purpose S | KEEP_CORRECTED | yes |
| 3 | Danny Halawi et al., 2024, Approaching Human-Level Forecasting with Language Models | KEEP | yes |
| 4 | Philipp Schoenegger et al., 2024, Wisdom of the Silicon Crowd: LLM Ensemble Prediction Capabil | KEEP | yes |
| 5 | Barbara Mellers et al., 2014, Psychological Strategies for Winning a Geopolitical Forecast | KEEP | yes |
| 6 | Philip E. Tetlock et al., 2005, Expert Political Judgment: How Good Is It? How Can We Know? | KEEP_WITH_CAVEAT | no |
| 7 | Ezra Karger et al., 2024, ForecastBench: A Dynamic Benchmark of AI Forecasting Capabil | KEEP | yes |
| 8 | Lisa P. Argyle et al., 2023, Out of One, Many: Using Language Models to Simulate Human Sa | KEEP | yes |
| 9 | James Bisbee et al., 2024, Synthetic Replacements for Human Survey Data? The Perils of  | KEEP | yes |
| 10 | Shibani Santurkar et al., 2023, Whose Opinions Do Language Models Reflect? | KEEP | yes |
| 11 | Brian A. Nosek et al., 2018, The Preregistration Revolution | KEEP | yes |
| 12 | Don A. Moore et al., 2008, The trouble with overconfidence | KEEP | no |
| 13 | Tilmann Gneiting et al., 2007, Strictly Proper Scoring Rules, Prediction, and Estimation | KEEP | yes |
| 14 | Alejandro Lopez-Lira et al., 2023, Can ChatGPT Forecast Stock Price Movements? Return Predictab | KEEP | no |
| 15 | Ashwini Ashokkumar et al., 2026, Large Language Models Can Predict the Results of Social Scie | KEEP | no |

## 1. Generative Agents: Interactive Simulacra of Human Behavior

- Authors and year: Joon Sung Park, Joseph C. O'Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, Michael S. Bernstein (6), 2023
- Venue: arXiv:2304.03442 (cs.HC); UIST 2023 per memory only, ACM page returned 403 so not confirmed
- Link: https://arxiv.org/abs/2304.03442
- What was opened: arXiv abstract page. Could not open ACM page.
- Finding as read: Authors build LLM-driven agents with memory, reflection and planning, run 25 of them in a Sims-like sandbox, and report emergent social behaviour such as organising a party; ablations show observation, planning and reflection each matter for believability.
- Limits: Shows believable behaviour in a game sandbox, not that agents match real people or predict real-world outcomes.
- Safe use: Cite as prior work on LLM agents that act believably in a sandbox, never as evidence they forecast people.
- Popular paraphrase flag: Believable is not accurate.

## 2. LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals (v1 title: Generative Agent Simulations of 1,000 People)

- Authors and year: Joon Sung Park, Carolyn Q. Zou, Jonne Kamphorst, Niles Egan, Aaron Shaw, Benjamin Mako Hill, Carrie Cai, Meredith Ringel Morris, Percy Liang, Robb Willer, Michael S. Bernstein (11), 2024
- Venue: arXiv:2411.10109 (cs.AI), submitted 2024-11-15; no peer-reviewed venue seen
- Link: https://arxiv.org/abs/2411.10109 and https://arxiv.org/abs/2411.10109v1
- What was opened: Abstract pages for latest version and v1. Full text HTML returned 404. Candidate year 2024 and v1 title are right; current arXiv title is different.
- Finding as read: With 1,052 US participants, agents built from the participants' own interviews and surveys reproduced their General Social Survey answers at about 86% (interview+survey; 83% interview only, 82% survey only, 74% demographics only) of the participants' own two-week test-retest consistency. Agents were of the same people interviewed.
- Limits: Agents are built from long self-reports of the very people being predicted; says nothing about simulating people from public data or forecasting world events.
- Safe use: At most: agents given a person's own interview approximated that person's survey answers; do not imply our simulation does this.
- Popular paraphrase flag: '85% accurate' paraphrase is wrong: it is normalized to test-retest consistency, not raw accuracy.

## 3. Approaching Human-Level Forecasting with Language Models

- Authors and year: Danny Halawi, Fred Zhang, Chen Yueh-Han, Jacob Steinhardt (4), 2024
- Venue: NeurIPS 2024 (Advances in NeurIPS 37), also arXiv:2402.18563
- Link: https://arxiv.org/abs/2402.18563 ; https://arxiv.org/html/2402.18563 ; https://proceedings.neurips.cc/paper_files/paper/2024/hash/5a5acfd0876c940d81619c1dc60e7748-Abstract-Conference.html
- What was opened: arXiv abstract, arXiv HTML (numbers via summarizer), NeurIPS abstract page.
- Finding as read: A retrieval-augmented LM system, tested on questions published after the models' cutoffs from forecasting platforms, nears the aggregate of competitive human forecasters. HTML summary reports Brier 0.179 for the system vs 0.149 for the crowd on 914 test questions (system still worse on average); it beats the crowd only in subsets (e.g. when crowd is uncertain).
- Quote (under 15 words): "nears the crowd aggregate of competitive forecasters"
- Limits: On average the system scored worse than the crowd; parity is limited to some conditions; per-subset numbers came through a summarizer and should be re-checked before citing.
- Safe use: Say LLM forecasters in 2024 came close to, but on average did not beat, human crowds; not about our product.
- Popular paraphrase flag: 'Human-level' in the title overstates: average Brier was worse than the crowd.

## 4. Wisdom of the Silicon Crowd: LLM Ensemble Prediction Capabilities Rival Human Crowd Accuracy

- Authors and year: Philipp Schoenegger, Indre Tuminauskaite, Peter S. Park, Philip E. Tetlock (4), 2024
- Venue: arXiv:2402.19379 (cs.CY), v6 July 2024; later published in Science Advances per memory, NOT verified
- Link: https://arxiv.org/abs/2402.19379 ; https://arxiv.org/html/2402.19379
- What was opened: arXiv abstract and HTML (numbers via summarizer). Journal version not opened.
- Finding as read: An ensemble of 12 LLMs forecast 31 binary Metaculus questions (Oct 2023 to Jan 2024) with Brier about 0.20 vs 0.19 for 925 human forecasters and 0.25 for a 50% baseline; the difference between the LLM and human crowds was not statistically significant.
- Quote (under 15 words): "not statistically different from the human crowd"
- Limits: Only 31 questions over about 3 months; authors note acquiescence bias (mean prediction about 57%) and overconfidence; equivalence is within a medium effect-size bound.
- Safe use: Say a 2024 study of 31 questions found an LLM ensemble statistically indistinguishable from a human crowd; do not generalise.
- Popular paraphrase flag: 'Rival' does not mean beat; and small n.

## 5. Psychological Strategies for Winning a Geopolitical Forecasting Tournament

- Authors and year: Barbara Mellers, Lyle Ungar, Jonathan Baron, Jaime Ramos, Burcu Gurcay, Katrina Fincher, Sydney E. Scott, Don Moore, Pavel Atanasov, Samuel A. Swift, Terry Murray, Eric Stone, Philip E. Tetlock (13), 2014
- Venue: Psychological Science 25(5), 1106-1115; DOI 10.1177/0956797614524255
- Link: https://www.psychologicalscience.org/journals/psychological-science/0956797614524255/
- What was opened: Journal landing page and APS Observer summary via search. Full text not opened.
- Finding as read: In IARPA's two-year tournament, five university research teams tested three interventions, probability training, teaming and tracking top performers into elite teams, and each improved forecast accuracy (calibration and resolution); combining them with statistical aggregation gave the best predictions.
- Limits: One tournament on geopolitical questions; effect sizes not checked in the full text by me.
- Safe use: Cite as evidence that training, teaming and aggregation improve human forecasts and that forecasts can be scored in public.

## 6. Expert Political Judgment: How Good Is It? How Can We Know?

- Authors and year: Philip E. Tetlock (1), 2005
- Venue: Princeton University Press (book)
- Link: https://knowledge.wharton.upenn.edu/?p=17144 ; https://corporate.jcx.au/expert-political-judgment ; https://en.wikipedia.org/wiki/Expert_Political_Judgment
- What was opened: Princeton Press page returned 403. Opened only a Wharton interview with Tetlock (2017) and a blog chapter summary; both secondary. Not the book.
- Finding as read: Per Tetlock in 2017: the major finding was that political experts are seriously overconfident (about 90% confident events happening about 70% of the time). Per a chapter summary: experts barely beat assigning equal probability to outcomes, beat Berkeley undergraduates, and the main difference was fox (better calibration and discrimination) vs hedgehog.
- Quote (under 15 words): "political experts are pretty seriously overconfident"
- Limits: I did not open the book; the 90/70 figure is Tetlock's recollection in an interview.
- Safe use: Cite only 'experts were overconfident and style mattered more than credentials', and confirm against the book before using numbers.
- Popular paraphrase flag: 'Experts are no better than dart-throwing chimps' is a popular overstatement; the chimp line was applied to the poorer-performing hedgehog style and rough baselines, and I did not find it in the sources I opened as a literal finding.

## 7. ForecastBench: A Dynamic Benchmark of AI Forecasting Capabilities

- Authors and year: Ezra Karger, Houtan Bastani, Chen Yueh-Han, Zachary Jacobs, Danny Halawi, Fred Zhang, Philip E. Tetlock (7), 2024
- Venue: arXiv:2409.19839 (v3 Feb 2025); ICLR 2025 (proceedings PDF URL found but could not read text)
- Link: https://arxiv.org/abs/2409.19839 ; https://forecastingresearch.substack.com/p/ai-llm-forecasting-model-forecastbench-benchmark (2025-10-08) ; https://forecastingresearch.substack.com/p/llms-are-closing-the-gap-on-human (2026-01-29)
- What was opened: arXiv abstract, two FRI Substack posts. ICLR PDF unreadable.
- Finding as read: Abstract: on a 200-question subset, expert forecasters outperformed the top LLM (p<0.001). FRI Oct 2025 post: superforecasters Brier 0.081 vs best LLM (GPT-4.5) 0.101, linear extrapolation to parity Nov 2026 (95% CI Dec 2025 to Jan 2028). FRI Jan 2026 update: superforecasters 0.085 vs best LLMs 0.102, gap 0.017, parity Nov 2026 (95% CI Jan 2026 to Nov 2027). The 0.101 vs 0.081 figures are VERIFIED to the Oct 2025 primary post but are superseded.
- Quote (under 15 words): "expert forecasters outperform the top-performing LLM"
- Limits: Difficulty-adjusted scores on non-overlapping question sets; binary questions; extrapolation is a projection, not a result.
- Safe use: Say that as of early 2026 the FRI leaderboard still had superforecasters ahead of the best LLMs; cite date and score.
- Popular paraphrase flag: Parity date is an extrapolation with wide CI, not a finding.

## 8. Out of One, Many: Using Language Models to Simulate Human Samples

- Authors and year: Lisa P. Argyle, Ethan C. Busby, Nancy Fulda, Joshua R. Gubler, Christopher Rytting, David Wingate (6), 2023
- Venue: Political Analysis 31(3), 337-351; DOI 10.1017/pan.2023.2 (arXiv:2209.06899, 2022)
- Link: https://doi.org/10.1017/pan.2023.2 ; https://arxiv.org/abs/2209.06899
- What was opened: arXiv abstract and Cambridge page.
- Finding as read: Conditioning GPT-3 on sociodemographic backstories of real US survey respondents yielded 'silicon samples' whose response patterns resembled those of human subgroups on several US surveys; authors call this algorithmic fidelity.
- Quote (under 15 words): "fine-grained and demographically correlated"
- Limits: GPT-3 and a few US survey topics; Bisbee et al. find fidelity fails on other tests.
- Safe use: Cite as the early, positive case for simulated respondents, always paired with Bisbee and Santurkar.

## 9. Synthetic Replacements for Human Survey Data? The Perils of Large Language Models

- Authors and year: James Bisbee, Joshua D. Clinton, Cassy Dorff, Brenton Kenkel, Jennifer M. Larson (5), 2024
- Venue: Political Analysis 32(4); DOI 10.1017/pan.2024.5
- Link: https://www.cambridge.org/core/product/B92267DC26195C7F36E63EA04A47D2FE
- What was opened: Cambridge article page (summary via fetcher) plus search result abstract.
- Finding as read: Using ChatGPT personas to answer ANES feeling-thermometer items (about 3.6 million responses reported), average scores resembled the survey, but synthetic variance was lower, regression estimates often differed from ANES ones, and results shifted with prompt wording and over a 3-month period.
- Limits: One model family (ChatGPT 3.5), one survey domain; the '48% of coefficients differ, 32% sign flips' figures came from a summarizer and I did not verify them in the text.
- Safe use: Cite to show synthetic respondents can match averages yet be unreliable and unreproducible.

## 10. Whose Opinions Do Language Models Reflect?

- Authors and year: Shibani Santurkar, Esin Durmus, Faisal Ladhak, Cinoo Lee, Percy Liang, Tatsunori Hashimoto (6), 2023
- Venue: ICML 2023 (PMLR 202); arXiv:2303.17548
- Link: https://arxiv.org/abs/2303.17548 ; https://proceedings.mlr.press/v202/santurkar23a.html
- What was opened: arXiv abstract and PMLR page.
- Finding as read: Using OpinionQA, built from US opinion surveys, authors find substantial misalignment between LM opinions and 60 US demographic groups, in some cases as large as the Democrat-Republican gap on climate change, and steering to a group did not fully fix it; RLHF-tuned models skew left-leaning.
- Quote (under 15 words): "on par with the Democrat-Republican divide on climate change"
- Limits: Tests models available in 2022-23 against specific US surveys.
- Safe use: Cite as a reason not to treat LLM outputs as stand-ins for the public.

## 11. The Preregistration Revolution

- Authors and year: Brian A. Nosek, Charles R. Ebersole, Alexander C. DeHaven, David T. Mellor (4), 2018
- Venue: PNAS; DOI 10.1073/pnas.1708274114
- Link: https://pmc.ncbi.nlm.nih.gov/articles/PMC5856500/
- What was opened: PMC page.
- Finding as read: Argues that committing to a plan before seeing data separates prediction from postdiction and counters selective reporting.
- Limits: Argument paper about research practice, not a measurement of forecast accuracy.
- Safe use: Cite as the rationale for registering before outcomes are known.

## 12. The trouble with overconfidence

- Authors and year: Don A. Moore, Paul J. Healy (2), 2008
- Venue: Psychological Review 115(2), 502-517
- Link: https://pubmed.ncbi.nlm.nih.gov/18426301/ (page returned no content); abstract seen via search result excerpt
- What was opened: Only via search result excerpt; publisher and PubMed page not readable. Treat as lightly verified.
- Finding as read: Reconciles three forms of overconfidence (overestimation, overplacement, overprecision); overprecision is the most persistent, and on hard tasks people overestimate their own performance.
- Limits: Cites other studies; not a forecasting study.
- Safe use: Cite for the claim that excessive precision in beliefs is persistent.

## 13. Strictly Proper Scoring Rules, Prediction, and Estimation

- Authors and year: Tilmann Gneiting, Adrian E. Raftery (2), 2007
- Venue: Journal of the American Statistical Association 102(477), 359-378; DOI 10.1198/016214506000001437
- Link: http://www.tandfonline.com/doi/abs/10.1198/016214506000001437
- What was opened: Publisher returned 403; confirmed bibliographic details only from search results (colab.ws and others).
- Finding as read: Reviews the theory of proper scoring rules for evaluating probabilistic forecasts.
- Limits: Theory paper; I could not read the abstract at the publisher.
- Safe use: Cite when explaining why a proper rule such as Brier is used for scoring.

## 14. Can ChatGPT Forecast Stock Price Movements? Return Predictability and Large Language Models

- Authors and year: Alejandro Lopez-Lira, Yuehua Tang (2), 2023
- Venue: arXiv:2304.07619 (q-fin.ST), revised Oct 2025; no journal seen
- Link: https://arxiv.org/abs/2304.07619
- What was opened: arXiv abstract page.
- Finding as read: Authors report that LLM sentiment scores of news headlines predict subsequent stock returns, more for smaller stocks and negative news, with strategy returns declining as LLM adoption rises.
- Limits: Preprint; headline-based backtests, not a live scored forecast record; the 90% hit rate refers to an untradable initial reaction.
- Safe use: Cite only as an example of LLMs in market prediction research; avoid performance numbers.

## 15. Large Language Models Can Predict the Results of Social Science Experiments

- Authors and year: Ashwini Ashokkumar, Luke Hewitt, Isaias Ghezae, Robb Willer (4), 2026
- Venue: Nature 656, 115-122 (8 July 2026); earlier preprint titled 'Predicting Results of Social Science Experiments Using Large Language Models'
- Link: https://www.gsb.stanford.edu/faculty-research/publications/large-language-models-can-predict-results-social-science-experiments
- What was opened: Stanford GSB publication page; Nature page itself not opened.
- Finding as read: GPT-4 simulated survey responses predicted treatment effects of 70 preregistered US survey experiments with strong correlation to actual effects, comparable to human forecasters, but systematically overestimated effect sizes.
- Limits: Predicts experimental effects, not individual or event outcomes; preprint reported r=0.85 via search only.
- Safe use: Cite alongside Bisbee as mixed evidence on simulated respondents, noting the overestimation.
