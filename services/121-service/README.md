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

- For basic testing (1 program):  
  `docker exec -it 121-service npm run seed:single-program`
- For basic testing (4 programs):  
  `docker exec -it 121-service npm run seed:multi-program`

- Add your custom testing data:  
  `docker exec -it 121-service npm run seed:dev`

- For pilot:  
  `docker exec -it 121-service npm run seed:pilot`

**NOTE:** These scripts do no longer automatically publish programs as well.

### Consequences of altering (program) data in the 121-platform

When changing the name of the NGO (`program.ngo`), this has effect on the PA-app NGO-logo-processing, which is hard-coded on the value of this attribute. So code-changes are needed in the PA-app. See the [PA-App README](../../interfaces/PA-App/README.md).

### API Sign-up/Log-in

- If you have no users in your database yet, start with: '`user` / `POST` `/user`'. Change the example-value where necessary, and execute.
- If you have already created the above user earlier, start with '`user` / `POST` `/user/login`'. Change the example-value where necessary, and execute.
- In either case, copy the value of the `token`-attribute from the response.
- Click 'Authorize' (top-right) and fill in `Token <copied token>`
- This will now give you access to all the API-endpoints applicable to the created users' user-role.

**NOTE:** for ease of local development (in [DEBUG-mode](./src/config.ts#L1)), the first/default-user will be used for all requests.
This user **_HAS_** to be created first, but the 'Authorize'-part is not necessary any more. Otherwise you would need to repeat the Authorize-setup after each refresh of the Swagger UI, i.e. after each code change.

#### Admin vs other users

- In USER /POST you can set `role: 'admin'`. Or one of: `aidworker`, `program-manager`, `project-officer`.
- The `admin`-user has access to all API-endpoints
- The other users have limited access to specific API-endpoints
- NOTE: The user-role distinction is only in effect when using the Bearer-authentication described above. If not, then the default-user will be used, which will have `admin`-rights automatically (even if you haven't specified `role='admin'` for that user initially).

---

## External services

### Use Twilio API during development

See the Twilio API documentation: <https://www.twilio.com/docs>.

- Make sure the `.env` file contains the correct access keys
- Use a tool to inspect the responses from the Twilio API, for example:
  - `ngrok`: <https://ngrok.com>:
    - See also: <https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html>
    - Make sure to use the correct port(`3000`) of the 121-service.
  - `Smee`: <https://smee.io/>
    - You can use the client with:  
      `npx smee -u https://smee.io/<unique-url>`
  - Or any other service that gives a public accessible URL to inspect and/or forward to you local instance of the 121-service.
- Set the ENV-variable `EXTERNAL_121_SERVICE_URL` to your personal url in the [services/.env](../.env)-file.
  - Make sure to run `npm run start:services` after the changes, so the new value(s) will be used.

To also test Whatsapp with Twilio:
- Setup Twilio Whatsapp Sandbox <https://www.twilio.com/docs/whatsapp/sandbox>
- Be sure to join the sandbox with the Whatsapp number you want to test <https://www.twilio.com/docs/whatsapp/sandbox#how-to-join-a-twilio-sandbox>
- Set the callback url for `When a Message Comes in` to `<your-url>/api/notifications/whatsapp/incoming`

### Upload voice mp3

See: [`src/notifications/voice/voice.service.ts`](`src/notifications/voice/voice.service.ts`).

- Mp3's that are used when sending voice notifications can be added to the `voice`-folder:  
  The folder structure follows the pattern: `voice/<programId>/<language>/<notification-key>.mp3`

### Use Africa's Talking API during development

If setting up a validation callback, use `ngrok` (see above) here as well during development.

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
