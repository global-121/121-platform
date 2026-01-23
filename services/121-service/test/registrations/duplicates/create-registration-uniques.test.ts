import { HttpStatus } from '@nestjs/common';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createRegistrationUniques,
  getActivities,
  getRegistrationIdByReferenceId,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  registrationPV5,
  registrationPV6,
  registrationPV7,
} from '@121-service/test/registrations/pagination/pagination-data';
const registration1 = { ...registrationPV5 };
const registration2 = { ...registrationPV6 };
const registration3 = { ...registrationPV7 };
const programId = 2;
describe('Successfully mark registrations to ignore duplication', () => {
  let registrationId1: number;
  let registrationId2: number;
  let registrationId3: number;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    registration3.phoneNumber = '1234567890';
    await importRegistrations(
      programId,
      [registration1, registration2, registration3],
      accessToken,
    );
    registrationId1 = await getRegistrationIdByReferenceId({
      referenceId: registration1.referenceId,
      programId,
      accessToken,
    });

    registrationId2 = await getRegistrationIdByReferenceId({
      referenceId: registration2.referenceId,
      programId,
      accessToken,
    });

    registrationId3 = await getRegistrationIdByReferenceId({
      referenceId: registration3.referenceId,
      programId,
      accessToken,
    });
  });

  it(`should successfully create unique registration pairs between 3 registrations`, async () => {
    const reason = 'test reason';
    const createUniquesResult = await createRegistrationUniques({
      registrationIds: [registrationId1, registrationId2, registrationId3],
      programId,
      accessToken,
      reason,
    });

    expect(createUniquesResult.status).toBe(HttpStatus.CREATED);

    // Get activities for each registration
    const activities1 = (
      await getActivities({
        programId,
        registrationId: registrationId1,
        accessToken,
      })
    ).body.data;

    const activities2 = (
      await getActivities({
        programId,
        registrationId: registrationId2,
        accessToken,
      })
    ).body.data;

    const activities3 = (
      await getActivities({
        programId,
        registrationId: registrationId3,
        accessToken,
      })
    ).body.data;

    const ignoredDuplicateActivities1 = activities1.filter(
      (act) => act.type === ActivityTypeEnum.IgnoredDuplicate,
    );

    const ignoredDuplicateActivities2 = activities2.filter(
      (act) => act.type === ActivityTypeEnum.IgnoredDuplicate,
    );

    const ignoredDuplicateActivities3 = activities3.filter(
      (act) => act.type === ActivityTypeEnum.IgnoredDuplicate,
    );

    // Check counts - each registration should have 2
    expect(ignoredDuplicateActivities1.length).toBe(2);
    expect(ignoredDuplicateActivities2.length).toBe(2);
    expect(ignoredDuplicateActivities3.length).toBe(2);

    // Check relationships directly - find specific activities by registration ID
    const reg1ToReg2Activity = ignoredDuplicateActivities1.find(
      (a) => a.attributes.duplicateWithRegistrationId === registrationId2,
    );

    const reg1ToReg3Activity = ignoredDuplicateActivities1.find(
      (a) => a.attributes.duplicateWithRegistrationId === registrationId3,
    );

    const reg2ToReg1Activity = ignoredDuplicateActivities2.find(
      (a) => a.attributes.duplicateWithRegistrationId === registrationId1,
    );

    const reg2ToReg3Activity = ignoredDuplicateActivities2.find(
      (a) => a.attributes.duplicateWithRegistrationId === registrationId3,
    );

    const reg3ToReg1Activity = ignoredDuplicateActivities3.find(
      (a) => a.attributes.duplicateWithRegistrationId === registrationId1,
    );

    const reg3ToReg2Activity = ignoredDuplicateActivities3.find(
      (a) => a.attributes.duplicateWithRegistrationId === registrationId2,
    );

    // Verify each relationship exists
    expect(reg1ToReg2Activity).toBeTruthy();
    expect(reg1ToReg3Activity).toBeTruthy();
    expect(reg2ToReg1Activity).toBeTruthy();
    expect(reg2ToReg3Activity).toBeTruthy();
    expect(reg3ToReg1Activity).toBeTruthy();
    expect(reg3ToReg2Activity).toBeTruthy();

    // Verify one activity in detail to ensure format is correct
    expect(reg1ToReg2Activity).toMatchObject({
      type: ActivityTypeEnum.IgnoredDuplicate,
      attributes: {
        duplicateWithRegistrationId: registrationId2,
        duplicateWithRegistrationProgramId: expect.any(Number),
        reason,
      },
      created: expect.any(String),
      user: {
        username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
    });
  });
});
