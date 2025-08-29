import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  await seedRegistrationsWithStatus(
    [registrationPV5],
    projectIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to project
  const basePage = new BasePage(page);
  await basePage.selectProject('NLRC Direct Digital Aid Project (PV)');
});
test('[31213] Move PA(s) from status "Included" to "Declined"', async ({
  page,
}) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  // Act
  await test.step('Change status of first selected registration to "Declined"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPV5.fullName,
      status: 'Decline',
    });
    await registrations.validateToastMessageAndClose(toastMessage);
  });

  await test.step('Search for the registration with status "Declined"', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Declined',
    });
  });
  // Assert
  await test.step('Validate the status of the registration', async () => {
    await registrations.validateStatusOfFirstRegistration({
      status: 'Declined',
    });
  });
});
