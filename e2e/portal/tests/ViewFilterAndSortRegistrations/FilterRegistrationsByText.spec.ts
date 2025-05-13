import { expect, test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

let registrationName: string;

// Arrange
test.beforeEach(async ({ page }) => {
  const accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);

  await seedRegistrationsWithStatus(
    registrationsPV,
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[34945] Filter registrations by text', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter Name column by text', async () => {
    await tableComponent.filterColumnByText('Name', 'Jan Janssen');
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jan Janssen');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Phone Number column by text', async () => {
    await tableComponent.filterColumnByText('Phone Number', '14155235557');
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jack Strong');
  });
});
