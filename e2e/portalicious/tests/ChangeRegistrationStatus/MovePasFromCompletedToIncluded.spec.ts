import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  changeBulkRegistrationStatus,
  seedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Included" successfully. The status change can take up to a minute to process.';
// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  await seedRegistrations([registrationPvMaxPayment], programIdPV);
  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  // Navigate to program
  const basePage = new BasePage(page);
  await basePage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[31214] Move PA(s) from status "Completed" to "Included"', async ({
  page,
}) => {
  const accessToken = await getAccessToken();
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act
  await test.step('Change status of registration to "Included"', async () => {
    await changeBulkRegistrationStatus({
      programId: 2,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
  });

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
      referenceIds: [],
      accessToken,
    });
  });

  await test.step('Raise amount of max payments for the registration', async () => {
    await updateRegistration(
      2,
      registrationPvMaxPayment.referenceId,
      {
        maxPayments: '2',
      },
      'automated test',
      accessToken,
    );
  });

  await test.step('Change status of registration to "Included"', async () => {
    await tableComponent.changeStatusOfRegistrationInTable({
      status: 'Include',
    });
    await registrations.validateToastMessageAndWait(toastMessage);
  });
  // Assert
  await test.step('Validate status change', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Included',
    });
    await registrations.validateStatusOfFirstRegistration({
      status: 'Included',
    });
  });
});
