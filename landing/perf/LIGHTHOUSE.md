# Lighthouse results, 2026-10-12

Every Lighthouse number quoted in the landing PRs and in `MORNING.md` comes from this file. Command, run from `landing/` with Google Chrome installed (the raw JSON reports were not committed; they are 0.5 MB each):

```
npx -y lighthouse <url> --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --chrome-flags="--headless=new --no-sandbox" --output=json
```

Defaults: mobile emulation, simulated slow 4G, 4x CPU slowdown. The budgets are in [PLAN.md](../PLAN.md): LCP under 2.0 s, CLS under 0.05, first-load JavaScript under 120 KB gzipped (`pnpm check:bundle`, 76.0 KB on the final build). LCP below is Lighthouse's simulated value, not what a browser measures; observed values are much smaller (see the last section).

## Result in one line

On the **live preview** (Cloudflare Pages) the final build's LCP is under 2.0 s on **3 of 6** runs, median about 2.05 s. The budget is **not reliably met** on the live URL under Lighthouse's simulation. It was met on 7 of 8 runs against a local server. CLS, accessibility, best practices and the JS budget pass everywhere.

## Series

Times in milliseconds. "Run 1" is the first run of a batch.

| Series | Where | Build | Runs: LCP (ms) | CLS | Perf | A11y | BP | SEO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | local `vite preview` | design pass, no SDK key, Google Fonts | 1806, 1699, 1809 | 0.0003 | 99 | 100 | 100 | 100 |
| B | local `vite preview` | with Amplitude and replay on (fake key, sample rate 1), Google Fonts | 2656 (run 1), 1807, 1957, 1961, 1804, 1959, 1978, 1805 | 0 to 0.0003 | 63 (run 1), then 98 to 99 | 100 | 96 | 100 |
| C | live preview | as B, real Amplitude key | 2228, 2055, 2047, 2836, 1837 | 0.0003 | 94 to 99 | 100 | 100 | 66 |
| D | live preview | fonts self-hosted and preloaded | 2154, 2019, 2364, 2163, 2247, 2224 | 0 | 97 to 98 | 100 | 100 | 66 |
| E (final) | live preview | bot check on interaction, SDKs after load or first interaction, font preload removed | 1533, 2145, 1962, 1901, 2152, 2403 | 0.0003 | 96 to 98 | 100 | 100 | 66 |

Series E: total blocking time 44 to 140 ms, first contentful paint 1383 to 2145 ms, main-thread work 1.3 to 1.8 s. Series C and D had main-thread work around 2.5 s.

Medians of LCP: A 1806, B 1957 (runs 2 to 8), C 2055, D 2194, E 2053.

## What the numbers mean

- **Run 1 of series B** was a cold-start outlier (LCP 2656, total blocking time 3241 ms); a subagent saw the same pattern on an earlier batch. The cause was not found.
- **SEO 66 on the live preview** is one failed audit, "page is blocked from indexing". Cloudflare serves every Pages preview deployment with `x-robots-tag: noindex`. It is not a page defect, and it will not apply on a production domain.
- **Best practices 96 in series B** came from running a fake API key (the browser reported failed requests). It is 100 with real keys.
- **Observed phases** from one live run (series D, run 3), what the browser actually did: time to first byte 75 ms, resource load delay 5 ms, load duration 47 ms, render delay 64 ms; the network log shows every first-paint request finishing within about 220 ms. The 2.0 to 2.4 s figures are the simulation of a slow phone. They are still the budget the plan names, and they are the number on this page.

## What changed between series, and what did not

1. Self-hosting the fonts (D) removed two third-party origins and tightened the spread, but did not lower the median: the first paint (about 1.7 s simulated) is bound by downloading and running the 76 KB React bundle, not by fonts.
2. Moving the bot check and the analytics SDKs out of the first-paint window (E) cut main-thread work by about 40% and moved the median LCP from about 2.2 s to about 2.05 s. Three runs pass; three do not.

## Options to close the gap (not done; each needs a decision)

- Replace React with Preact through an alias: about 40 KB gzipped less JavaScript. Touches the test setup and every component's imports.
- Pre-render the page's HTML at build time so the first paint does not wait on JavaScript. The headline depends on `utm_content`, so a single pre-rendered page would show the wrong headline to ad visitors. Doing it per variant needs a Pages Function in front of every page view.
- Accept the budget as a lab target on a slow-phone simulation and judge on real-user numbers once ads run.


## 2026-10-13: the sections build, with and without pre-rendering

Same command as above, run by subagents, 8 runs per series unless noted. Raw JSON stays in the session scratchpad (not committed). The table and the reading are in [DECISIONS.md](../DECISIONS.md) B3.

| Series | Where | LCP (ms), runs in order | Median | Under 2.0 s |
| --- | --- | --- | --- | --- |
| F as shipped | local | 2043, 1835, 2130, 1830, 1832, 2128, 2129, 2128 | 2085 | 3 of 8 |
| G pre-rendered | local | 1805, 1805, 1804, 1805, 1812, 1806, 1804, 1803 (plus 4 on `utm_content=hashed`: 1803, 1804, 1803, 1803) | 1805 | 12 of 12 |
| H as shipped | live staging | 2380, 2168, 2514, 2379, 2064, 1892, 1832, 2397 | 2274 | 2 of 8 |
| I pre-rendered | live staging | 2067, 1937, 1987, 1774, 1966, 2497, 2292, 2645 | 2027 | 4 of 8 |
| J pre-rendered, stylesheet inlined (reverted) | live staging | 1871, 2074, 2056, 2089, 2032, 2356, 2093, 2211 | 2082 | 1 of 8 |

CLS 0 to 0.001 and accessibility and best practices 100 in every run; SEO 66 on the live preview (Cloudflare adds `noindex` to previews). Run 1 of the local as-shipped series was the known cold-start outlier (total blocking time 3010 ms). The first live staging deploy of the pre-rendered build (before series I) measured 4 of 8 with a median of 2027 ms; series I is a repeat on a build with the same code.
