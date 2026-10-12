# Repo and PR practices that force well-thought-out PRs

- Date: 2026-10-11
- Area: engineering
- Confidence: medium. Plan and rule facts come from GitHub's own docs and pricing page, but those pages disagree or stay silent on some plan details. Web search ran out of budget, so I opened primary pages directly and did not survey many projects.

## Answer

A template does not force anything. It only pre-fills a text box. What forces thought is a required CI check that fails when the PR body is empty or wrong, plus a ruleset that makes that check mandatory. For a 22-day sprint on a public personal-account repo, use a short PR template, one small GitHub Actions check on the body, a ruleset on `main`, CODEOWNERS, and a short ADR folder. Skip Danger, a commit-message linter and long RFCs.

## Findings

**GitHub plans decide what you can enforce.**
- Free is $0 with unlimited private repos and 2,000 Actions minutes a month. Team is $4 per user per month for the first 12 months and gives 3,000 minutes. On the [pricing page](https://github.com/pricing), protected branches (repository rules) and code owners are listed for Free on public repositories only. Team includes them for private repositories.
- The [rulesets page](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) says rulesets are for GitHub Team and Enterprise. The pricing page says Free gets them on public repos. I could not reconcile the two. Test on the real repo before relying on either.
- Bypass lists only work on organization repositories. Required-reviewer teams (up to 15 teams, 0 to 10 approvals each) are not available on user-owned repositories. The repo is under `SatyamDave`, a user account, so move it to an organization if you want bypass rules or team reviewers. See [available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

**Rules a ruleset can enforce** (same page): require a pull request, an approval count, code-owner review, dismissal of stale approvals, approval from someone other than the last pusher, all comments resolved, a fixed merge method, passing status checks (strict or loose), linear history, signed commits, block force pushes, and code scanning results. The page does not list a commit-message pattern rule, so I cannot confirm one exists. A required status check is the rule that makes a CI gate on the PR description binding.

**PR templates** live in `.github/pull_request_template.md`, or in a `PULL_REQUEST_TEMPLATE/` folder for several. They only reach contributors after merging to the default branch, and the [docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository) describe no enforcement. A contributor can delete every line.

**What strong projects put in templates.** The [Kubernetes template](https://raw.githubusercontent.com/kubernetes/kubernetes/master/.github/PULL_REQUEST_TEMPLATE.md) has six parts: PR type (one `/kind` label), what and why, related issues, notes for the reviewer, a fenced release-note block (write `NONE` or a real note, with "action required" for upgrade steps), and an AI usage disclosure (YES or NO). Bots read the release-note block, so it is machine-checked, not decorative. The [Rust template](https://raw.githubusercontent.com/rust-lang/rust/master/.github/pull_request_template.md) is mostly a hidden comment. It asks for LLM disclosure, tracking-issue links and `r? <reviewer>` assignment, and keeps some text out of the permanent merge commit.

**Danger JS** ([site](https://danger.systems/js/), [repo](https://github.com/danger/danger-js)) is MIT licensed with about 5.5k stars. It runs in CI against a `dangerfile.ts` and posts or updates a PR comment. Its own examples are warn on no changelog, warn on lockfile mismatch, warn above 600 changed lines, and fail with no assignee. Most of those are warnings, not blocks. It needs a token and another dependency, and for body checks a 30-line Actions script does the same job.

**Conventional Commits 1.0.0** ([spec](https://www.conventionalcommits.org/en/v1.0.0/)): `type(scope)!: description`, with `fix` mapping to PATCH, `feat` to MINOR and a breaking change to MAJOR. It pays off only if a tool reads it, such as release automation. Real World has no versioned library release yet. The API and SDKs come later.

**CODEOWNERS** ([docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)) goes in `.github/`, the root or `docs/`, under 3 MB, read from the PR's base branch. Owners need write access. Drafts do not request review until marked ready. Any one listed owner satisfies "Require review from Code Owners".

**ADRs.** [adr.github.io](https://adr.github.io/) credits Michael Nygard's 2011 post for popularizing them. An ADR records one decision and its rationale. The [most-starred ADR repo](https://github.com/joelparkerhenderson/architecture-decision-record) (17.2k stars) says to use one `adr/` folder in git, one file per decision, named in lowercase imperative like `choose-database.md`. It also says to skip ADRs for tiny, low-risk, one-person, or temporary decisions. Nygard and MADR are the common templates. I did not open their section lists.

**Rust RFCs** ([process](https://rust-lang.github.io/rfcs/0002-rfc-process.html)): an RFC is required only for substantial changes such as language semantics or `std` additions. Bug fixes, refactors and metric improvements are normal PRs. A PR that needed an RFC may be closed. The point is a controlled path for big changes, not paperwork for all of them.

**Google's change-description rule** ([guide](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)): the first line is one imperative sentence that stands alone, and the body explains why, known shortcomings and links. "Fix bug" and "Phase 1" are named as bad descriptions.

## What it means for Real World

- For the product: the track record is the moat, so the same discipline applies to forecast-affecting changes. A PR that changes the daily pipeline, prompts or scoring must state its effect on past and future forecasts.
- For the engineering: one template with five fields, one Actions check, one ruleset. A PM can fill the template without reading code, and an engineer can read the PM's fields without a translator.
- For the business: this is cheap, costs no seats, and gives YC reviewers a visible history of reasoned decisions. Do not spend more than half a day on it.

## Recommendations

1. Add `.github/pull_request_template.md` with five headed fields: What changed (plain words), Why (the user or forecast outcome), How we know it works (command or screenshot), Risk to the daily run or published forecasts (`none` allowed), and AI disclosure (YES or NO). Copy the Kubernetes pattern. Cut anything not needed.
2. Add one GitHub Actions workflow on `pull_request` that fails if any heading is missing, any field is empty or still the placeholder, or the diff is above a set line count without a "large change" label. Make it a required status check. Use `actions/github-script`, not Danger.
3. Create a ruleset on `main`: require a PR, require the check from item 2, block force pushes, require all comments resolved, require squash or merge as one fixed method. Set approvals to 1 only once there are two humans. With one author, a required approval blocks every merge. Test that the ruleset can be created on the current plan first.
4. Add `.github/CODEOWNERS` that maps `pipeline/`, `scoring/` and `api/` to named owners and `docs/` and `web/copy` to the PM. Turn on code-owner review only after two people exist.
5. Add `docs/adr/` with a Nygard-style template (context, decision, consequences, status), one file per decision, lowercase imperative names. Write ADRs only for choices that are hard to reverse, such as hash format for published forecasts, agent sampling method, or scoring rule. Link the ADR from the PR.
6. Use plain imperative commit and PR titles, as in the Google guide. Do not adopt Conventional Commits enforcement until SDK releases need automated versioning.
7. Move the repo to a GitHub organization if bypass lists or team reviewers are needed.

## Open questions

- Do rulesets work on a Free user-account public repo today, given the conflicting docs? Test by creating one.
- Can required status checks be enforced there without an organization? Same test.
- Which ADR template (Nygard, MADR short) suits a mixed PM and engineer team? I did not open either template page. Try Nygard for two weeks and see.
- Do these gates slow a 22-day sprint? Measure PR time to merge in the first week and loosen the line cap if it hurts.

## Sources

- [About rulesets, GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), accessed 2026-10-11
- [Available rules for rulesets, GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets), accessed 2026-10-11
- [About protected branches, GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), accessed 2026-10-11
- [GitHub pricing](https://github.com/pricing), accessed 2026-10-11
- [Creating a pull request template, GitHub Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository), accessed 2026-10-11
- [About code owners, GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners), accessed 2026-10-11
- [Kubernetes PR template](https://raw.githubusercontent.com/kubernetes/kubernetes/master/.github/PULL_REQUEST_TEMPLATE.md), accessed 2026-10-11
- [Rust PR template](https://raw.githubusercontent.com/rust-lang/rust/master/.github/pull_request_template.md), accessed 2026-10-11
- [Rust RFC 2, the RFC process](https://rust-lang.github.io/rfcs/0002-rfc-process.html), accessed 2026-10-11
- [Danger JS](https://danger.systems/js/) and [danger-js repo](https://github.com/danger/danger-js), accessed 2026-10-11
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), accessed 2026-10-11
- [ADR GitHub organization](https://adr.github.io/), accessed 2026-10-11
- [architecture-decision-record repo](https://github.com/joelparkerhenderson/architecture-decision-record), accessed 2026-10-11
- [Google eng-practices, CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html), accessed 2026-10-11
