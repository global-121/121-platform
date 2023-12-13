import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase } from '../helpers/program.helper';
import {
  importRegistrations,
  searchRegistrationByPhoneNumber,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { registrationVisa } from '../../seed-data/mock/visa-card.data';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';

describe('Find registrations by phone-number', () => {
  let accessToken: string;
  const programId = 3;
  const otherProgramId = 2;

  const registration1 = {
    ...registrationVisa,
    referenceId: 'test-pa-1',
    [CustomDataAttributes.phoneNumber]: '15005550010',
    [CustomDataAttributes.whatsappPhoneNumber]: undefined,
  };
  const registration2 = {
    ...registrationVisa,
    referenceId: 'test-pa-with-different-phone-number',
    [CustomDataAttributes.phoneNumber]: '15005550020',
    [CustomDataAttributes.whatsappPhoneNumber]: undefined,
  };
  const registration3 = {
    ...registrationVisa,
    referenceId: 'test-pa-with-same-phone-number',
    [CustomDataAttributes.phoneNumber]: registration1.phoneNumber,
    [CustomDataAttributes.whatsappPhoneNumber]: undefined,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      programId,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(
      otherProgramId,
      ProgramPhase.registrationValidation,
      accessToken,
    );

    await importRegistrations(
      programId,
      [registration1, registration2, registration3],
      accessToken,
    );
  });

  it('should return the correct registration', async () => {
    // Arrange
    const testPhoneNumber = registration2[CustomDataAttributes.phoneNumber];

    // Act
    const searchResponse = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(searchResponse.statusCode).toBe(HttpStatus.OK);
    expect(searchResponse.body.length).toBe(1);
    expect(searchResponse.body[0][CustomDataAttributes.phoneNumber]).toBe(
      testPhoneNumber,
    );
  });

  it('should return all matching registrations', async () => {
    // Arrange
    const testPhoneNumber = registration1[CustomDataAttributes.phoneNumber];

    // Act
    const searchResponse = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(searchResponse.statusCode).toBe(HttpStatus.OK);
    expect(searchResponse.body.length).toBe(2);
    expect(searchResponse.body[0][CustomDataAttributes.phoneNumber]).toBe(
      testPhoneNumber,
    );
    expect(searchResponse.body[1][CustomDataAttributes.phoneNumber]).toBe(
      testPhoneNumber,
    );
  });

  it('should find registration(s) with phonenumber "+"-notation', async () => {
    // Arrange
    const testPhoneNumber = registration2[CustomDataAttributes.phoneNumber];

    // Act
    const searchResponse = await searchRegistrationByPhoneNumber(
      `+${testPhoneNumber}`,
      accessToken,
    );

    // Assert
    expect(searchResponse.statusCode).toBe(HttpStatus.OK);
    expect(searchResponse.body.length).toBe(1);
    expect(searchResponse.body[0][CustomDataAttributes.phoneNumber]).toBe(
      testPhoneNumber,
    );
  });

  it('should find registration with matching WhatsApp-phonenumber', async () => {
    // Arrange
    const testPhoneNumber = '15005550055';
    const registrationWithSameWhatsApp = {
      ...registrationVisa,
      referenceId: 'test-pa-with-same-whatsapp-number',
      [CustomDataAttributes.phoneNumber]: '15005550050',
      [CustomDataAttributes.whatsappPhoneNumber]: testPhoneNumber,
    };
    await importRegistrations(
      programId,
      [registrationWithSameWhatsApp],
      accessToken,
    );

    // Act
    const searchResponse = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(searchResponse.statusCode).toBe(HttpStatus.OK);
    expect(searchResponse.body.length).toBe(1);
    expect(
      searchResponse.body[0][CustomDataAttributes.whatsappPhoneNumber],
    ).toBe(testPhoneNumber);
  });

  it('should find all registrations with matching WhatsApp/regular-phonenumber(s)', async () => {
    // Arrange
    const testPhoneNumber = registration2.phoneNumber;
    const registrationWithSameWhatsApp = {
      ...registrationVisa,
      referenceId: 'test-pa-with-same-whatsapp-number',
      [CustomDataAttributes.phoneNumber]: '15005550050',
      [CustomDataAttributes.whatsappPhoneNumber]: testPhoneNumber,
    };
    await importRegistrations(
      programId,
      [registrationWithSameWhatsApp],
      accessToken,
    );

    // Act
    const searchResponse = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(searchResponse.statusCode).toBe(HttpStatus.OK);
    expect(searchResponse.body.length).toBe(2);
    expect(
      [
        searchResponse.body[0][CustomDataAttributes.whatsappPhoneNumber],
        searchResponse.body[0][CustomDataAttributes.phoneNumber],
      ].includes(testPhoneNumber),
    ).toBe(true);
    expect(
      [
        searchResponse.body[1][CustomDataAttributes.whatsappPhoneNumber],
        searchResponse.body[1][CustomDataAttributes.phoneNumber],
      ].includes(testPhoneNumber),
    ).toBe(true);
  });

  it('should find registrations across programs', async () => {
    //Arrange
    const testPhoneNumber = registration2.phoneNumber;
    const registrationInOtherProgram = {
      ...registrationVisa,
      referenceId: 'test-pa-with-same-phone-number-in-other-program',
      [CustomDataAttributes.phoneNumber]: testPhoneNumber,
      [CustomDataAttributes.whatsappPhoneNumber]: undefined,
    };
    await importRegistrations(
      programId,
      [registrationInOtherProgram],
      accessToken,
    );

    // Act
    const searchResponse = await searchRegistrationByPhoneNumber(
      `+${testPhoneNumber}`,
      accessToken,
    );

    // Assert
    expect(searchResponse.statusCode).toBe(HttpStatus.OK);
    expect(searchResponse.body.length).toBe(2);
    expect(searchResponse.body[0][CustomDataAttributes.phoneNumber]).toBe(
      testPhoneNumber,
    );
    expect(searchResponse.body[1][CustomDataAttributes.phoneNumber]).toBe(
      testPhoneNumber,
    );
  });
});
