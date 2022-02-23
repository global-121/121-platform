# Services

This Readme deals with how to run all services simultaneously using `docker-compose`. For more information on individual services, see their respective subfolders.

---

## Getting started / Installation

Clone the repository

    git clone https://github.com/global-121/121-platform.git

Switch to the repository folder

    cd services/

Copy the centralized .env file

    cp .env.example .env

Environment variables are explained in the comments of the .env.example, they should be set up prior to development

### Run in Production

Run (from `/services` folder):

    docker-compose up -d --build

### Run in Development

Run (from `/services` folder):

    docker-compose -f  docker-compose.yml -f  docker-compose.development.yml up -d --build

To follow the logs of the respective services run:

    docker-compose logs --follow  121-service  PA-accounts-service

Or other relevant commands (see README's in their subfolders).

### Re-use `node_modules` in your local IDE

If you want your IDE to (re-)use the (dev-)dependencies and tools installed in the container, you can copy them via a command from the root:

    npm run sync-dev-dependencies:121-service

This is a one-time copy, so when there are updates in the container, you have to run the command again.

## APIs

We use the NestJS Swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger).

- Access the `121-service` Swagger-UI via: <http://localhost:3000/docs/>

### Authentication

All services use [JSON Web Token](https://jwt.io/) (JWT) to handle authentication. The token should be passed with each request by the browser via an `access_token` cookie. The JWT authentication middleware handles the validation and authentication of the token.

### Adding third party API tokens

All the tokens and access keys for third party APIs should be added on the .env file and subsequently imported using the environment variables within typescript files.
