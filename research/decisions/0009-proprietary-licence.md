# 0009: The repository and every package are proprietary

- Date: 2026-10-12
- Status: superseded by 0018
- Rests on: [business/092-moat-theory](../business/092-moat-theory.md), [VC lens](../lenses/vc.md), [open-source/035-classic-abm](../open-source/035-classic-abm.md)

## Decision

The founder decided on 2026-10-12, in chat, that the repository and every package in it are proprietary, all rights reserved. No licence is granted to anyone, and access to the repository grants no right of use. `LICENSE` states this; every `package.json` carries `"license": "UNLICENSED"` and `"private": true`; every pyproject `[project]` carries `license = { text = "Proprietary" }`; and `make lint` runs `scripts/check_licence.py`, which fails if a package lacks those fields. Third-party components keep their own licences, listed in `THIRD_PARTY_NOTICES.md`. This was implemented in PR #68. A package, SDK or dataset released under any other licence needs a new record that supersedes this one.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Proprietary, all rights reserved (chosen) | Keeps the daily pipeline, calibration and panel data, the layers the moat note calls copyable or worth keeping, out of rivals' hands ([092](../business/092-moat-theory.md)); every later choice stays open, since a proprietary repo can be relicensed but an open release cannot be withdrawn | No outside contributions; a builder reading the SDK source has no right to reuse it until a later record licenses it |
| Permissive open source, such as Apache-2.0 | Lowest friction for builders and SDK users | Anyone may copy the pipeline, which the moat note rates as copyable in weeks by a funded rival ([092](../business/092-moat-theory.md)) |
| Copyleft, such as AGPL-3.0 | Rivals who run a modified copy as a service must publish their changes | The repo already rejects AGPL dependencies because they impose that obligation on us ([035](../open-source/035-classic-abm.md)); it still lets a rival run our code unmodified |
| Source-available, such as BSL or a non-commercial licence | Code can be read and audited while commercial use stays reserved | A custom licence to draft and police; auditability is already served by the public, recomputable forecast record rather than the source |

## Why this one

The moat note finds that the pipeline and twins are copyable and that the public hashed record and the daily panel are the assets worth protecting ([092](../business/092-moat-theory.md)); the VC lens asks that panel data not be given away ([vc](../lenses/vc.md)). Proprietary is the only option that is reversible in one direction: any open licence can still be chosen later for a single package, such as an SDK, by a superseding record. The trust claim rests on forecasts anyone can recompute, not on reading the engine's source.

## What would make us revisit it

- A builder-program or SDK launch that needs a public licence for the SDK packages.
- A customer, partner or data licensor that requires source access or a named open licence in writing.
- A decision to publish engine code alongside a paper.
