# 121 platform

121 is an open source platform for Cash based Aid built with Digital Account & Local/Global Financial service partners. -- Learn more about the platform: <https://www.121.global/>

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
- [![Test Interface: Portalicious](https://github.com/global-121/121-platform/actions/workflows/test_interface_portalicious.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_interface_portalicious.yml)
- [![Test Mock-Service: Code](https://github.com/global-121/121-platform/actions/workflows/test_mock-service_code.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_mock-service_code.yml)
- [![Test Service: Code](https://github.com/global-121/121-platform/actions/workflows/test_service_code.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_service_code.yml)
- [![Test Service: API Integration](https://github.com/global-121/121-platform/actions/workflows/test_service_api.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_service_api.yml)
- [![Test: E2E (Portal)](https://github.com/global-121/121-platform/actions/workflows/test_e2e_portal.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_e2e_portal.yml)
- [![Test: E2E (Portalicious)](https://github.com/global-121/121-platform/actions/workflows/test_e2e_portalicious.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_e2e_portalicious.yml)
- [![Test: Performance](https://github.com/global-121/121-platform/actions/workflows/test_k6.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_k6.yml)

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

Switch to the repository folder

    cd services/

Copy the centralized .env file

    cp .env.example .env

Environment variables are explained in the comments of the [`.env.example`-file](./services/.env.example), some already have a value that is safe/good to use for development, some need to be unique/specific for your environment.

Some variables are for credentials or tokens to access third-party services.

## Start Services

To start all services, after setup, from the root of this repository, run:

    npm run start:services

To see the status/logs of all/a specific Docker-container(s), run: (Where `<container-name>` is optional; See container-names in [`docker-compose.yml`](services/docker-compose.yml)).

    npm run logs:services <container-name>

To verify the successful installation and setup of services, access their Swagger UI:

- 121-Service: <http://localhost:3000/docs/>
- Mock-Service: <http://localhost:3001/docs/>

---

## Setup Interfaces

Install dependencies for the portal, run:

    npm run install:portal

Also, make sure to create an env file for each interface. For example:

    cp interfaces/Portal/.env.example interfaces/Portal/.env

## Start Interfaces

To start the portal, from the root of this repository, run:

    npm run start:portal

- Or explore the specific options as defined in each interface's own `package.json` or `README.md`.

When started, the portal will be available via:

- Portal: <http://localhost:8888>

---

## Local development

When you use [VS Code](https://code.visualstudio.com/), you can start multiple editor-windows at once, from the root of this repository, run:

    npm run code:all

To start an individual interface/service in VS Code:

- Run: (where `<package>` is one of `portal`, `portalicious`, `121-service`, `mock-service`)

      npm run code:<package>

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

10. See also [TypeORM migration documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md) for more info

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

### Authentication

All services use [JSON Web Token](https://jwt.io/) (JWT) to handle authentication. The token should be passed with each request by the browser via an `access_token` cookie. The JWT authentication middleware handles the validation and authentication of the token.

### Adding third party API tokens

All the tokens and access keys for third party APIs should be added on the `.env`-file and subsequently imported using the environment variables within typescript files.

### Recommended code-editor/IDE tools/extensions

To help with some types if files/tasks we've listed them here:

- [Workspace recommendations for VS Code](.vscode/extensions.json)
  When you open the root-folder of this repository in VSCode and go to: "_Extensions_" and use the filter: "_Recommended_"(`@recommended`);
  A list should be shown and each extension can be installed individually.

  Generic highlights:

  - [Cucumber (Gherkin) Full Support](https://marketplace.visualstudio.com/items?itemName=alexkrechik.cucumberautocomplete) - To work with `.feature`-files for test-scenarios

  Interfaces / front-end highlights:

  - [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - To work with translations in the HTML-templates and component TS-files

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
- Ionic Framework's supported Node.js versions: <https://ionicframework.com/docs/intro/environment#Node--npm>

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

- Scenarios of end-to-end/integration-tests for the whole platform are described in [`/features`](features/#readme).
- Each component has its own individual tests:
  - Unit-tests and UI-tests for all interfaces; Run with `npm test` in each `interfaces/*`-folder.
  - Unit-tests and API/integration-tests for all services; Run with `npm test` in each `services/*`-folder.
    See: `121-service/README.md`/[Testing](./services/121-service/README.md#testing) for details.

### When to use an API-test? (back-end + db? only)

- Is it to test query-magic?
- Is it to test essential endpoints (FSP integrations) and import/exports/etc?
- Often used (with different parameters) endpoints: PATCH /registration etc.
- Is there actual business-logic performed?
- Not necessary:
  - update single (program) properties?
- Examples:
  - import registrations -> change PA-status (with list of refIds) -> export included PAs
  - update PA attributes: all different content-types + possible values (including edge cases)

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

We are using `jasmine` for executing unit tests within `interfaces` and `jest` within `services`. However, while writing the unit test cases, the writing style and testing paradigm do not differ since `jest` is based on `jasmine`.

#### Writing tests

See the [Guide: Writing tests](./guide-Writing-Tests.md)

---

## Releases

See notable changes and the currently released version on the [Releases page](https://github.com/global-121/121-platform/releases).

This project uses the [`CalVer`](https://calver.org/#scheme)-format: `YY.MM-MICRO`.

### Release Checklist

This is how we create and publish a new release of the 121-platform.
(See [the glossary](#glossary) for definitions of some terms.)

- [ ] Define what code gets released. ("_Is the current `main`-branch working?_")
- [ ] Check the changes since the last release, by replacing `vX.X-X` with the latest release in this URL: `https://github.com/global-121/121-platform/compare/vX.X-X...main`
  - [ ] Check whether there are any changes to [`services/.env.example`](services/.env.example). If there are, then make any configuration changes to the staging-service in the Azure Portal, relating to new/changed/removed `ENV`-variables, changed values, etc.
- [ ] Define the [`version`](#glossary)-name for the upcoming release.
- [ ] "[Draft a release](https://github.com/global-121/121-platform/releases/new)" on GitHub
  - For "Choose a tag": Insert the `version` to create a new tag
  - For "Target": Choose the commit which you would like to release on `main`
  - Set the title of the release to `<version>`.
  - Use the "auto-generate release notes" button to generate the release notes, and double-check their contents
    - This will also be the basis of the "Inform stakeholders" message to be posted on Teams
- [ ] Publish the release on GitHub (as 'latest', not 'pre-release')
- [ ] Check the deployed release on the staging-environment
  - Now, and throughout the release process, it is wise to monitor the [CPU usage](https://portal.azure.com/#@rodekruis.onmicrosoft.com/blade/Microsoft_Azure_MonitoringMetrics/Metrics.ReactView/Referer/MetricsExplorer/ResourceId/%2Fsubscriptions%2Fb2d243bd-7fab-4a8a-8261-a725ee0e3b47%2FresourceGroups%2F510Global%2Fproviders%2Fmicrosoft.insights%2Fcomponents%2F121-global-application-insights/TimeContext/%7B%22relative%22%3A%7B%22duration%22%3A3600000%7D%2C%22showUTCTime%22%3Afalse%2C%22grain%22%3A1%7D/ChartDefinition/%7B%22v2charts%22%3A%5B%7B%22metrics%22%3A%5B%7B%22resourceMetadata%22%3A%7B%22id%22%3A%22%2Fsubscriptions%2Fb2d243bd-7fab-4a8a-8261-a725ee0e3b47%2FresourceGroups%2F510Global%2Fproviders%2Fmicrosoft.insights%2Fcomponents%2F121-global-application-insights%22%7D%2C%22name%22%3A%22performanceCounters%2FprocessorCpuPercentage%22%2C%22aggregationType%22%3A3%2C%22namespace%22%3A%22microsoft.insights%2Fcomponents%22%2C%22metricVisualization%22%3A%7B%22displayName%22%3A%22Processor%20time%22%2C%22color%22%3A%22%2347BDF5%22%7D%7D%5D%2C%22title%22%3A%22Most%20recent%20Max%20CPU%20usage%20App%20Services%22%2C%22titleKind%22%3A2%2C%22visualization%22%3A%7B%22chartType%22%3A2%2C%22legendVisualization%22%3A%7B%22isVisible%22%3Atrue%2C%22position%22%3A2%2C%22hideSubtitle%22%3Afalse%2C%22hideHoverCard%22%3Afalse%2C%22hideLabelNames%22%3Atrue%7D%2C%22axisVisualization%22%3A%7B%22x%22%3A%7B%22isVisible%22%3Atrue%2C%22axisType%22%3A2%7D%2C%22y%22%3A%7B%22isVisible%22%3Atrue%2C%22axisType%22%3A1%7D%7D%7D%7D%5D%7D) of our services
- [ ] Make any configuration changes (`ENV`-variables, etc.) on production-service(s)
- [ ] Use the ["deploy [client name] All" deployment-workflows on GitHub Actions](https://github.com/global-121/121-platform/actions) to deploy to each production-instance.
  - **Start with the "\_**demo**\_"-instance. This will **also\*\* deploy the production Mock-Service.

### Patch/Hotfix Checklist

This follows a similar process to regular release + deployment, with some small changes.

- Checkout the `<version>` tag which contains the code that you want to hotfix.
- Create a new local hotfix-branch using that tag as the `HEAD` (e.g. `hotfix/<vX.X-X>`, with an increased final `MICRO`-number) and make the changes.
- Push this branch to the upstream/origin repository on GitHub.
- Create a new release + tag (see above) selecting the `hotfix/v*`-branch as target, and publish it.
- Use the [deployment-workflows on GitHub Actions](https://github.com/global-121/121-platform/actions) to deploy the newly created _tag_ (**not the branch**). For each required instance.
- After the hotfix has been released to production, follow standard procedures to merge the hotfix-branch into the `main`-branch.

**Note:** Do not rebase/update the `hotfix/v*`-branch onto the `main`-branch until **AFTER** you have successfully deployed the hotfix to production.  
The hotfix branch is created from a "dangling" commit, this makes the GitHub UI confused when you look at a PR between the newly created `hotfix`-branch and the `main`-branch. Any conflict warnings shown on GitHub are not relevant for the hotfix-_deployment_, they'll only need to be addressed to merge the hotfix into the `main`-branch afterwards.

---

## Deployment

### Database

If you deploy the 121-platform to a server for the first time it is recommended to setup a separate Postgres database server. The connection to this database can be made by editing the `POSTGRES_*` variables in `services/.env`.

### Interfaces

#### To "test" environment

See: (via [GitHub Action(s)](.github/workflows/); i.e. `deploy_test_*.yml` )

- PR's to the branch `main` are automatically deployed to an individual preview-environment.
- When merged, a separate deployment is done to the test-environment; for that interface only.

#### To "staging" and/or "production" environment(s)

See: (via [GitHub Action(s)](.github/workflows/); i.e. `deploy_staging_*.yml` )

- Created/published releases are automatically deployed to the staging-environment
- A manual deploy can be done using the GitHub UI, using "Run workflow/`workflow_dispatch`" and selecting the preferred release-version `tag` (or `branch` for testing on the staging-environment).

### Service(s)

#### To "test" environment

See: (via [GitHub Action(s)](.github/workflows/); i.e. `deploy_test_service.yml`, `deploy_test_mock-service.yml` )

- When merged, a separate deployment is done to the test-environment.
- Make sure to update any environment-configuration in the Azure-portal as soon as possible, preferably before the merge & deploy.

#### To "staging" and/or "production" environment(s)

#### On initial deployment (only)

- [ ] Create the necessary Azure resources
- [ ] Configure the service configurations based on [`.env.example`](./services/.env.example)
- [ ] Create the necessary build/deploy-workflow files
- [ ] Merge these new files into the `main`-branch
- [ ] Build/Deploy the platform via the [GitHub Action(s)](.github/workflows/) by selecting the target release-version `tag`

#### On next deployments

- [ ] Decide on what `version` to deploy
- [ ] Prepare the environment accordingly (Setting all service-configuration in Azure Portal)
- [ ] A manual deploy can be done using the GitHub UI, using "Run workflow/`workflow_dispatch`" and selecting the preferred release-version `tag` (or `branch` for testing on the staging-environment).

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
