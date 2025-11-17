# E2E testing suite <!-- omit from toc -->

> [!NOTE]
> This documentation is about the "E2E Playwright test suite" _only_;
> For other testing, see the [root-README](../README.md#testing).

## Table of Contents <!-- omit from toc -->

- [Installation](#installation)
  - [Install E2E-test dependencies](#install-e2e-test-dependencies)
  - [Set necessary Environment-variables](#set-necessary-environment-variables)
- [Running tests](#running-tests)
  - [Using the command-line](#using-the-command-line)
  - [Using the VS Code-extension](#using-the-vs-code-extension)
- [Tests and Page Object Model (POM)](#tests-and-page-object-model-pom)
  - [What is Page Object Model (POM)?](#what-is-page-object-model-pom)
  - [Benefits of Using POM](#benefits-of-using-pom)
  - [Implementing POM](#implementing-pom)
- [Writing Tests](#writing-tests)
  - [Example Test](#example-test)
  - [Best Practices](#best-practices)
    - [Performance best practices](#performance-best-practices)
  - [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

---

## Installation

Clone the repository and run local Docker environment following the general [installation-documentation](../README.md#getting-started).

### Install E2E-test dependencies

From the `./e2e`-folder, run:

```shell
npm install && npx playwright install
```

### Set necessary Environment-variables

See the "Testing only"-section at the end of the [`services/.env.example`](../services/.env.example)-file.

Make sure to fill in all relevant variables in your local `services/.env`-file.

## Running tests

Before running the tests, make sure the local environment is running.

Run, from the repository-root: `npm run start:services`

The interface(s) need to be run in _production_-mode.

Run, from the repository-root: `npm run start:portal:e2e`

### Using the command-line

```shell
npm test
```

Or run them in "headed" mode (you can see the browser)

```shell
npm test -- --headed
```

Extra options:

- To run only specific test files, you can can run `npm test <substringMatchingFilename>`
- To update snapshot files: `npm run test:update-snapshots`
- To combine the 2 options above: `npm run test:update-snapshots:specific <substringMatchingFilename>`

### Using the VS Code-extension

Use the built-in runner of the VS Code-extension: [`#ms-playwright.playwright`](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

![Screenshot of Playwright-extension in VS Code](https://github.com/microsoft/playwright/assets/13063165/348e18ff-f819-4caa-8f7e-f16c20724f56)

---

## Tests and Page Object Model (POM)

### What is Page Object Model (POM)?

The Page Object Model is a design pattern that creates an object repository for storing all web elements. It acts as an interface for interacting with web pages in your test scripts. This pattern helps to keep the code clean and readable by separating the test logic from the details of the UI elements.

### Benefits of Using POM

- **Improved Test Maintenance**: Changes in the UI require updates only in the page objects, not in the test scripts.
- **Code Reusability**: Page objects can be reused across multiple tests.
- **Separation of Concerns**: Separates the test logic from the UI logic, making the code easier to understand and maintain.

### Implementing POM

Page Classes
Create a page class for each page representing different module and/ or functionality in your application. Here is an example of how you can structure your HomePage class:

```ts
import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class HomePage {
  readonly page: Page;
  readonly programCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.programCard = this.page.getByTestId('program-list-component-card');
  }

  async navigateToProgramme(programName: string) {
    await this.programCard.filter({ hasText: programName }).click();
  }
}

export default HomePage;
```

## Writing Tests

### Example Test

Here is a simple example of writing a test using the POM structure:

```ts
import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations({
    registrations: registrationsOCW,
    programId: OcwProgramId,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login();
});

test('Navigate to programme', async ({ page }) => {
  const homePage = new HomePage(page);

  await test.step('Should open PAs for registration', async () => {
    await homePage.navigateToProgramme('NLRC OCW Program');
  });
});
```

### Best Practices

- **Keep Tests Independent**: Each test should be able to run independently of others.
- **Use Meaningful Names**: Name your page objects and methods clearly to reflect their purpose.
- **Avoid Hardcoding**: Use variables and configuration files (like translation file) to manage test data.

#### Performance best practices

E2E tests can get quite slow so it's important to re-use state as much as practical. If you're writing a bunch of tests and they (can) rely on the same application state and don't change that state you should write your test code in the following way for the sake of performance.

- group your tests (either by file or otherwise)
- arrange/prepare the application state, this can be a step that takes a lot of time
- make sure this arrange/prepare step happens **only once** for this group (see example below)
- write the tests in this group so they reuse the prepared application state and **don't** change it

An example:

```typescript
let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  // Do slow/expensive setup here
  expensiveSetup(page);
});

test('foo === foo', async () => {
  // Reuse the page object instantiated in beforeAll
  expect(page.foo).toBe('foo');
});

test('qux === qux', async () => {
  // Reuse the page object instantiated in beforeAll
  expect(page.qux).toBe('qux');
});

test('bar === bar', async () => {
  // Reuse the page object instantiated in beforeAll
  expect(page.bar).toBe('bar');
});
```

### Common Issues and Troubleshooting

- **Element Not Found**: Ensure the selectors in your page objects are correct, unique and are loaded in DOM.
- **Timeouts**: Increase the default timeout if elements take longer to load.
- **Test Flakiness**: Use wait methods to handle dynamic content and animations.

For extended documentation see: <https://playwright.dev/docs/getting-started-vscode>
