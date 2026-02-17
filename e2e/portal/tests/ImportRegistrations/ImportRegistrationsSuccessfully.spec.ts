import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
  });
});

test('Successfully import registrations', async ({
  registrationsPage,
  tableComponent,
}) => {
  const registrationsDataFilePath = path.resolve(
    __dirname,
    '../../../test-registration-data/test-registrations-PV.csv',
  );

  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Import registrations to PV program successfully', async () => {
    await registrationsPage.importRegistrations(registrationsDataFilePath);
    await registrationsPage.validateToastMessageAndClose(
      'Registration(s) imported successfully',
    );
  });

  await test.step('Validate registrations are present in the table and the counts match', async () => {
    // Default display filter number
    await tableComponent.validateWaitForTableRowCount({ expectedRowCount: 10 });
    // Uploaded records count
    await tableComponent.validateAllRecordsCount(20);
  });
});
