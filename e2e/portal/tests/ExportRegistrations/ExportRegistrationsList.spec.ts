import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { deleteRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

let accessToken: string;

test.describe('Export registrations with different formats and configurations', () => {
  test.beforeAll(async ({ resetDBAndSeedRegistrations }) => {
    const result = await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationPvMaxPayment, ...registrationsPV],
      programId: programIdPV,
    });

    accessToken = result.accessToken;

    await deleteRegistrations({
      programId: programIdPV,
      referenceIds: [registrationPvMaxPayment.referenceId],
      accessToken,
    });
  });

  test.afterEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Export Selected Registrations', async ({
    registrationsPage,
    exportDataComponent,
  }) => {
    const programTitle = NLRCProgramPV.titlePortal.en;

    await test.step('Select program', async () => {
      await registrationsPage.selectProgram(programTitle);
    });

    await test.step('Export list and validate XLSX files downloaded', async () => {
      await registrationsPage.selectAllRegistrations();
      await registrationsPage.clickAndSelectExportOption(
        'Selected registrations',
      );
      await exportDataComponent.exportAndAssertData({
        excludedColumns: ['created'],
      });
    });

    await test.step('Export list and validate CSV files downloaded', async () => {
      await registrationsPage.clickAndSelectExportOption(
        'Selected registrations',
      );
      await exportDataComponent.exportAndAssertData({
        format: 'csv',
        excludedColumns: ['created'],
      });
    });
  });

  test('Export should only have selected columns', async ({
    registrationsPage,
    exportDataComponent,
  }) => {
    const programTitle = NLRCProgramPV.titlePortal.en;

    await test.step('Select program', async () => {
      await registrationsPage.selectProgram(programTitle);
    });

    await test.step('Export list and validate XLSX files downloaded', async () => {
      // Configure columns to be exported
      await registrationsPage.configureTableColumns({
        columns: [
          'Reg. #',
          'Name',
          'Phone Number',
          'FSP',
          'Scope',
          'Address street',
        ],
        onlyGivenColumns: true,
      });

      await registrationsPage.selectAllRegistrations();
      await registrationsPage.clickAndSelectExportOption(
        'Selected registrations',
      );
      await exportDataComponent.exportAndAssertData({
        snapshotName: 'exported-selected-columns-xlsx.csv',
      });
    });

    await test.step('Export list and validate CSV files downloaded', async () => {
      await registrationsPage.clickAndSelectExportOption(
        'Selected registrations',
      );
      await exportDataComponent.exportAndAssertData({
        format: 'csv',
        snapshotName: 'exported-selected-columns.csv',
      });
    });
  });
});
