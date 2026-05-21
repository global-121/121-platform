import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('Unsuccessfully import registrations', async ({ registrationsPage }) => {
  const wrongRegistrationsDataFilePath = path.resolve(
    __dirname,
    '../../../test-registration-data/test-registrations-OCW-scoped.csv',
  );
  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Import registrations to PV program successfully', async () => {
    await registrationsPage.importRegistrations(wrongRegistrationsDataFilePath);
    await registrationsPage.waitForImportProcessToComplete();
  });

  await test.step('Validate import error message', async () => {
    await registrationsPage.validateErrorMessage(
      'Something went wrong with this import. Please fix the errors reported below and try again.',
    );
  });

  await test.step('Should show table with error details', async () => {
    await registrationsPage.validateErrorTable();
  });
});

test('Import too many registrations', async ({ registrationsPage }) => {
  const wrongRegistrationsDataFilePath = path.resolve(
    __dirname,
    '../../../test-registration-data/test-registrations-demo-1001.csv',
  );
  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Import registrations to PV program successfully', async () => {
    //  Because the import throws quite quick on maximum rows exeeded,
    // we don't need to wait for the import process to complete in this test
    await registrationsPage.importRegistrations(wrongRegistrationsDataFilePath);
  });

  await test.step('Validate import error message', async () => {
    await registrationsPage.validateErrorMessage(
      'Too many records. Maximum number of records is 1000. You have 1001 records.',
    );
  });
});
