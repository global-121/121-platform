import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProgramRegistrationAttribute } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  registrationOCW1,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

const programId = 2;
describe('Get duplicate status of registrations', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);

    accessToken = await getAccessToken();
  });

  it(`should mark registrations as ${DuplicateStatus.duplicate} if they share attribute data`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      programId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations = result.body.data;
    expect(registrations.length).toBe(2);
    for (const registration of registrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.duplicate);
    }
  });

  it(`should mark registrations as ${DuplicateStatus.unique} if registration do not share attribute data`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '0987654321'; // Different phone number to ensure uniqueness
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      programId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations = result.body.data;
    expect(registrations.length).toBe(2);
    for (const registration of registrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.unique);
    }
  });

  it(`should mark registrations as ${DuplicateStatus.unique} when one of them is declined regardless of duplicate data`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890'; // Same phone number
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );
    await awaitChangeRegistrationStatus({
      programId,
      referenceIds: [registration2.referenceId],
      status: RegistrationStatusEnum.declined,
      accessToken,
    });

    const result = await getRegistrations({
      programId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });

    const registrations = result.body.data;
    expect(registrations.length).toBe(2);
    for (const registration of registrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.unique);
    }
  });

  it(`should mark registration as ${DuplicateStatus.duplicate} if it matches with a registration out of the user's scope`, async () => {
    const registration1 = {
      ...registrationPV5,
      scope: DebugScope.ZeelandMiddelburg,
    };
    const registration2 = {
      ...registrationPV6,
      scope: DebugScope.UtrechtHouten,
    };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890'; // Same phone number
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const testScope = DebugScope.Zeeland;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    const scopedResult = await getRegistrations({
      programId,
      accessToken: accessTokenScoped,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const scopedRegistrations = scopedResult.body.data;
    expect(scopedRegistrations.length).toBe(1);
    for (const registration of scopedRegistrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.duplicate);
    }
  });

  it(`should mark registration as ${DuplicateStatus.unique} if the registration data that is matched is not configured for a duplicate check`, async () => {
    await patchProgramRegistrationAttribute({
      programId,
      programRegistrationAttributeName: 'phoneNumber',
      programRegistrationAttribute: { duplicateCheck: false },
      accessToken,
    });

    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      programId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations = result.body.data;
    expect(registrations.length).toBe(2);
    for (const registration of registrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.unique);
    }
  });

  it(`should mark registrations as ${DuplicateStatus.unique} if matching attribute data is an empty string`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '';
    registration2.phoneNumber = '';
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      programId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations = result.body.data;
    expect(registrations.length).toBe(2);
    for (const registration of registrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.unique);
    }
  });

  it(`should not find duplicates across different programs`, async () => {
    const programIdPv = 2;
    const programIdOcw = 3;

    const registrationPv = { ...registrationPV5 };
    const registrationOcw = { ...registrationOCW1 };

    registrationPv.phoneNumber = '1234567890';
    registrationOcw.phoneNumber = '1234567890'; // Same phone number to ensure duplication

    await importRegistrations(programIdPv, [registrationPv], accessToken);
    await importRegistrations(programIdOcw, [registrationOcw], accessToken);

    const result1 = await getRegistrations({
      programId: programIdPv,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations1 = result1.body.data;
    expect(registrations1.length).toBe(1);
    expect(registrations1[0].duplicateStatus).toBe(DuplicateStatus.unique);

    const result2 = await getRegistrations({
      programId: programIdOcw,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations2 = result2.body.data;
    expect(registrations2.length).toBe(1);
    expect(registrations2[0].duplicateStatus).toBe(DuplicateStatus.unique);
  });
});
