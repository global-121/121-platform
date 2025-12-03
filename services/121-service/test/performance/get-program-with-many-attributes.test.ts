import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { performance } from 'node:perf_hooks';

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

// eslint-disable-next-line n/no-process-env -- Only used in test-runs, not included in '@121-service/src/env'
const duplicateNumber = parseInt(process.env.DUPLICATE_NUMBER || '5'); // cronjob duplicate number should be 2^5 = 32

// 30 seconds is jest global timeout and this test should be able to complete within that time
describe('Get program with many attributes within time threshold of 30 seconds', () => {
  let accessToken: string;

  it('Should get program with many attributes within time threshold', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
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
    const mockResponse = await duplicateRegistrationsAndPaymentData({
      powerNumberRegistration: duplicateNumber,
      accessToken,
      body: {
        secret: env.RESET_SECRET,
      },
    });
    expect(mockResponse.statusCode).toBe(HttpStatus.CREATED);

    // Assert
    // Get program with registrations and validate load time is less than 200ms
    const startTime = performance.now();
    const getProgramResponse = await getProgram(programIdOCW, accessToken);
    const elapsedTime = performance.now() - startTime;
    expect(getProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(elapsedTime).toBeLessThan(200); // 200 ms = 0.2 seconds
  });
});
