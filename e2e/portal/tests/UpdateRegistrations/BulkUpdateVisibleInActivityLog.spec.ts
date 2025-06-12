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
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

const newName = 'Michael Scarn';

test('[36352] Data should be updated according to selected columns and registrations', async ({
  page,
}) => {
  const registrationsPage = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(projectTitle);
  });

  await test.step('Select all registrations and open "Update registrations" dialog', async () => {
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
    // It is a soft assertion but the test will fail if the activity is not found
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Activity',
      selection: 'Data change',
    });
  });
});
