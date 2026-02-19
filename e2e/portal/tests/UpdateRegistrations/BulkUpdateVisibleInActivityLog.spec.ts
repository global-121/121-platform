import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const newName = 'Michael Scarn';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5, registrationPV6],
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Data should be updated according to selected columns and registrations', async ({
  registrationsPage,
  tableComponent,
}) => {
  await test.step('Select all registrations and open "Update registrations" dialog', async () => {
    // adding this extra step to ensure that deleted registrations are excluded from exports
    // for more info: AB#37336
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPV6.fullName,
      status: 'Delete',
      sendMessage: false,
    });
    await registrationsPage.dismissToast();

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
    await registrationsPage.validateToastMessageAndClose(
      'Updating registration(s)',
    );
  });

  await test.step('Validate that bulk update is visible in activity log', async () => {
    await registrationsPage.goToRegistrationByName({
      registrationName: newName,
    });
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Activity',
      selection: 'Data change',
    });
    await tableComponent.validateActivityPresentByType({
      notificationType: 'Data change',
      count: 1,
    });
  });
});
