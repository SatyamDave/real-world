# Running agents in their own language

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. The cost side is solid (price page, tokenizer papers). The quality side rests on older GPT-3.5/GPT-4-era papers and two Claude-specific tables; nobody has published a native-vs-English test on Haiku 5.5 for opinion simulation. Web search quota ran out mid-session, so coverage is narrower than planned and every cited page was opened directly.

## Answer

Default to English prompts with an explicit country/persona line ("cultural prompting"). Do not run agents in their native language by default. The evidence says native-language prompting does not reliably improve opinion simulation, it costs more tokens for non-Latin scripts, and Claude is weaker in low-resource languages. Treat native language as an A/B arm we measure on a small panel, and translate news to English once, centrally, instead of per agent.

## Findings

**Cost.**
- Haiku 5.5 is $0.10 per million input tokens and $0.50 per million output tokens for prompts up to 100k tokens. The Batch API takes 50% off both. Cache hits are $0.01 per million. ([Anthropic pricing](https://platform.claude.com/docs/en/docs/about-claude/pricing))
- Anthropic says Claude 4.7 and later models use a newer tokenizer that makes about 30% more tokens for the same text. Language-specific counts are not published there.
- Token cost differs sharply by language. Ahia et al. measured the GPT-3.5 tokenizer on 22 languages and found up to about 5x more tokens than Latin-script languages for Telugu and Georgian, and close to a 5x cost increase for most mid-resource Indic languages. Cyrillic and Japanese came close to Latin. ([Ahia et al. 2023](https://arxiv.org/abs/2305.13707))
- Petrov et al. report differences of up to 15x in token count for the same text across languages. ([Petrov et al., NeurIPS 2023](https://arxiv.org/abs/2305.15425))
- Caveat: these are GPT tokenizers. We have not measured Claude's tokenizer on our own text. That is a one-hour job with the token-counting endpoint.

**Task quality in non-English.**
- Anthropic's table (MMLU translated by humans, zero-shot CoT, relative to English) puts Haiku 4.5 at 96.4% for Spanish, 94.2% Chinese, 92.4% Hindi, 90.4% Bengali, 78.3% Swahili and 52.7% Yoruba. Sonnet 4.5 is better on every row. The table covers Haiku 4.5, not 5.5. ([Anthropic multilingual docs](https://platform.claude.com/docs/en/build-with-claude/multilingual-support))
- Models partly "think" in English internally. In Llama-2, middle layers decode the English token before the prompt-language token. ([Wendler et al. 2024](https://arxiv.org/abs/2402.10588))
- "Self-translate" (the model translates the input to English first, then answers) beat direct inference on five tasks. ([Etxaniz et al. 2023](https://arxiv.org/abs/2308.01223))

**Cultural and opinion alignment, which is what we care about.**
- Default model values look like English-speaking and Protestant European countries across five OpenAI models. Cultural prompting improved alignment for 71-81% of countries on GPT-4, GPT-4-turbo and GPT-4o. ([Tao et al., PNAS Nexus 2024](https://arxiv.org/abs/2311.14096))
- On GlobalOpinionQA, asking the model to take a country's view shifts answers toward that population but can produce stereotypes. Translating the questions into the target language did not reliably make answers closer to that language's speakers. ([Durmus et al. 2023](https://arxiv.org/abs/2306.16388))
- Counter-evidence: AlKhamissi et al. found models align better with Egypt when prompted in Arabic, and better still with Anthropological Prompting. That is two countries and two languages only. ([ACL 2024](https://arxiv.org/abs/2402.13231))
- Kwok et al. simulated 7,286 participants from 15 countries with GPT-3.5. Giving the country helped. Prompting in the native language lowered overall alignment, and some languages hurt more. ([COLM 2024](https://arxiv.org/abs/2408.06929))
- Asking in a non-English language does not reliably remove English-culture answers. GPT-4 was the most affected of the models tested. ([Wang et al. 2023](https://arxiv.org/abs/2310.12481))

Read together: the evidence is mixed and leans against native language as a fix. The one positive result (Arabic) is narrow. Country and persona context is the lever that repeatedly works.

**News translation.**
- GDELT 2.0 covers 65 live-translated languages, updates every 15 minutes, and is free and open. GDELT 1.0 does not include the translated languages. ([GDELT data page](https://www.gdeltproject.org/data.html))
- NLLB-200 translates directly between 200+ languages, with models from 600M to 54.5B parameters. Weights are CC-BY-NC 4.0, so they are not usable in a commercial product; code is MIT. ([fairseq NLLB branch](https://github.com/facebookresearch/fairseq/tree/nllb))

## What it means for Real World

- For the product: "Western flattening" will not be fixed by switching the prompt language. It needs persona grounding (country, age, religion, income from census and survey data) and a measured check against survey answers per country. We should show per-country accuracy on the receipts page, so weak regions are visible instead of hidden.
- For the engineering: use one English prompt template with a rendered persona block. Keep a `prompt_lang` field per agent so a native-language arm can be switched on per country without code changes. News goes through a single shared step: take GDELT's translated text, summarize once into English per event cluster, and give agents the same English digest plus a short local-flavor line. Do not translate news per agent.
- For the business: cost is the real constraint. My arithmetic, assuming 1,500 input and 150 output tokens per agent per night, 100,000 agents: about $22.50 standard, about $11 on batch, all English. If 60% of agents were in non-Latin scripts at an assumed 2.5x tokens, the bill would be about $43 standard, about $21 batch. Those multipliers are assumptions, not Claude measurements. Cached shared prefix (system prompt, news digest) at $0.01 per million cuts the input side further. Native-language for everyone is roughly double the cost for no proven quality gain.

## Recommendations

1. Ship English prompt plus persona block for all ~100k agents. Say "answer as this person would" and include country explicitly.
2. Measure Claude's token counts for the same 300-word prompt in 15 languages (hi, bn, ar, zh, ja, ko, ru, sw, yo, am, te, es, de, tr, id) via the token-counting endpoint. Put the table in the repo. Half a day.
3. Build a small A/B: 10 countries, 50 questions drawn from WVS or GlobalOpinionQA, three arms (English, English plus cultural prompt, native language). Score against real survey marginals with Jensen-Shannon distance, 5 samples per agent-question to see variance. Run on Haiku 5.5, batch. Likely under $20.
4. Translate news once per event cluster to English on the nightly batch, store the English digest and the source-language headline together so a trace can show both. Use an LLM (Haiku 5.5 or similar) for translation, not NLLB weights, because of the non-commercial license.
5. Gate native-language arms by country on the A/B result and by the Anthropic language table. Default off for Swahili, Yoruba, Amharic and similar, where the model is weakest.
6. Add `prompt_lang` and `news_lang_original` to the agent trace schema so the receipts page can say which language an agent was run in.

## Open questions

- Does Haiku 5.5 behave like the GPT-3.5/GPT-4 results in these papers? Only recommendation 3 answers this.
- How much does Claude's tokenizer inflate Indic, Arabic and CJK text? Recommendation 2.
- How good is LLM translation of news for low-resource languages versus GDELT's own translation, in terms of lost sentiment and named entities? Needs a 100-article human check in 5 languages.
- Do native-language prompts raise variance (less collapse) even when mean accuracy does not improve? None of the cited papers test this; our A/B should log variance.
- Search budget ran out, so I did not look for 2025-2026 papers on native-language persona simulation or WVS-based language effects. A follow-up search is worth doing.

## Sources

- [Anthropic pricing](https://platform.claude.com/docs/en/docs/about-claude/pricing), accessed 2026-10-11
- [Anthropic multilingual support](https://platform.claude.com/docs/en/build-with-claude/multilingual-support), accessed 2026-10-11
- [Do All Languages Cost the Same? (Ahia et al., 2023)](https://arxiv.org/abs/2305.13707), accessed 2026-10-11
- [Language Model Tokenizers Introduce Unfairness Between Languages (Petrov et al., 2023)](https://arxiv.org/abs/2305.15425), accessed 2026-10-11
- [Do Llamas Work in English? (Wendler et al., 2024)](https://arxiv.org/abs/2402.10588), accessed 2026-10-11
- [Do Multilingual Language Models Think Better in English? (Etxaniz et al., 2023)](https://arxiv.org/abs/2308.01223), accessed 2026-10-11
- [Cultural Bias and Cultural Alignment of LLMs (Tao et al., 2024)](https://arxiv.org/abs/2311.14096), accessed 2026-10-11
- [Towards Measuring the Representation of Subjective Global Opinions (Durmus et al., 2023)](https://arxiv.org/abs/2306.16388), accessed 2026-10-11
- [Investigating Cultural Alignment of LLMs (AlKhamissi et al., 2024)](https://arxiv.org/abs/2402.13231), accessed 2026-10-11
- [Evaluating Cultural Adaptability via Synthetic Personas (Kwok et al., 2024)](https://arxiv.org/abs/2408.06929), accessed 2026-10-11
- [Not All Countries Celebrate Thanksgiving (Wang et al., 2023)](https://arxiv.org/abs/2310.12481), accessed 2026-10-11
- [GDELT data page](https://www.gdeltproject.org/data.html), accessed 2026-10-11
- [NLLB-200 in fairseq](https://github.com/facebookresearch/fairseq/tree/nllb), accessed 2026-10-11
