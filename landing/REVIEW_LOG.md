# Satyam's review comments and what answered them

Read with `comments.sh` on 2026-10-12 and 2026-10-13. Status: done, proposed (a doc or SQL to review, nothing run) or open.

| Where | Comment (short) | Status | Answer |
| --- | --- | --- | --- |
| PR #24 review | Remove `globe_fallback_shown` | done | `6ff72f4`: event and its test removed |
| PR #24 review | Remove sign-up duplication (`signup_duplicate`) | done | `6ff72f4` |
| PR #22 `0001_init.sql:22` | Remove `referrer` | done | `0003_drop_referrer_landing_path.sql`, signup payload and insert no longer carry it. The migration is **not yet applied** to any branch (a column drop; apply to dev and staging first, main at go-live) |
| PR #22 `0001_init.sql:23` | "Not clear what `landing_path` does" | done | It was always `/` on a one-page site. Removed with `referrer` |
| PR #22 | Sister DB for the waitlist, reached only through the form; main DB is R1 and holds internal user data | proposed | [design/SISTER_DB.md](design/SISTER_DB.md) |
| PR #22 | Column in R1 showing which D1 signups became users; Amplitude to find who converts and our ICP | proposed | same doc, "Conversion" and "Amplitude" sections |
| Directive | LaunchDarkly with Amplitude, staging flag first, funnel visitor to form opened to completed | open | No LaunchDarkly account or key exists here. Not built; see the doc's "Flags" section for the plan |
| Directive | Landing folder not at repo root, as a UI skin | open | Not run: it changes every open PR and his guards. Proposal in the doc's last section |
| Directive | SEO and design tokens, no heavy graphics | done in part | Canonical, Open Graph, sitemap, robots; tokens from his UI in `tokens-next.css`; the globe is 5.7 KB gzipped of a 81.9 KB first load |
