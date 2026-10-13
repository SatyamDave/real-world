# Ad images

Generated, not hand-made: `pnpm --filter landing ads` renders one PNG per headline id and size from `src/copy/headlines.ts` and `src/brand.ts`, so the images cannot drift from the allow-list in [gtm/prelaunch-ads.md](../../gtm/prelaunch-ads.md). `manifest.json` lists every file.

| Size | Format | Text safe zone (px from each edge) |
| --- | --- | --- |
| 1080 x 1080 | square | 90 on every side |
| 1080 x 1350 | 4:5 portrait | 110 top and bottom, 90 sides |
| 1080 x 1920 | 9:16 story | 250 top, 340 bottom, 90 sides |

The safe zones are our own conservative margins, not Reddit or X specifications; those are unverified ([product/101](../../research/product/101-prelaunch-landing-waitlist-ads.md)). Only the decorative globe may reach the edge. The script stops if text leaves its zone.

Before it renders, every line is checked against what [gtm/messaging.md](../../gtm/messaging.md) forbids (a percentage, a ranking claim, "world model", an agent count, a trading offer, an accuracy claim) and against the no-politics rule. Each image carries "AI-simulated. Not a poll." No hash, probability or score appears.

The images have not been through a platform's ad review.
