#!/bin/bash

# Check if both branch names are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: Missing branch name(s)."
  echo "Usage: ./services/121-service/src/migration/test-migration.sh <old-branch-name> <new-branch-name> [<docker-name-of-database> (optional)] [<docker-name-121-service> (optional)]"
  echo "Example: ./services/121-service/src/migration/test-migration.sh main feat.new-awesome-entity"
  echo "Optional: ./services/121-service/src/migration/test-migration.sh old-branch-name new-branch-name custom-db-name custom-service-name"
  echo "Note:"
  echo "  - This script must be run from the root of the 121-platform repository"
  echo "  - Ensure you have an uncommitted migration script in the migrations folder before running this script"
  exit 1
fi
# Set default values for Docker container names if not provided
DOCKER_DB_NAME=${3:-'121db'}
DOCKER_SERVICE_NAME=${4:-'121-service'}

# Source the .env file to get the environment variables
source ./services/.env

# Check for local changes and stash them if present
STASH_NAME="automated-pre-migration-stash"
git stash push -u -m "$STASH_NAME"


# Checkout to the old branch
git checkout "$1"

# Stop the specified Docker containers
docker stop "$DOCKER_SERVICE_NAME"
docker stop "$DOCKER_DB_NAME"

# Remove the specified Docker container
docker rm "$DOCKER_DB_NAME"

# Start the specified Docker container to apply the migration and load some data, then stop it again
npm run start:services:detach

# Wait until the service is up or timeout after 1 minute
timeout=60
elapsed=0
interval=2

until [ $(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT_121_SERVICE}/api/health/health") -eq 200 ]; do
  if [ $elapsed -ge $timeout ]; then
    echo "Error: Service did not start within $timeout seconds."
  fi
  echo "Waiting for the service to be up..."
  sleep $interval
  elapsed=$((elapsed + interval))
done


curl -X 'POST' \
  "http://localhost:${PORT_121_SERVICE}/api/scripts/reset?mockPv=true&mockOcw=true&isApiTests=false&script=nlrc-multiple-mock-data" \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d "{
  \"secret\": \"${RESET_SECRET}\"
}"

docker stop "$DOCKER_SERVICE_NAME"

# Checkout to the new branch
git checkout "$2"

# Apply stashed changes by name
STASH_REF=$(git stash list | grep "$STASH_NAME" | head -n 1 | awk -F: '{print $1}')
if [ -n "$STASH_REF" ]; then
  git stash pop "$STASH_REF"
else
  echo "Error: Could not find stash with name '$STASH_NAME'"
  exit 1
fi

# Start the specified Docker container
docker start "$DOCKER_SERVICE_NAME"
