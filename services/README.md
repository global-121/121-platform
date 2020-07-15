# Services

This Readme deals with how to run all services simultaneously using `docker-compose`. For more information on individual services, see their respective subfolders.

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

Environment variables are explained in the comments of the .env.example

## Run in Production

Run (from `/services` folder):

    docker-compose up -d --build

## Run in Development

Run (from `/services` folder):

    docker-compose -f  docker-compose.yml -f  docker-compose.development.yml up -d --build

To follow the logs of the respective services run:

    docker-compose logs --follow  121-service  PA-accounts-service

Or other relevant commands (see README's in their subfolders).


## APIs

We use the NestJS Swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger).

- Access the `121-service` Swagger-UI via: <http://localhost:3000/docs/>
- Access the `PA-accounts-service` Swagger-UI via: <http://localhost:3001/docs/>

### Authentication

All services use [JSON Web Token](https://jwt.io/) (JWT) to handle authentication. The token should be passed with each request using the `Authorization` header with `Token` scheme. The JWT authentication middleware handles the validation and authentication of the token.
