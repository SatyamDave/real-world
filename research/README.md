# Research

**Start here:** read [`SYNTHESIS.md`](SYNTHESIS.md) for the one-page answer and the index of every note, then [`lenses/`](lenses/) for the plan reviewed from each seat.

This folder is the heart of the company. Every product and engineering decision traces back to a note here.

## Layout

| Folder | What goes in it |
| --- | --- |
| `market/` | Competitors, customers, pricing, market size, launch playbooks |
| `science/` | Papers and methods: simulated respondents, forecasting, data assimilation, population synthesis |
| `open-source/` | Repos we could use or learn from, with license, maturity and fit |
| `data/` | Data sources: what they contain, how to get them, license and cost |
| `engineering/` | Architecture, infrastructure, cost and tooling options |
| `product/` | Product mechanics, users, growth loops |
| `business/` | Unit economics, fundraising, regulation, moat |
| `lenses/` | Reviews of the whole plan from one seat each: CEO, CTO, CPO, CRO, CFO, VC, red team |
| `decisions/` | Decision records. One file per decision, numbered, never rewritten after it is accepted; a later decision supersedes it instead |

`SYNTHESIS.md` at this level is the current one-page answer: what we are building, why, and what the research says about it.

## Writing a note

Copy [`_TEMPLATE.md`](_TEMPLATE.md). Rules:

1. Lead with the answer. The first paragraph says what you found and what we should do about it.
2. Cite every fact with a link to the page you actually opened. A search snippet is not a source.
3. Date the note. Research goes stale; the date tells the reader how much to trust it.
4. Say how sure you are and why.
5. End with what it means for Real World, in concrete terms a PM and an engineer can both act on.

## Writing a decision

Copy [`decisions/_TEMPLATE.md`](decisions/_TEMPLATE.md). A decision names the options considered, the one chosen, the research notes it rests on, and what would make us revisit it.
