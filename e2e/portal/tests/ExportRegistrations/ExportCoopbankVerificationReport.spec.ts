import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CoopBank from '@121-service/src/seed-data/program/program-cooperative-bank-of-oromia.json';
import { startCooperativeBankOfOromiaValidationProcess } from '@121-service/test/helpers/program.helper';
import { registrationsCooperativeBankOfOromia } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const coopBankProgramId = 1;

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.cooperativeBankOfOromiaProgram,
    registrations: registrationsCooperativeBankOfOromia,
    programId: coopBankProgramId,
  });
  await startCooperativeBankOfOromiaValidationProcess(
    coopBankProgramId,
    accessToken,
  );
});

test('Export Coop Bank verification report', async ({
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
    await exportDataComponent.exportAndAssertData({
      excludedColumns: ['updated'],
    });
  });
});
