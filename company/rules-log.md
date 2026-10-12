# Rules log

Every rule or check added because of a real mistake, with the PRs that show the mistake. The `learn-rules` job (`.github/workflows/learn-rules.yml`, or `/learn-rules` in a session) appends here. A rule with no row here has no evidence behind it and is a candidate for deletion.

Last PR learned from: none

| Date | Failure class | Evidence | Guard added | Mechanical |
| --- | --- | --- | --- | --- |
| 2026-10-12 | Two looks for one product: web app and landing page styled separately, tokens copied by hand, hex colours in component and canvas code | #31, #36, landing PRs #20-#25 | `scripts/check_design.py` in `make lint`; screenshot gate in `pr-quality.yml`; root `CLAUDE.md` "One product, one look" | yes |
