import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  changeBulkRegistrationStatus,
  importRegistrations,
  seedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';
// Arrange
test.beforeEach(async ({ page }) => {
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
  await basePage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});
// Act
test('[31211] Move PA(s) from status "Included" to "Completed"', async ({
  page,
}) => {
  const accessToken = await getAccessToken();
  const paymentReferenceId = [registrationPvMaxPayment.referenceId];
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  await test.step('Upload extra registration with max payment set to 1', async () => {
    await importRegistrations(
      programIdPV,
      [registrationPvMaxPayment],
      accessToken,
    );
  });

  await test.step('Change status of all registrations to "Included"', async () => {
    await changeBulkRegistrationStatus({
      programId: 2,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
  });

  await test.step('Search for the registration with status "Included"', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Included',
    });
  });

  await test.step('Validate the status of the registration', async () => {
    await registrations.validateStatusOfFirstRegistration({
      status: 'Included',
    });
  });

  await test.step('Change status of registratios to "Completed" with doing a payment', async () => {
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 100,
      referenceIds: paymentReferenceId,
      accessToken,
    });
  });

  await test.step('Search for the registration with status "Completed"', async () => {
    await tableComponent.clearAllFilters();
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Completed',
    });
  });
  // Assert
  await test.step('Validate the status of the registration', async () => {
    await registrations.validateStatusOfFirstRegistration({
      status: 'Completed',
    });
  });
});
