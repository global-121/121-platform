import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { performance } from 'node:perf_hooks';

import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  doPayment,
  getProgram,
  paymentDryRun,
  postProgramRegistrationAttribute,
} from '@121-service/test/helpers/program.helper';
import {
  duplicateRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  getPaymentResults,
  updateRegistrationStatusAndLog,
} from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateCount = 15; // 2^15 = 32768

jest.setTimeout(1200000); // 20 minutes
describe('Status Change Payment In Large Program', () => {
  let accessToken: string;

  it('Should create program with many attributes update registration status and do payment', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    // Add 50 attributes to generate bigger load
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
      expect(postProgramRegistrationAttributeResponse.statusCode).toBe(201);
    }
    // Upload registration
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Duplicate registration between 20k - 50k
    const duplicateRegistrationsResponse = await duplicateRegistrations(
      duplicateCount,
      accessToken,
      {
        secret: 'fill_in_secret',
      },
    ); // 2^15 = 32768
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Assert
    // Get program with registrations and validate load time is less than 300ms
    const startTime = performance.now();
    const getProgramResponse = await getProgram(programIdOCW, accessToken);
    const elapsedTime = performance.now() - startTime;
    expect(getProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(elapsedTime).toBeLessThan(40); // 40 ms = 0.04 seconds
    // Change status of all PAs to included
    await updateRegistrationStatusAndLog({
      programId: programIdOCW,
      accessToken,
      status: 'included',
      maxRetryDurationMs: 340_000,
    });
    // Do the payment with dryRun first
    const paymentDryRunResponse = await paymentDryRun({
      programId: programIdOCW,
      accessToken,
      amount: 25,
    });
    expect(paymentDryRunResponse.statusCode).toBe(HttpStatus.OK);
    // Do payment
    const doPaymentResponse = await doPayment({
      programId: programIdOCW,
      amount: 25,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Monitor that 10% of payments is successful and then stop the test
    await getPaymentResults({
      programId: programIdOCW,
      paymentId: 1,
      accessToken,
      totalAmountPowerOfTwo: duplicateCount,
      passRate: 10,
      maxRetryDurationMs: 1200000,
      delayBetweenAttemptsMs: 5000,
      verbose: true,
    });
  });
});
