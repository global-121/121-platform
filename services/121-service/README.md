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

    docker compose exec 121-service  npm install --save <package-name>

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

To run a single test suite, amend the name of the test file, for example:

    docker exec 121-service  npm run test:e2e:all update-program.test.ts

### Debugging

To enter the 121-service in the terminal use: (Or use the "Exec"-tab inside Docker Desktop)

    docker exec -it 121-service  /bin/sh

To start a debugger using Chrome, follow these steps:

1. Add port mapping to the `docker-compose.development.yml` so that internal port 9229 is mapped to external port 9229. Note that all port settings from the main file are overridden.
2. In the start:dev script in the package.json of the 121-service, add =0.0.0.0 to the -- inspect flag, so it becomes --inspect=0.0.0.0
3. Start the services with npm run start:services.
4. In the code of the 121 Service where you want to break, add a line with debugger;
5. Check if the application indeed started on a debugger address 0.0.0.0 with `npm run logs:services 121-services`, and see something like: "`Debugger listening on ws://0.0.0.0:9229 02384d3e-4d1f-40ef-b8d5-be3da792fe71`"
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

### Refactoring

Steps to rename a database table:

1. Rename table name in the Entity decorator:
   @Entity('new_table_name')
2. Generate migrate script.
3. Change generated migration script:
4. Use the generated DROP FK CONSTRAINTS queries.
5. Manually add a query to change the name of the table.
6. Remove the query that creates a new table.
7. Use the generated CREATE FK CONSTRAINTS queries.
8. Caveats: if there is a related "cross table" that TypeORM automatically generated, then there is a bit of manual editing of the generated query involved.
9. See for an example: <https://github.com/global-121/121-platform/pull/4985/files#diff-9d32e210b9db0795ae71d28aaad421f3bb58bc8e3b263bbf54be13429239397c>
10. In principle there is no renaming of table name in queries in the code needed, as they are dynamically filled by TypeORM. However, we do have some hard-coded SQL scripts for creating mock data. Check if it is needed to update these queries: they are in .sql files.
11. Test the migration script:
12. Incremental, given an existing (filled) database, like on production.
13. New instance, like when installing a fresh local dev environment.
14. Run unit tests and API tests. Any problems/bugs are likely due to an incomplete/incorrect migration script.
15. Generate a "test" migration script.
16. In case this actually creates a script with queries, it means the migration script you created earlier is not yet complete.
17. Copy/paste (mindfully) the created queries into your migration script, edit them if needed, and re-do from step 11.
18. Caveat: TypeORM "randomly" names things like indexes and constraints, and these names need to be changed as well as TypeORM expects these new names, even though technically for PostgreSQL it does not matter. Just copy-paste the generated drop and create queries.
19. Rinse and repeat until step 15 does not create a migration script anymore (it will "complain" that there are no changes).
20. Do a smoke test on local dev: walk through happy flow main functions via the Portal.
21. We chose not to implement the down function of the migration script for table renames.

---

### Analyzing code structure and behavior

#### Compodoc

Compodoc can generate static code diagrams and documentation and serve that as a website locally:

1. From the 121-service folder run this command: `npx @compodoc/compodoc -p tsconfig.json -s`
2. This creates a folder called 'documentation' and starts a website that is typically available under: http://127.0.0.1:8080/
3. Most useful is the per-module diagram and documentation available under: http://127.0.0.1:8080/modules.html
4. For more information, see: https://docs.nestjs.com/recipes/documentation

#### AppMap

AppMap is a very extensive static and dynamic code analysis tool which can be run as a Visual Studio Extension. It has many features, options, and comes with an AI chat bot to converse with:

1. Install the AppMap Extension in Visual Studio Code. Reference: https://marketplace.visualstudio.com/items?itemName=appland.appmap
2. Start the 121 Service node process under the appmap-node npx script by using: `npm run start:services:appmap` on your development environment.
3. Create recordings by calling an API endpoint, or running test suites, or interacting via the 121 Portal. These recordings are stored in the tmp/appmap folder under the 121-service.
4. Open the Appmaps from these recordings from the APPMAPS pane in the AppMap Extension in VS Code.
5. Note: Docker creates new files as root. At least on Linux you need to run `sudo chown -R <your-username> .` in the 121-service folder so that the AppMap Extension can access the files of the recordings.
6. AppMap creates Dependency Diagrams, Sequence Diagrams, Flame Graphs and more to get insight of the code's behavior.
7. AppMap also as an AI bot called Navie AI to ask questions to.
8. For more information: https://appmap.io/docs/appmap-overview.html or access the Slack channel: https://appmap.io/community

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
