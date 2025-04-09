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

  registrationsPV.push(registrationPvMaxPayment);
  await seedRegistrationsWithStatus(
    registrationsPV,
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
  const registrationsPage = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  // Act & Assert
  await test.step('Filter Reg. # column by number 2', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 2,
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jan Janssen');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Number of payments column by number 1', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Number of payments',
      filterNumber: 1,
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Gemma Houtenbos');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Max payments column by number 1', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Max payments',
      filterNumber: 1,
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Arkadiusz Zbuczko');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Max payments with "Less than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Max payments',
      filterNumber: 1,
      filterWithRange: true,
      range: 'less than',
    });
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Max payments with "Greater than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Max payments',
      filterNumber: 0,
      filterWithRange: true,
      range: 'Greater than',
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Arkadiusz Zbuczko');
    await tableComponent.validateAllRecordsCount(1);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter "Reg. #" with "Greater than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 3,
      filterWithRange: true,
      range: 'Greater than',
    });
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter "Reg. #" with "Less than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 4,
      filterWithRange: true,
      range: 'Less than',
    });
    await tableComponent.validateAllRecordsCount(3);
    await tableComponent.clearAllFilters();
  });
});
