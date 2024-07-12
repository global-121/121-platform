for file in tests/*.js; do
  npx dotenv -e ../services/.env -- ./k6 run $file
done
