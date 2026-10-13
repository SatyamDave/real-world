# Home and simulator

## What it does

Every page has a top bar with "Real World." (to `/`), Simulate `/simulate`, Your tests `/record`, "How it works" `/how-it-works` and "Public record" (to `/receipts`), and the account (email, linking `/record`, or "Sign in"). There is no ledger tape, no "Call it" page or link, no Event tab and no country selectors ([decision 0016](../research/decisions/0016-icp-audiences.md)). At 720 px and below the pages move to a second row that scrolls sideways inside itself.

**Home** (`/`, title "Message test · Real World"). The first screen says who it is for and what to do, before anything technical:

- "Test your message on simulated consumers before you ship it.", then "Paste a launch message, a price change or a headline. Real World simulates how your ideal consumer reacts: who ignores it, who likes it, who shares it, and what simulated people say about it. Every result is AI-simulated."
- "Your message" and "Test my message": a plain form that opens `/simulate?text=<message>` with no script. The product line and ideal customer are asked on the simulator.
- "Free while in beta. Enterprise on request." and "Not sure how it works? Read how it works. The engine's own forecasts are scored in the Public record."
- Beside the form, a labelled example result ("Example numbers, not a real test.").
- "Start from a real decision": the use cases in `web/src/usecases.ts`, one consumer founder each (consumer app, e-commerce and DTC and more), each with a product line, an ideal customer and a message. Each opens the simulator filled in.

**How it works** (`/how-it-works`, title "How it works"): "The results are AI-simulated. They are not real customers, and the engine is not calibrated yet. Read a result as a signal to check, not a forecast to trust."; five steps (describe your idea, ideal consumer and message; the engine simulates many AI consumers across 27 segments with Jev; every test also runs a plain baseline; backtest on messages you already shipped; mark your real results, which cannot be changed afterwards); "The engine also forecasts real events every day and seals each forecast before the outcome, scored in public. See the Public record."; "Free while in beta. Enterprise on request."; and where data lives: "Signed in, your sealed tests and marks are stored on our server; signed out, nothing is stored." linking [privacy](privacy.md).

**Simulator** (`/simulate`, title "Simulate · Real World"): "Test a message on simulated consumers." One panel holds the message (up to 500 characters, "{n} of 500 characters"), "What are you building?", "Your ideal customer" and "Your gut, before you see the result" ("It lands" or "It flops"). `?use=<id>` fills the panel from a use case; `?text=` fills the message. Below the panel, "Backtest on messages you already published" takes up to 10 past messages, each with how it did. The result is a slip specified in [message test](will-it-land.md); the backtest result is stamped "Backtest: not on your record".

States, written out: "Asking 27 segments" while a test runs; a refusal shows the API's `detail` sentence as sent; "Could not test the message. The server did not respond."

## Who it is for

Consumer founders deciding what to say before they ship ([decision 0016](../research/decisions/0016-icp-audiences.md), [product/108](../research/product/108-consumer-wedge.md)).

## How we know it works

- The home asks for the message and links every use case; the simulator asks for the product line and ideal customer. Tests in `web/src/App.test.tsx` and `web/src/usecases.test.ts`.
- The top bar lists its pages and marks the current one, with no tape.
- `?use=` and `?text=` fill the simulator; `/playground` shows "Page not found".
- Message tests call the test endpoint and the backtest calls its own endpoint; neither starts a fork.
- Measured after launch: share of simulator runs that start from a use case or the home message box ([0016](../research/decisions/0016-icp-audiences.md)).

## What it is not

- No Event tab, no country or age selectors, no population lists and no ledger tape.
- No "Call it" page; the daily question is an API of the public record ([daily question](daily-question.md)).
- No API keys page and no code editor: inputs are form fields, not JSON.
- No sidebar, no lessons, no primitive cards ([0014](../research/decisions/0014-ledger-desk.md) is superseded where it conflicts).

## Where the code lives

- `web/src/App.tsx`, `web/src/Home.tsx`, `web/src/pages/simulate.tsx`, `web/src/usecases.ts`, `web/src/results.tsx`.
- Decisions: [0016](../research/decisions/0016-icp-audiences.md), [0014](../research/decisions/0014-ledger-desk.md), [0013](../research/decisions/0013-console-and-playground.md).
