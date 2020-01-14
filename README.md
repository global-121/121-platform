121 platform
============

121 is working towards an open source platform that allows safe, fast and fair humanitarian cash based aid programs using blockchain.  -- Learn more about the platform: <https://www.121.global/>

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


## Deployment

### To "test" environment
- Merged PR's to 'master' branch are automatically deployed to the test-server. (via [webhook](tools/webhook.service), see: [/tools#GitHub-webhook](tools/README.md#github-webhook))

### To "production" environment

#### On initial deployment (only)
- Configure environment(s) as described in [/services > Getting started / Installation](services/README.md#getting-started-installation).
  - Checkout code
  - Install dependencies / tools
  - Set secrets, configure ENV-variables, etc
- Setup the web-server as described in [/tools > Hosting > Apache2](tools/README.md#apache2).
- (Optional) Add data to the database using the available [seed-script](services/121-service/README.md#Seed-the-database).

#### On next deployments
- Create and merge a PR from `global-121:master` to `global-121:production` branches.

