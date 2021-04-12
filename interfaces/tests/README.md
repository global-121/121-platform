# Testing Interfaces

## Integration Tests

### Cypress

We use Cypress(<https://www.cypress.io/>) for integration tests and writing end-to-end UI tests.

### Configuration and set-up

Cypress module is set-up under `interfaces/tests` in order to accumulate all the integration tests within one directory which should also make it a lot more efficient in future to implement CI/CD pipeline.

We have 4 directories within `interfaces/tests/cypress/integration` named as each of the interfaces.

#### Configuration

The Configuration for all the URLs is in `tests/cypress.json`.

#### Base URL

Base URL is the default address that cypress uses and any additional sub-route string can be added to that base-url to visit or query a certain URL address.

For example: is base-url is set as `http://example.net` then executing `cy.visit('/test')` will take us to `http://example.net/test`. For more information visit: <https://docs.cypress.io/guides/references/configuration.html#Options>

#### Commands

In each of the spec file within integration directories, one of the commands from 'setHoPortal', 'setAwApp' and 'setPaApp'. These custom commands are used to set-up the base url for the corresponding interfaces, since they are all hosted on different URLs.

example:

```ts
beforeEach(() => {
  cy.setHoPortal();
  cy.server();
});
```

### Modules

Installed `cypress v.5.5.0`.

### Guides

#### Getting started

First, it is needed that a developer should go through the Documentation of the cypress, at following links:
<https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Write-your-first-test>

Get a basic idea about stubbing network requests and when they can be useful:
<https://docs.cypress.io/guides/guides/network-requests.html#Stub-Responses>

1. Test a URL address:
   A URL address for the current page can be tested by using:

```ts
cy.url().should('include', '/home');
```

Above tests for the URL to include the substring `/home`

2. Test an HTML element
   An Html element can be simply extracted by `cy.get('<selector>')`. In order to check whether they contain a text:

```ts
cy.get('<selector>').contains('<some text>');
```

3. Simulate typing:
   If it is an input field, a `.type("some text")` can be used to simulate typing information.

4. Network Stubbing
   If we want to stub network to bypass certain screens, we should use `cy.route()` to create a fake API response. This lets us define responses that might let us bypass certain pages without having to go through all the steps within UI.

```ts
cy.route({
  method: 'GET',
  url: '*/programs*',
  response: {},
}).as('programs');
```

After the above stub, we should also be wait for the code to be executed by `cy.wait('@programs')`, This will remove possibilities for conflicts due to order of execution.

#### Start test

In order to get started with executing tests we must make sure that the `interfaces` and `services` are running. They can be started by running commands `npm run start:services` and `npm run start:interfaces` from the root folder.

Once the services and interfaces are up and running, we can start the cypress suite using `npm run start:cypress`.

### Further implementation with CI

We also look forwards to integrate the Cypress tests possibly with CI (See: <https://docs.cypress.io/guides/guides/continuous-integration.html>)
