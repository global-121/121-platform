import { test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Paused" successfully. The status change can take up to a minute to process.';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  await seedRegistrationsWithStatus(
    registrationsPV,
    projectIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to project
  await loginPage.selectProject('NLRC Direct Digital Aid Project (PV)');
});

test('[34946] Filter registrations by dropdown selection', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter Status column with "New" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Status',
      selection: 'New',
    });
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Update status and filter by "Paused" status', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationsPV[0].fullName,
      status: 'Pause',
    });
    await registrations.validateToastMessageAndClose(toastMessage);
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
