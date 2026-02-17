import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const expectedInitialAssignedUsers = [
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
const userToRemove = 'view-no-pii@example.org';
const expectedFinalAssignedUsers = expectedInitialAssignedUsers.filter(
  (email) => email !== userToRemove,
);

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
});

test('Users should be removable from "program team"', async ({
  programTeamPage,
}) => {
  const programTitle = 'Cash program Westeros';

  await test.step('Select program and navigate to Manage team', async () => {
    await programTeamPage.selectProgram(programTitle);
    await programTeamPage.navigateToProgramSettingsPage('Program team');
  });

  await test.step('Validate assigned users are visible', async () => {
    await programTeamPage.validateAssignedTeamMembers(
      expectedInitialAssignedUsers,
    );
  });

  await test.step('Validate available system users are visible', async () => {
    await programTeamPage.enableEditMode();
    await programTeamPage.removeUserFromTeam({
      userEmail: userToRemove,
    });
    await programTeamPage.validateToastMessage('User removed');
    await programTeamPage.validateAssignedTeamMembers(
      expectedFinalAssignedUsers,
    );
  });
});
