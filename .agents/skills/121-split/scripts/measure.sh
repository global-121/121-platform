#!/usr/bin/env bash
# Usage: measure.sh <base> <branch>
# Prints changed lines per file (excluding generated files) and the total.
set -euo pipefail

base="${1:?base ref required}"
branch="${2:?branch required}"

git diff --numstat "$base" "$branch" -- . \
  ':(exclude)interfaces/portal/src/locale/messages.xlf' \
  ':(exclude)services/121-service/module-dependencies.md' \
  ':(exclude)**/package-lock.json' \
  ':(exclude)**/__snapshots__/**' \
  ':(exclude)**/*.snap' |
  awk '{ lines = ($1 == "-" ? 0 : $1) + ($2 == "-" ? 0 : $2); total += lines; printf "%6d  %s\n", lines, $3 }
       END { printf "%6d  TOTAL (excluding generated files)\n", total }'
