import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

import { env } from '@121-service/src/env';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  getProgram,
  postProgramRegistrationAttribute,
} from '@121-service/test/helpers/program.helper';
import {
  duplicateRegistrationsAndPaymentData,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// Timing configuration
const testTimeout = 30 * 1000; // Overall test timeout to prevent hanging
const maximumProgramLoadTime = 200; // Performance assertion limit for loading the program

// Performance test configuration
const duplicateNumber = 5; // cronjob duplicate number should be 2^5 = 32

jest.setTimeout(testTimeout);

describe('Get program with many attributes within time threshold of 30 seconds', () => {
  it('Should get program with many attributes within time threshold', async () => {
    // Arrange
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    const accessToken = await getAccessToken();

    // Add 50 attributes
    for (let i = 0; i < 50; i++) {
      const programRegistrationAttribute: ProgramRegistrationAttributeDto = {
        name: `attribute${i}`,
        options: [],
        scoring: {},
        pattern: 'string',
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        includeInTransactionExport: true,
        label: {
          en: `Attribute ${i}`,
        },
        placeholder: {
          en: '+31 6 00 00 00 00',
        },
        duplicateCheck: false,
        type: RegistrationAttributeTypes.text,
        isRequired: false,
      };

      const postProgramRegistrationAttributeResponse =
        await postProgramRegistrationAttribute(
          programRegistrationAttribute,
          programIdOCW,
          accessToken,
        );
      expect(postProgramRegistrationAttributeResponse.statusCode).toBe(
        HttpStatus.CREATED,
      );
    }
    // Upload registration
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);

    // Duplicate registrations
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Assert
    // Get program with registrations and validate load time
    const startTime = performance.now();

    const getProgramResponse = await getProgram(programIdOCW, accessToken);
    const elapsedTime = performance.now() - startTime;

    expect(getProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(elapsedTime).toBeLessThan(maximumProgramLoadTime);
  });
});
