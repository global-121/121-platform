# 121-Service

The 121-Service is the backend where 121-projects can be created and monitored, etc.

---

## Getting started / Installation

See instructions to get started in the main [`README`](../../README.md#getting-started).

## Database

This service uses a [fork](https://github.com/global-121/typeorm) of [TypeORM](https://typeorm.io/) with a PostgreSQL database.

### Seed the database

You can seed the database by using the `api/reset` endpoint from the Swagger UI.

### API Sign-up/Log-in

- If you have no users in your database yet, start with running one of the [reset/seed-scripts above](#seed-the-database).
- If you have already created the above user earlier, make a request: `POST /users/login`'. Change the example-value where necessary, and execute.
- The 121-service will respond with a (httpOnly-)Cookie containing the users's details and permissions, the cookie will be used automatically on subsequent requests.
- This will give access to each API-endpoint for which a `Permission` is specified and a matching `Permission` is present in the users' token/cookie.

## API

- Access the Swagger UI via: <http://localhost:3000/docs/>
- A JSON-document will be generated at [`swagger.json`](./swagger.json). You can use it to get a 'diff' view API changes between different version of the platform.
- A graph will be generated when run in development-mode at [`module-dependencies.md`](./module-dependencies.md).
  It can be viewed with <https://mermaid.live/> or the VSCode-extension: [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

### Updating/adding Node.js dependencies

Make sure to update any dependencies from _within_ the Docker-container, with:

    docker compose exec 121-service  npm install --save <package-name>

#### TypeORM

The only exception to this is TypeORM.

To test changes in the TypeORM fork (before releasing them):

1. Clone the forked repo <https://github.com/global-121/typeorm/>
2. Change the `"name"` in `"typeorm/package.json"` from `"@global121/typeorm"` to `"typeorm"`
   1. This is a temporary change that you should revert before pushing any code to the remote.
   2. It is necessary because of how the TypeORM fork is installed in the 121-service.
3. Make your desired changes to your local clone of the fork
4. From the cloned fork folder, run `npm run compile`
5. From your local 121-service folder, run `npm link FORK_PATH` where `FORK_PATH` is a full path to your cloned version of the fork
   1. eg. `npm link ~/git/typeorm`
6. You might need to restart the 121-service at this point for your changes to take effect.
7. Repeat steps 3 to 6 until your changes are ready, then proceed to make a PR to the fork.

To update TypeORM:

- Go to the forked repo and create a new version as described in the [README](https://github.com/global-121/typeorm/)
- Change the version number of TypeORM `"typeorm": "npm:@global121/typeorm@<version-number>",` in `services/121-service/package.json` according to the new release.
  - We cannot use `"@global121/typeorm": "<version-number>",` in the `package.json` because the TypeORM package is also a dependency in other packages. This configuration "tricks" npm into treating our fork as if it were the original `typeorm` so that, anywhere in our codebase (including in the `node_modules`), `import ... from 'typeorm'` will use our fork instead of the original `typeorm`
- Run `npm i` and commit both the changes to the `services/121-service/package.json` and the `services/121-service/package-lock.json`

---

## External services

### FSP-specific instructions

For FSP-specific instructions, see the README.md in each individual FSP-folder, e.g. for [Intersolve](./src/payments/fsp-integration/intersolve/README.md)

## Development

### Testing

To run the Unit-tests: (replace `:all` with `:watch` to run during development)

    docker exec 121-service  npm run test:unit:all

To run the API/Integration tests: (replace `:all` with `:watch` to run during development)

    docker exec 121-service  npm run test:integration:all

To run a single test suite, amend the name of the test file, for example:

    docker exec 121-service  npm run test:integration:all update-project.test.ts

To update snapshots, amend the `-- -u` option, for example:

    docker exec 121-service  npm run test:integration:all -- -u

If you want all the color output Jest can give set the [`FORCE_COLOR`](https://force-color.org/) environment variable to `true` in your local development environment via the [`services/.env`](../.env.example)-file.

#### Test coverage

For the sake of this section of the documentation, it is assumed that you understand how unit testing and integration testing are setup on the 121-service.

##### Unit test coverage

```bash
cd services/121-service
docker exec 121-service npm run test:unit:coverage
# (optional) open the report in your browser
npm run coverage:open:unit
```

##### Integration test coverage

Integration test coverage is slightly more complex. On a conceptual level, we are following the [steps laid out in this GitHub comment](https://github.com/istanbuljs/nyc/issues/548#issuecomment-304352525).

In practice, for us, this looks like this:

1. Instrumenting the 121-service code manually by running the service using `nyc`
   - This happens whenever you start the dev server, so long as you have set the `COVERAGE_DEV_STARTUP_SUFFIX` env variable accordingly in your `.env` file
2. Running the relevant integration tests
3. Killing the server
   - This is necessary because `nyc` generates the code coverage information into the `.nyc_output` directory whenever the server receives a `SIGINT`.
   - You can do this two ways:
     1. Manually killing the server
     2. Saving a file in the `121-service/src` folder will trigger a recompilation, which will implicitly kill the server
4. Generate a coverage report based on the data in `.nyc_output`

Which translates to these commands (after setting `COVERAGE_DEV_STARTUP_SUFFIX` accordingly in your `.env` file):

```bash
# step #1
cd 121-platform
npm run start:services:detach
# step #2
cd services/121-service
docker exec 121-service  npm run test:integration:all
# step #3, option a) manually kill the server
curl -d '{"secret":"fill_in_secret"}' -H "Content-Type: application/json" -X POST 'http://localhost:3000/api/test/kill-service'
# step #4
# note: this will not work if the previous steps, for whatever reason, did not generate coverage data in .nyc_output
docker compose exec 121-service npm run coverage:report:integration
# (optional) open the report in your browser
npm run coverage:open:integration
```

##### Combined test coverage

Test coverage is collected for unit and integration tests separately, and then combined in CI by QLTY.

You can, however, manually do this on your local machine by following a few steps. This assumes that you have already followed the steps for unit and integration tests. You can verify this by trying to open the two relevant reports in your browser, as outlined above.

```bash
# generate a single report that combines unit & integration coverage reports
npm run coverage:report:combined
# (optional) open the combined report in your browser
npm run coverage:open:combined
```

### Debugging

To enter the 121-service in the terminal use: (Or use the "Exec"-tab inside Docker Desktop)

    docker exec -it 121-service  /bin/sh

You can use the debugger in Visual Studio Code to set breakpoints and do step-through debugging. This works for the 121 Service, Mock Service and Integration Tests that run via jest. To make this work, the code contains configurations in launch.json, package.json of 121-service and mock-service and docker-compose.development.

For the 121 Service and Mock Service start the debugger from Visual Studio Code by following these steps:

1. Start the services with npm run start:services.
2. Open the Run and Debug section in Visual Studio Code by clicking the play arrow with bug icon in the left vertical bar of icons.
3. In the dropdown next to the green play button select what you want to debug: 121 Service or Mock Service.
4. Press the green play button. This attaches the Debugger to the node process in the respective Docker container. You can debug both Services at the same time by attaching both.
5. Now you can for example set a breakpoint in your code by right mouse clicking to the left of the line number and select Add breakpoint.

For the Integration Tests it works a bit differently:

1. Start the services with npm run start:services.
2. Run the integration tests with the command: docker exec 121-service npm run test:integration:debug (you can add filters like normal)
3. Open the Run and Debug section in Visual Studio Code by clicking the play arrow with bug icon in the left vertical bar of icons.
4. In the dropdown next to the green play button select Integration Tests.
5. Press the green play button. This attaches the Debugger to the jest node process in the 121-service Docker container.
6. Set a breakpoint in the test code where you want it.
7. Now press the |> continue button (or press F5) so the code runs until your breakpoint.

Reason that it works differently for Integration Tests: the test start to run automatically immediately after the node process starts, as opposed to the Services that wait for an API request. So therefore the script is set to break immediately after start-up, and you have time to attach the debugger to the jest node process.

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
2. This creates a folder called 'documentation' and starts a website that is typically available under: <http://localhost:8080/>
3. Most useful is the per-module diagram and documentation available under: <http://localhost:8080/modules.html>
4. For more information, see: <https://docs.nestjs.com/recipes/documentation>

#### AppMap

AppMap is a very extensive static and dynamic code analysis tool which can be run as a Visual Studio Extension. It has many features, options, and comes with an AI chat bot to converse with:

1. Install the AppMap Extension in Visual Studio Code. Reference: <https://marketplace.visualstudio.com/items?itemName=appland.appmap>
2. Start the 121 Service node process under the `appmap-node` npx script by using: `npm run start:services:appmap` on your development environment.
3. Create recordings by calling an API endpoint, or running test suites, or interacting via the 121 Portal. These recordings are stored in the `tmp/appmap` folder under the 121-service.
4. Open these recordings from the `APPMAPS`-pane in the AppMap Extension in VS Code.
5. Note: Docker creates new files as root. At least on Linux you need to run `sudo chown -R <your-username> .` in the 121-service folder so that the AppMap Extension can access the files of the recordings.
6. AppMap creates Dependency Diagrams, Sequence Diagrams, Flame Graphs and more to get insight of the code's behavior.
7. AppMap also as an AI bot called Navie AI to ask questions to.
8. For more information: <https://appmap.io/docs/appmap-overview.html> or access the Slack channel: <https://appmap.io/community>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
