import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProjectPV from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], projectIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

const fakeReferenceId =
  'this-is-not-the-greatest-reference-id-in-the-world-this-is-just-a-tribute';

test('[36351] Wrong CSV should trigger error (wrong data, column name etc.)', async ({
  page,
}) => {
  const registrationsPage = new RegistrationsPage(page);

  const projectTitle = NLRCProjectPV.titlePortal.en;

  await test.step('Select project', async () => {
    await registrationsPage.selectProject(projectTitle);
  });

  await test.step('Select all registrations and open "Update registrations" dialog', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectImportOption(
      'Update selected registrations',
    );
  });

  await test.step('Download the template, edit it, and upload', async () => {
    await registrationsPage.massUpdateRegistrations({
      expectedRowCount: 1,
      columns: ['Scope', 'Preferred Language', 'Full Name'],
      reason: 'Test reason',
      // remove a comma too many to trigger an error
      transformCSVFunction: (csv) =>
        csv.replace(registrationPV5.referenceId, fakeReferenceId),
    });
  });

  await test.step('Validate import error message', async () => {
    await registrationsPage.validateErrorMessage(
      `Something went wrong: The following referenceIds were not found in the database: ${fakeReferenceId}`,
    );
  });
});
