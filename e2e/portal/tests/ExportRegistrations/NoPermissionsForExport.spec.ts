import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { createUserWithPermissions } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ resetDBAndSeedRegistrations, page }) => {
  const { accessToken } = await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
  });
  const userName = await createUserWithPermissions({
    permissions: Object.values(PermissionEnum).filter(
      (permission) => permission !== PermissionEnum.RegistrationPersonalEXPORT,
    ),
    programId: programIdPV,
    adminAccessToken: accessToken,
  });
  const loginPage = new LoginPage(page);
  await loginPage.login(
    userName,
    env.USERCONFIG_121_SERVICE_PASSWORD_TESTING ?? '',
  );
});

test('Viewing the export options without permission', async ({
  registrationsPage,
}) => {
  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Validate that export button is not present', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.assertExportButtonIsHidden();
  });
});
