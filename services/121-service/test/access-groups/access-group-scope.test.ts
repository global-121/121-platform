import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  AccessGroupPath,
  getAccessGroupAssignments,
  getAccessGroupRegistrationValues,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import {
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

// This just a sanity check to see if scope and accessgroup filter can be applied together correctyly
// I don't think users should ever set a program like this on production, but in case it does happen, this test ensures the filters work correctly
// When gradually releasing access groups in paralel to scope we only show to configuration for one of either in the interface
// so none power users will never realize that both can be configured simultaneously
describe('Access groups - combined with scope', () => {
  const programId = 1;
  const userScope = DebugScope.Turkana;
  const userAccessGroupPath = 'noord-holland/haarlem';

  const createRegistration = ({
    name,
    scope,
    path,
  }: {
    name: string;
    scope: DebugScope;
    path: AccessGroupPath;
  }) => ({
    referenceId: `access-group-scope-${name}`,
    programFspConfigurationName: Fsps.safaricom,
    phoneNumber: '254708374200',
    fullName: name,
    nationalId: '32121321',
    scope,
    ...getAccessGroupRegistrationValues({ path }),
  });

  const withinScopeAndAccessGroup = createRegistration({
    name: 'within-scope-and-access-group',
    scope: DebugScope.Turkana,
    path: userAccessGroupPath,
  });
  const withinScopeOnly = createRegistration({
    name: 'within-scope-only',
    scope: DebugScope.Turkana,
    path: 'zuid-holland/rotterdam',
  });
  const withinAccessGroupOnly = createRegistration({
    name: 'within-access-group-only',
    scope: DebugScope.Kisumu,
    path: userAccessGroupPath,
  });
  const registrations = [
    withinScopeAndAccessGroup,
    withinScopeOnly,
    withinAccessGroupOnly,
  ];

  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.safaricomProgram });
    const accessTokenAdmin = await getAccessToken();

    await patchProgram(programId, { enableScope: true }, accessTokenAdmin);
    await setupAccessGroupLevels({
      programId,
      paths: [userAccessGroupPath, 'zuid-holland/rotterdam'],
      accessToken: accessTokenAdmin,
    });
    const importResponse = await importRegistrations(
      programId,
      registrations,
      accessTokenAdmin,
    );
    if (importResponse.status !== HttpStatus.CREATED) {
      throw new Error(
        `Failed to import registrations: ${importResponse.status} - ${JSON.stringify(importResponse.body)}`,
      );
    }

    accessToken = await createAccessTokenWithPermissions({
      permissions: Object.values(PermissionEnum),
      programId,
      adminAccessToken: accessTokenAdmin,
      scope: userScope,
      accessGroups: getAccessGroupAssignments({ path: userAccessGroupPath }),
    });
  });

  it('should only return registrations that are within both the scope and the access group of the user', async () => {
    // Act
    const response = await getRegistrations({
      programId,
      accessToken,
      limit: 100,
    });

    // Assert
    const referenceIds = response.body.data.map(
      ({ referenceId }: { referenceId: string }) => referenceId,
    );
    expect(referenceIds).toEqual([withinScopeAndAccessGroup.referenceId]);
  });
});
