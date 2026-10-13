# Registry

One row per pre-registered experiment. A row is added in the same commit as its `PREREG.md`, before any run, and its hash never changes. Status moves from registered to running to one of: supported, not supported, killed, abandoned (with the reason in `results/`). Lifecycle: [`README.md`](README.md).

Check every hash with `shasum -a 256 experiments/E*/PREREG.md`.

| ID | Title | Registered | Owner | SHA-256 of PREREG.md | Status | Results |
| --- | --- | --- | --- | --- | --- | --- |
| [E001](E001/PREREG.md) | Engine vs a single frontier-model prompt on post-cutoff poll subgroup distributions | 2026-10-11 | CTO | `62d1906059bd1357380b68d65ad75411da67529df41f540df9d8ea2c69c1f0ed` | registered | none |
| [E002](E002/PREREG.md) | Variance-collapse correction | 2026-10-11 | CTO | `0d2339a1b597362036994315f5ca4efe8c7fdb2f98017e728b565c3f5459d8ab` | registered | none |
| [E003](E003/PREREG.md) | Belief assimilation converges on a synthetic ground-truth world | 2026-10-11 | CTO | `13b0279a0d5f87d5b4f48fb652dd327c3cea4368a86b4476b69cc2794b5d7171` | supported | [2026-10-12-none](E003/results/2026-10-12-none/RESULTS.md) |
| [E004](E004/PREREG.md) | Live hashed forecasts vs the market price (Brier) | 2026-10-11 | CEO | `4d31066a1f4efe34b93b822908cfa8773f250df5edc4bf8cdec724b3150ed3b2` | registered | none |
| [E005](E005/PREREG.md) | Native-language vs English agents on non-Western polls | 2026-10-11 | CTO | `b5f7cbf8a140a6c1c2affb30f9a2dc1fedf7f8020531d707d8a23c4c8bad3f81` | registered | none |
| [E006](E006/PREREG.md) | Assimilation v2 vs persistence on the E003 synthetic world | 2026-10-12 | CTO | `ad372cad8f2a3d2a00641b9205cdb97afa87d87e151c88c7e3e47593b8bc450d` | supported | [2026-10-12-none](E006/results/2026-10-12-none/RESULTS.md) |
| [E007](E007/PREREG.md) | Jev forecasts are no worse calibrated than the Haiku baseline | 2026-10-12 | CTO | `cb68d107d9da5824e53b0d0dad2aaf7528f2cc0554ada13b7a334693f6033cc5` | registered | none |
| [E008](E008/PREREG.md) | The self-improving loop on a synthetic question stream | 2026-10-12 | CTO | `ebc8593d8389a247d9a1e494a88bb4bbc69f89c8a1ff970da8375ce86e99440d` | registered | none |
| [E009](E009/PREREG.md) | LoRA-tuned opinion model vs its base model vs Jev on survey questions fielded after registration | 2026-10-12 | CTO | `a83836b9b9fb03ff62854c15bbcd721437804d0edf4a0ca10590176b091c34c5` | registered | none |
| [E010](E010/PREREG.md) | The ICP engine beats a plain-prompt baseline and the founder's gut on marked message tests | 2026-10-13 | CTO | `cf9e4ebd65122eb4eb95504438a78d162d7a527caafe417c92c9a03d6422b9d2` | registered | none |
