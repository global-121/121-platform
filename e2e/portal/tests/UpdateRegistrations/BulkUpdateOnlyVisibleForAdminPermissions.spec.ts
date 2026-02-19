import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
    username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('User does not have sufficient Role to bulk update with CSV (import modal not visible)', async ({
  registrationsPage,
}) => {
  await test.step('Select all registrations, open "Update registrations" dialog and validate "Update selected registrations" are not visible', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.validateImportOptionNotVisible();
  });
});
