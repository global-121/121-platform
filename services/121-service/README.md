# 121-Service

The 121-Service is the backend where 121-programs can be created and monitored, etc.

---

## Getting started / Installation

See instructions to get started in the main [`/services/README`](../README.md).

- `npm start` - Start application
- `npm run start:watch` - Start application in watch mode
- `npm run start:prod` - Build application
- `npm test` - run Jest test runner

## API

- Access the Swagger UI via: <http://localhost:3000/docs/>
- API-specification in JSON-format via: <http://localhost:3000/docs-json>

## Database

This service uses [TypeORM](https://typeorm.io/) with a PostgreSQL database.

### Database migrations

During development the database-structure will change (e.g. an extra column in a table) while there is already data stored that cannot be lost. In this case we have to apply a migration.

Any time, the database-structure is adapted, before pushing, run:

    docker exec -it 121-service npm run migration:generate <name>

This stores all edits in a migration-file, which is pushed along with your code.
On test- and production-server, this file is automatically run within the `npm prestart` command.
To run this file locally, do:

    docker exec -it 121-service npm run migration:run

### Seed the database

Upon application start, automatically a basic seed-script is run which adds 1 `admin`-user. It will only do so, if no existing users are found. The password and e-mail for this user can be customized in centralized [`services/.env`](../.env.example) file.

To seed the database with more data (e.g. programs) additional seed-scripts can be run manually.  
**NOTE:** These seed-scripts delete _all existing data_. They cannot be run on production; When run locally or on test-environment, you are prompted with '`Are you sure? (y/n)`'.

See `services/121-service/package.json` for exact commands per program.

The same can be achieved by using the `api/reset` endpoint from the Swagger UI.

### API Sign-up/Log-in

- If you have no users in your database yet, start with: '`user` / `POST` `/user`'. Change the example-value where necessary, and execute.
- If you have already created the above user earlier, start with '`user` / `POST` `/user/login`'. Change the example-value where necessary, and execute.
- In either case, copy the value of the `token`-attribute from the response.
- Click 'Authorize' (top-right) and fill in `Token <copied token>`
- This will now give you access to all the API-endpoints applicable to the created users' user-role.

**NOTE:** for ease of local development (in [DEBUG-mode](./src/config.ts#L1)), the first/default-user will be used for all requests.
This user **_HAS_** to be created first, but the 'Authorize'-part is not necessary any more. Otherwise you would need to repeat the Authorize-setup after each refresh of the Swagger UI, i.e. after each code change.

#### Admin vs other users

- In USER /POST you can set `roles: ['admin']`. Or add one of the other available roles.
- The `admin`-role has access to all API-endpoints
- The other users have limited access to specific API-endpoints
- NOTE: The user-role distinction is only in effect when using the Bearer-authentication described above. If not, then the default-user will be used, which will have `admin`-rights automatically (regardless of its' `roles`-value(s)).

---

## External services

### FSP-specific instructions

For FSP-specific instructions, see the README.md in each individual FSP-folder, e.g. for [Intersolve](./src/payments/fsp-integration/intersolve/README.md)

### Upload voice mp3

See: [`src/notifications/voice/voice.service.ts`](`src/notifications/voice/voice.service.ts`).

- Mp3's that are used when sending voice notifications can be added to the `voice`-folder:  
  The folder structure follows the pattern: `voice/<programId>/<language>/<notification-key>.mp3`

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
