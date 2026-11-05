import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createUser,
  getAccessToken,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdCbe,
  programIdWesteros,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import {
  accessGroupLevelAttributeNames,
  accessGroupLevelAttributes,
} from '../../helpers/accessGroupLevelAttributes';

const programTeamPagePathCbe = `/program/${programIdCbe}/settings/users/team`;
const programTeamPagePathWesteros = `/program/${programIdWesteros}/settings/users/team`;

const newUserEmail = 'access-group-user@example.org';
const newUserRole = 'Only CREATE registrations';
const existingTeamMemberEmail =
  env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER ?? '';
const ownEmail = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;

test.beforeEach(
  'Setup',
  async ({
    resetDBAndSeedRegistrations,
    createRegistrationAttribute,
    updateAccessGroupLevels,
  }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.testMultiple,
      skipSeedRegistrations: true,
    });

    const accessToken = await getAccessToken();

    for (const attribute of accessGroupLevelAttributes) {
      await createRegistrationAttribute({
        programRegistrationAttribute: attribute,
        programId: programIdCbe,
        accessToken,
      });
    }

    await updateAccessGroupLevels({
      programId: programIdCbe,
      updateProgramAccessGroupLevelsDto: {
        accessGroupRegistrationAttributeNames: accessGroupLevelAttributeNames,
      },
      accessToken,
    });

    await createUser({
      username: newUserEmail,
      displayName: 'Access group user',
      adminAccessToken: accessToken,
    });
  },
);

test('Set access groups when adding a user to the program team', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page', async () => {
    await programTeamPage.goto(programTeamPagePathCbe);
  });

  await test.step('Add the user with access groups for the first two levels', async () => {
    await programTeamPage.openAddUserForm();
    await programTeamPage.validateAccessGroupFormIsVisible();
    await programTeamPage.addUserToTeam({
      userSearchPhrase: 'access-group',
      userEmail: newUserEmail,
      role: newUserRole,
      accessGroupLevels: { 1: 'Amsterdam', 2: 'West' },
    });
    await programTeamPage.validateToastMessageAndClose('User added');
  });

  await test.step('Validate the stored access groups when editing the user', async () => {
    await programTeamPage.editUser({ userEmail: newUserEmail });
    await programTeamPage.validateAccessGroupLevels({
      accessGroupLevels: { 1: 'Amsterdam', 2: 'West', 3: null },
    });
  });
});

test('Update and clear the access groups of a program team member', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page', async () => {
    await programTeamPage.goto(programTeamPagePathCbe);
  });

  await test.step('Validate the team member has no access groups yet', async () => {
    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.validateAccessGroupLevels({
      accessGroupLevels: { 1: null, 2: null, 3: null },
    });
  });

  await test.step('Set access groups for all three levels', async () => {
    await programTeamPage.setAccessGroupLevels({
      accessGroupLevels: { 1: 'Utrecht', 2: 'Noord', 3: 'Damrak' },
    });
    await programTeamPage.saveEditedUser();
    await programTeamPage.validateToastMessageAndClose('User updated');

    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.validateAccessGroupLevels({
      accessGroupLevels: { 1: 'Utrecht', 2: 'Noord', 3: 'Damrak' },
    });
  });

  await test.step('Change the first level and clear the last level', async () => {
    await programTeamPage.setAccessGroupLevels({
      accessGroupLevels: { 1: 'Rotterdam', 3: null },
    });
    await programTeamPage.saveEditedUser();
    await programTeamPage.validateToastMessageAndClose('User updated');

    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.validateAccessGroupLevels({
      accessGroupLevels: { 1: 'Rotterdam', 2: 'Noord', 3: null },
    });
  });

  await test.step('Clear all access groups', async () => {
    await programTeamPage.setAccessGroupLevels({
      accessGroupLevels: { 1: null, 2: null },
    });
    await programTeamPage.saveEditedUser();
    await programTeamPage.validateToastMessageAndClose('User updated');

    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.validateAccessGroupLevels({
      accessGroupLevels: { 1: null, 2: null, 3: null },
    });
  });
});

test('User cannot change their own access groups', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page and edit own user', async () => {
    await programTeamPage.goto(programTeamPagePathCbe);
    await programTeamPage.editUser({ userEmail: ownEmail });
  });

  await test.step('Validate the warning is shown and the access group levels are disabled', async () => {
    await expect(programTeamPage.ownAccessGroupsWarning).toBeVisible();
    await programTeamPage.validateAccessGroupLevelsAreDisabled();
  });
});

test('Access group fields are hidden for a program without access group levels', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page of a program without access group levels', async () => {
    await programTeamPage.goto(programTeamPagePathWesteros);
  });

  await test.step('Validate the access group form is hidden when adding a user', async () => {
    await programTeamPage.openAddUserForm();
    await programTeamPage.validateAccessGroupFormIsHidden();
    await programTeamPage.closeDialog();
  });

  await test.step('Validate the access group form is hidden when editing a user', async () => {
    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.validateAccessGroupFormIsHidden();
  });
});
