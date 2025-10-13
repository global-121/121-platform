#!/bin/bash
set -eo pipefail

# Performance test runner script
# This script runs performance tests sequentially, restarting services between tests
# Similar to k6/run-all-tests.sh but for Jest

# Array to collect failed tests
failed_tests=()

# Performance test files to run
test_files=(test/performance/*.test.ts)

echo "Found the following performance test files to run:"

for file in "${test_files[@]}"; do
  echo " - ${file}"
done

# new line
echo ""

for file in "${test_files[@]}"; do
  echo "::group::Running performance test: ${file}"

  test_name=$(basename "${file}" .test.ts)
  echo "Creating log directory"
  log_dir="${PWD}/logs/${test_name}"
  mkdir -p "${log_dir}"

  echo "Starting services"
  (cd ../services || exit 1 ; docker --log-level 'warn' compose -f docker-compose.yml up -d --quiet-pull --wait --wait-timeout 300)

  echo "Running Jest performance test"
  # Run specific test file with integration test configuration
  npm run test:integration:all -- --testPathPattern="${file}" --verbose
  exit_code=$?

  # Check exit code
  if [[ $exit_code -ne 0 ]]; then
      failed_tests+=("${file}")
  fi

  echo "Collecting logs in ${log_dir}"
  (cd ../services || exit 1; docker compose -f docker-compose.yml logs 121-service > "${log_dir}/121-service.log")
  (cd ../services || exit 1; docker compose -f docker-compose.yml logs > "${log_dir}/all-services.log")

  echo "Stopping services"
  (cd ../services || exit 1; docker compose -f docker-compose.yml down)

  echo "::endgroup::"
done

# new line
echo ""

# Check if there were any failed tests
if [[ ${#failed_tests[@]} -ne 0 ]]; then
  echo "The following tests failed:"
  for test in "${failed_tests[@]}"; do
    echo "${test}"
  done
  exit 1
else
  echo "All performance tests passed successfully."
fi

# new line
echo ""

echo "Logs are available in the artifact section (below) if running in CI, or in the logs directory: ${PWD}/logs"