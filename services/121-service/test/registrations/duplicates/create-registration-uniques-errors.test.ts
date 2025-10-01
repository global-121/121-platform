import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createRegistrationUniques,
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
} from '@121-service/test/registrations/pagination/pagination-data';
const registration1 = { ...registrationPV5 };
const registration2 = { ...registrationPV6 };
const programId = 2;

// This is separate from the other test file because it is testing the error case
// it also saves a bit of processing time because it does not have to reset db before each test

describe('Unsuccessfully mark registrations as unique from each other', () => {
  let registrationId1: number;
  let registrationId2: number;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';

    await importRegistrations(
      programId,
      [registration1, registration2],
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
  });

  it(`should fail to create an ignored duplicate registration pair for one registration`, async () => {
    const result = await createRegistrationUniques({
      registrationIds: [registrationId1],
      programId,
      accessToken,
    });
    expect(result.status).toBe(400);
    expect(result.body.message).toMatchSnapshot();
  });

  it(`should fail to create an ignored duplicate registration pair for more that 10 registrations`, async () => {
    const result = await createRegistrationUniques({
      registrationIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      programId,
      accessToken,
    });
    expect(result.status).toBe(400);
    expect(result.body.message).toMatchSnapshot();
  });

  it(`should fail to create an ignored duplicate registration pair if a registration id does not exist`, async () => {
    const result = await createRegistrationUniques({
      registrationIds: [registrationId2, 200],
      programId,
      accessToken,
    });
    expect(result.status).toBe(400);
    expect(result.body.message).toMatchSnapshot();
  });
});
