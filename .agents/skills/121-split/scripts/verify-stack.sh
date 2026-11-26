#!/usr/bin/env bash
# Usage: verify-stack.sh <original-branch> <last-stack-branch>
# Fails if the tip of the stack differs from the original branch.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

original="${1:?original branch required}"
tip="${2:?last stack branch required}"

if git diff --quiet "$original" "$tip"; then
  echo "OK: $tip is tree-identical to $original"
else
  echo "MISMATCH: files differing between $original and $tip:"
  git diff --stat "$original" "$tip"
  exit 1
fi
