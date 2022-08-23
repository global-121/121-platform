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

  ${GLOBAL_121_STATUS_URL:="http://localhost:3000/docs/"}
  local services_status_url=$GLOBAL_121_STATUS_URL

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

  function get_help() {
    cat <<END

-----------------------------------------------------------------------------
 Deploy Script options:
-----------------------------------------------------------------------------

* Full deploy of latest:                        $0

* Full deploy of target branch "release/v2":    $0 release/v2

* Only deploy the back-end service(s):          $0 --only-services

* Only deploy a specific interface:             $0 --only-interface pa

* See this help:                                $0 --help

-----------------------------------------------------------------------------
END
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

  function disable_maintenance_mode_when_done() {
    log "Waiting for services to disable Maintenance-mode..."

    cd "$repo" || return

    if [[ -e "./tools/wait-for.sh" ]];
    then
      # Run status check in a parallel process...
      (
        ./tools/wait-for.sh "$services_status_url" -- rm "$web_root/.maintenance"
      ) &
    else
      disable_maintenance_mode
    fi
  }

  function build_services() {
    log "Updating/building services..."

    cd "$repo_services" || return

    docker-compose up -d --build
  }

  function cleanup_services() {
    log "Cleaning up services..."

    cd "$repo_services" || return
    docker image prune --filter "until=168h" --force
  }

  function do_services() {
    enable_maintenance_mode
    build_services
    disable_maintenance_mode_when_done
    cleanup_services
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

    npm install --unsafe-perm --no-audit --no-fund

    npm run build:prod -- --base-href="/$base_href/"
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

  function do_interface() {
    local interface=$1

    if [[ $interface == 'aw' ]];
    then
      log "Deploying interface: AW-App"
      build_interface "AW-App" "$repo_aw" "$aw_dir"
      deploy_interface "AW-App" "$repo_aw" "$aw_dir"

    elif [[ $interface == 'pa' ]];
    then
      log "Deploying interface: PA-App"
      build_interface "PA-App" "$repo_pa" "$pa_dir"
      deploy_interface "PA-App" "$repo_pa" "$pa_dir"

    elif [[ $interface == 'ho' ]];
    then
      log "Deploying interface: HO-Portal"
      build_interface "HO-Portal" "$repo_ho" "$ho_dir"
      deploy_interface "HO-Portal" "$repo_ho" "$ho_dir"

    else
      log "Invalid interface name. Use: aw | pa | ho "
      exit 1
    fi
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

  function do_deployment() {
    local target=$1

    log "Doing a deployment with target: $target"
    setup_log_file

    clear_version
    update_code "$target"
    set_version

    do_services

    do_interface "pa"
    do_interface "aw"
    do_interface "ho"

    wait # Make sure the status-check has finised

    publish_version

    log "Done."

    # Return to start:
    cd "$repo" || return

    # Restart as the final step because it will kill the process running this script
    restart_webhook_service
  }

  ###########################################################################

  # Check command-line options/flags:
  while [[ "$1" =~ ^- && ! "$1" == "--" ]];
    do case $1 in
      -h | --help )
        get_help
        exit 0
        ;;
      --only-interface )
        shift;
        local onlyInterface=$1
        do_interface "$onlyInterface"
        exit 0
        ;;
      --only-services )
        shift;
        do_services
        exit 0
        ;;
    esac;
    shift;
  done
  if [[ "$1" == '--' ]];
  then
    shift;
  fi

  # If no options provided, do a full deployment:
  do_deployment "$target"
  exit 0

}

deploy "$@"
