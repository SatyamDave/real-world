#!/usr/bin/env bash
# Push the exported day records in $RW_HOME/receipts to the public git mirror (product/receipts.md).
#
# Usage: RECEIPTS_MIRROR_REMOTE=<git url, token included> scripts/mirror_receipts.sh
#
# The remote URL is passed on each command and never written to $RW_HOME/mirror/.git/config,
# so the token stays out of the working copy.
set -euo pipefail

if [ -z "${RECEIPTS_MIRROR_REMOTE:-}" ]; then
  echo "receipts mirror off: RECEIPTS_MIRROR_REMOTE is not set"
  exit 0
fi
remote="$RECEIPTS_MIRROR_REMOTE"
home="${RW_HOME:-var}"
mirror="$home/mirror"

shopt -s nullglob
all=("$home"/receipts/*.json)
files=()
if [ ${#all[@]} -gt 0 ]; then
  fixtures=$(uv run --quiet python -m rw.ledger fixture "${all[@]}")
  for f in "${all[@]}"; do
    grep -qxF "$f" <<< "$fixtures" || files+=("$f")
  done
fi
if [ ${#files[@]} -eq 0 ]; then
  echo "no receipts to mirror in $home/receipts; fixture days are never mirrored" >&2
  exit 1
fi

# A tampered day must not reach the public repo; one failure refuses the whole push.
uv run --quiet python -m rw.ledger check-export "${files[@]}" || {
  echo "refusing to push: a receipt failed its own check" >&2
  exit 1
}

export GIT_TERMINAL_PROMPT=0
[ -d "$mirror/.git" ] || git init -q -b main "$mirror"
# Exit 2 means the remote has no main branch yet: the first push creates it.
if git ls-remote --exit-code "$remote" refs/heads/main > /dev/null; then
  git -C "$mirror" fetch -q "$remote" main
  git -C "$mirror" reset -q --hard FETCH_HEAD
else
  code=$?
  [ "$code" -eq 2 ] || exit "$code"
fi

mkdir -p "$mirror/receipts"
for f in "${files[@]}"; do
  dest="$mirror/receipts/$(basename "$f")"
  if [ -e "$dest" ] && ! cmp -s "$f" "$dest"; then
    echo "refusing to push: $(basename "$f") differs from the mirrored copy" >&2
    exit 1
  fi
  cp "$f" "$dest"
done

git -C "$mirror" add receipts
if git -C "$mirror" diff --cached --quiet; then
  echo "receipts mirror: nothing new"
  exit 0
fi
last=$(basename "${files[${#files[@]} - 1]}" .json)
git -C "$mirror" -c user.name="Real World receipts" -c user.email="receipts@localhost" \
  commit -q -m "chore: receipts through $last"
git -C "$mirror" push -q "$remote" HEAD:main
echo "receipts mirror: pushed receipts through $last"
