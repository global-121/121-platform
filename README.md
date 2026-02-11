# 121 platform

121 is an open source platform for Cash based Aid built for the Humanitarian sector by the Netherlands Red Cross. -- Learn more about the platform: <https://www.121.global/>

---

[![License](https://img.shields.io/github/license/global-121/121-platform?style=flat-square)](LICENSE)
[![Releases](https://img.shields.io/github/v/release/global-121/121-platform?style=flat-square)](https://github.com/global-121/121-platform/releases)

---

## Status

See: [status.121.global](https://status.121.global/)

### Tests Status

Static analysis, formatting, code-style, functionality, integration, etc:

- [![Test: Workflows](https://github.com/global-121/121-platform/actions/workflows/test_workflows.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_workflows.yml)
- [![Test: Formatting](https://github.com/global-121/121-platform/actions/workflows/test_formatting.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_formatting.yml)
- [![Test: Code scanning with CodeQL](https://github.com/global-121/121-platform/actions/workflows/test_codeql-analysis.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_codeql-analysis.yml)
- [![Test Interface: Portal](https://github.com/global-121/121-platform/actions/workflows/test_interface_portal.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_interface_portal.yml)
- [![Test Mock-Service: Code](https://github.com/global-121/121-platform/actions/workflows/test_mock-service_code.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_mock-service_code.yml)
- [![Test Service: Code](https://github.com/global-121/121-platform/actions/workflows/test_service_code.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_service_code.yml)
- [![Test Service: API Integration](https://github.com/global-121/121-platform/actions/workflows/test_service_api.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_service_api.yml)
- [![Test: E2E (Portal)](https://github.com/global-121/121-platform/actions/workflows/test_e2e_portal.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_e2e_portal.yml)

See also: [Testing](#testing)

---

## Documentation

The documentation of the 121 platform can be found on the Wiki of this repository on GitHub: <https://github.com/global-121/121-platform/wiki>

---

## Getting Started

### Set up a local development-environment

- Install Git: <https://git-scm.com/download/>
- Install Node.js: <https://nodejs.org/en/download/>
  - Install the version specified in the [`.node-version`](.node-version)-file.

  - To prevent conflicts between projects or components using other versions of Node.js it is recommended to use a 'version manager'.
    - [FNM](https://nodejs.org/en/download/package-manager/#fnm) (for Windows/macOS/Linux

    - [NVM - Node Version Manager](http://nvm.sh/) (for macOS/Linux).

    - [NVM for Windows](https://github.com/coreybutler/nvm-windows) (for Windows))

- Install Docker
  - On Linux, install Docker Engine + Compose plugin: <https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository>
  - On macOS, install Docker Desktop: <https://docs.docker.com/docker-for-mac/install/>

  - On Windows, install Docker Desktop: <https://docs.docker.com/docker-for-windows/install/>

    If there are issues running Docker on Windows, you _might_ need to do the following:
    - Install WSL2 Linux kernel package.  
      Check step 4 on <https://learn.microsoft.com/en-us/windows/wsl/install-manual>
    - Set WSL2 as default version in PowerShell
      - `wsl --set-default-version 2`
      - Check step 5 on <https://learn.microsoft.com/en-us/windows/wsl/install-manual>

### Set up repository and code

With these tools in place you can checkout the code and start setting up:

    git clone https://github.com/global-121/121-platform.git

Navigate to the root folder of this repository:

    cd 121-platform

Then install the required version of Node.js and `npm`:

- If you use FNM: `fnm use` (And follow the prompts)

- If you use NVM
  - On macOS/Linux: `nvm install`

  - On Windows: `nvm install <version in .node-version-file>`

---

Now, make sure to run the following in the root folder to install the necessary pre-hooks:

```bash
npm install
```

## Setup Services

Copy the centralized `.env`-file

    cp -i services/.env.example services/.env

Each environment-variable is explained in the [`.env.example`-file](./services/.env.example). See the comments above each variable.

The initially set values are the defaults that should enable you to do local development and run all (automated) tests.

- Some variables _should_ have a unique/specific value for your (local) environment.
- Some are (sensitive) credentials or tokens to access third-party services. (Reach out to the development-team if you need them.)
- Some are feature-switches that enable/disable specific features of the platform.

## Start Services

To start all services, after setup, from the root of this repository, run:

    npm run start:services

This will run Docker Compose in "attached" mode. The logs for all containers will be output to `stdout`.  
To stop all services press <kbd>⌃ Control</kbd> + <kbd>C</kbd>.

To see the status/logs of all/a specific Docker-container(s), run: (Where `<container-name>` is optional; See container-names in [`docker-compose.yml`](services/docker-compose.yml)).

    npm run logs:services <container-name>

To verify the successful installation and setup of services, access their Swagger UI:

- 121-Service: <http://localhost:3000/docs/>
- Mock-Service: <http://localhost:3001/docs/>

---

## Setup Interfaces

Install dependencies for the portal, run:

    npm run install:portal

Also, make sure to set the environment-variables. Run:

    cp -i interfaces/portal/.env.example interfaces/portal/.env

## Start Interfaces

To start the portal, from the root of this repository, run:

    npm run start:portal

Or explore the specific options as defined in the [`package.json`](interfaces/portal/package.json) or [`README.md`](interfaces/portal/README.md).

When started, the portal will be available via: <http://localhost:8888>

---

## Local development

When you use [VS Code](https://code.visualstudio.com/), you can start multiple editor-windows at once, from the root of this repository, run:

    npm run code:all

To start an individual interface/service in VS Code:

- Run: (where `<package>` is one of `portal`, `121-service`, `mock-service`)

      npm run code:<package>

### Using environment-variables

See for guidelines on how we work with environment-variables, at the top of: [`.env.example`](services/.env.example).

#### Third party API tokens, credentials, infrastructure-specific values, etc

All (sensitive) tokens, access keys for third party APIs, infrastructure-specific hostnames and similar values should be injected in the application(s) via environment-variables.

⚠️ Make sure never to commit any such sensitive values! Always use the (ignored) local `.env`-file.

### Process for implementing data-model changes

When making changes to the data-model of the `121-service` (creating/editing any `\*.entity.ts` files), you need to create a migration script to take these changes into affect.

The process is:

1. Make the changes in the `\*.entity.ts` file
2. To generate a migration-script run: `docker exec 121-service npm run migration:generate src/migration/<descriptive-name-for-migration-script>`. This will compare the data-model according to your code with the data-model according to your database, and generate any CREATE, ALTER, etc SQL-statements that are needed to make the database align with code again.
3. Restart the 121-service through `docker restart 121-service`: this will always run any new migration-scripts (and thus update the data-model in the database), so in this case the just generated migration-script.
4. If more changes required, then follow the above process as often as needed.

5. Do NOT import any files from our code base into your migrations. For example, do NOT import seed JSON files to get data to insert into the database, since the migration may break if ever these seed JSON files change. Instead, "hard code" the needed data in your migration file.
6. Do NOT change migration files anymore after they have been merged to main, like commenting out parts of it, since there is a high probability this will result in bugs or faulty data on production instances. Instead, create a new migration file. The exception is bug fixing a migration file, for example if a file was imported that causes the migration to fail (see 5 above).
7. To run this file locally, do: `docker exec -it 121-service  npm run migration:run`
8. If you want to revert one migration you can run: `docker exec -it 121-service  npm run migration:revert`
9. If ever running into issues with migrations locally, the reset process is:
   - Delete all tables in the `121-service` database schema
   - Restart `121-service` container
   - This will now run all migration-scripts, which starts with the `InitialMigration`-script, which creates all tables
   - (Run seed)

10. When creating new sequences for tables with existing data be sure to also update it using `setval` ([example](https://github.com/global-121/121-platform/pull/6965/files)) to the current max id.
11. See also [TypeORM migration documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md) for more info

NOTE: if you're making many data-model changes at once, or are doing a lot of trial and error, there is an alternative option:

1. In `services/121-service/src/ormconfig.ts` set `synchronize` to `true` and restart `121-service`.
2. This will make sure that any changes you make to `\*.entity.ts` files are automatically updated in your database tables, which allows for quicker development/testing.
3. When you're done with all your changes, you will need to revert all changes temporarily to be able to create a migration script. There are multiple ways to do this, for example by stashing all your changes, or working with a new branch, etc. Either way:
   - stashing all your changes (git stash)
   - restart 121-service and wait until the data-model changes are actually reverted again
   - set `synchronize` back to `false` and restart 121-service
   - load your stashed changes again (git stash pop)
   - generate migration-script (see above)
   - restart 121-service (like above, to run the new migration-script)

To test the migrations you are creating you can use this .sh script (unix only) `./services/121-service/src/migration/test-migration.sh` example usage `./services/121-service/src/migration/test-migration.sh main feat.new-awesome-entity`

This script performs the following steps:

1. Checks out the old branch and stops the specified Docker containers.
2. Starts the Docker containers to apply the migration and load some data.
3. Waits for the service to be up and running, then resets the database with mock data.
4. Checks out the new branch, applies any stashed changes, and restarts the Docker containers to run the migrations again.

### Authentication

All services use [JSON Web Token](https://jwt.io/) (JWT) to handle authentication. The token should be passed with each request by the browser via an `access_token` cookie. The JWT authentication middleware handles the validation and authentication of the token.

### Recommended code-editor/IDE tools/extensions

To make development of all components of the 121-Platform easier, we recommend using VSCode with some specific extensions.  
They are listed in [`.vscode/extensions.json`](.vscode/extensions.json)-files, in each component's sub-folder, next to the root of the repository.

- [Main/root-folder](.vscode/extensions.json)  
  Generic extensions for code-style, linting, formatting, etc. Also GitHub Actions-workflow and Azure related ones.

- [Portal](interfaces/portal/.vscode/extensions.json)  
  Additional extensions for working with Angular, Tailwind, etc.

- [121-Service](services/121-service/.vscode/extensions.json) / [Mock-Service](services/mock-service/.vscode/extensions.json)  
  Additional extensions for working with Node.js, Jest Unit-tests, etc.

When you open a folder in VSCode and go to: "_Extensions_" and use the filter: "_Recommended_"(`@recommended`);  
A list should be shown and each extension can be installed individually.

#### Adding/Updating recommended extensions

In VSCode, you can add a new recommended extension by selecting "_Add to Workspace Recommendations_" from the context-menu in the Extensions sidebar.

Make sure to add an extension to all (other) **relevant** `extensions.json`-files, so that it is available in all components of the 121-platform. Angular/CSS-specific extensions don't need to be shared, but TypeScript/Formatting/Developer-convenience-related ones _do_.

## Common problems with Local Environment set-up

### Swagger-UI not accessible

If the Swagger-UI is not accessible after installing Docker and setting up the services, you can take the following steps to debug:

1. `docker compose ps` to list running containers and their status
2. `docker compose logs -f <container-name>` to check their logs/console output (or leave out the `<container-name>` to get ALL output)

### Docker related issues

If there are issues with Docker commands, it could be due to permissions. Prefix your commands with `sudo docker....`

### Database related errors

If the errors are related to not being able to access/connect to the database then reset/recreate the database by:

- Setting `dropSchema: true` in `src/ormconfig.ts` of the specific service.
- Restarting that service will reset/recreate its database(-schema)

### Upgrade Node.js version

When considering upgrading the (LTS) version of the Node.js runtime, take into account:

- The Node.js Release schedule: <https://github.com/nodejs/release#release-schedule>
- The (specific) version supported by Microsoft Azure App Services,  
  in their Node.js Support Timeline: <https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md>
- Angular's Actively supported versions: <https://angular.io/guide/versions#actively-supported-versions>

### Updated/new Node.js dependencies

When new Node.js dependencies are added to a service since it is last build on you local machine, you can:

- Verify if everything is installed properly:

      docker compose exec <container-name> npm ls

- If that produces errors or reports missing dependencies, try to build the service from a clean slate with:

      npm run install:services -- --no-cache <container-name>

  Or similarly:

      npm run start:services -- --force-recreate <container-name>

---

## Testing

- Scenarios of e2e and integration/API-tests for the whole platform are described in [`Azure Test Plan`](https://dev.azure.com/redcrossnl/121%20Platform/_testPlans/define?planId=27408&suiteId=27409).
- Each component has its own individual tests:
  - Unit-tests and UI-tests for all interfaces; Run with `npm test` in each `interfaces/*`-folder.
  - Unit-tests and API/integration-tests for all services; Run with `npm test` in each `services/*`-folder.  
    See the README: [121-service / Testing](./services/121-service/README.md#testing) for details.

### How to use E2E tests and maintain documentation/Test Suites

- For how to write and execute Playwright E2E tests see `e2e/README.md`/[E2E testing suite](https://github.com/global-121/121-platform/tree/main/e2e).
- For how to write and maintain Azure Test Plan suites see `wiki`/[Creating and maintaining E2E tests](https://github.com/global-121/121-platform/wiki/Creating-and-maintaining-E2E-tests).

### When to use an API-test? (back-end + db? only)

- Is it to test query-magic?
- Is it to test essential endpoints (FSP integrations) and import/exports/etc?
- Often used (with different parameters) endpoints: `PATCH /registration` etc.
- Is there actual business-logic performed?
- Not necessary:
  - update single (program) properties?
- Examples:
  - import Registrations -> change status (with list of `referenceId`s) -> export included registrations
  - update Registration-attributes: all different content-types + possible values (including edge cases)

#### Notes

These tests are still expensive (to bootstrap app + database)

### Unit Tests

#### Why?

There are a few reasons why we write unit tests cases:

- Unit tests are written to ensure the integrity the functional level aspect of the code written. It helps us identify mistakes, unnecessary code and also when there is room for improvement to make the code more intuitive and efficient.
- We also write unit test cases to clearly state what the method is supposed to do, so it is smoother for new joiners to be onboarded
- It helps us achieve recommended devOps protocols for maintaining code base while working within teams.

#### Maintenance with future changes

How are Unit Tests affected when we make changes within the code in future?

- We should aim to write and update unit tests along side the current development, so that our tests are up to date and also reflect the changes done. Helps us stay in track
- Unit tests in this case differ from manual or automated UI testing. While UI may not exhibit any changes on the surface it is possible code itself might be declaring new variables or making new method calls upon modifications, all of those need to be tested and the new test-scenario or spec-file should be committed together with the feature change.

#### Our testing framework(s)

We are using `jest` for executing unit tests within `interfaces` and `services`.

#### Writing tests

See the [Guide: Writing tests](./guide-Writing-Tests.md)

### Test Coverage

Test coverage is collected and reported to the [QLTY dashboard](https://qlty.sh/gh/global-121/projects/121-platform). This information is then used to determine whether a PR is decreasing test coverage or not.

Refer to the README file of the [121-service](/services/121-service/README.md#test-coverage) or the [portal interface](/interfaces/portal/README.md#test-coverage) for more detailed information on how each coverage report is generated.

---

## Releases

See notable changes and the currently released version on the [Releases page](https://github.com/global-121/121-platform/releases).

This project uses the [`CalVer`](https://calver.org/#scheme)-format: `YY.MM-MICRO`.

### Release Checklist

This is how we create and publish a new release of the 121-platform.
(See [the glossary](#glossary) for definitions of some terms.)

- Define _what_ code needs to be released.  
   (Is the current state of the `main`-branch what we want? Or a specific commit/point-in-the-past?)
- Check the changes since the last release, by replacing `vX.X-X` with the latest release in this URL: `https://github.com/global-121/121-platform/compare/vX.X-X...main`  
  Check any changes to make sure we highlight new user-features, or any required changes to the deployment-process or newly required environment-variables, etc.  
  So we can include these in the release-notes.
- Define the [`version`](#glossary)-name for the upcoming release.
- "[Draft a release](https://github.com/global-121/121-platform/releases/new)" on GitHub
  - For "Choose a tag": Insert the `version` to create a new tag
  - For "Target": Choose the commit which you would like to release (defined in the first step).
  - Set the title of the release to `<version>`.
  - Use the "Generate release notes" button and double-check the contents.  
    Rephrase where necessary or highlight specific changes/features.
- Publish the release on GitHub (as "**latest**", not "pre-release")

### Hotfix-release Checklist

Only in rare, very specific circumstances it might be required to do a "hotfix-release". For example when:

- A new (incomplete) feature, that is not yet communicated to end-users, is already in `main`
- A (complex) migration-script, that would require an out-of-office-hours deployment, is already in `main`
- Another issue that would pose (too big) a risk to deploy to any of the currently running instances.  
  Consider however, that it is also possible to _**postpone**_ the deployment of a regular release, for a specific instance.

This follows a similar process to regular release + deployment, with some small changes.

- Checkout the `<version>` tag which contains the code that you want to hotfix.
- Create a new local hotfix-branch using that tag as the `HEAD` (e.g. `hotfix/<vX.X-X>`, with an increased final `MICRO`-number) and make the changes.
- Push this branch to the upstream/origin repository on GitHub.  
  Verify the test-runs(s) on the hotfix-branch by looking at the status of the last commit on the [branches-overview](https://github.com/global-121/121-platform/branches/all?query=hotfix).
- Create a new release + tag (see above) selecting the `hotfix/v*`-branch as target, and publish it.
- Use the ["Deploy new code"](https://github.com/global-121/infrastructure/#deploy-new-code) checklist to deploy the newly created _tag_ (**not the branch**). For only the required instance.
- After the hotfix has been released+deployed to production, follow standard procedures to get the hotfix-code into the `main`-branch.

**Note:** 💡 Do not rebase/update the `hotfix/v*`-branch onto the `main`-branch until **AFTER** you have successfully deployed the hotfix to production.  
The hotfix branch is created from a "dangling" commit, this makes the GitHub UI confused when you look at a PR between the newly created `hotfix`-branch and the `main`-branch. Any conflict warnings shown on GitHub are not relevant for the hotfix-_deployment_, they'll only need to be addressed to merge the hotfix into the `main`-branch afterwards.

---

## Deployment

The 121-Platform should be deployed to:

- a static web-hosting service (for the Portal only)
- a Node.js-capable environment (for 121-Service and Mock-Service)
- using a (possibly externally hosted) PostgreSQL-database
- using a (possible externally hosted) Redis-queue
- using some (externally hosted) Azure-services (Blob Storage, E-mail sending, etc)

This infrastructure is defined to be run using Docker (in use for local development only). But no guarantees are made that the platform can be deployed as-is to any Docker-capable hosting service.

> 🏗️ 510-only:  
> See details on _how to deploy new code_ in the [`infrastructure`-repository](https://github.com/global-121/infrastructure/#deploy-new-code).

## Glossary

| Term          | Definition (_we_ use)                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `version`     | A name specified in the [`CalVer`](https://calver.org/#scheme)-format: `YY.MM-MICRO`                         |
| `tag`         | A specific commit or point-in-time on the git-timeline; named after a version, i.e. `v22.1.0`                |
| `release`     | A fixed 'state of the code-base', [published on GitHub](https://github.com/global-121/121-platform/releases) |
| `deployment`  | An action performed to get (released) code running on an environment                                         |
| `environment` | A machine that can run code (with specified settings); i.e. a service, or your local machine                 |

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
