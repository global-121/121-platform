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
    local from=$2
    local to=$3

    log "Comparing shared file: $path..."

    diff --recursive --unified $from/$path $to/$path | diff-so-fancy
  }

  compare_code "_set-env-variables.js" "$repo_pa" "$repo_aw"
  compare_code "_set-env-variables.js" "$repo_pa" "$repo_ho"
  compare_code "_convert-styles-to-async.js" "$repo_pa" "$repo_aw"
  compare_code "ngx-translate-lint.config.json" "$repo_pa" "$repo_aw"

  compare_code "src/app/shared/dialogue-turn/" "$repo_pa" "$repo_aw"
  compare_code "src/app/shared/q-and-a-set/" "$repo_pa" "$repo_aw"
  compare_code "src/app/shared/qr-scanner/" "$repo_pa" "$repo_aw"
  compare_code "src/app/shared/date-input/" "$repo_pa" "$repo_aw"
  compare_code "src/app/shared/numeric-input/" "$repo_pa" "$repo_aw"
  compare_code "src/app/shared/phone-number-input/" "$repo_pa" "$repo_aw"

  compare_code "src/app/directives/only-allowed-input.directive.ts" "$repo_pa" "$repo_aw"
  compare_code "src/app/directives/only-allowed-input.directive.spec.ts" "$repo_pa" "$repo_aw"
  compare_code "src/app/directives/only-allowed-input.directive.ts" "$repo_pa" "$repo_ho"
  compare_code "src/app/directives/only-allowed-input.directive.spec.ts" "$repo_pa" "$repo_ho"

  compare_code "src/app/services/jwt.service.ts" "$repo_pa" "$repo_aw"
  compare_code "src/app/services/jwt.service.ts" "$repo_pa" "$repo_ho"
  compare_code "src/app/services/api.service.ts" "$repo_pa" "$repo_aw"
  compare_code "src/app/services/api.service.ts" "$repo_pa" "$repo_ho"
  compare_code "src/app/services/translatable-string.service.ts" "$repo_pa" "$repo_aw"
  compare_code "src/app/services/translatable-string.service.spec.ts" "$repo_pa" "$repo_aw"
  compare_code "src/app/services/translatable-string.service.ts" "$repo_pa" "$repo_ho"
  compare_code "src/app/services/translatable-string.service.spec.ts" "$repo_pa" "$repo_ho"

  compare_code ".editorconfig" "$repo_pa" "$repo_aw"
  compare_code ".editorconfig" "$repo_pa" "$repo_ho"
  compare_code ".prettierignore" "$repo_pa" "$repo_aw"
  compare_code ".prettierignore" "$repo_pa" "$repo_ho"
  compare_code ".prettierrc.yml" "$repo_pa" "$repo_aw"
  compare_code ".prettierrc.yml" "$repo_pa" "$repo_ho"
  compare_code "tslint.json" "$repo_pa" "$repo_aw"
  compare_code "tslint.json" "$repo_pa" "$repo_ho"
  compare_code "tsconfig.json" "$repo_pa" "$repo_aw"
  compare_code "tsconfig.json" "$repo_pa" "$repo_ho"
  compare_code "src/tsconfig.app.json" "$repo_pa" "$repo_aw"
  compare_code "src/tsconfig.app.json" "$repo_pa" "$repo_ho"
  compare_code "src/tsconfig.spec.json" "$repo_pa" "$repo_aw"
  compare_code "src/tsconfig.spec.json" "$repo_pa" "$repo_ho"
  compare_code "src/tslint.json" "$repo_pa" "$repo_aw"
  compare_code "src/tslint.json" "$repo_pa" "$repo_ho"

  log "Done."
}

check_shared_code
