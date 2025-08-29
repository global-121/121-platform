import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProjectRegistrationAttribute } from '@121-service/test/helpers/project.helper';
import {
  awaitChangeRegistrationStatus,
  createRegistrationUniques,
  getRegistrationIdByReferenceId,
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
  registrationPV7,
} from '@121-service/test/registrations/pagination/pagination-data';

const projectId = 2;
describe('Get duplicate status of registrations', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);

    accessToken = await getAccessToken();
  });

  it(`should mark registrations as ${DuplicateStatus.duplicate} if they share attribute data`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      projectId,
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
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      projectId,
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
      projectId,
      [registration1, registration2],
      accessToken,
    );
    await awaitChangeRegistrationStatus({
      projectId,
      referenceIds: [registration2.referenceId],
      status: RegistrationStatusEnum.declined,
      accessToken,
    });

    const result = await getRegistrations({
      projectId,
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
      scope: DebugScope.KisumuWest,
    };
    const registration2 = {
      ...registrationPV6,
      scope: DebugScope.TurkanaNorth,
    };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890'; // Same phone number
    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const testScope = DebugScope.Kisumu;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    const scopedResult = await getRegistrations({
      projectId,
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
    await patchProjectRegistrationAttribute({
      projectId,
      projectRegistrationAttributeName: 'phoneNumber',
      projectRegistrationAttribute: { duplicateCheck: false },
      accessToken,
    });

    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      projectId,
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
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getRegistrations({
      projectId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations = result.body.data;
    expect(registrations.length).toBe(2);
    for (const registration of registrations) {
      expect(registration.duplicateStatus).toBe(DuplicateStatus.unique);
    }
  });

  it(`should not find duplicates across different projects`, async () => {
    const projectIdPv = 2;
    const projectIdOcw = 3;

    const registrationPv = { ...registrationPV5 };
    const registrationOcw = { ...registrationOCW1 };

    registrationPv.phoneNumber = '1234567890';
    registrationOcw.phoneNumber = '1234567890'; // Same phone number to ensure duplication

    await importRegistrations(projectIdPv, [registrationPv], accessToken);
    await importRegistrations(projectIdOcw, [registrationOcw], accessToken);

    const result1 = await getRegistrations({
      projectId: projectIdPv,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations1 = result1.body.data;
    expect(registrations1.length).toBe(1);
    expect(registrations1[0].duplicateStatus).toBe(DuplicateStatus.unique);

    const result2 = await getRegistrations({
      projectId: projectIdOcw,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const registrations2 = result2.body.data;
    expect(registrations2.length).toBe(1);
    expect(registrations2[0].duplicateStatus).toBe(DuplicateStatus.unique);
  });

  it(`should mark registrations as ${DuplicateStatus.unique} if the duplicate registrations are marked as unique`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };
    const registration3 = { ...registrationPV7 };

    // Give all registrations the same phone numbers to make them duplicates
    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    registration3.phoneNumber = '1234567890';
    registration1.whatsappPhoneNumber = '1234567890';
    registration2.whatsappPhoneNumber = '1234567890';
    registration3.whatsappPhoneNumber = '1234567890';

    await importRegistrations(
      projectId,
      [registration1, registration2, registration3],
      accessToken,
    );
    const registrationId1 = await getRegistrationIdByReferenceId({
      referenceId: registration1.referenceId,
      projectId,
      accessToken,
    });
    const registrationId2 = await getRegistrationIdByReferenceId({
      referenceId: registration2.referenceId,
      projectId,
      accessToken,
    });
    const registrationId3 = await getRegistrationIdByReferenceId({
      referenceId: registration3.referenceId,
      projectId,
      accessToken,
    });

    await createRegistrationUniques({
      projectId,
      accessToken,
      registrationIds: [registrationId1, registrationId2],
    });
    await createRegistrationUniques({
      projectId,
      accessToken,
      registrationIds: [registrationId1, registrationId3],
    });

    // Registration1 should be unique as all its duplicates are ignored
    // Registration2 should be duplicate as it is still duplicate with registration3
    // Registration3 should be duplicate as it is still duplicate with registration2
    const result = await getRegistrations({
      projectId,
      accessToken,
      attributes: ['referenceId', 'duplicateStatus'],
    });
    const resultRegistrations = result.body.data;

    expect(
      resultRegistrations.find(
        (r) => r.referenceId === registration1.referenceId,
      ).duplicateStatus,
    ).toBe(DuplicateStatus.unique);

    expect(
      resultRegistrations.find(
        (r) => r.referenceId === registration2.referenceId,
      ).duplicateStatus,
    ).toBe(DuplicateStatus.duplicate);

    expect(
      resultRegistrations.find(
        (r) => r.referenceId === registration3.referenceId,
      ).duplicateStatus,
    ).toBe(DuplicateStatus.duplicate);
  });
});
