import test from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  changeBulkRegistrationStatus,
  seedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

const toastMessageIncluded =
  'The status of 1 registration(s) is being changed to "Included" successfully. The status change can take up to a minute to process.';

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
  await basePage.selectProgram(projectTitle);
});

test('[31209] Move PA(s) from status "Validated" to "Included"', async ({
  page,
}) => {
  const accessToken = await getAccessToken();
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  if (!basePage || !registrations || !tableComponent) {
    throw new Error('pages and components not found');
  }

  await test.step('Change status of all registrations to "Validated"', async () => {
    await changeBulkRegistrationStatus({
      programId: 2,
      status: RegistrationStatusEnum.validated,
      accessToken,
    });
  });

  await test.step('Search for the registration with status "Validated"', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Validated',
    });
  });

  await test.step('Validate the status of the registration', async () => {
    await registrations.validateStatusOfFirstRegistration({
      status: 'Validated',
    });
  });

  await test.step('Change status of first selected registration to "Validated"', async () => {
    await tableComponent.changeStatusOfRegistrationInTable({
      status: 'Include',
    });
    await basePage.validateToastMessage(toastMessageIncluded);
  });

  await test.step('Search for the registration with status "Validated"', async () => {
    await tableComponent.clearAllFilters();
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
});
