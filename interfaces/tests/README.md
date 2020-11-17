### Cypress

We use cypress as integration tests and writing end-to-end UI tests.

### Configuration and set-up
Cypress module is set-up under `interfaces/tests` in order to accumulate all the integration tests within one directory which should also make it a lot more efficient in future to implement CI/CD pipeline.

We have 4 directories within  `interfaces/tests/cypress/integration` names as `AW-App`, `Referral-App`, `PA-App` and `Ho-Portal` corresponding to each of the interfaces.

#### Configuration
The Configuration for all the portal addresses are found in  `tests/cypress.json`

#### Base URL
Base URL is the default address that cypress uses and any additional sub-route string can be added to that base-url to visit or query a certain URL address.

For example: is base-url is set as `http://xyz.io` then executing `cy.visit('/test')` will take us to `http://xyz.io/test`. For more information visit: https://docs.cypress.io/guides/references/configuration.html#Options

#### Commands
In each of the spec file within integration directories, one of the commands from 'setHoPortal', 'setAwApp', 'setPaApp' and 'setReferralApp'. These custom commands are used to set-up the base url for the corresponding interfaces, since they are all hosted in different individual localhost ports.

example:
```ts
  beforeEach(() => {
    cy.setHoPortal();
    cy.server();
  });
```

### Modules
Installed `cypress v.5.5.0`.

### guides
#### Guide to start:
First, it is needed that a developer should go through the Documentation of the cypress, at following links:
https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Write-your-first-test

Get a basic idea about stubbing network requests:
https://docs.cypress.io/guides/guides/network-requests.html#Stub-Responses

#### Start test
In order to get started with executing tests we must make sure that the `interfaces` and `services` are running. They can be started by running commands `npm run start:services` and `npm run start:interfaces` from the root folder.



### Further implementation with CI /
We also look forwards to integrate the cypress tests possibly with CI (refer to: https://docs.cypress.io/guides/guides/continuous-integration.html)
