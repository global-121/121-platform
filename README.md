# 121 platform

121 is an open source platform for Cash based Aid built with Digital Account & Local/Global Financial service partners. -- Learn more about the platform: <https://www.121.global/>

---

[![License](https://img.shields.io/github/license/global-121/121-platform?style=flat-square)](LICENSE)
[![Releases](https://img.shields.io/github/v/release/global-121/121-platform?style=flat-square)](https://github.com/global-121/121-platform/releases)

---

## Status

| Interfaces | Build Status                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-App     | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/PA-App?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=17&branchName=master)    |
| AW-App     | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/AW-App?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=18&branchName=master)    |
| HO-Portal  | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/HO-Portal?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=13&branchName=master) |

| Service     | Build Status                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 121-service | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/121-service?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=12&branchName=master) |

---

## Documentation

The documentation of the 121 platform can be found on the Wiki of this repository on GitHub: <https://github.com/global-121/121-platform/wiki>

---

## Getting Started

To set up a local development-environment:

- Install Git: <https://git-scm.com/download/>
- Install Node.js: <https://nodejs.org/en/download/>

  - Install the version specified in the [`.node-version`](.node-version)-file.
  - To prevent conflicts between projects or components using other versions of Node.js it is recommended to use a 'version manager'.

    - [NVM - Node Version Manager](http://nvm.sh/) (for macOS/Linux).

    - [NVM for Windows](https://github.com/coreybutler/nvm-windows) (for Windows)

    - [FNM](https://nodejs.org/en/download/package-manager/#fnm) (for Windows/macOS/Linux)

- Install Docker
  - On macOS, install Docker Desktop: <https://docs.docker.com/docker-for-mac/install/>
  - On Windows, install Docker Desktop: <https://docs.docker.com/docker-for-windows/install/>
  - On Linux:
    - Install Docker Engine: <https://docs.docker.com/engine/install/>
    - Install Docker Compose: <https://docs.docker.com/compose/install/#install-compose-on-linux-systems>

With these tools in place you can checkout the code and start setting up:

    git clone https://github.com/global-121/121-platform.git

Navigate to the root folder of this repository:

    cd 121-platform

Then install the required version of Node.js and `npm`:

- If you use NVM

  - On macOS/Linux:

        nvm install && npm install --global npm@7

  - On Windows:

         nvm install <version in .node-version> && npm install --global npm@7

- If you use FNM:

         fnm use && npm install --global npm@7

---

## Setup Services

Follow the "[Getting started / installation](services/README.md#getting-started--installation)"-section in the [services/README](services/README.md)-file.

## Start Services

To start all services, after setup, from the root of this repository, run:

    npm run start:services

To see the status/logs of all Docker-containers, run from the `services/`-folder:

    docker-compose logs -f <container-name>

To verify the successful installation and setup of services, access their Swagger UI:
| | URL | or run: |
| ------------------- | ----------------------------- | -------------------------- |
| 121-service | <http://localhost:3000/docs/> | `npm rum open:121-service` |

---

## Setup Interfaces

Follow the "[Getting started / installation](interfaces/README.md#getting-started--installation)"-section in the [interfaces/README](interfaces/README.md)-file.

Install dependencies for all the interfaces at once, run:

    npm run install:interfaces

Or to install 1 specific interface's dependencies, run: (where `<interface-name>` is one of `pa`, `aw`, `ho`)

    npm run install:<interface-name>

Or from each of the individual interface directories(`interfaces/*`) run:

    npm install

## Start Interfaces

To start all interfaces at once, from the root of this repository, run:

    npm run start:interfaces

To start an individual interface in development mode:

- Run: (where `<interface-name>` is one of `pa`, `aw`, `ho`)

      npm run start:<interface-name>

- Or explore the specific options as defined in each interface's own `package.json` or `README.md`.

All individual Angular applications, when started will be available via:

|           | URL                     | or run:           |
| --------- | ----------------------- | ----------------- |
| PA-App    | <http://localhost:8008> | `npm run open:pa` |
| AW-App    | <http://localhost:8080> | `npm run open:aw` |
| HO-Portal | <http://localhost:8888> | `npm run open:ho` |

---

## Local development

### Process for implementing data-model changes

When making changes to the data-model of the `121-service` (creating/editing any `\*.entity.ts` files), you need to create a migration script to take these changes into affect.

The process is:

1. Make the changes in the `\*.entity.ts` file
2. Generate a migration-script with `docker-compose exec 121-service npm run migration:generate <descriptive-name-for-migration-script>`. This will compare the data-model according to your code with the data-model according to your database, and generate any CREATE, ALTER, etc SQL-statements that are needed to make the database align with code again.
3. Restart the 121-service through `docker restart 121-service`: this will always run any new migration-scripts (and thus update the data-model in the database), so in this case the just generated migration-script.
4. If more changes required, then follow the above process as often as needed.
5. If ever running into issues with migrations locally, the reset process is:

- Delete all tables in the `121-service` database schema
- Restart `121-service` container
- This will now run all migration-scripts, which starts with the `InitialMigration`-script, which creates all tables
- (Run seed)

6. See also [TypeORM migration documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md) for more info

NOTE: if you're making many data-model changes at once, or are doing a lot of trial and error, there is an alternative option:

1. In `services/121-service/ormconfig.js` set `synchronize` to `true` and restart `121-service`.
2. This will make sure that any changes you make to `\*.entity.ts` files are automatically updated in your database tables, which allows for quicker development/testing.
3. When you're done with all your changes, you will need to revert all changes temporarily to be able to create a migration script. There are multiple ways to do this, for example by stashing all your changes, or working with a new branch, etc. Either way:
   - stashing all your changes (git stash)
   - restart 121-service and wait until the data-model changes are actually reverted again
   - set `synchronize` back to `false` and restart 121-service
   - load your stashed changes again (git stash pop)
   - generate migration-script (see above)
   - restart 121-service (like above, to run the new migration-script)

### Recommended code-editor/IDE tools/extensions

To help with some types if files/tasks we've listed them here:

- [Workspace recommendations for VS Code](.vscode/extensions.json)
  When you open the root-folder of this repository in VSCode and go to: "_Extensions_" and use the filter: "_Recommended_";  
  A list should be shown and each extension can be installed individually.

  Generic highlights:

  - [Cucumber (Gherkin) Full Support](https://marketplace.visualstudio.com/items?itemName=alexkrechik.cucumberautocomplete) - To work with `.feature`-files for test-scenarios
  - [Azure Pipelines](https://marketplace.visualstudio.com/items?itemName=ms-azure-devops.azure-pipelines) - To work with the CI/CD Azure Pipelines configurations

  Interfaces / front-end highlights:

  - [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - To work with translations in the HTML-templates and component TS-files

## Common problems with Local Environment set-up

### Swagger-UI not accessible

If the Swagger-UI is not accessible after installing Docker and setting up the services, you can take the following steps to debug:

1. `docker-compose ps` to list running containers and their status
2. `docker-compose logs -f <container-name>` to check their logs/console output (or leave out the `<container-name>` to get ALL output)

### Docker related issues

If there are issues with Docker commands, it could be due to permissions. Prefix your commands with `sudo docker....`

### Database related errors

If the errors are related to not being able to access/connect to the database then reset/recreate the database by:

- Setting `dropSchema: true` in `ormconfig.ts` of the specific service.
- Restarting that service will reset/recreate its database(-schema)

### Updating/adding Node.js dependencies

When new Node.js dependencies are added to the services since it is last build on you local machine, you can:

- Verify if everything is installed properly:

      docker-compose exec <container-name> npm ls

- If that produces errors or reports missing dependencies, try to build the service from a clean slate with:

      npm run install:services -- --no-cache <container-name>

  Or similarly:

      npm run start:services -- --force-recreate <container-name>

### Node-sass related errors on interface start

If you get an error related to node-sass when starting any interface, you might be using an incorrect version of Node.js.
To fix this you have two options:

1.  Check the correct Node.js version to use in the [`.node-version`](.node-version)-file.

2.  Check if you already have it installed on your machine with

        nvm list

    - If the correct version is installed, switch to it with

      (for macOS/Linux)

          nvm use

      (for Windows)

          nvm use <version in .node-version>

    - If the correct version is not installed, install it, then switch to it following the instructions above.

3.  If you still encounter problems after switching to the correct node version, try rebuilding `node-sass` with the following command:

        npm rebuild node-sass

---

## Testing

- Scenarios of end-to-end/integration-tests for the whole platform are described in [`/features`](features/#readme).
- Each component has its own individual tests:
  - Unit-tests and UI-tests for all interfaces; Run with `npm test` in each `interfaces/*`-folder.
  - Unit-tests and integration-tests for all services; Run with `npm test` in each `services/*`-folder.

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

We are using `jasmine` for executing unit tests within `interfaces` and `jest` within `services`. However, while writing the unit test cases, the writing style and testing paradigm do not differ since `jest` is based on `jasmine` to begin with.

#### Key points for writing tests

Keep the following points in mind while writing test cases:

- We should follow a practice to write to tests for all methods except the ones which are private.
- Every method which contains an async call, can be tested by returning a promise that can be spied and stubbed to verify the UI behavior.
- We should aim to write a complementary test for each method written on the file
- Verify class declarations and modifications through methods, boolean variables, string variables, etc.
- Monitor changes within the HTML template(values of attributes, content of buttons) and verify through test cases
- Create "`it ("should....`" scenarios for conditional code as well (e.g. if/else blocks)
- NOTE: It isn't necessary to test all the variables and all method calls, however a highlight of what the method is supposed to accomplish should be reflected within the test cases.
- Use the "`fit`" and "`fdescribe`" to execute only the unit test cases that you are currently working on. Make sure **not** to commit these commands.

- Testing class variables and objects, when they are being defined or constructed
- There are several methods which serve the purpose of defining class wide variables, which we should also test and verify. One of the typical examples of one such method is `ngOnInit`

```ts
it('ngOnInit: should set up variables', () => {
  expect(component.isLoggedIn).toBeDefined(); // check for class variables to be defined
  expect(component.someValye).toBeTruthy(); // check for a variable to be TRUE
  expect(component.someValye).toBeFalsy(); // check for a variable to be FALSE
});
```

The methods written as `toBeTruthy` are called matchers, they help us compare the expected values, their types, whether a method was called, the arguments of the methods and also their existence. There are various methods provided by the testing module. We can find a detailed list of those methods and their usage here: <https://jasmine.github.io/api/3.5/matchers.html>

A short introduction tutorial, to start off writing test cases can be found at: <https://jasmine.github.io/tutorials/your_first_suite>

##### Testing method callbacks and changes

- In order to test for methods to have been called, or been called with certain arguments use `spy` and `toHaveBeenCalled`/ `toHaveBeenCalledWith` matchers.

```ts
// Code
public doLogin(event: Event) {
  event.preventDefault();
  // ...rest of the actual method.
}

// Test
it('some_method: should call another fn', () => {
  spyOn(event, "preventDefault"); // Monitor the said method
  component.doLogin(event); // call some_method
  expect(event.preventDefault).toHaveBeenCalled(); // check for the monitored method to have been called
});
```

##### Testing conditional statements

- Make separate `it` blocks for different conditions.

```ts
it("Test when xyz === 'some-value'", () => {});
it("Test when xyz !== 'some-value'", () => {});
```

##### Testing Async methods (i.e. methods which make an API call)

- Make a Spy for the specific async call which returns a Promise object. For example a method containing a call routine `this.programsService.changePassword` can be spied using following

```ts
let spy = spyOn(component.programsService, 'changePassword').and.returnValue(
  Promise.resolve(true),
);
```

- Based on the changes / executions upon the completion of the async request, we should aim to test the changes and modifications.

```ts
// block to test what happens after the async calls:
spy.calls.mostRecent().returnValue.then(() => {
  // Here goes expectations and changes
});
```

- Make sure the `done()` method is used to account for the async calls and fake async stubs/spies.

```ts
it('XYZ', (done) => {
  // spies and stubs

  spy.calls.mostRecent().returnValue.then(() => {
    // tests
    done(); // to complete the tests
  });
});
```

##### Testing HTML elements

- By using the `defaultEl` and the monitoring the changes within the HTML pages. However, the testing here does not bring a lot of productivity in terms of what we get out of it. So, we can choose to discard this aspect of testing.
- HTML elements are tested by matching the `string` values, which is not very intuitive with `i18n` modules in use

---

## Releases

See notable changes and the currently release version in the [CHANGELOG](CHANGELOG.md).

### Release Checklist

This is how we create and publish a new release of the 121-platform.  
(See [the glossary](#glossary) for definitions of some terms.)

- [ ] Define the date/time of the release. (Notify the dev-team for a code-freeze.)
- [ ] Define what code gets released. ("_Is the current `master`-branch working?_")
- [ ] Define the `version`(-number) for the upcoming release.
- [ ] Update the [CHANGELOG](CHANGELOG.md) with the date + version.
  - [ ] Commit changes to `master`-branch on GitHub.
- [ ] Create a `release`-branch ("`release/<version>`") from current `master`-branch and push this branch to GitHub
- [ ] Given current setup of automatic deployments on release: Make any server config changes (ENV-variables, etc.) on staging-servers before creating prerelease (see below)
- [ ] "[Draft a release](https://github.com/global-121/121-platform/releases/new)" on GitHub
  - [ ] Add the `version` to create a new tag
  - [ ] Select the new `release/<version>`-branch
  - [ ] Set the title of the release to `version`. Add a short description and/or link to relevant other documents (if applicable)
  - [ ] **!!!IMPORTANT!!! UPDATE 2021/12/22**: check the 'prelease' checkbox. Given current setup this makes sure the release is only automatically deployed to staging-servers, and not to production-servers.
  - [ ] Publish the release on GitHub
  - [ ] Check the the deployed release on staging server(s)
  - [ ] Make any needed server config changes (ENV-variables, etc.) on production-servers
  - [ ] Edit the release by unchecking the 'prelease' checkbox and publishing again. Given current setup this will now automatically deploy to production-servers (and to staging again).

### Patch/Hotfix Checklist

This follows the same process as a regular release + deployment. With some small changes.

- Code does not need to be frozen. (As there is no active development on the release-branch)

#### Manual approach

- Checkout the `release/<version>`-branch that needs the hotfix.
- Create a new local branch (e.g. `release/<v0.x.1>`) and make the changes
- Push this branch directly to the main/upstream repository, not to a personal fork.
- Create a new release (see above) and publish it.  
  The publish-command will invoke the webhook(s), which trigger an automated deploy for environments on that same _minor_ version.
- Add the hotfix-release to the [CHANGELOG](CHANGELOG.md)
- After the hotfix-release, apply the same fix to the master-branch in a regular PR (by creating a PR from the hotfix-branch to `master`-branch)

#### GitHub web-interface-only approach

- Browse to the specific file that needs a fix on GitHub, click "edit" and make the changes  
  The URL will look like: `https://github.com/global-121/121-platform/edit/release/v1.0.0/<path-to-file>`
- Select "Create a new branch for this commit and start a pull request" from the "commit changes"-box
- Use `release/v1.0.1` as the branch-name by clicking "Propose changes"  
  This branch will now be created and is available to use for a new release
- Add the hotfix-release to the [CHANGELOG](CHANGELOG.md) and commit to the same `release/v1.0.1` branch.
- Create a new release (see above) and publish it.  
  The publish-command will invoke the webhook(s), which trigger an automated deploy for environments on that same _minor_ version.
- After the hotfix-release, apply the fixes to the master-branch by merging the PR created.

---

## Deployment

### To "test" environment

- Merged PR's to 'master' branch are automatically deployed to the test-server. (via [webhook](tools/webhook.service), see: [/tools#GitHub-webhook](tools/README.md#github-webhook))
  - To skip deployment after a PR is merged, add `[SKIP CD]` to the title of the PR before merging. (For example when only updating documentation)
- Make sure to update the environment-settings as soon as possible, preferably before the merge+deploy.

### To "production" environment

#### On initial deployment (only)

- [ ] Configure environment(s) as described in [/services > Getting started / Installation](services/README.md#getting-started-installation).
  - [ ] Checkout code (of latest release)
  - [ ] Set secrets, configure ENV-variables (via all `.env`-files)
  - [ ] Build the platform (by running the [deploy script](./tools/deploy.sh)):  
         Run: `sudo ./tools/deploy.sh <target-branch>`, where `<target-branch>` is for example: `release/v1.0.0`
- [ ] Setup the web-server as described in [/tools > Hosting > Apache2](tools/README.md#apache2)
- [ ] (Optional) Add data to the database using the available [seed-script](services/121-service/README.md#Seed-the-database)

#### On next deployments

- [ ] Decide on what version to deploy
- [ ] Check for any changes/additions/removals in the [CHANGELOG](CHANGELOG.md)
- [ ] Prepare the environment accordingly (in all `.env`-files)
  - [ ] Build the platform (by running the [deploy script](./tools/deploy.sh)):  
         Run: `sudo ./tools/deploy.sh <target-branch>`, where `<target-branch>` is for example: `release/v1.1.0`

## Glossary

| Term          | Definition (_we_ use)                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `version`     | A 'number' specified in the [`SemVer`](https://semver.org/spec/v2.0.0.html)-format: `1.1.0`                  |
| `tag`         | A specific commit or point-in-time on the git-timeline; named after a version, i.e. `v1.1.0`                 |
| `release`     | A fixed 'state of the code-base', [published on GitHub](https://github.com/global-121/121-platform/releases) |
| `deployment`  | An action performed to get (released) code running on an environment                                         |
| `environment` | A machine that can run code (with specified settings); i.e. a server or VM, or your local machine            |

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
