import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('Fail to include duplicate registrations', async ({
  registrationsPage,
  tableComponent,
  page,
}) => {
  await test.step('Import registrations', async () => {
    const registrationsDataFilePath = path.resolve(
      __dirname,
      '../../../test-registration-data/test-registrations-PV.csv',
    );
    const programTitle = NLRCProgramPV.titlePortal.en;
    await registrationsPage.selectProgram(programTitle);
    await registrationsPage.importRegistrations(registrationsDataFilePath);
    await registrationsPage.validateToastMessageAndClose(
      'Registration(s) imported successfully',
    );
    // Default display filter number
    await tableComponent.validateWaitForTableRowCount({ expectedRowCount: 10 });
    // Uploaded records count
    await tableComponent.validateAllRecordsCount(20);
  });

  await test.step('Include registrations and fail', async () => {
    const registrationNames = [
      'mock-address-city-fail',
      'mock-fail-create-order',
    ];

    await page.goto(`/en-GB/program/${programIdPV}/registrations`);
    await tableComponent.changeRegistrationStatusByNamesWithOptions({
      registrationNames,
      status: 'Include',
    });
    await registrationsPage.validateDuplicatesErrorDialog({
      duplicateCount: registrationNames.length,
    });
  });
});
