# E005: Native-language vs English agents on non-Western polls

- Registered: 2026-10-11
- Owner seat: CTO
- Rests on: [multilingual agents](../../research/engineering/073-multilingual-agents.md), [cross-cultural bias](../../research/science/027-cross-cultural-llm-bias.md), [calibration methods](../../research/science/019-calibration-methods.md), [global poll sources](../../research/data/054-global-poll-sources.md), [CPO lens](../../research/lenses/cpo.md)
- Claim it earns or kills: whether any agent runs in a language other than English. The default is English with an explicit country and persona line ([multilingual agents](../../research/engineering/073-multilingual-agents.md)). Runs after launch; native-language prompting is cut before Oct 27 ([CPO lens](../../research/lenses/cpo.md)).

## Hypothesis

In at least one of the ten countries below, agents prompted in the language of the country's survey instrument produce answer distributions closer to the observed post-cutoff survey marginals than agents prompted in English with country framing.

## Primary metric

Per country, mean paired Jensen-Shannon distance to the observed marginals, native-language arm minus English-with-country-framing arm, over that country's questions. Negative favours native language.

## Secondary metrics

- The two other arms, English plain and native language with country framing, against the same reference ([cross-cultural bias](../../research/science/027-cross-cultural-llm-bias.md)).
- Within-question spread across the five samples per agent-question.
- Input tokens per call by language ([multilingual agents](../../research/engineering/073-multilingual-agents.md)).

## Data

Countries, fixed now: Egypt, Nigeria, Indonesia, India, Brazil and Japan, named in [cross-cultural bias](../../research/science/027-cross-cultural-llm-bias.md), plus Turkey, South Korea, Kenya and Mexico, whose languages are in the token table planned in [multilingual agents](../../research/engineering/073-multilingual-agents.md). A country is eligible only if it has a human-translated survey instrument fielded after every model's training cutoff with published marginals; model-translated instruments are not ground truth ([cross-cultural bias](../../research/science/027-cross-cultural-llm-bias.md)). The prompt language is the language of that instrument; a country whose instrument is in English is ineligible. 50 questions per country, drawn before any model is run ([multilingual agents](../../research/engineering/073-multilingual-agents.md)). GlobalOpinionQA is non-commercial and is not used for any result here ([opinion benchmarks](../../research/science/020-opinion-benchmarks.md)). The repo stores links and computed metrics, not survey tables.

## Baseline

English with an explicit country and persona line, the planned default.

## Sample size and stopping rule

Ten countries, 50 questions each, four arms, five samples per agent-question ([multilingual agents](../../research/engineering/073-multilingual-agents.md)). At least six eligible countries are required; ineligible countries are listed and dropped before the run. Run once.

## Analysis plan

Per country, 95% interval for the primary metric by bootstrap over questions (10,000 resamples). The decision is per country, not global ([cross-cultural bias](../../research/science/027-cross-cultural-llm-bias.md)). Report every country and arm, including countries where native language is worse. Multiple comparisons: with up to ten countries, a country is switched only if its interval excludes zero at 99.5% (Bonferroni over ten).

## Kill criterion

Native-language prompting is enabled only in countries that pass. If none pass, every agent stays on English prompts, the `prompt_lang` field stays English, and no copy claims native-language agents.

## Cost cap

$40 of LLM spend; the notes estimate under $20 for this design ([multilingual agents](../../research/engineering/073-multilingual-agents.md), [cross-cultural bias](../../research/science/027-cross-cultural-llm-bias.md)). The run stops if the cost ledger cannot be read.

## Command

`make experiment ID=E005`
