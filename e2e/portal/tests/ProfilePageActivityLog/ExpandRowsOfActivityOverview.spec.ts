import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  getRegistrationIdByReferenceId,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

let registrationId: number;
const paymentReferenceId = [registrationPV5.referenceId];
// Choose the appropriate array based on environment
const isCI = process.env.CI === 'true';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  await doPayment({
    programId: 2,
    paymentNr: 1,
    amount: 100,
    referenceIds: paymentReferenceId,
    accessToken,
  });

  await updateRegistration(
    2,
    registrationPV5.referenceId,
    {
      maxPayments: '2',
    },
    'automated test',
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[34462] Expand rows of activity overview', async ({ page }) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  const tableComponent = new TableComponent(page);
  // Act
  await test.step('Navigate to registration activity log', async () => {
    await activityLogPage.goto(
      `/project/${programIdPV}/registrations/${registrationId}`,
    );
  });
  // Assert
  await test.step('Expand all activity rows and assert that they are expanded', async () => {
    // Mitigate the timeout issue when the table is not fully loaded
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Activity',
      selection: 'Transfer',
    });
    await tableComponent.clearAllFilters();
    // Validate amount of rows before expanding
    await tableComponent.validateTableRowCount(isCI ? 6 : 5);
    // Expand all rows
    await tableComponent.expandAllRows();
    // Validate amount of rows after expanding
    await tableComponent.validateTableRowCount(isCI ? 12 : 10);
  });
});
