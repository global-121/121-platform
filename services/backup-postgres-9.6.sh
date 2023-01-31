#!/bin/bash

# Read env file

# Git checkout to new version

export $(grep -v '^#' .env | xargs)

PGPASSWORD=$POSTGRES_PASSWORD

# Backup current PostgreSQL data
docker exec -it 121db /usr/bin/pg_dump -c -U global121 -d global121  > dumpfile

# # Stop the current PostgreSQL container
docker compose stop 121db

# # Stop the 121 service
docker compose stop 121-service

# Remove current PostgresSQL container and its volume
docker compose rm -s -v --force 121db

# Already cash postgres 14 image before the upgrade
docker pull postgres:14
