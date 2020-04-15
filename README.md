121 platform
============

121 is an open source platform for Cash based Aid built with Digital Identity & Local/Global Financial service partners.  -- Learn more about the platform: <https://www.121.global/>

---

- [List of API endpoints](./API%20Reference.md)  


## Status

| Interfaces | Build Status |
|------------|--------------|
| PA-App  | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/PA-App?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=17&branchName=master) |
| PA-App (Android)  | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/PA-App%20--%20Android?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=23&branchName=master) |
| AW-App  | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/AW-App?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=18&branchName=master) |
| AW-App (Android) | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/AW-App%20--%20Android?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=22&branchName=master) |
| HO-Portal  | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/HO-Portal?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=13&branchName=master) |

| Services | Build Status |
|----------|--------------|
| 121-service | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/121-service?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=12&branchName=master) |
| PA-accounts-service | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/PA-accounts-service?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=19&branchName=master) |
| Tykn-SSI-Services | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/Tykn%20SSI%20Services?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=20&branchName=master) |

## Documentation
The documentation of the 121 platform can be found on the Wiki of this repository on GitHub.

## Testing
- Scenarios of end-to-end/integration-tests for the whole platform are described in [`/features`](features/#readme).
- Each component has its own individual tests:
  - Unit-tests and UI-tests for all interfaces; Run with `npm test` in each `interfaces/*`-folder.
  - Unit-tests and integration-tests for all services; Run with `npm test` in each `services/*`-folder.


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
- [ ] Create a `release`-branch ("`release/<version>`") from current `master`-branch
- [ ] Run the [Azure Pipelines](https://dev.azure.com/redcrossnl/121%20Platform/_build) for the native Android-apps on that `release`-branch
  - [ ] Download the generated artifacts (`AW-App.zip` and `PA-App.zip`)
  - [ ] Rename to match the version (i.e: `PA-App-v0.1.0.zip`)
- [ ] "[Draft a release](https://github.com/global-121/121-platform/releases/new)" on GitHub  
  - [ ] Select the new `release`-branch
  - [ ] Add a short description and/or link to relevant other documents.
  - [ ] Attach the generated artifacts of the native Android apps
  - [ ] Create/publish the release on GitHub


## Deployment

### To "test" environment
- Merged PR's to 'master' branch are automatically deployed to the test-server. (via [webhook](tools/webhook.service), see: [/tools#GitHub-webhook](tools/README.md#github-webhook))
- Make sure to update the environment-settings as soon as possible, preferably before the merge+deploy.

### To "production" environment

#### On initial deployment (only)
- [ ] Configure environment(s) as described in [/services > Getting started / Installation](services/README.md#getting-started-installation).
  - [ ] Checkout code (of latest release)
  - [ ] Set secrets, configure ENV-variables (via all .env-files)
  - [ ] Build the platform (following actions from the [webhook script](./tools/webhook.js))
- [ ] Setup the web-server as described in [/tools > Hosting > Apache2](tools/README.md#apache2)
- [ ] (Optional) Add data to the database using the available [seed-script](services/121-service/README.md#Seed-the-database)

#### On next deployments
- [ ] Decide on what version to deploy
- [ ] Checkout code (from that version's release-branch)
- [ ] Check for any changes/additions/removals in the [CHANGELOG](CHANGELOG.md)
- [ ] Prepare the environment accordingly (in all .env-files)
- [ ] Rebuild the platform (following actions from the [webhook script](./tools/webhook.js))


## Glossary

| Term          | Definition (_we_ use) |
|---------------|---------------------|
| `version`     | A 'number' specified in the [`SemVer`](https://semver.org/spec/v2.0.0.html)-format: `0.1.0` |
| `tag`         | A specific commit or point-in-time on the git-timeline; named after a version, i.e. `v0.1.0` |
| `release`     | A fixed 'state of the code-base', [published on GitHub](https://github.com/global-121/121-platform/releases)
| `deployment`  | An action performed to get (released) code running on an environment
| `environment` | A machine that can run code (with specified settings); i.e. a server or VM, or your local machine |
