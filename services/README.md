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

Run (from /services subfolder):

    docker-compose up -d --build

All backend services should now be up and running if you uncommented the last lines of the 121-service & pa-accounts-service dockerfile.

## Development

The 4 `tykn-ssi-service` containers are always started automatically by docker-compose. If you want to develop in `121-service` or the `PA-accounts-service` and read the logs live you have to comment/remove the npm start commands in the docker files

    121-service/Dockerfile
    PA-accounts-service/Dockerfile

and instead you have to start both containers manually:

    docker start -i 121-service
    docker start -i PA-accounts-service

and from the command-line in both interactive dockers, run:

    npm run start:dev

Or other relevant commands (see README's in their subfolders).


## How to use Swagger (with authorization features)

Access 121-service Swagger API via `http://localhost:3000/docs`
Access PA-accounts-service Swagger API via `http://localhost:3001/docs`


## Swagger API docs

We use the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [swagger.io](https://swagger.io/)
