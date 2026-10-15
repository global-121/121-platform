import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import {
  AccessGroupPath,
  getAccessGroupAssignments,
  getAccessGroupRegistrationValues,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import {
  importRegistrations,
  searchRegistrationByPhoneNumber,
} from '@121-service/test/helpers/registration.helper';
import {
  assignUserToProgram,
  createUserWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

// The search by phone number is not bound to a program, so the access groups of the user
// have to be applied per program the user is assigned to
describe('Access groups - search registrations by phone number across programs', () => {
  const userAccessGroupPath: AccessGroupPath = 'noord-holland/haarlem';

  const createRegistration = ({
    name,
    phoneNumber,
    path,
  }: {
    name: string;
    phoneNumber: string;
    path?: AccessGroupPath;
  }) => ({
    referenceId: `access-group-phone-number-${name}`,
    programFspConfigurationName: Fsps.intersolveVoucherPaper,
    phoneNumber,
    fullName: name,
    ...(path ? getAccessGroupRegistrationValues({ path }) : {}),
  });

  const withinAccessGroup = createRegistration({
    name: 'within-access-group',
    phoneNumber: '14155235551',
    path: userAccessGroupPath,
  });
  const outsideAccessGroup = createRegistration({
    name: 'outside-access-group',
    phoneNumber: '14155235552',
    path: 'zuid-holland/rotterdam',
  });
  // Shares its phone number with the registration outside the access group of the user in the first program
  const ofOtherProgram = {
    ...createRegistration({
      name: 'of-other-program',
      phoneNumber: outsideAccessGroup.phoneNumber,
    }),
    programFspConfigurationName: Fsps.intersolveVisa,
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    const accessTokenAdmin = await getAccessToken();

    await setupAccessGroupLevels({
      programId: programIdPV,
      paths: [userAccessGroupPath, 'zuid-holland/rotterdam'],
      accessToken: accessTokenAdmin,
    });
    await importRegistrations(
      programIdPV,
      [withinAccessGroup, outsideAccessGroup],
      accessTokenAdmin,
    );

    await importRegistrations(programIdOCW, [ofOtherProgram], accessTokenAdmin);

    const { username, password, userId } = await createUserWithPermissions({
      permissions: Object.values(PermissionEnum),
      programId: programIdPV,
      adminAccessToken: accessTokenAdmin,
      accessGroups: getAccessGroupAssignments({ path: userAccessGroupPath }),
    });
    await assignUserToProgram({
      programId: programIdOCW,
      userId,
      roles: [DefaultUserRole.View],
      adminAccessToken: accessTokenAdmin,
    });
    accessToken = await getAccessToken(username, password);
  });

  it('should return a registration within the access group of the user', async () => {
    // Act
    const response = await searchRegistrationByPhoneNumber(
      withinAccessGroup.phoneNumber,
      accessToken,
    );

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(
      response.body.map(
        ({ referenceId }: { referenceId: string }) => referenceId,
      ),
    ).toEqual([withinAccessGroup.referenceId]);
  });

  it('should not return a registration outside the access group of the user', async () => {
    // Act
    const response = await searchRegistrationByPhoneNumber(
      outsideAccessGroup.phoneNumber,
      accessToken,
    );

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(
      response.body.map(
        ({ referenceId }: { referenceId: string }) => referenceId,
      ),
    ).not.toContain(outsideAccessGroup.referenceId);
  });

  it('should only return the registration of the other program when the phone number is shared with a registration outside the access group of the user', async () => {
    // Act
    const response = await searchRegistrationByPhoneNumber(
      ofOtherProgram.phoneNumber,
      accessToken,
    );

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].referenceId).toBe(ofOtherProgram.referenceId);
    expect(response.body[0].programId).toBe(programIdOCW);
  });
});
