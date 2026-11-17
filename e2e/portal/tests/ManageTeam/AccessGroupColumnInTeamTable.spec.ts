import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdCbe,
  programIdWesteros,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import {
  accessGroupLevelAttributeNames,
  accessGroupLevelAttributes,
} from '@121-e2e/portal/helpers/accessGroupLevelAttributes';

const programTeamPagePathCbe = `/program/${programIdCbe}/settings/users/team`;
const programTeamPagePathWesteros = `/program/${programIdWesteros}/settings/users/team`;

const existingTeamMemberEmail =
  env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER ?? '';
const labelForAllAccessGroups = 'All';

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
  },
);

test('Access group column shows "All" for a team member without access groups', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page', async () => {
    await programTeamPage.goto(programTeamPagePathCbe);
  });

  await test.step('Validate the access group column is visible', async () => {
    await programTeamPage.validateAccessGroupColumnIsVisible();
  });

  await test.step('Validate the team member has access to all access groups', async () => {
    await programTeamPage.validateAccessGroupOfUser({
      userEmail: existingTeamMemberEmail,
      accessGroup: labelForAllAccessGroups,
    });
  });
});

test('Access group column shows the access groups of a team member after updating them', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page', async () => {
    await programTeamPage.goto(programTeamPagePathCbe);
  });

  await test.step('Set access groups for the first two levels and validate the column', async () => {
    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.setAccessGroupLevels({
      accessGroupLevels: { 1: 'Amsterdam', 2: 'West' },
    });
    await programTeamPage.saveEditedUser();
    await programTeamPage.validateToastMessageAndClose('User updated');

    await programTeamPage.validateAccessGroupOfUser({
      userEmail: existingTeamMemberEmail,
      accessGroup: 'Amsterdam / West',
    });
  });

  await test.step('Set access groups for all four levels and validate the column', async () => {
    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.setAccessGroupLevels({
      accessGroupLevels: { 1: 'Utrecht', 2: 'Noord', 3: 'Damrak', 4: '51-100' },
    });
    await programTeamPage.saveEditedUser();
    await programTeamPage.validateToastMessageAndClose('User updated');

    await programTeamPage.validateAccessGroupOfUser({
      userEmail: existingTeamMemberEmail,
      accessGroup: 'Utrecht / Noord / Damrak / 51-100',
    });
  });

  await test.step('Clear all access groups and validate the column', async () => {
    await programTeamPage.editUser({ userEmail: existingTeamMemberEmail });
    await programTeamPage.setAccessGroupLevels({
      accessGroupLevels: { 1: null },
    });
    await programTeamPage.saveEditedUser();
    await programTeamPage.validateToastMessageAndClose('User updated');

    await programTeamPage.validateAccessGroupOfUser({
      userEmail: existingTeamMemberEmail,
      accessGroup: labelForAllAccessGroups,
    });
  });
});

test('Access group column is hidden for a program without access group levels', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to the program team page of a program without access group levels', async () => {
    await programTeamPage.goto(programTeamPagePathWesteros);
  });

  await test.step('Validate the access group column is hidden', async () => {
    await programTeamPage.validateAccessGroupColumnIsHidden();
  });
});
