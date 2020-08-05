#!/bin/bash

#
# Utility script to quickly show differences between pieces of code that are shared(copied!) between interfaces
#
# Requirements:
#  - diff (comes pre-installed on macOS)
#  - diff-so-fancy (see: https://github.com/so-fancy/diff-so-fancy)
#
function check_shared_code() {
  # Ensure we always start from the repository root-folder
  local repo
  repo=$(git rev-parse --show-toplevel)
  cd "$repo" || return

  # Load ENV-variables
  set -a; [ -f ./tools/.env ] && . ./tools/.env; set +a;

  # Variables
  local repo_services=$repo/services
  local repo_interfaces=$repo/interfaces
  local repo_pa=$repo_interfaces/PA-App
  local repo_ho=$repo_interfaces/HO-Portal
  local repo_aw=$repo_interfaces/AW-App

  function log() {
    printf "\n\n"
    # highlight/warn:
    tput setaf 3
    echo "$@"
    printf "\n"
    # reset highlight/warn:
    tput sgr0
  }


  function compare_code() {
    local path=$1

    log "Comparing shared file: $path..."

    diff --recursive --unified $repo_pa/$path $repo_aw/$path | diff-so-fancy
  }

  compare_code "src/app/shared/dialogue-turn/"
  compare_code "src/app/shared/q-and-a-set/"
  compare_code "src/app/shared/qr-scanner/"
  compare_code "src/app/shared/numeric-input/"
  compare_code "src/app/shared/phone-number-input/"

  compare_code "src/app/services/jwt.service.*"
  compare_code "src/app/services/api.service.*"
  compare_code "src/app/services/translatable-string.*"

  compare_code ".editorconfig"
  compare_code ".prettierignore"
  compare_code ".prettierrc.yml"

  log "Done."
}

check_shared_code
