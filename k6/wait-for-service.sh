#!/usr/bin/env bash
set -e

URL="http://localhost:3000/api/health/health"
TIMEOUT=120
INTERVAL=2
ELAPSED=0

echo "Waiting for API at $URL to be ready..."

until curl -fsS "$URL" > /dev/null; do
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Timeout waiting for API at $URL"
    exit 1
  fi
done

echo "API is up!"
