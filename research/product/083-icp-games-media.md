# ICP deep dive: game studios and newsrooms

- Date: 2026-10-11
- Area: product
- Confidence: low. The web search budget was exhausted before any search ran, so this note rests on seven fetched primary pages. Budget numbers for games and media are not sourced and are marked as hypotheses.

## Answer

Newsrooms are a better first ICP than game studios, but neither will pay much. Media wants a shareable artifact (a "how would the world react" piece with a methods box), not an API. Games buy playtesting and QA tooling, not opinion simulation. The licensing finding matters more than the ICP finding: IPUMS International bans commercial use, which blocks the "census microdata" moat for any paid customer. Real World should sell to media as a free-to-embed, attributed product first, and treat games as a later API-only segment.

## Findings

**Competitors do not show these two segments as customers.**
- Simile's homepage announces a Series B of $200M at a $2B valuation. It names CVS Health, Gallup, Itau, Deloitte, Wealthfront, Suntory and Garnett Station Partners. No media or games customer is named. Pricing is not listed. [Simile](https://www.simile.com/)
- Aaru's homepage names two clients, EY (a wealth study) and Breakwater (an investor tracker). It lists use cases: product, marketing, segmentation, scenario planning, strategic communications. No media or games customer, no pricing, no funding figure on the page. [Aaru](https://aaru.com)
- Read bluntly: the two best-funded players sell to finance, health and consumer goods. If media or games were a proven market, they would show a logo. I could not confirm any such logo.

**Games buy bots that find bugs, not simulated publics.**
- modl.ai sells AI playtesting agents to QA teams. You upload a build, describe tasks in plain language, and the agents produce video, logs and severity-scored bug reports. It supports Android and desktop, with iOS in development. It names no customers or prices, only "Book a Demo". It says human testers are still better for tasks needing skill or intuition. [modl.ai](https://www.modl.ai)
- This is the nearest "agents in games" product and it does something different from Real World. A studio's pain is crashes, soft-locks and balance. Real World's pain point (how do 100,000 people react to an event) fits only a narrow slice: community sentiment around a patch, monetization change, or live-ops event, and in-game economy or world-event design.
- I could not fetch the GDC State of the Game Industry survey (404), so I have no sourced figure on studio AI adoption or budget. Do not quote one.

**Media has a trust problem with AI, and a real appetite for audience understanding.**
- Reuters Institute Digital News Report 2025: 7% of respondents use AI chatbots for news weekly (15% under 25). Audiences are sceptical of news made mainly by AI and accept AI better when journalists use it in a supporting role. Comfort with AI-made news was 44% in India and 11% in the UK. Respondents expect AI news to be less trustworthy (-18 net). The report warns publishers against using automation mainly to cut costs. [Reuters Institute DNR 2025](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary)
- Implication: a newsroom cannot publish "AI said 61% of Brazilians would be angry" as fact without damage. It can publish a forecast with an ensemble spread, a stated track record and a method box, and the human reporter stays the byline. This is a fit for Real World's hashed public track record, because it gives the editor something defensible.
- The global framing helps. The same report shows attitudes differ sharply by country, so a worldwide simulation has a story hook that US-only tools lack.

**Data licensing is the hard blocker.**
- IPUMS International terms: data may be used only for scholarly research and education. "Commercial use is strictly prohibited." No redistribution; each team member must be licensed. Users must not publish statistics that could reveal identities. [IPUMS International terms](https://international.ipums.org/international/terms.shtml)
- A paid API or a media license is commercial use. Agents "sampled from IPUMS" cannot be the basis of a paid product without written permission from IPUMS and the national statistical offices behind each file. I did not confirm whether any exception exists.
- GDELT is the opposite: "unlimited and unrestricted use for any academic, commercial, or governmental use", with a citation and link required on redistribution. GDELT 2.0 events and GKG update every 15 minutes and cover 65 live translated languages. [GDELT terms](https://www.gdeltproject.org/about.html), [GDELT data](https://www.gdeltproject.org/data.html)
- The news input side is therefore safe to sell. The population side is not, as currently planned.

**What I could not source.** Budgets: what a newsroom or a studio pays for audience research, polling or QA tools. Whether any newsroom runs paid "how would the world react" pieces regularly. Licensing terms of game-studio data sharing (player telemetry would be the real gold, and studios will not hand it over).

## What it means for Real World

- For the product: lead with a "reaction explainer" format for editors: one fork, one event, a 7-day ensemble, a chart with spread, a methods box, a receipts link. Give newsrooms an embeddable widget and a CSV, not just an API. For games, offer one narrow thing, such as a patch-reaction forecast by country, and do not build bug-finding or balance tools.
- For the engineering: add a provenance field on every agent and every output stating which data sources fed it, so a license-restricted source can be excluded from a commercial run. Build the publishing format for an embedded result (stable URL, hash, spread, citation) before any enterprise features. Keep GDELT citation text in every output.
- For the business: hypothesis only, not sourced: newsrooms pay little cash, so use them for credibility and distribution, and charge games and brands later. The YC story is stronger with three named newsrooms publishing receipts than with zero paying logos. Do not promise commercial output built on IPUMS until the license question is answered in writing.

## Recommendations

1. Email IPUMS (ipums@umn.edu) this week and ask in writing whether derived synthetic agents, not microdata, can power a commercial or publicly published product. Until the answer is yes, label the launch population build "research preview, non-commercial".
2. Plan a fallback population source that allows commercial use (national statistical office open data, DHS/Eurostat-type open files, WVS if its terms allow). Have an engineer check each license page and record the result in one table in the repo.
3. Pick 5 newsrooms with international desks or data teams and offer a free co-published piece before Oct 27, using one real event and the hashed forecast. Success is 2 published pieces with a link back.
4. Ship one embeddable "reaction card" (chart, spread, hash, methods link) as part of the web app. A PM can write the copy rules; an engineer can build it from the existing simulate output.
5. Treat games as a post-launch segment. Run 3 calls with live-ops or community leads at mid-size studios to test the patch-reaction use case before building anything.
6. Write a short method box that states what the simulation cannot do: not a poll, spread is not a confidence interval, Western flattening risk. Reuters shows audiences punish overclaiming.

## Open questions

- Do newsrooms or studios have a budget line for this? Find out through the 5 newsroom and 3 studio calls above, and ask what they pay for polling and playtest tools today.
- Does IPUMS, or any national statistical office behind IPUMS, license derived synthetic data for commercial use? Ask in writing.
- Are Aaru or Simile selling to media quietly? Their sites name none. A follow-up search is needed once the web search limit is raised; I could not run one.
- Will editors accept ensemble spread as a story element? Test with one pilot piece.

## Sources

- [Simile homepage](https://www.simile.com/), accessed 2026-10-11
- [Aaru homepage](https://aaru.com), accessed 2026-10-11
- [modl.ai homepage](https://www.modl.ai), accessed 2026-10-11
- [Reuters Institute Digital News Report 2025, executive summary](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary), accessed 2026-10-11
- [IPUMS International terms of use](https://international.ipums.org/international/terms.shtml), accessed 2026-10-11
- [GDELT terms of use](https://www.gdeltproject.org/about.html), accessed 2026-10-11
- [GDELT data products](https://www.gdeltproject.org/data.html), accessed 2026-10-11
