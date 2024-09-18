#!/usr/bin/env bash

#
# See: https://dev.to/nandorholozsnyak/local-development-environments-per-git-branches-with-docker-compose-2k6o
#

GIT_BRANCH=${1:-$(git branch --show-current | sed 's/[^[:alnum:]]/_/g')}
NAME="121_platform_$GIT_BRANCH"
echo "Stopping with name: $NAME"
docker compose --project-name="$NAME" stop
