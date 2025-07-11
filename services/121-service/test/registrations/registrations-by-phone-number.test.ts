import { HttpStatus } from '@nestjs/common';

import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { registrationNotScopedPv } from '@121-service/test/fixtures/scoped-registrations';
import {
  importRegistrations,
  searchRegistrationByPhoneNumber,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('/ Registrations - by phone-number', () => {
  let accessToken: string;

  const registrationOnlyPhoneNumber = {
    ...registrationNotScopedPv,
    referenceId: 'test-pa-1',
    [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550010',
    [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]: undefined,
  };
  const registrationOnlyPhoneNumberUnique = {
    ...registrationNotScopedPv,
    referenceId: 'test-pa-with-different-phone-number',
    [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550020',
    [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]: undefined,
  };
  const registrationOnlyPhoneNumberSame = {
    ...registrationNotScopedPv,
    referenceId: 'test-pa-with-same-phone-number',
    [DefaultRegistrationDataAttributeNames.phoneNumber]:
      registrationOnlyPhoneNumber.phoneNumber,
    [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]: undefined,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(
      programIdPV,
      [
        registrationOnlyPhoneNumber,
        registrationOnlyPhoneNumberUnique,
        registrationOnlyPhoneNumberSame,
      ],
      accessToken,
    );
  }, 20_000);

  it('should not return anything for non-existing phone-numbers', async () => {
    // Arrange
    const testPhoneNumber = '15005550001';

    // Act
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(0);
  });

  it('should return the correct registration', async () => {
    // Arrange
    const testPhoneNumber =
      registrationOnlyPhoneNumberUnique[
        DefaultRegistrationDataAttributeNames.phoneNumber
      ];

    // Act
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(1);
    expect(
      response.body[0][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
  });

  it('should return all matching registrations', async () => {
    // Arrange
    const testPhoneNumber =
      registrationOnlyPhoneNumber[
        DefaultRegistrationDataAttributeNames.phoneNumber
      ];

    // Act
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(2);
    expect(
      response.body[0][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
    expect(
      response.body[1][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
  });

  it('should find registration(s) with phonenumber "+"-notation', async () => {
    // Arrange
    const testPhoneNumber =
      registrationOnlyPhoneNumberUnique[
        DefaultRegistrationDataAttributeNames.phoneNumber
      ];

    // Act
    const response = await searchRegistrationByPhoneNumber(
      `+${testPhoneNumber}`,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(1);
    expect(
      response.body[0][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
  });

  it('should find registration with matching WhatsApp-phonenumber', async () => {
    // Arrange
    const testPhoneNumber = '15005550055';
    const registrationWithWhatsApp = {
      ...registrationVisa,
      referenceId: 'test-pa-with-same-whatsapp-number',
      [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550050',
      [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]:
        testPhoneNumber,
    };
    await importRegistrations(
      programIdOCW,
      [registrationWithWhatsApp],
      accessToken,
    );

    // Act
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(1);
    expect(
      response.body[0][
        DefaultRegistrationDataAttributeNames.whatsappPhoneNumber
      ],
    ).toBe(testPhoneNumber);
  });

  it('should find all registrations with matching WhatsApp/regular-phonenumber(s)', async () => {
    // Arrange
    const testPhoneNumber = registrationOnlyPhoneNumberUnique.phoneNumber;
    const registrationWithSameWhatsApp = {
      ...registrationVisa,
      referenceId: 'test-pa-with-same-whatsapp-number',
      [DefaultRegistrationDataAttributeNames.phoneNumber]: '15005550050',
      [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]:
        testPhoneNumber,
    };
    await importRegistrations(
      programIdOCW,
      [registrationWithSameWhatsApp],
      accessToken,
    );

    // Act
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(2);
    expect(
      [
        response.body[0][
          DefaultRegistrationDataAttributeNames.whatsappPhoneNumber
        ],
        response.body[0][DefaultRegistrationDataAttributeNames.phoneNumber],
      ].includes(testPhoneNumber),
    ).toBe(true);
    expect(
      [
        response.body[1][
          DefaultRegistrationDataAttributeNames.whatsappPhoneNumber
        ],
        response.body[1][DefaultRegistrationDataAttributeNames.phoneNumber],
      ].includes(testPhoneNumber),
    ).toBe(true);
  });

  it('should find registrations across programs', async () => {
    //Arrange
    const testPhoneNumber = registrationOnlyPhoneNumberUnique.phoneNumber;
    const registrationInOtherProgram = {
      ...registrationVisa,
      referenceId: 'test-pa-with-same-phone-number-in-other-program',
      [DefaultRegistrationDataAttributeNames.phoneNumber]: testPhoneNumber,
      [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]:
        '15005550300',
    };
    await importRegistrations(
      programIdOCW,
      [registrationInOtherProgram],
      accessToken,
    );

    // Act
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(2);
    expect(
      response.body[0][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
    expect(
      response.body[1][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
  });

  it('should only find registrations with matching scope', async () => {
    //Arrange
    const testPhoneNumber =
      registrationOnlyPhoneNumberUnique[
        DefaultRegistrationDataAttributeNames.phoneNumber
      ];
    const registrationInOtherProgramZeelandMiddelburg = {
      ...registrationVisa,
      referenceId:
        'test-pa-with-same-phone-number-in-other-program-zeeland-middelburg',
      [DefaultRegistrationDataAttributeNames.phoneNumber]: testPhoneNumber,
      [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]:
        '15005550201',
      scope: DebugScope.ZeelandMiddelburg,
    };

    const registrationInOtherProgramUtrechtHouten = {
      ...registrationVisa,
      referenceId:
        'test-pa-with-same-phone-number-in-other-program-utrecht-houten',
      [DefaultRegistrationDataAttributeNames.phoneNumber]: testPhoneNumber,
      [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]:
        '15005550202',
      scope: DebugScope.UtrechtHouten,
    };

    await importRegistrations(
      programIdPV,
      [
        registrationInOtherProgramZeelandMiddelburg,
        registrationInOtherProgramUtrechtHouten,
      ],
      accessToken,
    );

    // Act
    const accessTokenZeelandMiddelburg = await getAccessTokenScoped(
      DebugScope.ZeelandMiddelburg,
    );
    const response = await searchRegistrationByPhoneNumber(
      testPhoneNumber,
      accessTokenZeelandMiddelburg,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(1);
    expect(
      response.body[0][DefaultRegistrationDataAttributeNames.phoneNumber],
    ).toBe(testPhoneNumber);
  });
});
