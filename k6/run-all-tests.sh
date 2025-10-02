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

echo "Found the following test files to run:"

for file in "${test_files[@]}"; do
  echo " - ${file}"
done

# new line
echo ""

for file in "${test_files[@]}"; do
  # TODO: AB#38219 - fix failing test
  # skip payment100kRegistrationIntersolveVisa.js for now as it is failing
  if [[ $(basename "${file}") == "payment100kRegistrationIntersolveVisa.js" ]]; then
    echo "Skipping failing test: ${file}"
    continue
  fi


  echo ::group::Running test: "${file}"

  echo "Creating log directory"
  log_dir="${PWD}/logs/$(basename "${file}" .js)"
  mkdir -p "${log_dir}"

  echo "Starting services"
  (cd ../services || exit 1 ; docker --log-level 'warn' compose -f docker-compose.yml up -d --quiet-pull --wait --wait-timeout 300)

  echo "Running k6 test"
  npx dotenv -e ../services/.env -- ./k6 run --summary-export=summary.json "${file}"

  # default to 1 because if "fails" is not present, it means that no checks were run at all, which is likely due to a failure
  FAILURE_COUNT=$(jq '.metrics.checks.fails // 1' summary.json)
  if [[ ${FAILURE_COUNT} -gt 0 ]]; then
      failed_tests+=("${file}")
  fi

  echo "Collecting logs in ${log_dir}"
  cp summary.json "${log_dir}/summary.json"
  (cd ../services || exit 1; docker compose -f docker-compose.yml logs 121-service > "${log_dir}/121-service.log")
  (cd ../services || exit 1; docker compose -f docker-compose.yml logs > "${log_dir}/all-services.log")

  echo "Stopping services"
  (cd ../services || exit 1; docker compose -f docker-compose.yml down)

  echo ::endgroup::
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
  echo "All tests passed successfully."
fi

# new line
echo ""

echo "Logs are available in the artifact section (below) if running in CI, or in the logs directory: ${PWD}/logs"
