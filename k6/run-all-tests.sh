set -e

# Array to collect failed tests
failed_tests=()

for file in tests/*.js; do
  echo "Test: $file"
  echo "Starting services"
  (cd .. ; npm run start:services ; cd services)
  echo "Running k6 test"
  if ! npx dotenv -e ../services/.env -- ./k6 run $file; then
    echo "Test failed: $file"
    failed_tests+=("$file")
  fi
  echo "Stopping services"
  (cd ../services ; docker compose -f docker-compose.yml down)
done

# Check if there were any failed tests
if [ ${#failed_tests[@]} -ne 0 ]; then
  echo "The following tests failed:"
  for test in "${failed_tests[@]}"; do
    echo "$test"
  done
  exit 1
else
  echo "All tests passed successfully."
  exit 1
fi
