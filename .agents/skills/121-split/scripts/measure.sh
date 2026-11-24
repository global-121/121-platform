#!/usr/bin/env bash
# Usage: measure.sh <base> <branch>
# Prints changed lines per file (excluding generated files) and the total.
# A rename shows as one line, e.g. "src/{old.ts => new.ts}", counting only the changed lines.
# Keep the excludes in sync with references/grouping-heuristics.md.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${1:?base ref required}"
branch="${2:?branch required}"

git -c core.quotePath=false diff --numstat "$base" "$branch" -- . \
  ':(exclude)interfaces/portal/src/locale/messages.xlf' \
  ':(exclude)services/121-service/module-dependencies.md' \
  ':(exclude,glob)**/package-lock.json' \
  ':(exclude,glob)**/__snapshots__/**' \
  ':(exclude,glob)**/*.snap' |
  awk -F'\t' '{ lines = ($1 == "-" ? 0 : $1) + ($2 == "-" ? 0 : $2); total += lines; printf "%6d  %s\n", lines, $3 }
       END { printf "%6d  TOTAL (excluding generated files)\n", total }'
