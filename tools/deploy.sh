#!/bin/bash

function deploy() {
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
  local repo_ref=$repo_interfaces/Referral-App

  local web_root=$GLOBAL_121_WEB_ROOT
  local pa_dir=$GLOBAL_121_PA_DIR
  local ho_dir=$GLOBAL_121_HO_DIR
  local aw_dir=$GLOBAL_121_AW_DIR
  local ref_dir=$GLOBAL_121_REF_DIR

  # Arguments
  local target=$1 || false

  function log() {
    printf "\n\n"
    # highlight/warn:
    tput setaf 3
    echo "$@"
    printf "\n"
    # reset highlight/warn:
    tput sgr0
  }

  function clear_version() {
    # Remove version, during deployment:
    echo 'Deployment in progress...' | sudo tee "$web_root/VERSION.txt"

    log "Version cleared during deployment"
  }

  function update_code() {
    log "Updating code..."
    local target=$1 || false

    cd "$repo" || return
    sudo git reset --hard
    sudo git fetch --all --tags

    # When a target is provided, checkout that
    if [[ -n "$target" ]]
    then
      log "Checking out: $target"

      sudo git checkout -b "$target" --track upstream/"$target"
    else
      log "Pulling latest changes"

      sudo git pull --ff-only
    fi
  }

  function build_services() {
    log "Updating/building services..."

    cd "$repo_services" || return
    sudo docker-compose up -d --build
    sudo docker restart 121-service PA-accounts-service
  }

  function build_interface() {
    local app=$1
    local repo_path=$2
    local base_href="/$3/"

    log "Building interface $app..."

    cd "$repo_path" || return

    # When a target is provided, create a clean environment
    if [[ -n "$target" ]]
    then
      sudo npm ci --unsafe-perm --no-audit --no-fund
    else
      sudo npm install --unsafe-perm --no-audit --no-fund
    fi

    sudo npm run build -- --prod --base-href="$base_href"
  }

  function deploy_interface() {
    local app=$1
    local repo_path=$2
    local web_app_dir=$3

    log "Deploying interface $app..."

    cd "$repo_path" || return
    sudo rm -rf "$web_root/$web_app_dir"
    sudo cp -r www/ "$web_root/$web_app_dir"
  }

  function restart_webhook_service() {
    sudo service webhook restart

    log "Webhook service restarted: "
  }

  function update_version() {
    # Store version, accessible via web:
    sudo git describe --tags --dirty --broken | sudo tee "$web_root/VERSION.txt"

    log "Deployed: "
    cat "$web_root/VERSION.txt"
  }


  #
  # Actual deployment:
  #
  clear_version

  update_code "$target"

  build_services

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
}

deploy "$@"
