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

  local web_root=$GLOBAL_121_WEB_ROOT
  local pa_dir=$GLOBAL_121_PA_DIR
  local ho_dir=$GLOBAL_121_HO_DIR
  local aw_dir=$GLOBAL_121_AW_DIR

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

  function set_version {
    version="$(git describe --tags --dirty --broken)"
    export GLOBAL_121_VERSION=$version

    log "Deploying version: $version"
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

  function enable_maintenance_mode() {
    log "Enable Maintenance-mode..."

    touch "$web_root/.maintenance"
  }

  function disable_maintenance_mode() {
    log "Disable Maintenance-mode..."

    rm "$web_root/.maintenance"
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

    npm install --unsafe-perm --no-audit --no-fund --production

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
    rm -rf "${web_root:?}/$web_app_dir"
    cp -r www/ "$web_root/$web_app_dir"
  }

  function restart_webhook_service() {
    service webhook restart

    log "Webhook service restarted: "
  }

  function publish_version() {
    # Store version, accessible via web:
    echo "$GLOBAL_121_VERSION" | tee "$web_root/VERSION.txt"

    log "Deployed: $GLOBAL_121_VERSION"
  }


  #
  # Actual deployment:
  #
  setup_log_file

  clear_version

  update_code "$target"

  set_version

  enable_maintenance_mode
  build_services
  disable_maintenance_mode
  cleanup_services

  build_interface "PA-App" "$repo_pa" "$pa_dir"
  deploy_interface "PA-App" "$repo_pa" "$pa_dir"

  build_interface "AW-App" "$repo_aw" "$aw_dir"
  deploy_interface "AW-App" "$repo_aw" "$aw_dir"

  build_interface "HO-Portal" "$repo_ho" "$ho_dir"
  deploy_interface "HO-Portal" "$repo_ho" "$ho_dir"

  publish_version

  restart_webhook_service

  log "Done."

  # Return to start:
  cd "$repo" || return
}

deploy "$@"
