# 0018: The repository is open source under Apache-2.0

- Date: 2026-10-14
- Status: accepted
- Rests on: [0009](0009-proprietary-licence.md), [business/092-moat-theory](../business/092-moat-theory.md), [open-source/035-classic-abm](../open-source/035-classic-abm.md)

## Decision

The founder decided on 2026-10-14, in chat, to open-source Real World under the Apache License 2.0. This supersedes [0009](0009-proprietary-licence.md). `LICENSE` holds the Apache-2.0 text and `NOTICE` the attribution; every `package.json` carries `"license": "Apache-2.0"` and every pyproject `[project]` carries `license = { text = "Apache-2.0" }`, which `scripts/check_licence.py` enforces. Packages keep `"private": true` because none is published to npm yet. Third-party data keeps its own licence ([data/sources.csv](../../data/sources.csv)); nothing bundled in `data/` comes from a restricted source. Both contributors agreed to the relicence.

The public repository is published from a clean copy of `main` with a fresh history, because past commits held a local demo database and sign-in emails (`var-demo/`). Company planning, go-to-market and the moats notes are left out of the public copy.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| Apache-2.0 (chosen) | Permissive, with an explicit patent grant; the standard for SDKs and engines | Anyone may run the pipeline commercially |
| MIT | Shortest permissive licence | No patent grant |
| AGPL-3.0 | Hosted forks must publish changes | The repo already rejects AGPL dependencies for that obligation ([035](../open-source/035-classic-abm.md)) |

## Why this one

The moat note already rated the pipeline as copyable and placed the durable value in the public hashed record and the daily panel ([092](../business/092-moat-theory.md)). Open code costs little against that and lets anyone audit the engine behind the record.

## What would make us revisit it

- A data licensor that forbids publishing code which reads its data.
- A fork that runs the pipeline as a rival service with the record's name.
