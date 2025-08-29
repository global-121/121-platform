import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProjectRegistrationAttribute } from '@121-service/test/helpers/project.helper';
import {
  awaitChangeRegistrationStatus,
  createRegistrationUniques,
  getDuplicates,
  getRegistrationIdByReferenceId,
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

  it(`should find a duplicate if registration has a duplicate`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber'],
      name: registration2.fullName,
      isInScope: true,
    });
  });

  it(`should find no duplicates if there is not duplicate data`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '0987654321';
    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
  });

  it(`should find multiple attribute names if multiple attributes are duplicates`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    registration1.whatsappPhoneNumber = '0987654321';
    registration2.whatsappPhoneNumber = '0987654321';

    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber', 'whatsappPhoneNumber'],
      name: registration2.fullName,
      isInScope: true,
    });
  });

  it(`should return isInScope is false and no name for a duplicate if the duplicate registration is out of the scope of the user`, async () => {
    const registration1 = { ...registrationPV5, scope: DebugScope.KisumuEast };
    const registration2 = {
      ...registrationPV6,
      scope: DebugScope.TurkanaNorth,
    };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';

    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const scopedAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);

    const result = await getDuplicates({
      projectId,
      accessToken: scopedAccessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(1);

    // Name should not be there if the duplicate registration is out of the scope because the user has no permission to see the name
    expect(duplicates[0]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: DebugScope.TurkanaNorth,
      attributeNames: ['phoneNumber'],
      isInScope: false,
    });
  });

  it(`should find no duplicates if one of the registrations has status declined`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890'; // Same phone number to ensure duplication

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

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);

    const result2 = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration2.referenceId,
    });
    const duplicates2 = result2.body;
    expect(duplicates2.length).toBe(0);
  });

  it(`should find no duplicates if the matching registartion data are empty strings`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '';
    registration2.phoneNumber = '';

    await importRegistrations(
      projectId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
  });

  it(`should find no duplicates if the registration data that is matched is not configured for a duplicate check`, async () => {
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

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
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

    const result1 = await getDuplicates({
      projectId: projectIdPv,
      accessToken,
      referenceId: registrationPv.referenceId,
    });
    const duplicates1 = result1.body;
    expect(duplicates1.length).toBe(0);

    const result2 = await getDuplicates({
      projectId: projectIdOcw,
      accessToken,
      referenceId: registrationOcw.referenceId,
    });
    const duplicates2 = result2.body;
    expect(duplicates2.length).toBe(0);
  });

  it(`should find multiple duplicates if there are mutliple duplicates`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };
    const registration3 = { ...registrationPV7 };
    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    registration3.phoneNumber = '1234567890';

    await importRegistrations(
      projectId,
      [registration1, registration2, registration3],
      accessToken,
    );

    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(2);
    expect(duplicates[0]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber'],
      name: registration2.fullName,
      isInScope: true,
    });
    expect(duplicates[1]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber'],
      name: registration3.fullName,
      isInScope: true,
    });
  });

  it(`should not find duplicates if the duplicate registrations are marked as unqiue`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };
    const registration3 = { ...registrationPV7 };

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

    // Registration 1 is ignored with registration 2 and 3 so it should not have any duplicates
    const result = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
    await getAccessToken();

    // Registration 2 is ignored with registration 1 so it should only have duplicate with registration 3
    const result2 = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration2.referenceId,
    });
    const duplicates2 = result2.body;
    expect(duplicates2.length).toBe(1);
    expect(duplicates2[0]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber', 'whatsappPhoneNumber'],
      name: registration3.fullName,
      isInScope: true,
    });

    // Registration 3 is ignored with registration 1 so it should only have duplicate with registration 2
    const result3 = await getDuplicates({
      projectId,
      accessToken,
      referenceId: registration3.referenceId,
    });
    const duplicates3 = result3.body;
    expect(duplicates3.length).toBe(1);
    expect(duplicates3[0]).toMatchObject({
      registrationProjectId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber', 'whatsappPhoneNumber'],
      name: registration2.fullName,
      isInScope: true,
    });
  });
});
