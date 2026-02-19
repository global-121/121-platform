import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const expectedUserEmails = [
  'admin@example.org',
  'program-admin@example.org',
  'view-user@example.org',
  'kobo+registration_country@example.org',
  'kobo+validation_country@example.org',
  'cva-manager@example.org',
  'cva-officer@example.org',
  'finance-manager@example.org',
  'finance-officer@example.org',
  'view-no-pii@example.org',
];

const expectedAssignedUsers = [
  'admin',
  'cva-manager',
  'cva-officer',
  'finance-manager',
  'finance-officer',
  'kobo+registration_country',
  'kobo+validation_country',
  'program-admin',
  'view-no-pii',
  'view-user',
];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
});

test('[Admin] View "Names" and "E-mails" on "Users" page', async ({
  usersPage,
}) => {
  await test.step('Navigate to Users page', async () => {
    await usersPage.navigateToPage('Users');
  });

  await test.step('Validate Users table elements', async () => {
    await usersPage.validateAssignedUsersNames(expectedAssignedUsers);
    await usersPage.validateAssignedUserEmails(expectedUserEmails);
  });
});
