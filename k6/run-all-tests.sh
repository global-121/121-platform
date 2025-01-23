# Array to collect failed tests
failed_tests=()
for file in --throw tests/retryFailedJobsOnStartupDuringQueueProcessing.js; do
  echo "Test: $file"
  echo "Starting services"
  (cd ../services ; docker --log-level 'warn' compose -f docker-compose.yml up -d --quiet-pull --wait --wait-timeout 300)

  echo "Running k6 test"
  npx dotenv -e ../services/.env -- ./k6 run --summary-export=summary.json $file

  # Log the contents of summary.json for debugging
  echo "Contents of summary.json:"
  cat summary.json

  # Parse failed checks and thresholds
  failed_checks=$(jq '.root_group.checks | to_entries | map(select(.value.fails > 0)) | length' summary.json)
  failed_thresholds=$(jq '[.metrics[]?.thresholds[]? | select(. == false)] | length' summary.json)

  # Default to 0 if jq parsing fails
  failed_checks=${failed_checks:-0}
  failed_thresholds=${failed_thresholds:-0}

  if [ "$failed_checks" -gt 0 ] || [ "$failed_thresholds" -gt 0 ]; then
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
fi
