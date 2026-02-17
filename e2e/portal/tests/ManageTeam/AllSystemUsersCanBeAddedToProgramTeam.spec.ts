import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { removeProgramAssignment } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const expectedAssignedUsers = ['admin@example.org'];
const expectedAvailablesystemUsers = [
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
const programId = 2;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  const { accessToken } = await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
  // remove assignments of all users except admin again, to create the context for this test
  for (let userId = 2; userId <= 10; userId++) {
    await removeProgramAssignment(programId, userId, accessToken);
  }
});

test('All system-users are available to be added to a "program team"', async ({
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
  await test.step('Validate available system users are visible', async () => {
    await programTeamPage.enableEditMode();
    await programTeamPage.openAddUserForm();
    await programTeamPage.validateAvailableSystemUsers(
      expectedAvailablesystemUsers,
    );
  });
});
