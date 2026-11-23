#!/usr/bin/env bash
# Usage: baseline-typecheck.sh <base>
# Run on the checked-out original branch. Typechecks every package touched by the
# diff against <base> and prints labelled results plus a final verdict line
# (CLEAN or ERRORS_EXIST). Errors found here exist on the original branch and are
# not caused by the split.
set -uo pipefail

base="${1:?base ref required}"
packages=("services/121-service" "services/mock-service" "interfaces/portal")
failed=0

for package in "${packages[@]}"; do
  if [ -z "$(git diff --name-only "$base" HEAD -- "$package")" ]; then
    continue
  fi

  echo "package:      $package"
  output="$(cd "$package" && npm run typecheck 2>&1)"
  status=$?
  errors="$(printf '%s\n' "$output" | grep -E 'error TS[0-9]+' | sed "s#^#  - $package/#")"

  if [ "$status" -eq 0 ]; then
    echo "status:       OK"
    continue
  fi

  failed=1
  echo "status:       FAILED"
  if [ -n "$errors" ]; then
    echo "errors:"
    printf '%s\n' "$errors"
  else
    echo "errors:       none parsed (tooling or environment problem, e.g. missing dependencies)"
  fi
done

if [ "$failed" -eq 0 ]; then
  echo "verdict:      CLEAN"
else
  echo "verdict:      ERRORS_EXIST"
fi
