import { Page, test } from '@playwright/test';
import { Pages } from 'helpers/interfaces';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDuplicateRegistrations } from '@121-service/test/helpers/utility.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

import MovePasFromRegisteredToValidated from './MovePasFromRegisteredToValidated';

let page: Page;
// Declare pages and components
const pages: Partial<Pages> = {};

test.describe('Scenario: Change multiple statuses of registrations', () => {
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Initialize pages and components after sharedPage is assigned
    pages.basePage = new BasePage(page);
    pages.registrations = new RegistrationsPage(page);

    await resetDB(SeedScript.nlrcMultiple);
    const programIdPV = 2;

    await seedRegistrations(registrationsPV, programIdPV);
    // multiply registrations
    await resetDuplicateRegistrations(7);

    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login(
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('Change Statuses', () => {
    MovePasFromRegisteredToValidated(pages);
  });
});
