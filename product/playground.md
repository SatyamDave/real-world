# Home and simulator

## What it does

Every page sits under the ledger desk ([decision 0014](../research/decisions/0014-ledger-desk.md)): a top bar with "Real World." (to `/`), the pages Simulate `/simulate`, Call it `/call`, Your record `/record`, Receipts `/receipts` and Scores `/scores` (the current one underlined), and the account (email, linking `/record`, or "Sign in"). Under it the ledger tape, one mono line from `GET /v1/status`: "Last cycle {date} {status} · latest receipt {hash} · anchor: {state} · model: {model} · spend today ${spent} of ${budget}". While it loads: "Loading system status"; if it fails: "Could not load system status. The server did not respond." with "Try again". At 720 px and below the pages move to a second row that scrolls sideways inside itself.

**Home** (`/`, title "Will this land? · Real World"):

The first screen says who it is for, what it simulates and what to do, before anything technical (founder direction, 2026-10-12):

- "See how people react before you post.", then "For creators, small brands, founders and anyone about to post something that matters." and "Paste a post. Real World simulates how audiences in 16 countries, by age and education, react to it: who scrolls past, who reads it, who likes it and who shares it, with two simulated accounts in their own words. Every result is AI-simulated."
- "Your post", a box with the placeholder "Paste a tweet, a caption, a headline or a hook", and "Test my post". The box is a plain form: it opens `/simulate?text=<post>` with no script.
- "Or play today's question against the AI." linking `/call`, then three steps: "1 Paste your post", "2 Pick who sees it", "3 See who reacts, and what they say".
- Beside it at 1024px and up (under it below): "Example result" with the stamp "Example": a fixed post, "41%" of this audience would like or share it, the reaction mix, the most and least likely audience, and "Example numbers, not a real test." These numbers are illustrative and labelled so.
- "Made for": four cards, Creators, Small brands, Founders, Newsrooms, each one line opening its use case on `/simulate?use=<id>`.
- Then, left: "Today's question" (the question from `GET /v1/daily`, the AI's seal row "The AI's call is sealed" with "{leaf hash 12} · day record {date}", and "Make your call" to `/call`; on 404 "No question today. The next one opens tomorrow.") and "Sealed before the outcome" (below). Right: "Today's simulated populations": "World of {date}. The simulated share leaning yes on one belief, by country.", a "Belief" select (every topic, "Inflation worry" first chosen), and one row per country: ISO code, name, coverage tier, a bar and the share. Under the rows, the day record's seal grid with "Day record {date} · root {first 8}…{last 8} · {anchored | anchor pending | not anchored}." and "Check it on Receipts" (to `/receipts#{date}`); with no record yet, an empty grid and "No day record yet". Then the disclosure with every country's tier. States: "Loading today's populations"; "Could not load today's populations. …" with "Try again".
- "Start from a real decision": "Each one opens the simulator filled in. Change anything before you run it." and every use case in `web/src/usecases.ts`, grouped under Creators, Founders and marketers, Newsrooms, Policy and public affairs, Curious people. Each row shows a kind tag ("Post test", "Event" or "Call it"), the title, one sentence and the audience in plain words. "Today's question" opens `/call`; every other row opens `/simulate?use=<id>`.
- "Sealed before the outcome", under Today's question: "The AI's daily calls are hashed before the outcome and scored in public, misses included. Your sealed tests are scored against your own gut." with links Receipts, Scores, Your record.
- On the home the ledger tape sits after the page content, above the footer.

**Simulator** (`/simulate`, title "Simulate · Real World"): "Simulate", "Run a post or one event on today's simulated populations. Every result is AI-simulated and shows its coverage tier." Tabs "Test a post" (Reaction) and "Test an event" (Event, with "See how beliefs in 16 countries shift after one event." under the tabs), and a link "Call today's question" to `/call`. One panel holds the text ("Post" or "Event", up to 500 characters, "{n} of 500 characters"), the audience (one country or "Every simulated country"; a use case can name several, shown with "Change"), age bands for a post, "Your gut, before you see the result" ("It lands" or "It flops") for a post, "Simulated days" (1 to 14) for a fork, and "Test it" or "Test the event"; under it "World of {date} · {n} simulated populations", and for a post the retrospective check "Check it on posts you already published". `?use=<id>` fills the panel from that use case; with no `?use=`, `?text=` fills the post (trimmed, at most 500 characters). Before a run, "Start from a real decision" lists the use cases of the chosen kind; choosing one fills the panel and sets the address to `/simulate?use=<id>`. `/playground` shows "Page not found".

The result is a slip below the panel:

- Post test: "Post test" and the stamp "Sealed" or "Not sealed"; the post quoted; the landing chance as a large number with "landing chance: the share of this audience who would like or share it" and "{p10} to {p90} across {n} audiences (p10 to p90). Uncalibrated until 100 marked tests."; "The audience, one dot per 1%": 100 dots split by population weight, filled where that segment would like or share it, with "Filled dots would like or share it: {n} of 100. Weighted by population.", where {n} always equals the headline percentage (the headline's dots are spread across segments by population times landing chance, none above its segment's dots); "Reaction mix" as one stacked bar, with a legend row under it at 720px and below; the table "Landing chance by country, age band and education. {n} segments asked, each country's most populous first; – means not asked." (a row per country with its tier, and only the age band and education columns some segment was asked in); "Most likely to like or share it" and "Least likely" with tiers, each label starting upper case; "Two simulated accounts"; "One rewrite to test" with "Test this version"; then the seal: when sealed, the seal grid, "Sealed {YYYY-MM-DD HH:MM} UTC", the full hash in four groups and "Mark it in your record once you know how it did"; signed out, an empty grid and "Not sealed. Sign in to seal this test and keep your record." with "Sign in". Then "Copy result", which copies one line ("\"{post, up to 80 characters}\" lands with {n}% of a simulated audience in {k} countries. AI-simulated, coverage {tiers}. Sealed {date} · {hash 12}" or "Not sealed", then the `/simulate` address) and shows "Copied" for 2 seconds, or "Copy failed: select the text below" with the text. Last, model calls and cost, and the disclosure with tiers.
- Event: "Event · {days} simulated days from the world of {date}" and the stamp "Counterfactual: not scored"; the event quoted; the largest move as a large number; "Beliefs before and after" with "Median after {days} days, with p10 to p90 across {members} members. Tick: before." and a row per topic, largest move first: a track with the p10-p90 band, a tick at before, a dot at the median and "{before} → {after} ({pts}) · p10–p90 {p10}–{p90}"; the largest move day by day; "Largest segment shifts" with agent counts and tiers; members, agents, days and cost; the disclosure with tiers.

States, written out: "Running the simulation" while it runs; a refusal shows the API's `detail` sentence as sent; "Could not run the simulation. The server did not respond."

## Who it is for

Anyone deciding something that depends on how people react: a post, an announcement, a price, a policy, a headline ([product/108](../research/product/108-consumer-wedge.md)).

## How we know it works

- The home asks the post question, lists every country of today's world and links every use case. Test: `App.test.tsx` "the home asks the post question, lists today's populations and links every use case".
- The top bar lists the five pages and marks the current one; the tape is the status line. Tests: "the top bar lists the pages, marks the active one, and offers sign-in", "the ledger tape is one literal line from GET /v1/status, and the footer has none".
- `?use=` and `?text=` fill the simulator. Tests: "a use case opens the simulator filled in", "?text= starts the simulator with that post"; `/playground` is not a page: "/playground is not a page".
- The post slip draws 100 dots, a row per country in the table and the seal grid. Tests: "the reaction slip draws 100 dots and a segment matrix", "a signed-in test shows its seal and the retrospective check is labelled".
- Reaction runs call `POST /v1/tests`; Event runs call `POST /v1/simulate` and wait on the job through the SDK, with its caps and refusals unchanged ([simulate API](simulate-api.md)). Test: "an event run draws every topic and says it is not scored".
- Measured after launch: share of simulator runs that start from a use case or the home post box ([0014](../research/decisions/0014-ledger-desk.md)).

## What it is not

- No API keys page and no code editor: inputs are form fields, not JSON.
- No Event result is sealed or scored: a fork has no real outcome.
- No sidebar, no lessons, no primitive cards ([0014](../research/decisions/0014-ledger-desk.md)).

## Where the code lives

- `web/src/App.tsx` (top bar, tape, `SealGrid`), `web/src/Home.tsx` (home and `UseCaseList`), `web/src/pages/simulate.tsx`, `web/src/usecases.ts`, `web/src/results.tsx`.
- Decision: [0014](../research/decisions/0014-ledger-desk.md), superseding [0013](../research/decisions/0013-console-and-playground.md).
