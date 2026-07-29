#!/usr/bin/env bash
#
# Warn when '.env.example' files are staged, so secrets aren't leaked unintentionally.
# Prompts the committer to consciously confirm the change before continuing.
#

ORANGE='\033[0;33m'
NC='\033[0m' # No Color

log() {
  printf "${ORANGE}[pre-commit]${NC} %s\n" "$1"
}

staged_env_examples="$(git diff --staged --name-only --diff-filter=d | grep -E '(^|/)\.env\.example$' || true)"

if [ -z "$staged_env_examples" ]; then
  exit 0
fi

log "You are about to commit changes to the following '.env.example' file(s):"
printf '  - %s\n' $staged_env_examples
log "Make sure these contain ONLY placeholders, not real secrets."

if [ -e /dev/tty ] && [ -r /dev/tty ]; then
  printf "${ORANGE}[pre-commit]${NC} Continue with the commit? [y/N] "
  read -r reply < /dev/tty
  case "$reply" in
    [Yy]*) log "Confirmed. Continuing." ;;
    *)     log "Aborted by user."; exit 1 ;;
  esac
else
  log "Non-interactive shell detected; skipping confirmation prompt."
fi
