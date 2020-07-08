# Services

This Readme deals with how to run all services simultaneously using docker-compose. For more information on individual services, see the Readme's in the respective subfolders.

---

## Getting started / Installation

Clone the repository

    git clone https://github.com/global-121/121-platform.git

Switch to the repository folder

    cd services/

Copy a few secret files and get the right passwords from someone who knows:

    cp .env.example .env
    cp 121-service/src/example.secrets.ts 121-service/src/secrets.ts
    cp 121-service/example.ormconfig.json 121-service/ormconfig.json
    cp PA-accounts-service/src/example.secrets.ts PA-accounts-service/src/secrets.ts
    cp PA-accounts-service/example.ormconfig.json PA-accounts-service/ormconfig.json

Copy the two example `Dockerfile` files ...

    cp 121-service/example.Dockerfile 121-service/Dockerfile
    cp PA-accounts-service/example.Dockerfile PA-accounts-service/Dockerfile 

... and uncomment the appropriate last line (or leave as is, in which case you will need to start the containers and start the applications from within: see below).
... Also note the `NODE_ENV`-variable. Leave this as 'development' for local environment.

---
## Run in Production
Run (from /services subfolder):

    docker-compose up -d --build

## Run in Development

Run (from /services subfolder):

    docker-compose -f  docker-compose.yml -f  docker-compose.development.yml up -d --build

To follow the logs of the respective services run:

    docker logs -f 121-service
    docker logs -f PA-accounts-service

Or other relevant commands (see README's in their subfolders).


## How to use Swagger (with authorization features)

Access 121-service Swagger API via `http://localhost:3000/docs`
Access PA-accounts-service Swagger API via `http://localhost:3001/docs`


## Swagger API docs

We use the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [swagger.io](https://swagger.io/)
