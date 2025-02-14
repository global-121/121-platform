import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProgramRegistrationAttribute } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getDuplicates,
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

const programId = 2;
describe('Get duplicate status of registrations', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it(`should find a duplicate if registration has a duplicate`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toMatchObject({
      registrationProgramId: expect.any(Number),
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
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      programId,
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
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toMatchObject({
      registrationProgramId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber', 'whatsappPhoneNumber'],
      name: registration2.fullName,
      isInScope: true,
    });
  });

  it(`should return isInScope is false and no name for a duplicate if the duplicate registration is out of the scope of the user`, async () => {
    const registration1 = { ...registrationPV5, scope: DebugScope.ZeelandGoes };
    const registration2 = {
      ...registrationPV6,
      scope: DebugScope.UtrechtHouten,
    };

    registration1.phoneNumber = '1234567890';
    registration2.phoneNumber = '1234567890';

    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );

    const scopedAccessToken = await getAccessTokenScoped(DebugScope.Zeeland);

    const result = await getDuplicates({
      programId,
      accessToken: scopedAccessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(1);

    // Name should not be there if the duplicate registration is out of the scope because the user has no permission to see the name
    expect(duplicates[0]).toMatchObject({
      registrationProgramId: expect.any(Number),
      scope: DebugScope.UtrechtHouten,
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

    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);

    const result2 = await getDuplicates({
      programId,
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
      programId,
      [registration1, registration2],
      accessToken,
    );

    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
  });

  it(`should find no duplicates if the registration data that is matched is not configured for a duplicate check`, async () => {
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

    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
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

    const result1 = await getDuplicates({
      programId: programIdPv,
      accessToken,
      referenceId: registrationPv.referenceId,
    });
    const duplicates1 = result1.body;
    expect(duplicates1.length).toBe(0);

    const result2 = await getDuplicates({
      programId: programIdOcw,
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
      programId,
      [registration1, registration2, registration3],
      accessToken,
    );

    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(2);
    expect(duplicates[0]).toMatchObject({
      registrationProgramId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber'],
      name: registration2.fullName,
      isInScope: true,
    });
    expect(duplicates[1]).toMatchObject({
      registrationProgramId: expect.any(Number),
      scope: '',
      attributeNames: ['phoneNumber'],
      name: registration3.fullName,
      isInScope: true,
    });
  });

  it(`should not find duplicates on empty values`, async () => {
    const registration1 = { ...registrationPV5 };
    const registration2 = { ...registrationPV6 };

    registration1.phoneNumber = '';
    registration2.phoneNumber = '';
    await importRegistrations(
      programId,
      [registration1, registration2],
      accessToken,
    );
    const result = await getDuplicates({
      programId,
      accessToken,
      referenceId: registration1.referenceId,
    });
    const duplicates = result.body;
    expect(duplicates.length).toBe(0);
  });
});
