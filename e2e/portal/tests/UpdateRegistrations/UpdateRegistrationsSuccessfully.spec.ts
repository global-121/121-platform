import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const newName = 'Michael Scarn';

test('Data should be updated according to selected columns and registrations', async ({
  resetDBAndSeedRegistrations,
  registrationsPage,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationPV5],
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('Select all registrations and open "Update registrations" dialog', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectImportOption(
      'Update selected registrations',
    );
  });

  await test.step('Download the template, edit it, and upload', async () => {
    expect(newName).not.toBe(registrationPV5.fullName);

    await registrationsPage.massUpdateRegistrations({
      expectedRowCount: 1,
      columns: ['Scope', 'Preferred Language', 'Full Name'],
      reason: 'Test reason',
      transformCSVFunction: (csv) =>
        csv.replace(registrationPV5.fullName, newName),
    });
  });

  await test.step('Validate registration is updated', async () => {
    await registrationsPage.table.filterColumnByText({
      columnName: 'Name',
      filterText: newName,
    });
    await registrationsPage.table.validateWaitForTableRowCount({
      expectedRowCount: 1,
    });
  });
});
