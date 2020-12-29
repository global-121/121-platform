# PA-accounts-Service

The PA-accounts Service is the service for PA's who cannot store their wallet on their own device.

---

## Getting started / Installation

See instructions to get started in the main [`/services/README`](../README.md).

- `npm start` - Start application
- `npm run start:watch` - Start application in watch mode
- `npm run start:prod` - Build application
- `npm test` - run Jest test runner

## API

- Access the Swagger UI via: <http://localhost:3001/docs/>.
- API-specification in JSON-format via: <http://localhost:3001/docs-json>

## Database

This service uses [TypeORM](https://typeorm.io/) with a PostgreSQL database.

### Database migrations

During development the database-structure will change (e.g. an extra column in a table) while there is already data stored that cannot be lost. In this case we have to apply a migration.

Any time, the database-structure is adapted, before pushing, run:

    docker exec -it PA-accounts npm run migration:generate <name>

This stores all edits in a migration-file, which is pushed along with your code.
On test- and production-server, this file is automatically run within the `npm prestart` command.
To run this file locally, do:

    docker exec -it PA-accounts-service npm run migration:run

### Sign-up/Sign-in

- If you have no users in your database yet, start with 'USER /POST user'. Leave the default input as is, and execute.
- If you have already created the above user earlier, start with 'USER /POST user/login'. Leave the default input as is, and execute.
- In either case, copy the value of the `token`-attribute from the response.
- Click 'Authorize' (top-right) and fill in `Token <copied token>`
- This will now give you access to all hitherto forbidden API-calls.
- NOTE: for ease of development, if not logged in, it will take the default-user. So you do need to create this default user with email `test@example.org`, but the Authorize part is not necessary any more. Otherwise you would need to repeat the Authorize-setup after each refresh of the Swagger UI, i.e. after each code change.

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
