# 121-Service

The 121-Service is the backend where 121-programs can be created and monitored, etc.

---

## Getting started / Installation

See instructions to get started in the main [`README`](../../README.md#getting-started).

## API

- Access the Swagger UI via: <http://localhost:3000/docs/>
- API-specification in JSON-format via: <http://localhost:3000/docs-json>
- A graph will be generated when run in 'development' mode at [`module-dependencies.md`](./module-dependencies.md).
  It can be viewed with <https://mermaid.live/> or the VSCode-extension: [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

### Updating/adding Node.js dependencies

Make sure to update any dependencies from _within_ the Docker-container, with:

    docker compose exec  121-service  npm install --save

## Database

This service uses [TypeORM](https://typeorm.io/) with a PostgreSQL database.

### Database migrations

During development the database-structure will change (e.g. an extra column in a table) while there is already data stored that cannot be lost. In this case we have to apply a migration.

Any time, the database-structure is adapted, before pushing, run:

    docker exec -it 121-service npm run migration:generate migration/<name>

This stores all edits in a migration-file, which is pushed along with your code.
On test- and production-server, this file is automatically run within the `npm prestart` command.
To run this file locally, do:

    docker exec -it 121-service npm run migration:run

If you want to revert one migration you can run:

    docker exec -it 121-service npm run migration:revert

### Seed the database

To create the database initially, you have to run a command once:

    docker exex -it 121-service npm run setup

This will add 1 `admin`-user. It will only do so, if no existing users are found. The password and e-mail for this user can be customized in centralized [`services/.env`](../.env.example) file.

To seed the database with more data (e.g. programs) additional seed-scripts can be run manually.
**NOTE:** These seed-scripts delete _all existing data_. They cannot be run on production; When run locally or on test-environment, you are prompted with '`Are you sure? (y/n)`'.

See `services/121-service/package.json` for exact commands per program.

The same can be achieved by using the `api/reset` endpoint from the Swagger UI.

### API Sign-up/Log-in

- If you have no users in your database yet, start with running one of the [reset/seed-scripts above](#seed-the-database).
- If you have already created the above user earlier, make a request: `POST /user/login`'. Change the example-value where necessary, and execute.
- The 121-service will respond with a (httpOnly-)Cookie containing the users's details and permissions, the cookie will be used automatically on subsequent requests.
- This will give access to each API-endpoint for which a `Permission` is specified and a matching `Permission` is present in the users' token/cookie.

---

## External services

### FSP-specific instructions

For FSP-specific instructions, see the README.md in each individual FSP-folder, e.g. for [Intersolve](./src/payments/fsp-integration/intersolve/README.md)

### Upload voice mp3

See: [`src/notifications/voice/voice.service.ts`](`src/notifications/voice/voice.service.ts`).

- Mp3's that are used when sending voice notifications can be added to the `voice`-folder:
  The folder structure follows the pattern: `voice/<programId>/<language>/<notification-key>.mp3`

## Development

### Testing

To run the api tests:

    docker exec 121-service npm run test:e2e

### Debugging

To enter the 121-service in the terminal use:

    docker exec -it 121-service /bin/sh

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
