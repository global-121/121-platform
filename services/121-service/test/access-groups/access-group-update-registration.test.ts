import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  getAccessGroupAssignments,
  getAccessGroupRegistrationValues,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import {
  getRegistrationEvents,
  importRegistrations,
  searchRegistrationByReferenceId,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Access groups - update registration', () => {
  const programId = 1;
  const reason = 'automated test';
  const registrationPath = 'noord-holland/haarlem';
  const userAccessGroupPath = 'noord-holland';
  const registrationHaarlem = {
    referenceId: 'access-group-update-registration',
    programFspConfigurationName: Fsps.safaricom,
    phoneNumber: '254708374200',
    fullName: 'Original Name',
    nationalId: '32121321',
    ...getAccessGroupRegistrationValues({ path: registrationPath }),
  };

  let accessTokenAdmin: string;
  let accessTokenNoordHolland: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.safaricomProgram });
    accessTokenAdmin = await getAccessToken();

    await setupAccessGroupLevels({
      programId,
      paths: [
        registrationPath,
        'noord-holland/amsterdam',
        'zuid-holland/rotterdam',
      ],
      accessToken: accessTokenAdmin,
    });
    const importResponse = await importRegistrations(
      programId,
      [registrationHaarlem],
      accessTokenAdmin,
    );
    if (importResponse.status !== HttpStatus.CREATED) {
      throw new Error(
        `Failed to import registrations: ${importResponse.status} - ${JSON.stringify(importResponse.body)}`,
      );
    }

    accessTokenNoordHolland = await createAccessTokenWithPermissions({
      permissions: Object.values(PermissionEnum),
      programId,
      adminAccessToken: accessTokenAdmin,
      accessGroups: getAccessGroupAssignments({ path: userAccessGroupPath }),
    });
  });

  it('should not change anything when clearing an access group attribute of the user that is not the last field', async () => {
    // Arrange
    const registrationBeforeResponse = await searchRegistrationByReferenceId(
      registrationHaarlem.referenceId,
      programId,
      accessTokenAdmin,
    );
    const eventsBeforeResponse = await getRegistrationEvents({
      programId,
      referenceId: registrationHaarlem.referenceId,
      accessToken: accessTokenAdmin,
    });

    // Act
    const updateResponse = await updateRegistration(
      programId,
      registrationHaarlem.referenceId,
      {
        province: '',
        fullName: 'Changed Name',
        municipality: 'rotterdam',
      },
      reason,
      accessTokenNoordHolland,
    );

    // Assert
    const registrationAfterResponse = await searchRegistrationByReferenceId(
      registrationHaarlem.referenceId,
      programId,
      accessTokenAdmin,
    );
    const eventsAfterResponse = await getRegistrationEvents({
      programId,
      referenceId: registrationHaarlem.referenceId,
      accessToken: accessTokenAdmin,
    });
    expect(updateResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(registrationAfterResponse.body.data[0]).toEqual(
      registrationBeforeResponse.body.data[0],
    );
    expect(eventsAfterResponse.body.data).toEqual(
      eventsBeforeResponse.body.data,
    );
  });

  it('should update a registration when the access group attributes of the user stay the same', async () => {
    // Arrange
    const eventsBeforeResponse = await getRegistrationEvents({
      programId,
      referenceId: registrationHaarlem.referenceId,
      accessToken: accessTokenAdmin,
    });

    // Act
    const updateResponse = await updateRegistration(
      programId,
      registrationHaarlem.referenceId,
      {
        province: 'noord-holland',
        fullName: 'Changed Name',
        municipality: 'amsterdam',
      },
      reason,
      accessTokenNoordHolland,
    );

    // Assert
    const registrationAfterResponse = await searchRegistrationByReferenceId(
      registrationHaarlem.referenceId,
      programId,
      accessTokenAdmin,
    );
    const eventsAfterResponse = await getRegistrationEvents({
      programId,
      referenceId: registrationHaarlem.referenceId,
      accessToken: accessTokenAdmin,
    });
    expect(updateResponse.statusCode).toBe(HttpStatus.OK);
    expect(registrationAfterResponse.body.data[0]).toMatchObject({
      province: 'noord-holland',
      fullName: 'Changed Name',
      municipality: 'amsterdam',
    });
    expect(eventsAfterResponse.body.data.length).toBeGreaterThan(
      eventsBeforeResponse.body.data.length,
    );
  });
});
