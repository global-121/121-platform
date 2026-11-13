import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import {
  AccessGroupPath,
  getAccessGroupAssignments,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import { getAllUsersByProgramId } from '@121-service/test/helpers/user.helper';
import {
  createUserAssignedToProgram,
  getAccessToken,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const accessGroupPath: AccessGroupPath = 'noord-holland/haarlem';
let userEmail: string;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });

  const accessToken = await getAccessToken();
  await setupAccessGroupLevels({
    programId: programIdPV,
    paths: [accessGroupPath],
    accessToken,
  });
  const userId = await createUserAssignedToProgram({
    programId: programIdPV,
    roles: [DefaultUserRole.View],
    accessGroups: getAccessGroupAssignments({ path: accessGroupPath }),
    adminAccessToken: accessToken,
  });
  const usersResponse = await getAllUsersByProgramId({
    programId: programIdPV,
    accessToken,
  });
  userEmail = usersResponse.body.find(
    ({ id }: { id: number }) => id === userId,
  ).username;
});

test('"Access group" column should only be shown when access groups are configured for the program', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to Manage team in PV program and validate access group of user is shown', async () => {
    await programTeamPage.goto(`/program/${programIdPV}/settings/users/team`);
    await programTeamPage.validateAccessGroupOfUser({
      userEmail,
      expectedAccessGroup: 'noord-holland / haarlem',
    });
  });

  await test.step('Navigate to Manage team in OCW program and validate access group column is hidden', async () => {
    await programTeamPage.goto(`/program/${programIdOCW}/settings/users/team`);
    await programTeamPage.validateAccessGroupColumnIsHidden();
  });
});
