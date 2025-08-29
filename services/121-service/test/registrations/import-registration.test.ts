import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  registrationScopedKisumuEastPv,
  registrationScopedTurkanaNorthPv,
} from '@121-service/test/fixtures/scoped-registrations';
import {
  patchProject,
  setAllProjectsRegistrationAttributesNonRequired,
  unpublishProject,
} from '@121-service/test/helpers/project.helper';
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
  projectIdOCW,
  projectIdPV,
  projectIdWesteros,
  registrationPV5,
  registrationWesteros1,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Import a registration', () => {
  let accessToken: string;

  it('should import registrations', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    // Act
    const response = await importRegistrations(
      projectIdOCW,
      [registrationVisa],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      projectIdOCW,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationVisa) {
      expect(registration[key]).toBe(registrationVisa[key]);
    }
  });

  it('should import registration with mixed attributes (dropdown, boolean, string, numeric)', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    // Act
    const response = await importRegistrations(
      projectIdWesteros,
      [registrationWesteros1],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationWesteros1.referenceId,
      projectIdWesteros,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationWesteros1) {
      // TODO: Number & Boolean is converted to string maybe we should fix this in the future
      const expectedValue = registrationWesteros1[key];
      const actualValue = registration[key];

      let normalizedExpectedValue = expectedValue;
      if (
        typeof expectedValue === 'number' ||
        typeof expectedValue === 'boolean'
      ) {
        normalizedExpectedValue = expectedValue.toString();
      }

      expect(actualValue).toBe(normalizedExpectedValue);
    }
  });

  it('should fail import registrations due to project is not published yet', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    // unpublish a project
    await unpublishProject(projectIdOCW, accessToken);

    const response = await importRegistrations(
      projectIdOCW,
      [registrationVisa],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.errors).toBe(
      `Registrations are not allowed for this project yet, try again later.`,
    );
  });

  it('should import registration scoped', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    const accessToken = await getAccessTokenScoped(DebugScope.Kisumu);

    // Act
    const response = await importRegistrations(
      projectIdPV,
      [registrationScopedKisumuEastPv],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationScopedKisumuEastPv.referenceId,
      projectIdPV,
      accessToken,
    );
    const registrationResult = result.body.data[0];

    for (const key in registrationScopedKisumuEastPv) {
      expect(registrationResult[key]).toBe(registrationScopedKisumuEastPv[key]);
    }
  });

  it('should not import any registration if one of them has different scope than user', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    const accessToken = await getAccessTokenScoped(DebugScope.Kisumu);

    // Act
    const response = await importRegistrations(
      projectIdPV,
      [registrationScopedKisumuEastPv, registrationScopedTurkanaNorthPv],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

    const result = await searchRegistrationByReferenceId(
      registrationScopedKisumuEastPv.referenceId,
      projectIdPV,
      accessToken,
    );
    const registrationsResult = result.body.data;
    expect(registrationsResult).toHaveLength(0);
  });

  it('should not import registrations with empty phoneNumber, when project disallows this', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    const registrationVisaCopy = { ...registrationVisa };
    // @ts-expect-error "The operand of a 'delete' operator must be optional.ts(2790)"
    delete registrationVisaCopy.phoneNumber;

    // Act
    const response = await importRegistrations(
      projectIdOCW,
      [registrationVisaCopy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

    const result = await searchRegistrationByReferenceId(
      registrationVisaCopy.referenceId,
      projectIdOCW,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should import registrations with empty phoneNumber, when project allows this', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    const registrationPVCopy = { ...registrationPV5 };
    // @ts-expect-error "The operand of a 'delete' operator must be optional.ts(2790)"
    delete registrationPVCopy.phoneNumber;
    const projectUpdate = {
      allowEmptyPhoneNumber: true,
    };
    await patchProject(projectIdPV, projectUpdate, accessToken);

    // Act
    const response = await importRegistrations(
      projectIdPV,
      [registrationPVCopy],
      accessToken,
    );
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationPVCopy.referenceId,
      projectIdPV,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationPVCopy) {
      expect(registration[key]).toBe(registrationPVCopy[key]);
    }
  });

  it('should throw an error with a numeric registration atribute set to null', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    const registrationVisaCopy = { ...registrationVisa };
    // @ts-expect-error we are forcing something to be null when it shouldn't be
    registrationVisaCopy.addressHouseNumber = null;

    // Act
    const response = await importRegistrations(
      projectIdOCW,
      [registrationVisaCopy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();

    const result = await searchRegistrationByReferenceId(
      registrationVisaCopy.referenceId,
      projectIdOCW,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should throw an error with a dropdown registration atribute set to null', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
    const registrationWesteros1Copy = { ...registrationWesteros1 };
    const projectIdWesteros = 2;
    // @ts-expect-error we are forcing something to be null when it shouldn't be
    registrationWesteros1Copy.house = null;

    // Act
    const response = await importRegistrations(
      projectIdWesteros,
      [registrationWesteros1Copy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();

    const result = await searchRegistrationByReferenceId(
      registrationWesteros1Copy.referenceId,
      projectIdWesteros,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should throw an error when a required fsp attribute is missing', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    // Removes whatsapp from original registration
    const {
      whatsappPhoneNumber: _whatsappPhoneNumber,
      ...registrationWesteros1Copy
    } = registrationWesteros1;
    registrationWesteros1Copy.projectFspConfigurationName =
      Fsps.intersolveVoucherWhatsapp;

    const projectIdWestoros = 2;

    // Act
    const response = await importRegistrations(
      projectIdWestoros,
      [registrationWesteros1Copy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();

    const result = await searchRegistrationByReferenceId(
      registrationWesteros1Copy.referenceId,
      projectIdWestoros,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should throw an error when uploading a non existing fsp', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    // Removes whatsapp from original registration
    const {
      whatsappPhoneNumber: _whatsappPhoneNumber,
      ...registrationWesteros1Copy
    } = registrationWesteros1;
    registrationWesteros1Copy.projectFspConfigurationName = 'non-existing-fsp';

    // Act
    const response = await importRegistrations(
      projectIdWesteros,
      [registrationWesteros1Copy],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body[0].error).toContain(
      registrationWesteros1Copy.projectFspConfigurationName,
    );

    const result = await searchRegistrationByReferenceId(
      registrationWesteros1Copy.referenceId,
      projectIdWesteros,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should give me a CSV template when I request it', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    const response = await getImportRegistrationsTemplate(projectIdOCW);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.sort()).toMatchSnapshot();
  });

  it('should import registration with null values when all attributes are non-required attributes', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
    const registrationWesterosEmpty = {
      referenceId: 'registrationWesterosEmpty',
      projectFspConfigurationName: 'ironBank',
    };

    const projectUpdate = {
      allowEmptyPhoneNumber: true,
    };
    await patchProject(projectIdWesteros, projectUpdate, accessToken);

    // Patch all projectRegistationAttributes to be non-required
    await setAllProjectsRegistrationAttributesNonRequired(
      projectIdWesteros,
      accessToken,
    );

    // Act
    const response = await importRegistrations(
      projectIdPV,
      [registrationWesterosEmpty],
      accessToken,
    );
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationWesterosEmpty.referenceId,
      projectIdPV,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationWesterosEmpty) {
      expect(registration[key]).toBe(registrationWesterosEmpty[key]);
    }
  });
});
