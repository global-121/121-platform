#!/usr/bin/env bash
# Usage: check-touched-packages.sh <base>
# Compares the working tree against <base> and, for every package it touches,
# runs the same checks as the pre-commit hook: a full typecheck and eslint on the
# changed files. Prints labelled results plus a final verdict line (CLEAN or
# ERRORS_EXIST).
# - On the original branch this is the baseline: errors that are not caused by
#   the split.
# - On a chunk, before committing: any error missing from the baseline is caused
#   by the split.
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"

base="${1:?base ref required}"
packages=("services/121-service" "services/mock-service" "interfaces/portal" "e2e")
environment_problem="none parsed (tooling or environment problem, e.g. missing dependencies)"
failed=0

report_typecheck() {
  local package="$1" output status errors
  output="$(cd "$package" && npm run typecheck 2>&1)"
  status=$?

  if [ "$status" -eq 0 ]; then
    echo "typecheck:    OK"
    return
  fi

  failed=1
  echo "typecheck:    FAILED"
  errors="$(printf '%s\n' "$output" | grep -E 'error TS[0-9]+' | sed "s#^#  - $package/#")"
  if [ -n "$errors" ]; then
    printf '%s\n' "$errors"
  else
    echo "  - $environment_problem"
  fi
}

report_lint() {
  local package="$1" extensions='ts|js|mjs' files=() file output status errors
  if [ "$package" = "interfaces/portal" ]; then
    extensions="$extensions|html"
  fi

  while IFS= read -r file; do
    files+=("${file#"$package"/}")
  done < <(git diff --name-only --diff-filter=d "$base" -- "$package" | grep -E "\.($extensions)$")

  if [ "${#files[@]}" -eq 0 ]; then
    echo "lint:         OK (no lintable files changed)"
    return
  fi

  output="$(cd "$package" && npx eslint --quiet --cache "${files[@]}" 2>&1)"
  status=$?

  if [ "$status" -eq 0 ]; then
    echo "lint:         OK"
    return
  fi

  failed=1
  echo "lint:         FAILED"
  errors="$(printf '%s\n' "$output" | grep -E "^$root/" | sed "s#^$root/#  - #")"
  if [ -n "$errors" ]; then
    printf '%s\n' "$errors"
  else
    echo "  - $environment_problem"
  fi
}

for package in "${packages[@]}"; do
  if [ -z "$(git diff --name-only "$base" -- "$package")" ]; then
    continue
  fi

  echo "package:      $package"
  report_typecheck "$package"
  report_lint "$package"
done

if [ "$failed" -eq 0 ]; then
  echo "verdict:      CLEAN"
else
  echo "verdict:      ERRORS_EXIST"
fi
