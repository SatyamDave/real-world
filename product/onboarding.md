# Onboarding

## What it does

After the first sign-in, `/welcome` asks up to four short questions, one per screen, each with "Continue" and "Skip", and "Skip setup" on every screen. The answers set what the person sees first everywhere else; they can change them any time in `/settings`.

1. "What will you use Real World for?" One choice: "Markets and investing", "Policy and politics", "Journalism and research", "Building on the API", "Just curious".
2. "Which countries do you follow?" Any number of the simulated countries, each with its name and `TierBadge`, from `GET /v1/world`.
3. "Which topics matter to you?" Any number of the topics in `data/topics.csv`, shown by their labels ("Inflation worry", "Trust in government" and so on), from `GET /v1/world`.
4. "Which country are you in? Optional." One simulated country, or "Somewhere else". The line under it: "Used only to pick the country shown first."

The last screen ends on the personal home at `/`. A person who skips any step gets the defaults in the table below; nothing asks again.

How the answers are used:

| Answer | Where it acts |
| --- | --- |
| Use | Order of the home sections ([home and briefing](home-and-briefing.md)); "Building on the API" puts the developer card first |
| Countries | The briefing's rows, the order of open questions, the ranking of suggested forks, the countries listed first on `/world` |
| Topics | The same, by topic; the topic shown first on the globe and `/world` |
| Own country | The default country in every view that shows one country (`/world`, `/questions/{id}`, the agent panel's "Read one agent" row); with no answer, the first chosen country; with neither, no default, as today |

States, written out:

- Loading the country and topic lists: "Loading countries", "Loading topics".
- Lists could not load: `LoadError` "Could not load countries. The server did not respond." with "Try again"; "Skip" still works.
- Saving: the button reads "Saving"; failure: "Your answers were not saved. Try again." and the screen stays.
- Signed out on `/welcome`: redirect to `/sign-in`.
- Already onboarded on `/welcome`: redirect to `/`.

## Who it is for

A person who just made an account and wants the product to show their countries and topics first, without a tour.

## How we know it works

- `PATCH /v1/me/profile` takes `use`, `countries`, `topics`, `own_country` and `onboarded`; it refuses an unknown country or topic with `422 invalid_request`, checked against `data/countries.csv` and `data/topics.csv`. Fields are in `api/openapi.json`. The profile is stored on the person's row as one JSON value. Tests in `api/tests/test_profile.py`: `test_the_profile_accepts_only_known_countries_and_topics`, `test_skipping_marks_the_profile_onboarded_with_no_answers`.
- The first sign-in opens `/welcome`; any later sign-in, or a person with `onboarded` set, never does. Test: `welcome.test.tsx` "a second sign-in does not show onboarding".
- Each answer changes what it should: component tests render the home, `/world` and a question page with fixture profiles and assert the default country, the topic shown first and the section order from the table above.
- At most four screens; "Skip setup" from any screen lands on `/` with defaults. Test: `welcome.test.tsx` "skip setup from step 1 saves an empty profile and opens home".
- Measured after launch: the share of new accounts that finish all four steps, and the share that edit their profile in the first week.

## What it is not

- No tour, tooltips, checklists, progress rewards or popups after onboarding.
- No free-text interests, no age, gender, job or employer questions: only the four answers above.
- Not a filter on the proof layer: receipts, scores, cycle and research show everything to everyone.
- The own-country answer is not used to infer anything about the person and is never shown to others.

## Where the code lives

- `web/src/pages/welcome.tsx`, `web/src/profile.ts`, the profile section of `web/src/pages/settings.tsx`; `api/rw_api/routes_profile.py`.
- Decision: [0011](../research/decisions/0011-consumer-product-and-api.md). Research: [product/081](../research/product/081-icp-policy-research.md), [product/083](../research/product/083-icp-games-media.md), [data/099](../research/data/099-country-coverage-tiers.md).
