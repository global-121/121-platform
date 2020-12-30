#!/bin/bash

function deploy() {
  # Ensure we always start from the repository root-folder
  local repo
  repo=$(git rev-parse --show-toplevel)
  cd "$repo" || return

  # Load ENV-variables
  set -a; [ -f ./tools/.env ] && . ./tools/.env; set +a;

  # Variables
  local log_file=$GLOBAL_121_DEPLOY_LOG_FILE
  local repo_services=$repo/services
  local repo_interfaces=$repo/interfaces
  local repo_pa=$repo_interfaces/PA-App
  local repo_ho=$repo_interfaces/HO-Portal
  local repo_aw=$repo_interfaces/AW-App
  local repo_ref=$repo_interfaces/Referral-App

  local web_root=$GLOBAL_121_WEB_ROOT
  local pa_dir=$GLOBAL_121_PA_DIR
  local ho_dir=$GLOBAL_121_HO_DIR
  local aw_dir=$GLOBAL_121_AW_DIR
  local ref_dir=$GLOBAL_121_REF_DIR

  # Arguments
  local target=$1 || false

  ###########################################################################

  function log() {
    printf "\n\n"
    echo "------------------------------------------------------------------------------"
    echo " " "$@"
    echo "------------------------------------------------------------------------------"
    printf "\n"
  }

  function setup_log_file() {
    # If a log-file is specified in the ENV-variable
    # Output all STDOUT and STDERR to file AND to console
    if [[ -n "$log_file" ]]
    then
      touch "$log_file"
      # All output to one file and all output to the screen
      exec > >(tee "$log_file") 2>&1
    fi
  }

  function clear_version() {
    # Remove version, during deployment:
    echo 'Deployment in progress...' | tee "$web_root/VERSION.txt"

    log "Version cleared during deployment"
  }

  function update_code() {
    log "Updating code..."
    local target=$1 || false

    cd "$repo" || return
    git reset --hard
    git fetch --all --tags

    # When a target is provided, checkout that
    if [[ -n "$target" ]]
    then
      log "Checking out: $target"

      git checkout -b "$target" --track upstream/"$target"
    else
      log "Pulling latest changes"

      git pull --ff-only
    fi
  }

  function build_services() {
    log "Updating/building services..."

    cd "$repo_services" || return
    docker-compose stop
    docker-compose up -d --build
  }

  function cleanup_services() {
    log "Cleaning up services..."

    cd "$repo_services" || return
    docker image prune --filter "until=168h" --force
  }

  function build_interface() {
    local app=$1
    local repo_path=$2
    local base_href=$3

    if [[ -z "$base_href" ]]
    then
      log "Skipped building interface $app... Target directory not defined."
      return
    fi

    log "Building interface $app..."

    cd "$repo_path" || return

    # When a target is provided, create a clean environment
    if [[ -n "$target" ]]
    then
      npm ci --unsafe-perm --no-audit --no-fund
    else
      npm install --unsafe-perm --no-audit --no-fund
    fi

    npm run build -- --prod --base-href="/$base_href/"
  }

  function deploy_interface() {
    local app=$1
    local repo_path=$2
    local web_app_dir=$3

    if [[ -z "$3" ]]
    then
      log "Skipped deploying interface $app... Target directory not defined."
      return
    fi

    log "Deploying interface $app..."

    cd "$repo_path" || return
    rm -rfv "${web_root:?}/$web_app_dir"
    cp -rv www/ "$web_root/$web_app_dir"
  }

  function restart_webhook_service() {
    service webhook restart

    log "Webhook service restarted: "
  }

  function update_version() {
    # Store version, accessible via web:
    git describe --tags --dirty --broken | tee "$web_root/VERSION.txt"

    log "Deployed: "
    cat "$web_root/VERSION.txt"
  }


  #
  # Actual deployment:
  #
  setup_log_file

  clear_version

  update_code "$target"

  build_services
  cleanup_services

  build_interface "PA-App" "$repo_pa" "$pa_dir"
  deploy_interface "PA-App" "$repo_pa" "$pa_dir"

  build_interface "AW-App" "$repo_aw" "$aw_dir"
  deploy_interface "AW-App" "$repo_aw" "$aw_dir"

  build_interface "HO-Portal" "$repo_ho" "$ho_dir"
  deploy_interface "HO-Portal" "$repo_ho" "$ho_dir"

  build_interface "Referral-App" "$repo_ref" "$ref_dir"
  deploy_interface "Referral-App" "$repo_ref" "$ref_dir"

  update_version

  restart_webhook_service

  log "Done."

  # Return to start:
  cd "$repo" || return
}

deploy "$@"
