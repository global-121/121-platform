#!/bin/bash


for i in {1..30}; do
  if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "API is up!";
    exit 0;
  fi
  echo "Waiting for API...";
  sleep 2
done
echo "API did not start in time";
exit 1
