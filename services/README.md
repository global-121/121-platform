# Services

This Readme deals with how to run all services simultaneously using docker-compose. For more information on individual services, see the Readme's in the respective subfolders.

---

## Getting started / Installation

Clone the repository

    git clone https://github.com/global-121/121-platform.git

Switch to the repository folder

    cd services/

Copy a few secret files and get the right passwords from someone who knows:

    cp 121-service/src/secrets.ts.example 121-service/src/secrets.ts
    cp 121-service/ormconfig.json.example 121-service/ormconfig.json
    cp PA-accounts-service/src/secrets.ts.example PA-accounts-service/src/secrets.ts
    cp PA-accounts-service/ormconfig.json.example PA-accounts-service/ormconfig.json

---

## Docker-compose

Run (from /services subfolder):

    docker-compose -f "docker-compose.yml" up -d --build

## How to use

The 4 `tykn-ssi-service` containers are started automatically by docker-compose. The others are not. The docker-compose sets up both services interactively, for now (development purposes) an `npm start` command is not included in the respective `Dockerfiles`. Instead you have to start both containers:

    docker start -i 121-service
    docker start -i PA-accounts-service

and from the command-line, run:

    npm run start:dev

Or other relevant commands (see README's in their subfolders).

## Seed the database

To seed the database, run the following command(s):  
Replace `seed` with `seed:dev` to get more data to test with.

    docker exec -i 121-service npm run seed
    docker exec -i PA-accounts-service npm run seed

## How to use Swagger (with authorization features)

Access 121-service Swagger API via `http://localhost:3000/docs`
Access PA-accounts-service Swagger API via `http://localhost:3001/docs`


## On development-server

Access 121-service Swagger API via `http://137.117.210.255/121/docs/`
Access PA-accounts-service Swagger API via `http://137.117.210.255/PA-accounts/docs/`


## Swagger API docs

We use the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [swagger.io](https://swagger.io/)
