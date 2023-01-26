# Start 121-service and clean unused things

docker compose start 121-service

rm dumpfile

docker volume rm postgres:9.6
