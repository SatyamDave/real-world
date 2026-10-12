# Synthetic social networks at country scale

- Date: 2026-10-11
- Area: science
- Confidence: medium. The SCI papers and the LLM-network papers were opened and read. The SCI license terms, the 13-country contact dataset and GeoPops could not be opened (403, bot check, 404), and the search budget ran out, so those items are marked unverified.

## Answer

Do not generate a person-to-person graph for 100,000 agents from an LLM or from scratch. Build a layered graph from rules: household, school/work, neighbourhood and a long-range layer. Fit the long-range layer to the Facebook Social Connectedness Index (SCI) so ties decay with distance and respect borders. Use homophily by a few attributes with tunable strength. Use an LLM only to sanity-check small samples, because it overstates political homophily.

## Findings

**SCI is the best public geography prior, and it is a region-to-region matrix, not a graph.** The index is built from Facebook friendship links and gives the relative frequency of links between every pair of US counties, and between US counties and foreign countries ([Bailey et al., JEP 2018 abstract](https://www.aeaweb.org/articles?id=10.1257/jep.32.3.259)). In the US, 62.8% of an average county's friends live within 100 miles ([NBER w23608](https://www.nber.org/papers/w23608)). Connectedness predicts trade, migration and patent citations after controlling for distance. A later release covers national and subnational units across 178 countries, updated 25 January 2026, distributed on the Humanitarian Data Exchange, per the search summary of Johnston, Kuchler, Kulkarni and Stroebel. I could not open the HDX page (HTTP 403) or Meta's dataset page (title only), so the license, file size and exact resolution are unverified. A European companion paper reports that connectedness falls with distance and at country borders, and that old borders such as Austria-Hungary and East/West Germany still show up (search summary only; the PDF redirected to a Facebook CDN link and I did not fetch it).

**What SCI cannot do.** It carries no person-level attributes, no degree distribution and no tie strength. It reflects Facebook users, so coverage is weak where Facebook is weak (China, parts of Africa, older people in many countries). The scaling is relative, so absolute degree must come from elsewhere.

**Rule-based generators exist and are mostly US-shaped.**
- [SynthPops](https://github.com/InstituteforDiseaseModeling/synthpops): MIT license, 50 stars, 48 forks, and the README says it is no longer actively maintained. It builds households, schools, workplaces and long-term care layers. Supported data: Seattle area and three Washington counties, Dakar Region, plus national-scale data for Zimbabwe, Malawi and Nepal. Population files are not in the pip package. Treat it as a design reference, not a dependency.
- GeoPops, per a search summary only: open source, US Census based, assigns homes, schools and workplaces, and wires contacts inside each place with stochastic block models to get assortative mixing. I could not load the repo to confirm license or maintenance.
- A 13-country synthetic contact dataset (household, school, workplace, community layers, validated against census on six metrics) exists in PMC12813305. The article page was blocked by a bot check. Countries, license and size are unverified. Worth a direct look because it is the nearest thing to ready-made multi-country data.
- [Mistry et al. 2020](https://arxiv.org/abs/2003.01214): age-structured contact matrices by setting for 277 subnational regions covering about 3.5 billion people. These are matrices, not graphs, but they give the mixing rates the household, school and work layers should hit.

**LLM-generated networks: good shape, wrong homophily.**
- [Chang et al., arXiv 2408.16629](https://arxiv.org/html/2408.16629v2): 50 personas per network, 30 networks per method. Asking the LLM for the whole graph at once ("global") gives too little density, clustering and connectivity and no long tail. Asking per persona ("local") or per persona with the graph so far shown ("sequential") is far better. Sequential averaged a Kolmogorov-Smirnov distance of 0.330 to real networks against 0.499 for the best classical model (small-world). Generated networks varied less than real ones.
- The same paper: political affiliation dominated friend choice, cited in 86.7% of the model's reasons. Cross-group ratio was 0.180 (local) and 0.340 (sequential) against 0.528 on Twitter. Polarization was 0.639 and 0.515 against 0.33 to 0.42. The effect held across six models, including Llama 3.1 and Gemma 2. The authors note it is US-focused and that prompts list all personas, which limits scale.
- [Papachristou and Yuan, PNAS Nexus 2025](https://arxiv.org/abs/2402.10659): LLM link choices show preferential attachment, triadic closure and homophily. Models favour homophily in friendship networks and heterophily in organizations.

**Cost reality.** The per-persona prompts need the whole persona list, so 100,000 agents cannot be wired by LLM calls without sampling tricks. The subsampling extension at 300 personas lowered density and clustering, which is the wrong direction.

## What it means for Real World

- For the product: "ask why" on an agent needs a visible neighbourhood: household, workplace or school, a few friends, with the reason each tie exists. A rule-built layered graph gives that for free. Show cross-border ties on the globe from SCI, which is a striking and honest visual.
- For the engineering: one graph builder, deterministic from a seed, run offline and stored. Layers are edge lists keyed by agent id. The long-range layer samples partners by country and region with probability proportional to SCI and a distance kernel, then by attribute similarity. Do not rebuild nightly.
- For the business: SCI as a named calibration source helps the "not Western-flattened" story, but the license is unconfirmed and Facebook coverage is uneven, so the claim must be worded carefully. Do not claim empirically validated network structure outside the US.

## Recommendations

1. Build a four-layer graph: household (from census household size and age), school or workplace (cohort size from census), neighbourhood (same small region), long-range (SCI-weighted). Keep it under about 500 lines of Python. One owner: an engineer. PM sign-off: the list of layers and what each means in the UI.
2. Confirm the SCI license and download the 178-country file from HDX by hand (the fetch was blocked). Record the license in the repo before any redistribution of derived data.
3. Parameterize homophily per attribute (age, education, religion, language, a political-leaning score) in one config file, defaults mild, and report the realized assortativity for each country in a JSON next to the graph.
4. Check degree against a heavy-tailed target (mean about 100 to 150 weak ties, long tail) with a KS distance test, the same metric Chang et al. use. Fail the build if it drifts.
5. Run a one-off LLM audit: 300 personas, local method, compare political cross-group ratio to the rule graph. Use it to catch implausible ties, never as the generator.
6. Read PMC12813305 and the GeoPops repo directly before writing the builder. Borrow the school and workplace sizing, skip the dependency.

## Open questions

- SCI license and redistribution terms for the 2026 release. Fix: read the HDX page in a browser.
- Whether SCI at subnational level covers low-Facebook countries well enough. Fix: count empty or tiny cells per country in the file.
- How much homophily by attribute is real outside the US. Fix: World Values Survey questions on trust and friends, plus the European SCI paper's findings.
- Whether the 13-country dataset is usable as a seed. Fix: open the paper and its data repository.
- Whether a dense contact graph changes ensemble forecasts at all. Fix: run the same event with the graph shuffled and compare spread.

## Sources

- [Social Connectedness: Measurement, Determinants, and Effects (JEP abstract)](https://www.aeaweb.org/articles?id=10.1257/jep.32.3.259), accessed 2026-10-11
- [Measuring Social Connectedness, NBER w23608](https://www.nber.org/papers/w23608), accessed 2026-10-11
- [LLMs Generate Structurally Realistic Social Networks, arXiv 2408.16629](https://arxiv.org/html/2408.16629v2), accessed 2026-10-11 (first 100,000 of 166,863 characters read)
- [Network Formation and Dynamics Among Multi-LLMs, arXiv 2402.10659](https://arxiv.org/abs/2402.10659), accessed 2026-10-11
- [SynthPops repository](https://github.com/InstituteforDiseaseModeling/synthpops), accessed 2026-10-11
- [Inferring high-resolution human mixing patterns, arXiv 2003.01214](https://arxiv.org/abs/2003.01214), accessed 2026-10-11 (abstract only)
- [13-country synthetic contact datasets, PMC12813305](https://pmc.ncbi.nlm.nih.gov/articles/PMC12813305/), not opened (bot check); cited from search summary
- [The Determinants of Social Connectedness in Europe](https://research.facebook.com/file/324755526109107/The-Determinants-of-Social-Connectedness-in-Europe.pdf), not opened; cited from search summary
