#!/usr/bin/env bash
# Usage: preflight.sh
# Prints labelled preflight facts and a final verdict line (READY or BLOCKED).
set -uo pipefail

branch="$(git branch --show-current)"
sha="$(git rev-parse HEAD)"
dirty_count="$(git status --porcelain | wc -l | tr -d ' ')"
base="$(git merge-base origin/main HEAD)"
behind_main="$(git rev-list --count HEAD..origin/main)"

echo "branch:       ${branch:-<detached HEAD>}"
echo "sha:          $sha"
echo "base:         $base"
echo "dirty files:  $dirty_count"
echo "behind main:  $behind_main"

blockers=()
[ -z "$branch" ] && blockers+=("detached HEAD: check out a named branch")
[ "$dirty_count" != "0" ] && blockers+=("working tree is dirty ($dirty_count files)")
[ "$behind_main" != "0" ] && blockers+=("branch is $behind_main commits behind origin/main (ask the user: rebase first or continue)")

if [ "${#blockers[@]}" -eq 0 ]; then
  echo "verdict:      READY"
else
  echo "verdict:      BLOCKED"
  for blocker in "${blockers[@]}"; do
    echo "  - $blocker"
  done
fi
