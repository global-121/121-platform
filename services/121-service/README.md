# 121-Service

The 121-Service is the backend where 121-programs can be created and monitored, etc.

---

## Getting started / Installation

Clone the repository

    git clone https://github.com/global-121/121-platform.git

Switch to the repository folder

    cd services/121-service/

Install dependencies (NOT NEEDED, SINCE USING DOCKER)

    npm install

Copy a few secret files and get the right passwords from someone who knows:

    cp src/secrets.example.ts src/secrets.ts
    cp secrets/DID_generation/import-HO-wallet.example.txt secrets/DID_generation/import-HO-wallet.txt
    cp ormconfig.example.json ormconfig.json

---

## Database

The example codebase uses [TypeORM](http://typeorm.io/) with a Dockerized Postgres database.

Install Docker & create a Docker network (needed because we will create separate Docker containers for DB and for app, which need to be linked) through:

    docker network create 121network

Create a new local Postgres-database through Docker with:

    docker run --name 121db -p 5438:5432 -e POSTGRES_USER=global121 -e POSTGRES_PASSWORD=global121 -e POSTGRES_DB=global121 -t --restart always --network 121network -v ${PWD}/postgresql.conf:/etc/postgresql.conf -d postgres:9.6 -c 'config_file=/etc/postgresql.conf'

On application start, tables for all entities will be created automatically.

When running this setup locally, you can access the dockerized database for example through pgAdmin (or any other GUI) on port 5438 (as that's where the docker container's port forwarding goes).

---

## Start application locally

Create the Docker image from the Dockerfile in this folder through:

    docker build -t 121-node .

Start the app Docker container through (NOTE: you have to change 'C:/github/121-platform' to your own path for the repository-root 121-platform folder):

    docker run --name=121-service -v C:/github/121-platform:/home/121 -p 3000:3000 -it --network 121network 121-node

If you've already created the container before and just want to start again:

    docker start -i 121-service

The Docker container currently in development phase does NOT run an `npm start` command.

Once in the Docker-container do (only the first time, because of the docker-volume the node_modules will also be copied to your local folder):

- `cd ../../integration-tools/tykn-id`
- `npm ci`
- `cd ../../services/121-service` (to go back to application root-folder)

Run the application through:

- `npm run start:dev` (uses `tswatch` instead of `nodemon`)
- `npm run start:watch` (to use with `nodemon` for restart upon change)

## Start application on VM

Same as above. But replace `-it` tag in `docker run` or `docker start` commands by `-d` to run in detached mode.
Also, the CMD line of Dockerfile should be changed from: `CMD ["npm", "run", "start:dev"]` to: `CMD ["npm", "start"]`.

## Seed the database and create identity schema

To be able to use the functionality of this service an initial admin user is required, so he/she can create new aid-worker/admin users and programs. Furthermore an initial 'identity' schema is required which will be used to create generic 'identity' credentials containing age and name. This initial user and schema can be created by running seed script. The initial identity schema is stored in the program database because this already contains the right functionality to publish and create schema’s.

To seed the database for dev mode with an admin, an identity schema and some initial testing values run the following command:

    docker exec -i 121-service npm run seed:dev

To seed it for production run the following command:

    docker exec -i 121-service npm run seed

This user password and username can be customized in `secrets.ts`

## How to use Swagger (with authorization features)

Access Swagger API via `http://localhost:3000/docs`

### Sign-up/Sign-in

- If you have no users in your database yet, start with 'USER /POST user'. Leave the default input as is, and execute.
- If you already have created the above user earlier, start with 'USER /POST user/login'. Leave the default input as is, and execute.
- In either case, copy the value of the Token-attribute from the output.
- Click 'Authorize' (top-right) and fill in `Bearer <copied token>`
- This will now give you access to all hitherto forbidden API-calls.
- NOTE: for ease of development, if not logged in, it will take the default-user. So you do need to create this default user with email `test@example.org`, but the Authorize part is not necessary any more. Otherwise you would need to repeat the Authorize-setup after each refresh of Swagger, i.e. after each code change.

#### Admin vs AidWorker

- Different authorizations for Admin or AidWorker are added.
- In USER /POST you can set `role='admin'` or `role='aidworker'`.
- With `admin` you have access to all API-calls
- With `aidworker` you have access only to (most) GET requests
- Only the USER /POST call is completely open at the moment, as otherwise you cannot create a first admin-user. To improve in the future.
- NOTE: this `admin/aidworker` distinction is only working if you're using the Bearer authentication described above. If not, then the default-user will be used, which will have admin-rights automatically (even if you haven't specified `role='admin'` for that user initially).

#### Using other endpoints

A typical flow to use other endpoints (after being signed up/in):

- Create programs with POST /programs
- Get a list of all programs with GET /programs
- Create 2 countries Malawi and Ethiopia with POST /countrys (NOTE: countries will be relevant e.g. to preload a list of standard criteria based on country, which you can subsequently choose to use in your program or not. You can additionally add custom criteria as well.)
- Create criterium 'age' with POST /criterium and add it to country Ethiopia with PUT /countrys/{countryId}
- Create criterium 'gender' with POST /criterium and add it to country Malawi with PUT /countrys/{countryId}
- Create criterium-options 'male' and 'female' for criterium 'gender' with POST /criterium-options/{criteriumId}

---

## Other relevant NPM scripts

- `npm start` - Start application
- `npm run start:watch` - Start application in watch mode
- `npm run test` - run Jest test runner
- `npm run start:prod` - Build application

---

## Authentication

This applications uses [JSON Web Token](https://jwt.io/) (JWT) to handle authentication. The token is passed with each request using the `Authorization` header with `Token` scheme. The JWT authentication middleware handles the validation and authentication of the token.

---

## Swagger API docs

We use the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [swagger.io](https://swagger.io/)
