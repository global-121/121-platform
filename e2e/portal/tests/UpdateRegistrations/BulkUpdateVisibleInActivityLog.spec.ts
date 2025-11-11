import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [registrationPV5, registrationPV6],
    programIdPV,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

const newName = 'Michael Scarn';

test('Data should be updated according to selected columns and registrations', async ({
  page,
}) => {
  const registrationsPage = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(projectTitle);
  });

  await test.step('Select all registrations and open "Update registrations" dialog', async () => {
    // adding this extra step to ensure that deleted registrations are excluded from exports
    // for more info: AB#37336
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPV6.fullName,
      status: 'Delete',
      sendMessage: false,
    });
    await registrationsPage.dismissToast();

    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectImportOption(
      'Update selected registrations',
    );
  });

  await test.step('Download the template, edit it, and upload', async () => {
    expect(newName).not.toBe(registrationPV5.fullName);

    await registrationsPage.massUpdateRegistrations({
      expectedRowCount: 1,
      columns: ['Scope', 'Preferred Language', 'Full Name'],
      reason: 'Test reason',
      transformCSVFunction: (csv) =>
        csv.replace(registrationPV5.fullName, newName),
    });
    await registrationsPage.validateToastMessageAndClose(
      'Updating registration(s)',
    );
  });

  await test.step('Validate that bulk update is visible in activity log', async () => {
    await registrationsPage.goToRegistrationByName({
      registrationName: newName,
    });
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Activity',
      selection: 'Data change',
    });
    await tableComponent.validateActivityPresentByType({
      notificationType: 'Data change',
      count: 1,
    });
  });
});
