import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getActivities,
  getRegistrationIdByReferenceId,
  ignoreDuplicates,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';
const registration1 = { ...registrationPV5 };
const registration2 = { ...registrationPV6 };
const programId = 2;
describe('Get duplicate status of registrations', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );
  });

  it(`should sucessfully create an ignored duplicate registration pair and related activities`, async () => {
    const reason = 'test reason';
    const ignoreDuplicatesResult = await ignoreDuplicates({
      referenceId1: registration1.referenceId,
      referenceId2: registration2.referenceId,
      programId,
      accessToken,
      reason,
    });

    const registrationId1 = await getRegistrationIdByReferenceId({
      referenceId: registration1.referenceId,
      programId,
      accessToken,
    });
    const registrationId2 = await getRegistrationIdByReferenceId({
      referenceId: registration2.referenceId,
      programId,
      accessToken,
    });

    const activities1 = (
      await getActivities({
        programId,
        registrationId: registrationId1,
        accessToken,
      })
    ).body.data;
    const ignoreDuplicateActivity1 = activities1.find(
      (activity) => activity.type === ActivityTypeEnum.IgnoredDuplication,
    );

    const activities2 = (
      await getActivities({
        programId,
        registrationId: registrationId2,
        accessToken,
      })
    ).body.data;
    const ignoreDuplicateActivity2 = activities2.find(
      (activity) => activity.type === ActivityTypeEnum.IgnoredDuplication,
    );

    expect(ignoreDuplicatesResult.status).toBe(201);

    expect(ignoreDuplicateActivity1).toMatchObject({
      type: ActivityTypeEnum.IgnoredDuplication,
      attributes: {
        duplicateRegistrationId: String(registrationId2),
        duplicateRegistrationProgramId: expect.any(String),
        reason,
      },
      created: expect.any(String),
      id: expect.any(String),
      user: {
        id: expect.any(Number),
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
    });
    expect(ignoreDuplicateActivity2).toMatchObject({
      type: ActivityTypeEnum.IgnoredDuplication,
      attributes: {
        duplicateRegistrationId: String(registrationId1),
        duplicateRegistrationProgramId: expect.any(String),
        reason,
      },
      created: expect.any(String),
      id: expect.any(String),
      user: {
        id: expect.any(Number),
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
    });
  });

  it(`should fail to create an ignored duplicate registration pair if the pair already exists`, async () => {
    await ignoreDuplicates({
      referenceId1: registration1.referenceId,
      referenceId2: registration2.referenceId,
      programId,
      accessToken,
    });
    const result = await ignoreDuplicates({
      referenceId1: registration1.referenceId,
      referenceId2: registration2.referenceId,
      programId,
      accessToken,
    });
    expect(result.status).toBe(400);
    expect(result.body.message).toMatchSnapshot();

    const resultReversed = await ignoreDuplicates({
      referenceId1: registration2.referenceId,
      referenceId2: registration1.referenceId,
      programId,
      accessToken,
    });
    expect(resultReversed.status).toBe(400);
    expect(resultReversed.body.message).toMatchSnapshot();
  });

  it(`should fail to create an ignored duplicate registration pair for itself`, async () => {
    const result = await ignoreDuplicates({
      referenceId1: registration1.referenceId,
      referenceId2: registration1.referenceId,
      programId,
      accessToken,
    });
    expect(result.status).toBe(400);
    expect(result.body.message).toMatchSnapshot();
  });
});
