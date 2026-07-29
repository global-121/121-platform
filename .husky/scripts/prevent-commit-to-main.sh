#!/usr/bin/env bash
#
# Prevent committing directly to the "main" branch.
#

ORANGE='\033[0;33m'
NC='\033[0m' # No Color

log() {
  printf "${ORANGE}[pre-commit]${NC} %s\n" "$1"
}

if [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ]; then
  log "You shouldn't commit directly to the main branch."
  log "Create a feature branch:  git branch new-branch-name"
  log "Then reset 'main':        git reset --hard origin/main"
  log "And continue to work:     git checkout new-branch-name"
  exit 1
fi
