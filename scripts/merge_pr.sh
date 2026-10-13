#!/usr/bin/env bash
# Merge a pull request only after every required check has reported and passed.
#
# Usage: scripts/merge_pr.sh <pr-number>
#
# `gh pr checks --watch` returns at once when no check has reported yet, which is how
# #8 and #9 were merged before CI existed for their commits. This script refuses to
# merge until the CI job and both PR quality jobs have reported, and none is pending.
# The repository plan has no branch protection, so this is the only gate.
set -euo pipefail

pr="${1:?usage: scripts/merge_pr.sh <pr-number>}"
repo="${GH_REPO:-SatyamDave/real-world}"
required="check description size"
timeout="${MERGE_PR_TIMEOUT:-1800}"
waited=0

while :; do
  checks=$(gh pr checks "$pr" --repo "$repo" --json name,bucket --jq '.[] | "\(.name) \(.bucket)"' 2>/dev/null || true)
  missing=""
  pending=""
  failed=""
  for name in $required; do
    bucket=$(printf '%s\n' "$checks" | awk -v n="$name" '$1 == n { print $2 }' | tail -1)
    case "$bucket" in
      pass) ;;
      "") missing="$missing $name" ;;
      pending) pending="$pending $name" ;;
      *) failed="$failed $name($bucket)" ;;
    esac
  done
  if [ -n "$failed" ]; then
    echo "PR #$pr has failing checks:$failed" >&2
    exit 1
  fi
  if [ -z "$missing" ] && [ -z "$pending" ]; then
    break
  fi
  if [ "$waited" -ge "$timeout" ]; then
    echo "PR #$pr: checks not reported after ${timeout}s; not merged. missing:$missing pending:$pending" >&2
    exit 1
  fi
  echo "PR #$pr: waiting on checks. missing:$missing pending:$pending"
  sleep 20
  waited=$((waited + 20))
done

echo "PR #$pr: every required check passed; merging."
gh pr merge "$pr" --repo "$repo" --merge
