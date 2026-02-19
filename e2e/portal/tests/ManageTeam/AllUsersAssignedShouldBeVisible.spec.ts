import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const expectedAssignedUsers = [
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

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
});

test('All users assigned to the program should be visible', async ({
  programTeamPage,
}) => {
  const programTitle = 'Cash program Westeros';

  await test.step('Select program and navigate to Manage team', async () => {
    await programTeamPage.selectProgram(programTitle);
    await programTeamPage.navigateToProgramSettingsPage('Program team');
  });

  await test.step('Validate assigned users are visible', async () => {
    await programTeamPage.validateAssignedTeamMembers(expectedAssignedUsers);
  });
});
