# Testing Interfaces

## Integration Tests with Cypress

We use Cypress(<https://www.cypress.io/>) for integration tests and writing end-to-end UI tests.

### Run tests with Github Actions

- On each Pull Request to `master` and each push to a `release/*`-branch the Cypress Integration Tests are run.
- This means that tests are started on each new commit in a PR to master.
- Results can be seen in the [Actions page on GitHub](https://github.com/global-121/121-platform/actions/workflows/cypress-workflow.yml)

### Start test locally

1. Set `MOCK_TWILIO` and `MOCK_INTERSOLVE` and possible other mock env-variables to `TRUE`
2. Make sure all interfaces and services are running, use:
   - `npm run start:services`
   - `npm run start:interfaces`
3. Start with: `npm run start:cypress`

   - This will open up a window, where you can choose your preferred browser first in which the tests will run
   - Click one of the test files to start running all the tests in that file

### Configuration and set-up

Cypress module is set-up under `interfaces/tests` in order to accumulate all the integration tests within one directory so each interface's tests can share the test-tooling.

Within `interfaces/tests/cypress/e2e` there are folders for each of the interfaces.

#### Configuration

The Configuration for all the URLs is in [`cypress.config.js`](./cypress.config.js).

#### Base URL

Base URL is the default address that Cypress uses and any additional sub-route string can be added to that base-url to visit or query a certain URL address.

For example: is base-url is set as `http://example.net` then executing `cy.visit('/test')` will take us to `http://example.net/test`. For more information visit: <https://docs.cypress.io/guides/references/configuration.html#Options>

#### Commands

In each of the spec file within integration directories, one of the commands from `setHoPortal`, `setAwApp` and `setPaApp`. These custom commands are used to set-up the base url for the corresponding interfaces, since they are all hosted on different URLs.

example:

```ts
beforeEach(() => {
  cy.setHoPortal();
});
```

### Guides

#### Getting started

First, it is needed that a developer should go through the Documentation of Cypress, at following links:
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

After the above stub, we should also wait for the code to be executed by `cy.wait('@programs')`, This will remove possibilities for conflicts due to execution order.
