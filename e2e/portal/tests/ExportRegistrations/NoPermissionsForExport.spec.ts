import { test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  createUserWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  const userName = await createUserWithPermissions({
    permissions: Object.values(PermissionEnum).filter(
      (permission) => permission !== PermissionEnum.RegistrationPersonalEXPORT,
    ),
    programId: programIdPV,
    adminAccessToken: accessToken,
  });
  await loginPage.login(
    userName,
    env.USERCONFIG_121_SERVICE_PASSWORD_TESTING ?? '',
  );
});

test('[29360] Viewing the export options without permission', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await basePage.selectProgram(projectTitle);
  });

  await test.step('Validate that export button is not present', async () => {
    await registrations.selectAllRegistrations();
    await registrations.assertExportButtonIsHidden();
  });
});
