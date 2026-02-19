import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { removeProgramAssignment } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

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

test('User cannot assign role to self', async ({ page, programTeamPage }) => {
  const programTitle = 'Cash program Westeros';

  // Arrange
  await test.step('Select program and navigate to Manage team', async () => {
    await programTeamPage.selectProgram(programTitle);
    await programTeamPage.navigateToProgramSettingsPage('Program team');
  });

  // Act
  await test.step('Check if warning appears that user cannot edit their own roles', async () => {
    await programTeamPage.enableEditMode();
    await programTeamPage.editUser({
      userEmail: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    });

    // Assert
    await expect(
      page.getByText('Users cannot change their own roles'),
    ).toBeVisible();
  });
});
