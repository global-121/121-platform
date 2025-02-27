import { Page, test } from '@playwright/test';
import { Components, Pages } from 'helpers/interfaces';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

import MovePasFromIncludedToCompleted from './MovePasFromIncludedToCompleted';
import MovePasFromRegisteredToDeclined from './MovePasFromRegisteredToDeclined';
import MovePasFromRegisteredToIncluded from './MovePasFromRegisteredToIncluded';
import MovePasFromRegisteredToValidated from './MovePasFromRegisteredToValidated';
import MovePasFromValidatedToDeclined from './MovePasFromValidatedToDeclined';
import MovePasFromValidatedToIncluded from './MovePasFromValidatedToIncluded';

let page: Page;
// Declare pages and components
const pages: Partial<Pages> = {};
const components: Partial<Components> = {};
// Select program name
const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

test.describe('Scenario: Change multiple statuses of registrations', () => {
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Initialize pages and components after sharedPage is assigned
    pages.basePage = new BasePage(page);
    pages.registrations = new RegistrationsPage(page);
    components.tableComponent = new TableComponent(page);

    await resetDB(SeedScript.nlrcMultiple);

    await seedRegistrations(registrationsPV, programIdPV);
    // multiply registrations
    await resetDuplicateRegistrations(3);

    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login(
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
    // Navigate to program
    const basePage = new BasePage(page);
    await basePage.selectProgram(projectTitle);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('Change Statuses', () => {
    MovePasFromRegisteredToValidated(pages, components);
    MovePasFromRegisteredToIncluded(pages, components);
    MovePasFromRegisteredToDeclined(pages, components);
    MovePasFromValidatedToIncluded(pages, components);
    MovePasFromValidatedToDeclined(pages, components);
    MovePasFromIncludedToCompleted(pages, components);
  });
});
