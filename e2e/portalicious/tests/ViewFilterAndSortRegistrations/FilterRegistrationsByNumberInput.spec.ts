import { expect, test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

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

  await seedRegistrationsWithStatus(
    [registrationPvMaxPayment],
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  await doPayment({
    programId: 2,
    paymentNr: 1,
    amount: 25,
    referenceIds: [registrationsPV[0].referenceId],
    accessToken,
  });

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

test('[34948] Filter registrations by Input number', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter registrations columns by number', async () => {
    // Filter Reg. column by number
    await tableComponent.filterColumnByNumber('Reg. #', 2);
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jan Janssen');
    await tableComponent.clearAllFilters();
    // Filter Reg. column by number
    await tableComponent.filterColumnByNumber('Reg. #', 4);
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jack Strong');
    await tableComponent.clearAllFilters();
    // Filter Number of payments column by number
    await tableComponent.filterColumnByNumber('Number of payments', 1);
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Gemma Houtenbos');
    await tableComponent.clearAllFilters();
    // Filter Max payments column by number
    await tableComponent.filterColumnByNumber('Max payments', 1);
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Arkadiusz Zbuczko');
  });
});
