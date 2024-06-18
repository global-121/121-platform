import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  registrationScopedGoesPv,
  registrationScopedUtrechtPv,
} from '@121-service/test/fixtures/scoped-registrations';
import {
  patchProgram,
  unpublishProgram,
} from '@121-service/test/helpers/program.helper';
import {
  getImportRegistrationsTemplate,
  importRegistrations,
  searchRegistrationByReferenceId,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationWesteros1,
} from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Import a registration', () => {
  let accessToken: string;

  it('should import registrations', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOCW,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationVisa) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration['financialServiceProvider']).toBe(
          registrationVisa[key],
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration[key]).toBe(registrationVisa[key]);
      }
    }
  });

  it('should fail import registrations due to program is not published yet', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    // unpublish a program
    await unpublishProgram(programIdOCW, accessToken);

    const response = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.errors).toBe(
      `Registrations are not allowed for this program yet, try again later.`,
    );
  });

  it('should import registration scoped', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    const accessToken = await getAccessTokenScoped(DebugScope.Zeeland);

    // Act
    const response = await importRegistrations(
      programIdPV,
      [registrationScopedGoesPv],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationScopedGoesPv.referenceId,
      programIdPV,
      accessToken,
    );
    const registrationResult = result.body.data[0];

    for (const key in registrationScopedGoesPv) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registrationResult['financialServiceProvider']).toBe(
          registrationScopedGoesPv[key],
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registrationResult[key]).toBe(registrationScopedGoesPv[key]);
      }
    }
  });

  it('should not import any registration if one of them has different scope than user', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    const accessToken = await getAccessTokenScoped(DebugScope.Zeeland);

    // Act
    const response = await importRegistrations(
      programIdPV,
      [registrationScopedGoesPv, registrationScopedUtrechtPv],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

    const result = await searchRegistrationByReferenceId(
      registrationScopedGoesPv.referenceId,
      programIdPV,
      accessToken,
    );
    const registrationsResult = result.body.data;
    expect(registrationsResult).toHaveLength(0);
  });

  it('should not import registrations with empty phoneNumber, when program disallows this', async () => {
    // Arrange
    accessToken = await getAccessToken();
    const registrationVisaCopy = { ...registrationVisa };
    // @ts-expect-error "The operand of a 'delete' operator must be optional.ts(2790)"
    delete registrationVisaCopy.phoneNumber;

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisaCopy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

    const result = await searchRegistrationByReferenceId(
      registrationVisaCopy.referenceId,
      programIdOCW,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should import registrations with empty phoneNumber, when program allows this', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    const registrationVisaCopy = { ...registrationVisa };
    // @ts-expect-error "The operand of a 'delete' operator must be optional.ts(2790)"
    delete registrationVisaCopy.phoneNumber;
    const programUpdate = {
      allowEmptyPhoneNumber: true,
    };
    await patchProgram(programIdOCW, programUpdate, accessToken);

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisaCopy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationVisaCopy.referenceId,
      programIdOCW,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationVisaCopy) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration['financialServiceProvider']).toBe(
          registrationVisaCopy[key],
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration[key]).toBe(registrationVisaCopy[key]);
      }
    }
  });

  it('should throw an error with a numeric custom atribute set to null', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    const registrationVisaCopy = { ...registrationVisa };
    // @ts-expect-error we are forcing something to be null when it shouldn't be
    registrationVisaCopy.addressHouseNumber = null;

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisaCopy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();

    const result = await searchRegistrationByReferenceId(
      registrationVisaCopy.referenceId,
      programIdOCW,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should throw an error with a dropdown custom atribute set to null', async () => {
    // Arrange
    await resetDB(SeedScript.test);
    accessToken = await getAccessToken();
    const registrationWesteros1Copy = { ...registrationWesteros1 };
    const programIdWestoros = 1;
    // @ts-expect-error we are forcing something to be null when it shouldn't be
    registrationWesteros1Copy.house = null;

    // Act
    const response = await importRegistrations(
      programIdWestoros,
      [registrationWesteros1Copy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();

    const result = await searchRegistrationByReferenceId(
      registrationWesteros1Copy.referenceId,
      programIdWestoros,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should give me a CSV template when I request it', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    const response = await getImportRegistrationsTemplate(programIdOCW);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.sort()).toMatchSnapshot();
  });
});
