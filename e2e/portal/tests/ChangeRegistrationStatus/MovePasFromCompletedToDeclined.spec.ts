import test from '@playwright/test';

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
    [registrationPvMaxPayment],
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to program
  const basePage = new BasePage(page);
  await basePage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[31215] Move PA(s) from status "Completed" to "Declined"', async ({
  page,
}) => {
  const accessToken = await getAccessToken();
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act

  await test.step('Validate the status of the registration', async () => {
    await registrations.validateStatusOfFirstRegistration({
      status: 'Included',
    });
  });

  await test.step('Change status of registration to "Completed" with doing a payment', async () => {
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 25,
      referenceIds: [registrationPvMaxPayment.referenceId],
      accessToken,
    });
  });

  await test.step('Change status of registration to "Declined"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPvMaxPayment.fullName,
      status: 'Decline',
    });
    await registrations.validateToastMessageAndClose(toastMessage);
  });
  // Assert
  await test.step('Validate status change', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Declined',
    });
    await registrations.validateStatusOfFirstRegistration({
      status: 'Declined',
    });
  });
});
