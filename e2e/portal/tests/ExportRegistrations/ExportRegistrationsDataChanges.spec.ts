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
  });
});

test('Export all People Affected data changes', async ({
  registrationsPage,
  exportDataComponent,
}) => {
  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Export list and validate XLSX files downloaded', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectExportOption('Status & data changes');
    await exportDataComponent.exportAndAssertData({
      excludedColumns: ['created'],
    });
  });
});
