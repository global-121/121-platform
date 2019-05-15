# 121 - HO-portal

## Introduction

This is the backend for the Programs Service / Humanitarian Organization web portal, where 121-programs can be created and monitored, etc.

----------

# Getting started

## Installation

Clone the repository

    git clone https://github.com/global-121/121.global.git

Switch to the repo folder

    cd service/programs-service/
    
Install dependencies
    
    npm install

Copy config file and set JsonWebToken secret key

    cp src/config.ts.example src/config.ts
    
----------

## Database

The example codebase uses [Typeorm](http://typeorm.io/) with a Dockerized Postgres database.

Install Docker & create a Docker network (needed because we will create separate Docker containers for DB and for app, which need to be linked) through:

    docker network create 121network

Create a new local postgres-database through Docker with: 

    docker run --name 121db -p 5438:5432 -e POSTGRES_USER=global121 -e POSTGRES_PASSWORD=global121 -e POSTGRES_DB=global121 -t --restart always --network 121network -v ${PWD}/postgresql.conf:/etc/postgresql.conf -d postgres:9.6 -c 'config_file=/etc/postgresql.conf'

Copy Typeorm config example file for database settings

    cp ormconfig.json.example ormconfig.json
    
Set database settings in ormconfig.json

    {
      "type": "postgres",
      "host": "121db",
      "port": 5432,
      "username": "global121",
      "password": "global121",
      "database": "global121",
      "entities": ["src/**/**.entity{.ts,.js}"],
      "synchronize": true
    }
    

On application start, tables for all entities will be created.

----------

## Start application

Create the Docker image from the Dockerfile in this folder through:

    docker build -t 121-node .

Start the app Docker container through (NOTE: the ${PWD} code for current directory may not translate to all OS's):

    docker run --name=121-programs-service -v ${PWD}:/home/121 -p 3000:3000 -it --network 121network 121-node

If you've already created the container before and just want to start again:

    docker start -i 121-programs-service

The Docker container automatically runs 'npm start' (defined in Dockerfile)
Possibly rebuild/rerun by changing this to:
- `npm run start:dev` (uses tswatch instead of nodemon)
- `npm run start:watch` (to use with nodemon for restart upon change)

## How tu use Swagger (with authorization features)
- Access Swagger API via `http://localhost:3000/docs`
- If you have no users in your database yet, start with 'USER /POST user'. Leave the default input as is, and execute.
- If you already have created the above user earlier, start with 'USER /POST user/login'. Leave the default input as is, and execute.
- In either case, copy the value of the Token-attribute from the output.
- Click 'Authorize' (top-right) and fill in 'bearer <copied token>'
- This will now give you access to all hitherto forbidden API-calls.
- NOTE: for ease of development, if not logged in, it will take the standard login. So you do need to create one user with email test@test.nl, but the Authorize part is not necessary any more. Otherwise you would need to repeat the Authorize-setup after each refresh of Swagger, i.e. after each code change.

----------

## Other relevant NPM scripts

- `npm start` - Start application
- `npm run start:watch` - Start application in watch mode
- `npm run test` - run Jest test runner 
- `npm run start:prod` - Build application

----------

# Authentication
 
This applications uses JSON Web Token (JWT) to handle authentication. The token is passed with each request using the `Authorization` header with `Token` scheme. The JWT authentication middleware handles the validation and authentication of the token. Please check the following sources to learn more about JWT.

----------
 
# Swagger API docs

This example repo uses the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [www.swagger.io](https://swagger.io/)        