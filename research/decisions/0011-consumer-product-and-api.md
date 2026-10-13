# 0011: Real World is a consumer product with free accounts and a self-serve API

- Date: 2026-10-12
- Status: superseded by 0012
- Rests on: [CPO lens](../lenses/cpo.md), [CEO lens](../lenses/ceo.md), [CFO lens](../lenses/cfo.md), [CRO lens](../lenses/cro.md), [VC lens](../lenses/vc.md), [product/077-daily-question-mechanics](../product/077-daily-question-mechanics.md), [product/078-api-launch-playbooks](../product/078-api-launch-playbooks.md), [product/081-icp-policy-research](../product/081-icp-policy-research.md), [product/083-icp-games-media](../product/083-icp-games-media.md), [product/087-trust-and-explainability](../product/087-trust-and-explainability.md), [engineering/106-sign-in-methods](../engineering/106-sign-in-methods.md), [business/089-unit-economics](../business/089-unit-economics.md), [0006-engine-visible-surfaces](0006-engine-visible-surfaces.md)

## Decision

The founder decided that the app stops reading as a landing page plus a demo and becomes a product people return to, plus a self-serve developer API. A signed-in person gets four things: forks as the core action (type "What if …", get the simulated reaction by country and segment with its receipt-style card, saved to their account with a share link and a history), a personal daily briefing (how simulated opinion moved overnight on the countries and topics they chose, with the questions on those topics first), a personal track record (their Brier on daily questions against the simulation's on the same questions) and a developer area (self-serve API keys with a daily dollar cap per key, usage and docs). Accounts are free, with no paid plan, billing, teams or workspaces; this settles item 8 of [decisions-needed](../../company/decisions-needed.md) (no Pro plan and no paid credits at launch). A 3-4 step onboarding asks what they use it for, their countries, their topics and optionally their own country; it can be skipped, is editable in settings, and drives the home order, the briefing, the suggested forks and the default country in every view. Browsing stays open with no sign-in: today's question, receipts, world, cycle, scores, research and question pages, and shared fork links. Signing in is needed to save forks, to start forks beyond the anonymous allowance, to keep a track record and to get API keys. Every fork a signed-in person starts is checked against a per-person daily count, the per-fork cost clamp and the day's fork budget in `engine/rw/settings.py`, and is refused when any of them cannot be read. The existing seven surfaces of [0006](0006-engine-visible-surfaces.md) stay as the public proof layer, linked from the product. The word stays "fork" ([glossary](../../product/glossary.md) bans "what-if" as a synonym); the input's placeholder reads "What if …". Sign-in is an email link with a code, per [106](../engineering/106-sign-in-methods.md); the specs are [accounts](../../product/accounts.md), onboarding (spec retired by [0012](0012-will-it-land-and-call-it.md)), home and briefing (spec retired by [0012](0012-will-it-land-and-call-it.md)), forks (spec retired by [0012](0012-will-it-land-and-call-it.md)), [track record](../../product/track-record.md), developer (spec retired by [0012](0012-will-it-land-and-call-it.md)) and the surface map in [web-app](../../product/web-app.md).

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Keep the 0006 app: open proof surfaces, a fork box, no accounts | Already built; matches the lens launch scope of four surfaces | The founder's reading: it is a demo. The only return reason is the streak, kept in one browser; the CPO lens's own day-7 return metric has nothing else to lift it |
| Consumer product with free accounts plus a self-serve API (chosen) | One repeat loop for each journey: forks for the analyst, briefing and track record for the daily visitor, keys for the developer. Free accounts make the per-person fork cap the lenses asked for possible. The record stays open, so the trust argument of 087 holds | Six more specs and seven build slices in 15 days to launch; a privacy notice and an email provider before launch; more surface for the red team |
| API-first developer console; consumer side stays a demo | Matches the CRO and VC view that money comes from builders and pilots | Ignores the founder's consumer ruling; the daily-question panel, the one data asset that compounds ([VC lens](../lenses/vc.md)), gets no account to hang on |
| Full SaaS: teams, workspaces, Pro plan, billing | Looks like the reference products | Every lens cut it (CPO: teams, seats, Pro; CRO: seats and tiers; VC: subscription tiers; CFO: no subscription at launch); no usage data to price from ([business/089](../business/089-unit-economics.md)) |
| Everything behind sign-in | Simplest auth model; every fork is attributable | Fails Gate 4 ("The daily page works with no sign-up"); CRO: the record "stop[s] working behind a login"; CPO: visitors leave at a signup wall |

## Why this one

- The founder made the call and named the reference feel (Perplexity, Jev at [market/004](../market/004-jev-typesafe.md)): calm, precise, not gamified. That excludes leagues, badges and notifications, which the CPO lens also cut.
- It keeps the evidence intact. Trust comes from a public, unbackfillable record and honest uncertainty, not from the interface ([087](../product/087-trust-and-explainability.md)); the receipts, scores and cycle stay open and unchanged, and each product view links the proof behind its numbers.
- It answers the CPO's activation and return metrics with more than one loop: the daily question's fast and slow rewards ([077](../product/077-daily-question-mechanics.md)) become a personal track record, and the briefing gives a reason to open the app on days with no new question.
- Several lenses already asked for sign-in on free forks (CEO, CRO, VC, CFO): a per-person allowance needs a person. Email sign-in makes each account cost an inbox ([106](../engineering/106-sign-in-methods.md)).
- Self-serve keys replace hand-made builder keys ([product/078](../product/078-api-launch-playbooks.md) on quickstart friction), with a daily cap per key so no key can spend the shared budget.

### Lens objections this overrides, and why

| Lens | Objection | Ruling |
| --- | --- | --- |
| CPO | Launch is three things: daily question, receipts, fork button | Overridden: the founder judged that this reads as a demo. The three stay, open and unchanged; the product is built around them |
| CPO | Cut "the dashboard" | Overridden for a personal home and briefing. Teams, seats, Pro, webhooks, batch and MCP stay cut |
| CEO | Launch one company; everything but the record is backdrop | Partly overridden: the consumer product is the record made personal (your forks, your score against the simulation). The demo order receipts, fork, agent panel is unchanged |
| CFO | Free signed-in forks at 3 a month; anonymous visitors get cached forks only | Not decided here: the numbers stay the founder's call ([decisions-needed](../../company/decisions-needed.md), item 7). This decision only fixes that each cap exists per person and fails closed |
| CRO, VC | Revenue comes from pilots and builders, not consumers | Not contradicted: accounts are free and the pilot offer is untouched. Consumers are the distribution and the panel |
| `product/web-app.md` | "No sign-in, accounts, settings, dashboard … or onboarding popups" | Overridden for accounts, settings, a personal home and a skippable onboarding. Dark-pattern prompts and popups stay out |
| `product/simulate-api.md` | Keys are made by hand for the builders program only | Overridden: keys are self-serve for any signed-in person, each with a daily cap. Operator keys keep their lifetime cap |

Upheld unchanged: browsing without sign-in (Gate 4, CRO), no paywall on the record (CRO), no "beats the market" or accuracy claims ([messaging](../../gtm/messaging.md)), every output labelled AI-simulated with its coverage tier, no leagues, friend streaks or push notifications (CPO), and the acceptable-use screen on every fork.

### Amendment to the launch scope

This decision amends "What we launch" in [company/plan-to-nov-2.md](../../company/plan-to-nov-2.md): the daily question, receipts and the proof surfaces, forks and `POST /v1/simulate` as before, plus free email accounts, onboarding, a personal home with the briefing, saved forks with history, a personal track record and self-serve capped API keys. If a product slice is not green by Gate 3 (Oct 24), it ships switched off; the open daily page and proof layer never wait on it.

## Build plan

Each slice is one Zeroshot run and one PR under the rules of [BUILD_PLAN.md](BUILD_PLAN.md), touching only its file areas. Each slice adds its own SQL file under `api/rw_api/sql/` (loaded in name order, as the engine does with `engine/rw/sql/`) instead of editing `schema.sql`, its own routes module, and its own page, so parallel slices share only `api/openapi.json` (regenerated after rebase) and `engine/rw/settings.py` (one appended block each). The account routes carry the OpenAPI tag `account` and are left out of both SDKs, since they use the session cookie, not an API key.

| Slice | What it delivers | File areas | Depends on |
| --- | --- | --- | --- |
| P1 Accounts and sessions | Email link and code sign-in, local outbox, sessions, `GET /v1/me`, sign-out, account deletion, the startup check that refuses a non-local origin without an email provider, and the loader for `api/rw_api/sql/` | `api/rw_api/auth.py`, `api/rw_api/routes_me.py`, `api/rw_api/sql/accounts.sql`, `api/rw_api/app.py` (router and startup check only), `engine/rw/settings.py`, `api/tests/test_auth.py`, `api/openapi.json` | none |
| P2 Navigation shell | Session-aware header, `/sign-in`, `/settings` (email, sign-out, delete), the signed-in versus signed-out nav of [web-app](../../product/web-app.md); `/` still shows today's page | `web/src/App.tsx` (header and route switch), `web/src/pages/sign-in.tsx`, `web/src/pages/settings.tsx`, `web/src/session.ts`, their tests, `web/src/styles.css` | P1 |
| P3 Onboarding and profile | `PATCH /v1/me/profile`, `/welcome`, the profile section of `/settings`, the default country used by `/world` and `/questions/{id}` | `api/rw_api/routes_profile.py`, `api/rw_api/sql/profile.sql`, `api/tests/test_profile.py`, `web/src/pages/welcome.tsx`, `web/src/profile.ts`, `web/src/pages/settings.tsx` (profile section), their tests | P1, P2 |
| P4 Home and briefing | `GET /v1/me/briefing`, the signed-in home at `/` with the order rules | `api/rw_api/routes_briefing.py`, `api/tests/test_briefing.py`, `web/src/Home.tsx`, `web/src/Briefing.tsx`, their tests | P3 |
| P5 Saved forks | Per-person daily fork count, `user_forks`, `/v1/me/forks`, "Save" on the fork card, `/forks` history | `api/rw_api/routes_forks.py`, `api/rw_api/sql/forks.sql`, `api/rw_api/app.py` (spend checks), `engine/rw/settings.py`, `api/tests/test_user_forks.py`, `web/src/ForkCard.tsx`, `web/src/pages/forks.tsx`, their tests | P1, P2 |
| P6 Track record | Linking a browser's `player_id` to the account, `GET /v1/me/track-record`, `/track-record` | `api/rw_api/routes_record.py`, `api/rw_api/sql/players.sql`, `api/tests/test_track_record.py`, `web/src/pages/track-record.tsx`, its test | P1, P2 |
| P7 Developer keys | Self-serve keys with a daily cap, usage, revoke, `/developers` | `api/rw_api/keys.py`, `api/rw_api/routes_keys.py`, `api/rw_api/sql/user_keys.sql`, `api/rw_api/app.py` (key spend check), `engine/rw/settings.py`, `api/tests/test_user_keys.py`, `web/src/pages/developers.tsx`, its test | P1, P2, P5 (both edit the spend checks in `app.py`) |

```
P1 accounts ─▶ P2 nav shell ─┬─▶ P3 onboarding ─▶ P4 home and briefing
                             ├─▶ P5 saved forks ─▶ P7 developer keys
                             └─▶ P6 track record
```

Critical path: P1, P2, P3, P4, four runs. P3, P5 and P6 run in parallel once P2 merges. P5 and P7 are spend paths and use the `critical-change` profile; the rest use `economy-change`.

## What would make us revisit it

- After 30 days live, under 10% of people who finish sign-in return on any of days 6-8 (the CPO's day-7 measure applied to accounts).
- Sign-in completion, the share of sign-in requests that end in a session, is under 50% in the first week: add passkeys or Google sign-in ([106](../engineering/106-sign-in-methods.md)).
- Free signed-in fork spend reaches `FORK_DAILY_BUDGET_USD` on 3 days in a week, so signed-in people are refused for budget, not for their own cap.
- The first day account work blocks the open daily page or a proof surface from shipping.
