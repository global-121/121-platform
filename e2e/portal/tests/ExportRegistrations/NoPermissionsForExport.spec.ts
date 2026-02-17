import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
    password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
  });
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
