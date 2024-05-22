# <p align="center"> API & E2E testing suites </p>

<p align="center">
  <a href="https://playwright.dev/">
    <img width="140" alt="Playwright Logo" src="https://seeklogo.com/images/P/playwright-logo-22FA8B9E63-seeklogo.com.png" />
  </a>
</p>

<p align="center">
  This documentation touches upon E2E Playwright test suite for API refer to <a href="https://github.com/global-121/121-platform?tab=readme-ov-file#testing">features/</a>.
</p>

## Advantages of Playwright Automated Tests

- **Simulating User Interactions**: Playwright enables you to simulate user interactions in the interface across different browsers and devices.

- **Reuse of API Tests**: With Playwright, you can reuse API tests and include parts of those tests in the setup of front-end automation.

- **Automation of UI Regression Tests**: While UI regression tests are typically done manually, Playwright allows you to automate these repeatable tasks efficiently.

- **Headless Testing on Pipelines**: Playwright supports headless testing, making it suitable for integration with CI/CD pipelines.

- **Rich APIs and Debugging Capabilities**: Playwright offers a rich collection of APIs for writing tests and extensive debugging capabilities, including screenshots, videos, and trace logs.

- **Easy reporting setup for Azure Test Plan**: Thanks to many different ways of connecting Playwright report to Azure Test Plan QA can create result outputs from simple pass/fail to more complex charts and reports.

> 🚩 **Prerequisite**
>
> The only prerequisite is to have Node.js, Plawyright and Playwright Add On for VS Code installed on your machine

### Installation

<p>Clone the repository and run local Docker enviroment following <a href="https://github.com/global-121/121-platform?tab=readme-ov-file#setup-services">installation/</a> documentation</p>

**Install Playwright dependecies**

```shell
cd /121-platform/e2e
```

Then:

```shell
npm install
```

**Install missing dependencies**

## Enviromental variables

Base Url, Azure Token and test users data are stored in .env file.

### Run tests via console

```shell
npm test
```

Or run them in "headed" mode (you can see the browser)

```shell
npm test -- --headed
```

 <h2>
  <b>Or run them using built in runner via VS Code</b>
    <a href="https://playwright.dev/">
      <img width="40" alt="Playwright Logo" src="https://seeklogo.com/images/P/playwright-logo-22FA8B9E63-seeklogo.com.png" />
    </a>
  </h2>
  <a>
    <img alt="playwright tool" src="https://github.com/microsoft/playwright/assets/13063165/348e18ff-f819-4caa-8f7e-f16c20724f56"/>
  </a>

## Tests and Page Object Model (POM)

### What is Page Object Model (POM)?

The Page Object Model is a design pattern that creates an object repository for storing all web elements. It acts as an interface for interacting with web pages in your test scripts. This pattern helps to keep the code clean and readable by separating the test logic from the details of the UI elements.

### Benefits of Using POM

- Improved Test Maintenance: Changes in the UI require updates only in the page objects, not in the test scripts.
- Code Reusability: Page objects can be reused across multiple tests.
- Separation of Concerns: Separates the test logic from the UI logic, making the code easier to understand and maintain.

### Implementing POM
Page Classes
Create a page class for each page representing different module and/ or functionality in your application. Here is an example of how you can structure your HomePage class:

```
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

```
import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NLRCProgram from '@121-service/seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27493] Navigate to programme', async ({ page }) => {
  const homePage = new HomePage(page);

  await test.step('Should open PAs for registration', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
  });
});
```

### How to generate Screenshots for "User Manual":

- Navigate to e2e > tests > UserManualScreenshots > userManualScreenshots.spec.ts
- Remove "skip" command from the test
``` test.skip('Navigates to the portal and takes screenshots', async ({ page }) => ```
- Run the test with command: ``` npx playwright test userManualScreenshots/userManualScreenshots.spec.ts  ```
- Copy the screenshots from "screenshots" folder and paste them in "User Manual" repository

