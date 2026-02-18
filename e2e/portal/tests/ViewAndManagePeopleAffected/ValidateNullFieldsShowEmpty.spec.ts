import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Validate that null fields show empty in the table', async ({
  registrationsPage,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Setup and seed database', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrationsPage.waitForLoaded(allRegistrationsCount);
  });

  await registrationsPage.validateEmptyField({ columnName: 'Max payments' });
});
