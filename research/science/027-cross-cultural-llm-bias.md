# Cross-cultural and multilingual bias in LLM simulations

- Date: 2026-10-11
- Area: science
- Confidence: medium. The Western skew is replicated by many papers. The "native language vs English" results conflict across papers, and I could not open two PDFs or run more searches (search budget ran out).

## Answer

Every frontier LLM tested defaults to the values of a few rich, mostly English-speaking or Protestant European countries, and this is the main threat to a 100,000-agent world simulation. Prompting in the native language helps a little and unevenly. Naming the country in the prompt helps more but adds stereotypes. Neither fixes it. Real World should treat LLM-only agents outside the US and Western Europe as unvalidated, ground every country in survey microdata and data assimilation, and publish per-country scores so the gap is visible rather than hidden.

## Findings

**The skew is real and large.**
- GlobalOpinionQA (Anthropic, Durmus et al.) has 2,556 questions: 2,203 from Pew Global Attitudes and 353 from World Values Survey wave 7. Score is 1 minus Jensen-Shannon distance to each country's answer distribution. The tested model's default answers were closest to the USA, Canada, Australia and some European and South American countries. [arXiv HTML](https://arxiv.org/html/2306.16388v2)
- The dataset is on Hugging Face under CC BY-NC-SA 4.0. Non-commercial. The card warns the surveys were not designed to evaluate LLMs. [HF card](https://huggingface.co/datasets/Anthropic/llm_global_opinions)
- Tao et al. (PNAS Nexus 2024) tested five OpenAI models against the Integrated Values Surveys (107 countries analysed). GPT-4o was closest to Finland, Andorra and the Netherlands and farthest from Jordan, Libya and Ghana. [arXiv](https://arxiv.org/html/2311.14096v2)
- Liu et al. (AAAI) tested eight models on WVS wave 7 (66 countries). Models align well with a few countries and under-align with most. DeepSeek-R1 scored about 0.90 on the US and Chile and about 0.79 on Egypt and Myanmar. Models track the latest wave best and older waves worst. [arXiv](https://arxiv.org/html/2509.01418v2)
- Bulté and Rigouts Terryn (Computational Linguistics, June 2026) tested 10 models on 63 Hofstede and WVS items in 11 languages. All models, whatever their origin, behaved alike and stayed biased toward the Netherlands, Germany, the US and Japan. [ACL Anthology](https://aclanthology.org/2026.cl-2.2/)
- Alignment tuning makes it worse. After RLHF or DPO, every procedure moved GlobalOpinionQA agreement toward the US and away from Jordan, China and Nigeria. Bengali reading comprehension fell for every model, with only 71 Bengali examples in the Tülu SFT data. [arXiv HTML](https://arxiv.org/html/2402.15018)

**Native language vs English: mixed, and small.**
- Durmus et al. translated questions into Russian, Chinese and Turkish. Responses did not become closest to those speakers. For Russian they stayed nearer the USA, Canada and parts of Europe than Russia. [arXiv HTML](https://arxiv.org/html/2306.16388v2)
- Liu et al. found the opposite on average. Matching prompt language to the country helped in over 82% of 240 cases (3 baselines x 8 models x 10 countries). Gains were small: China 0.8124 to 0.8365, Germany 0.8408 to 0.8608. Some model-language pairs got worse (Aya-23 on Russian and Korean). [arXiv](https://arxiv.org/html/2509.01418v2)
- Bulté and Rigouts Terryn: explicit cultural framing beat prompt language, and combining both was no better than framing alone in English. [ACL Anthology](https://aclanthology.org/2026.cl-2.2/)
- Rystrøm et al. (Danish, Dutch, English, Portuguese): multilingual ability does not reliably give cultural alignment. Models showed US-centric bias in English and Portuguese. Peak alignment was only about 0.7. Self-consistency in non-English languages was below human test-retest (0.66 to 0.84), so part of the signal is noise. [arXiv HTML](https://arxiv.org/html/2502.16534v2)
- Atari et al. ("Which Humans?", 2023 preprint) attribute the WEIRD pattern to training data and human feedback, not just language. A Spanish-translation retest reportedly left results largely unchanged (secondary source only). [Harvard CID](https://www.hks.harvard.edu/centers/cid/publications/which-humans)

**Country prompting helps most, with failures.**
- Tao et al.: adding "born and living in country X" improved alignment for 71.0% (GPT-4o), 81.3% (GPT-4-turbo) and 77.6% (GPT-4) of countries. It failed or made things worse for 19 to 29%. Mean cultural distance for GPT-4o fell from 2.42 to 1.57. All prompts were English. [arXiv HTML](https://arxiv.org/html/2311.14096v2)
- Durmus et al. report the shifts can reflect stereotypes and overgeneralization.

**Outside the US, simulated respondents miss badly.**
- A Korean synthetic panel (about 8,000 personas per model, Gemini 3.5 Flash and EXAONE) had mean absolute error of 14 to 19 points against the Korea Media Panel Survey. Item-mean correlation was 0.70 to 0.91, so rankings are fine but levels are wrong. Calibrating on 30% real data cut error to about 4.5 points, but direct estimation from the real sample (3.6 points) was better. The authors: synthetic panels are diagnostic, not substitutes. [arXiv](https://arxiv.org/abs/2608.28615)
- Pew's own US test (30 Sep 2026): even the best model (Claude Opus 4.6) missed human benchmarks by 11.4 points on average. [Pew](https://www.pewresearch.org/data-labs/2026/09/30/methodology-silicon-samples.md) If that is the best case at home, other countries will be worse.

## What it means for Real World

- For the product: "whole world, not America only" is the claim most likely to be wrong in public. Show a per-country confidence tier on the globe (validated against local survey data, or not). Do not show a smooth, equally confident world.
- For the engineering: Native-language prompting is not a fix. Test it per country, because it hurt some model-language pairs. Language is also not a stand-in for culture (Portuguese covers Portugal and Brazil). Inject real microdata (IPUMS demographics, WVS and regional barometer answers) into each agent's prompt, and use data assimilation to correct level errors. Rankings across segments are more trustworthy than absolute levels (Korean result). Cost note, my inference and not sourced: non-English prompts usually cost more tokens, which matters against the $15 to $60 nightly budget.
- For the business: the moat is the per-country scorecard against real polls. GlobalOpinionQA is CC BY-NC-SA, so use it for internal evaluation only, not shipped in a commercial product. WVS and Pew terms need a separate check.

## Recommendations

1. Build a bias eval harness in week one. Load GlobalOpinionQA, compute 1 minus JS distance per country for our chosen model. Report the 66-country WVS-7 slice as the baseline. Internal use only (license).
2. Add a per-country "validated / unvalidated" flag to every forecast and the API response. Default unvalidated countries to wide ensemble spread.
3. Run one small A/B before launch on about 10 countries across regions (include Egypt, Nigeria, Indonesia, India, Brazil, Japan): English plain vs English with country framing vs native language vs both. Pick per country, not globally. Budget under $20.
4. Ground agents with real answers. Condition each agent on its census row plus a few real survey answers from its country, not a one-line persona. This beats framing alone.
5. Use assimilation as the correction layer. Score the first 7 days per country against WVS, Gallup and Pew where available, and shrink toward real estimates where error is above a threshold (Korean result: real data wins once you have a few hundred responses).
6. Publish the per-country Brier and level error on the receipts page, including bad ones. This is also the honest answer to "Western flattening".
7. Do not use a model-translated survey as ground truth. Use human-translated instruments only.

## Open questions

- Does Haiku 5.5 (our nightly model) show the same ranking of countries as the models studied? Nobody has published it. Answer by running Recommendation 1.
- Does the gap persist for free-text and multi-turn agent behaviour rather than multiple-choice survey answers? Tao et al. flag this as untested.
- Which of Liu et al. and Durmus et al. is right on prompt language? Likely differences in model, language and metric. We found no direct comparison. Test on our own model.
- I did not open the Computational Linguistics PDF body, the Pew country table, or the Atari paper itself, and found no verified study of variance collapse across many non-Western countries. A follow-up search is needed.

## Sources

- [Towards Measuring the Representation of Subjective Global Opinions in Language Models (Durmus et al.)](https://arxiv.org/html/2306.16388v2), accessed 2026-10-11
- [Anthropic/llm_global_opinions dataset card](https://huggingface.co/datasets/Anthropic/llm_global_opinions), accessed 2026-10-11
- [Cultural bias and cultural alignment of large language models (Tao et al.)](https://arxiv.org/html/2311.14096v2), accessed 2026-10-11
- [On the Alignment of Large Language Models with Global Human Opinion (Liu et al.)](https://arxiv.org/html/2509.01418v2), accessed 2026-10-11
- [LLMs and Cultural Values: Prompt Language and Explicit Cultural Framing (Bulté and Rigouts Terryn)](https://aclanthology.org/2026.cl-2.2/), accessed 2026-10-11
- [Multilingual != Multicultural (Rystrøm, Kirk, Hale)](https://arxiv.org/html/2502.16534v2), accessed 2026-10-11
- [Unintended Impacts of LLM Alignment on Global Representation](https://arxiv.org/html/2402.15018), accessed 2026-10-11
- [Which Humans? (Atari et al.), summary page](https://www.hks.harvard.edu/centers/cid/publications/which-humans), accessed 2026-10-11 (search result only, not opened)
- [Distributional Validity of a Korean Synthetic Persona Panel (Kim and Cho)](https://arxiv.org/abs/2608.28615), accessed 2026-10-11
- [Pew Research Center, silicon samples methodology (2026-09-30)](https://www.pewresearch.org/data-labs/2026/09/30/methodology-silicon-samples.md), accessed 2026-10-11
