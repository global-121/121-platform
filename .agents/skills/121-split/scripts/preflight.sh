#!/usr/bin/env bash
# Usage: preflight.sh [target-ref]
# Prints labelled preflight facts and a final verdict line (READY or BLOCKED).
# target-ref is what the original branch will be merged into (default: origin/main).
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

target="${1:-origin/main}"

if ! git rev-parse --verify --quiet "$target^{commit}" >/dev/null; then
  echo "verdict:        BLOCKED"
  echo "  - $target does not exist locally: fetch it first (ask the user)"
  exit 0
fi

branch="$(git branch --show-current)"
sha="$(git rev-parse HEAD)"
dirty_count="$(git status --porcelain | wc -l | tr -d ' ')"
base="$(git merge-base "$target" HEAD)"
behind_target="$(git rev-list --count "HEAD..$target")"
target_updated="$(git log --walk-reflogs -1 --date=relative --format=%gd "$target" 2>/dev/null | sed -E 's/.*@\{(.*)\}/\1/')"

echo "branch:         ${branch:-<detached HEAD>}"
echo "sha:            $sha"
echo "target:         $target"
echo "target updated: ${target_updated:-unknown} (local ref; not fetched by this script)"
echo "base:           $base"
echo "dirty files:    $dirty_count"
echo "behind target:  $behind_target"

blockers=()
[ -z "$branch" ] && blockers+=("detached HEAD: check out a named branch")
[ "$dirty_count" != "0" ] && blockers+=("working tree is dirty ($dirty_count files)")

if [ "${#blockers[@]}" -eq 0 ]; then
  echo "verdict:        READY"
  if [ "$behind_target" != "0" ]; then
    echo "warning:        branch is $behind_target commits behind $target; the PRs may need a rebase later"
  fi
else
  echo "verdict:        BLOCKED"
  for blocker in "${blockers[@]}"; do
    echo "  - $blocker"
  done
fi
