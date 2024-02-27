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

    docker compose exec 121-service  npm install --save

## Database

This service uses [TypeORM](https://typeorm.io/) with a PostgreSQL database.

### Seed the database

To create the database initially, you have to run a command once:

    docker exex -it 121-service  npm run setup

This will add 1 `admin`-user. It will only do so, if no existing users are found. The password and e-mail for this user can be customized in centralized [`services/.env`](../.env.example) file.

To seed the database with more data (e.g. programs) additional seed-scripts can be run manually.
**NOTE:** These seed-scripts delete _all existing data_. They cannot be run on production; When run locally or on test-environment, you are prompted with '`Are you sure? (y/n)`'.

See `services/121-service/package.json` for exact commands per program.

The same can be achieved by using the `api/reset` endpoint from the Swagger UI.

### API Sign-up/Log-in

- If you have no users in your database yet, start with running one of the [reset/seed-scripts above](#seed-the-database).
- If you have already created the above user earlier, make a request: `POST /users/login`'. Change the example-value where necessary, and execute.
- The 121-service will respond with a (httpOnly-)Cookie containing the users's details and permissions, the cookie will be used automatically on subsequent requests.
- This will give access to each API-endpoint for which a `Permission` is specified and a matching `Permission` is present in the users' token/cookie.

---

## External services

### FSP-specific instructions

For FSP-specific instructions, see the README.md in each individual FSP-folder, e.g. for [Intersolve](./src/payments/fsp-integration/intersolve/README.md)

## Development

### Testing

To run the Unit-tests: (replace `:all` with `:watch` to run during development)

    docker exec 121-service  npm run test:unit:all

To run the API/Integration tests: (replace `:all` with `:watch` to run during development)

    docker exec 121-service  npm run test:e2e:all

### Debugging

To enter the 121-service in the terminal use: (Or use the "Exec"-tab inside Docker Desktop)

    docker exec -it 121-service  /bin/sh

To start a debugger using Chrome, follow these steps:

1. Add port mapping to the docker-compose.development.yml so that internal port 9229 is mapped to external port 9229. Note that all port settings from the main file are overridden.
2. In the start:dev script in the package.json of the 121-service, add =0.0.0.0 to the -- inspect flag, so it becomes --inspect=0.0.0.0
3. Start the services with npm run start:services.
4. In the code of the 121 Service where you want to break, add a line with debugger;
5. Check if the application indeed started on a debugger address 0.0.0.0 with npm run logs:services 121-services, and see something like: Debugger listening on ws://0.0.0.0:9229 02384d3e-4d1f-40ef-b8d5-be3da792fe71
6. Open the Swagger Docs in the Chrome Web Browser: <http://localhost:3000/docs/>
7. Open the Inspector in Chrome with CTRL-SHIFT-I or right mouse click and select Inspect. Now there should be a green hexagon on the top left of the Inspector window.
8. Click the green hexagon item in the top left of the Inspector window (Open dedicated DevTools for Node.js).
9. This opens a new window called DevTools. Leave it open.
10. In the logs of the 121 Service it should say: Debugger attached.
11. Use Swagger API to call the endpoint that will run into the code where you set the debugger; statement (see point 4 above.)
12. The DevTools window now should show your code and Debugger functionality so you can watch variables, step over code, etc.
13. In the left margin of the code, you can also right mouse click and for example select: continue to here.
14. If you want to set the theme to dark, go to Settings in DevTools and under Preferences you have Theme, there select Dark. For more info: <https://stackoverflow.com/questions/20777454/google-chrome-customize-developer-tools-theme-color-schema>

To start the debugger from Visual Studio Code, follow these steps:

1. Probably some steps from above, starting debugger in Chrome, are also needed here, but not sure which. Maybe items 1, and 2.
2. The contents of launch.json in the root folder of the repository enable the possibility to attach the Debugger in Visual Studio Code to the Node.js process running in the 121-service Docker container.
3. Start the services with npm run start:services, probably need to do this from a Terminal inside Visual Studio Code.
4. Open the Run and Debug section in Visual Studio Code by clicking the play arrow with bug icon in the left vertical bar of icons.
5. Press the green play icon left besides the "Docker: Attach to Node" text which is selected by default in the dropdown. This attaches the Debugger.
6. Now you can for example set a breakpoint in your code by right mouse clicking to the left of the line number and select Add breakpoint.

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
