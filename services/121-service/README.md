# 121-Service

The 121-Service is the backend where 121-programs can be created and monitored, etc.

---

## Getting started / Installation

See instructions to get started in the main [`README`](../../README.md#getting-started).

## Database

This service uses [TypeORM](https://typeorm.io/) with a PostgreSQL database.

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
  It can be viewed with <https://mermaid.live/> or in VSCode Markdown Preview-mode.

### Updating/adding Node.js dependencies

Make sure to update any dependencies from _within_ the Docker-container, with:

    docker compose exec 121-service  npm install --save <package-name>

---

## External services

### Application Insights

The service uses the Node.js `applicationinsights` 3.x SDK. Telemetry starts before
NestJS and its instrumented dependencies load. Without
`APPLICATIONINSIGHTS_CONNECTION_STRING`, initialization is skipped.

#### Upgrade decisions (AB#45327, compatibility layer)

- Keep the `applicationinsights` package and its manual tracking APIs rather than
  replace the logging stack with the Azure Monitor OpenTelemetry distribution.
  This limits changes to existing traces, exceptions, custom events and callers.
- Keep `main.ts` as an ordered, two-import entry point (`instrumentation`, then
  `server`). The import formatter otherwise moves initialization behind NestJS
  imports, which prevents reliable dependency instrumentation. The existing server
  bootstrap lives in `server.ts`; startup commands remain unchanged.
- Replace the unsupported `addTelemetryProcessor` with the supported HTTP
  `startIncomingSpanHook`. Preserve the `x-121-interface` header as the request's
  `customDimensions.interface`, rather than rename the dimension or emit another
  request record. Explicit HTTP enablement keeps the hook configuration compatible
  with the SDK's public options type; it matches the SDK default.
- Keep existing application-authored messages, properties, severity levels,
  redaction, middleware coverage and per-message flushing in this first layer.
  Handle rejected flush promises as well as synchronous errors, since SDK 3.x
  flushing is asynchronous.
- Use the public `KnownSeverityLevel` export instead of an internal SDK path.
  Azure still receives Error/Critical severity for the existing alert flag.
- Keep SDK collection defaults rather than recreate legacy internals. SDK-generated
  names, runtime counters and correlation behavior follow the 3.x SDK; unsupported
  legacy features such as native extended metrics are not recreated. Existing
  application-authored telemetry contracts remain unchanged.
- Set `tracesPerSecond: 0` to retain percentage-based sampling (100% by default,
  still configurable through the SDK). The underlying distribution otherwise
  defaults to a five-trace-per-second rate-limited sampler, which can discard
  requests even though the compatibility SDK reports 100% sampling. This is a
  deliberate exception to the new defaults to preserve collection volume.
- Deny the new transitive `protobufjs` install script explicitly. Its script only
  checks dependency version notation; it is not needed at runtime.

References: [Node.js SDK and supported configuration](https://github.com/microsoft/ApplicationInsights-node.js#readme),
[Node.js migration guide](https://learn.microsoft.com/azure/azure-monitor/app/opentelemetry-nodejs-migrate?tabs=cleaninstall),
[HTTP instrumentation hooks](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/opentelemetry-instrumentation-http#http-instrumentation-options).

#### Baseline observability (AB#45327, second layer)

| Signal                                                       | Collection                                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Request volume, duration and failures                        | SDK HTTP instrumentation; request names use Express route templates, not individual identifiers               |
| Outbound HTTP and PostgreSQL duration/failures               | SDK defaults                                                                                                  |
| Redis commands within traced operations                      | Standard OpenTelemetry `ioredis` instrumentation; command names only, without keys or values                  |
| NestJS logs and handled errors                               | `ApplicationInsightsLogger`, with severity and logger context; Error objects become exception records         |
| Existing custom events, traces and handled exceptions        | Existing `AzureLogService` APIs                                                                               |
| Uncaught errors and unhandled rejections                     | One Critical exception plus a restart trace; bounded delivery before exit code 1                              |
| Process CPU, memory and supported request/exception counters | SDK default performance counters, on the SDK's collection interval                                            |
| Service identity                                             | OpenTelemetry resource `service.name=121-service`; `service.version` from `GLOBAL_121_VERSION` when available |

Requests, dependencies, logs and exceptions retain SDK operation correlation.
`x-121-interface` still populates `customDimensions.interface`. Automatic metrics
and service resources use SDK defaults; no custom business counters are added.

##### Decisions and alternatives

- Add only the missing `ioredis` instrumentation, not an all-instrumentations
  bundle. The SDK's Redis instrumentation targets the `redis` package, while this
  service uses `ioredis`. Retain the instrumentation's default parent-span
  requirement to avoid exporting every background Bull polling command. Job-level
  traces and queue-depth/business metrics remain outside this slice.
- Align the instrumentation dependency generation with the Application Insights
  SDK (`instrumentation` 0.221.x, `instrumentation-ioredis` 0.69.x), rather than
  introduce another instrumentation generation. Newer packages also triggered
  the repository's minimum-release-age policy during installation.
- Bridge NestJS's existing logger instead of adding Winston/Pino or enabling
  blanket console collection. Keep local console output. Export string messages
  and Error objects, but omit other objects and structured parameters from Azure
  records to avoid exporting unaudited payloads. Existing direct `console.*`
  output remains local; callers should use NestJS Logger or AzureLogService for
  cloud-visible logs. Never put personal data or secrets in free-text messages,
  exceptions or custom-event properties; these remain the caller's responsibility.
- Remove the Onafriq/Safaricom payload-logging middleware rather than maintain a
  second request record alongside automatic HTTP telemetry. Retain the public
  external-request logging methods for SOAP and other manual callers, but export
  fixed success/failure messages with only origin and status code. Failures now
  produce Error-severity traces, not synthetic exceptions containing payloads.
- Redact URL credentials, concrete paths/query strings, database statement text,
  database usernames/connection strings and incoming caller addresses. Keep route
  templates, dependency origins, operation names, durations and outcomes.
  Centralize this in a span processor's mutable `onEnding` hook rather than
  mutate the read-only `onEnd` span or introduce an external collector. `onEnding`
  is an experimental OpenTelemetry API in the locked SDK; SDK upgrades need a
  real-ingestion privacy check in addition to unit tests.
- Use a standard resource for name/version across logs, traces and metrics, rather
  than client tags that do not consistently cover metrics.
- Keep percentage-based sampling from the compatibility layer. Keep console
  auto-collection disabled. Disable SDK uncaught-exception collection because the
  service owns fatal handling; this prevents duplicate exception records and
  retains exit code 1 for unhandled rejections. Register those handlers before
  NestJS bootstrap rather than after listening.
- Use SDK batching instead of flushing every event. Enable NestJS shutdown hooks
  for graceful signals and flush/shut down telemetry after application closure.
  Bound this work to five seconds so an unavailable ingestion endpoint cannot
  block shutdown or fatal restart indefinitely. Log timeout/export failures
  locally. Delivery after a hard kill or deadline expiry is not guaranteed.

These are intentional output changes in the second layer. Queries based on
request/response body text, full external URLs, caller IPs or the former synthetic
HTTP exceptions need updates. No API responses, payloads or Fsp behavior change.
Legacy native extended metrics, arbitrary console/object capture, dashboards,
alerts and browser instrumentation remain excluded.

##### Azure verification queries

Run these in the Application Insights resource after deployment. Allow at least
one minute for default performance counters. Live Azure ingestion and existing
deployment-specific dashboards require an authorized deployment check; local
collector checks do not prove Azure-side ingestion.

```kusto
requests
| where timestamp > ago(30m) and cloud_RoleName == "121-service"
| summarize requests=sum(itemCount),
    failures=sumif(itemCount, success == false),
    p95Duration=percentile(duration, 95)
    by name, tostring(customDimensions.interface), bin(timestamp, 5m)
```

```kusto
dependencies
| where timestamp > ago(30m) and cloud_RoleName == "121-service"
| summarize calls=sum(itemCount), failures=sumif(itemCount, success == false),
    p95Duration=percentile(duration, 95) by type, target, name
```

```kusto
union traces, exceptions, customEvents
| where timestamp > ago(30m) and cloud_RoleName == "121-service"
| project timestamp, itemType, operation_Id, operation_ParentId,
    severityLevel, message, outerMessage, name, customDimensions
| order by timestamp desc
```

```kusto
union performanceCounters, customMetrics
| where timestamp > ago(30m) and cloud_RoleName == "121-service"
| summarize samples=count() by itemType, name
```

References: [NestJS custom loggers](https://docs.nestjs.com/techniques/logger#extending-built-in-logger),
[NestJS shutdown hooks](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown),
[`ioredis` instrumentation and privacy options](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-ioredis),
[OpenTelemetry mutable span-ending hook](https://opentelemetry.io/docs/specs/otel/trace/sdk/#onending),
[Azure Monitor OpenTelemetry options](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/monitor/monitor-opentelemetry#configuration).

### FSP-specific instructions

For FSP-specific instructions, see the README.md in each individual FSP-folder, e.g. for [Intersolve](./src/fsp-integrations/integrations/intersolve/README.md)

## Development

### Scoped repositories and request scope

Scoped repositories (see [scoped.repository.ts](./src/scoped.repository.ts)) are
`Scope.REQUEST` providers that read the user from the injected `REQUEST`.
Do not mark them `durable`: for a controller whose dependency tree is purely
durable, NestJS injects the context-id payload (which is `undefined` without a
`ContextIdStrategy`) instead of the HTTP request, so scope filtering is silently
skipped. Without a strategy, `durable` gives no caching benefit either.

### Testing

To run the Unit-tests: (replace `:all` with `:watch` to run during development)

    docker exec 121-service  npm run test:unit:all

To run the API/Integration tests: (replace `:all` with `:watch` to run during development)

    docker exec 121-service  npm run test:integration:all

To run a single test suite, amend the name of the test file, for example:

    docker exec 121-service  npm run test:integration:base update-program.test.ts

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
curl --data '{"secret":"fill_in_secret"}' --header "Content-Type: application/json" --request POST 'http://localhost:3000/api/test/kill-service'
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

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
