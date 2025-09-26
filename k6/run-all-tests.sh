#!/bin/bash

# Array to collect failed tests
failed_tests=()

# Check if filenames are provided as arguments
if [[ "$#" -eq 0 ]]; then
  # No filenames provided, run all tests
  test_files=(tests/*.js)
else
  # Use provided filenames
  test_files=("$@")
fi

for file in "${test_files[@]}"; do
  echo "Test: ${file}"
  echo "Starting services"
  (cd ../services || exit 1 ; docker --log-level 'warn' compose -f docker-compose.yml up -d --quiet-pull --wait --wait-timeout 300)
  echo "Running k6 test"
  npx dotenv -e ../services/.env -- ./k6 run --summary-export=summary.json "${file}"

  # Log the contents of summary.json for debugging
  echo "Contents of summary.json:"
  cat summary.json
  # XXX: fix when summary.json doesn't have "checks" key
  HAS_FAILURE=$(jq '.metrics.checks.fails' summary.json)
  # Check if there are any failed checks
  if [[ ${HAS_FAILURE} -gt 0 ]]; then
      echo "Test failed: ${file}"
      failed_tests+=("${file}")
  fi
done

# Check if there were any failed tests
if [[ ${#failed_tests[@]} -ne 0 ]]; then
  echo "The following tests failed:"
  for test in "${failed_tests[@]}"; do
    echo "${test}"
  done
  exit 1
else
  echo "All tests passed successfully."
fi
