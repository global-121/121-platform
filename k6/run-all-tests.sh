for file in tests/*.js; do
  echo "Test: $file"
  echo "Starting services"
  (cd ../services ; docker --log-level 'warn' compose -f docker-compose.yml up -d --quiet-pull --wait --wait-timeout 300)
  echo "Running k6 test"
  npx dotenv -e ../services/.env -- ./k6 run $file
  echo "Stopping services"
  (cd ../services ; docker compose -f docker-compose.yml down)
done
