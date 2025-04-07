import { test } from '@playwright/test';

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

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Paused" successfully. The status change can take up to a minute to process.';

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

test('[34946] Filter registrations by dropdown selection', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter Status column with "Registered" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Status',
      selection: 'Registered',
    });
    await registrations.validateRegistrationIsNotPresent();
    await tableComponent.clearAllFilters();
  });

  await test.step('Update status and filter by "Paused" status', async () => {
    await tableComponent.changeStatusOfRegistrationInTable('Pause');
    await registrations.validateToastMessageAndWait(toastMessage);
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Status',
      selection: 'Paused',
    });
    await registrations.validateStatusOfFirstRegistration({
      status: 'Paused',
    });
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Duplicates column by "Unique" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Duplicates',
      selection: 'Unique',
    });
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Duplicates column by "Duplicate" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Duplicates',
      selection: 'Duplicate',
    });
    await tableComponent.validateAllRecordsCount(2);
  });
});
