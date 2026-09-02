import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPVWithOneDuplicate,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPVWithOneDuplicate,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Validate that duplicate badges are present in the UI', async ({
  registrationsPage,
}) => {
  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPVWithOneDuplicate.length;
    await registrationsPage.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Verify contents of duplicate column', async () => {
    await registrationsPage.assertDuplicateColumnValues([
      'Unique',
      'Duplicate',
      'Duplicate',
      'Unique',
    ]);
  });
});
