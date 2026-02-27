import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  removeProgramAssignment,
} from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const expectedAssignedUsers = ['admin@example.org', 'cva-officer@example.org'];
const userSearchPhrase = 'cva-officer';
const userFullEmail = 'cva-officer@example.org';
const userRole = 'Only CREATE registrations';
const programId = 2;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
  // Get access token after DB reset to avoid race condition
  const accessToken = await getAccessToken();
  // remove assignments of all users except admin again, to create the context for this test
  for (let userId = 2; userId <= 10; userId++) {
    await removeProgramAssignment(programId, userId, accessToken);
  }
});

test('Assign successfully roles to a user ', async ({ programTeamPage }) => {
  const programTitle = 'Cash program Westeros';

  await test.step('Select program and navigate to Manage team', async () => {
    await programTeamPage.selectProgram(programTitle);
    await programTeamPage.navigateToProgramSettingsPage('Program team');
  });

  await test.step('Validate available system users are visible', async () => {
    await programTeamPage.enableEditMode();
    await programTeamPage.openAddUserForm();
    await programTeamPage.addUserToTeam({
      userSearchPhrase,
      userEmail: userFullEmail,
      role: userRole,
    });
    await programTeamPage.validateToastMessage('User added');
    await programTeamPage.validateAssignedTeamMembers(expectedAssignedUsers);
  });
});
