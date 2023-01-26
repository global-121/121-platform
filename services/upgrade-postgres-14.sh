docker compose up -d 121db

# Wait for db to be up
while ! nc -z localhost 5438; do
  sleep 1
done
echo "New version of postgres database is up"

# Copy dumpfile to new docker container
docker cp dumpfile 121db:/dumpfile

# Restore
export $(grep -v '^#' .env | xargs)
PGPASSWORD=$POSTGRES_PASSWORD
docker exec -i 121db psql -U global121 global121 < dumpfile

