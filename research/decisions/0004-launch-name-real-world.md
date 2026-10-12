# 0004: Launch name — "Real World"

- Date: 2026-10-12
- Status: proposed
- Rests on: [product/085](../product/085-naming-trademark.md), [lenses/ceo.md](../lenses/ceo.md), [lenses/red-team.md](../lenses/red-team.md), [lenses/cro.md](../lenses/cro.md)

## Decision

The product launches under the name "Real World". Rohit and Satyam agreed it on 2026-10-12; this record is `proposed` until the founder accepts it and Satyam approves in the PR (per [`research/decisions/CLAUDE.md`](CLAUDE.md), a founder-only decision needs the approval recorded in the PR). The name is the spoken name, the display name and the launch brand. Because [085](../product/085-naming-trademark.md) could not verify the trademark and the bare phrase carries risk, the display name is held in one config field (`landing/src/brand.ts` for the landing page; the equivalent single field in the app and engine) so a rename costs minutes, and all visual design avoids anything that evokes MTV's "The Real World". This settles open item 1 in [`company/decisions-needed.md`](../../company/decisions-needed.md), which is removed in the same PR.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Launch as "Real World" (chosen) | Reads well in sentences ("fork the Real World"); already the working name; Rohit and Satyam agreed it; keeping it in one config field makes a later rename cheap ([085](../product/085-naming-trademark.md)) | Trademark unverified; the phrase is famous from MTV; best domains are taken; contested as a search term ([085](../product/085-naming-trademark.md)) |
| Launch under a qualified brand ("Real World Sim") | Distinct domain and handle; lower confusion risk | Loses the clean phrase; still unverified; 085 could not confirm it is clearly better ([085](../product/085-naming-trademark.md)) |
| Pick a new distinct brand | Clean trademark and SEO runway | A rename after the first public hash splits the public track record, which is the moat ([ceo.md](../lenses/ceo.md), [085](../product/085-naming-trademark.md)) |

## Why this one

Every lens that raised the name said pick one before the first forecast hash, because a rename after the record starts splits the moat ([ceo.md](../lenses/ceo.md), [cro.md](../lenses/cro.md), [red-team.md](../lenses/red-team.md)). The founders chose the name that reads best and is already in use, and bounded the risk the way 085 recommended: the name lives in one config field, the trademark is cleared before it becomes expensive to change, and the visuals stay clear of the MTV association. Launching under the qualified or a new brand was rejected because 085 could not show either is clearly safer, and a new brand pays the moat cost 085 warns against.

## What would make us revisit it

- A real USPTO search for REAL WORLD in classes 9, 35, 36, 41 and 42, or a lawyer's knockout opinion, finds a blocking mark in software or forecasting classes ([085](../product/085-naming-trademark.md)). 085 recommends both before Oct 27; they are still outstanding.
- The lawyer's knockout opinion flags "Real World" as high risk: switch to a prepared fallback and update the one config field ([085](../product/085-naming-trademark.md)).
- SEO proves unworkable once measured (a real SERP check for "Real World AI"), which 085 lists as an open question, not data.
- A buyable, clearly better domain appears within the agreed cap (for example realworld.ai below the cap): that does not change the name, only the domain ([085](../product/085-naming-trademark.md)).
