import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CoopBank from '@121-service/src/seed-data/program/program-cooperative-bank-of-oromia.json';
import { startCooperativeBankOfOromiaValidationProcess } from '@121-service/test/helpers/program.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const coopBankProgramId = 1;

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.cooperativeBankOfOromiaProgram,
    programId: coopBankProgramId,
    skipSeedRegistrations: true,
  });
  await startCooperativeBankOfOromiaValidationProcess(
    coopBankProgramId,
    accessToken,
  );
});

test('Export Coop Bank Empty verification report', async ({
  registrationsPage,
  exportDataComponent,
}) => {
  const programTitle = CoopBank.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Export list and validate XLSX file downloaded', async () => {
    await registrationsPage.clickAndSelectExportOption(
      'Coopbank verification report',
    );
    await exportDataComponent.exportAndAssertData();
  });
});
