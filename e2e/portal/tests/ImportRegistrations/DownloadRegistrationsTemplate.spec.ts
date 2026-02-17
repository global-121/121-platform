import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
  });
});

test('Download template for import registrations', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);

  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Export import template and validate CSV files columns', async () => {
    await registrationsPage.assertImportTemplateForPvProgram();
  });
});
