import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

import { env } from '@121-service/src/env';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  doPayment,
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
import { isHighDataVolume } from '@121-service/test/performance/helpers/high-data-volume.helper';
import {
  getPaymentResults,
  updateRegistrationStatusAndLog,
} from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// Timing configuration
const maxRetryDurationMs = 600_000; // 10 minutes, for the status change
const maxPaymentRetryDurationMs = 900_000; // 15 minutes, to reach the pass rate
const testTimeout = 1_800_000; // 30 minutes
const delayBetweenAttemptsMs = 15_000; // 15 seconds
const maximumProgramLoadTime = 200; // 200 ms = 0.2 seconds

const duplicateLowNumber = 5;
const duplicateHighNumber = 15; // cronjob duplicate number should be 2^15 = 32768
const passRate = 10; // 10%
const amount = 25;

const duplicateNumber = isHighDataVolume
  ? duplicateHighNumber
  : duplicateLowNumber;

jest.setTimeout(testTimeout);

describe('Status Change Payment In Large Program', () => {
  it('Should create program with many attributes update registration status and do payment', async () => {
    // Arrange
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    const accessToken = await getAccessToken();

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

    // Duplicate registration to 2^15 = 32k (high data volume) or 2^5 = 32 (local)
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        accessToken,
        skipIntroduceDuplicates: true,
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

    // Change status of all PAs to included
    await updateRegistrationStatusAndLog({
      programId: programIdOCW,
      accessToken,
      status: 'included',
      maxRetryDurationMs,
      delayBetweenAttemptsMs,
    });

    // Do the payment with dryRun first
    const paymentDryRunResponse = await doPayment({
      programId: programIdOCW,
      referenceIds: [],
      accessToken,
      transferValue: amount,
      filter: { dryRun: 'true' },
    });
    expect(paymentDryRunResponse.statusCode).toBe(HttpStatus.OK);

    // Do payment
    const doPaymentResponse = await doPayment({
      programId: programIdOCW,
      transferValue: amount,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.CREATED);

    // Monitor that 10% of payments is successful and then stop the test
    const paymentResults = await getPaymentResults({
      programId: programIdOCW,
      paymentId: doPaymentResponse.body.id,
      accessToken,
      totalAmountPowerOfTwo: duplicateNumber,
      passRate,
      maxRetryDurationMs: maxPaymentRetryDurationMs,
      delayBetweenAttemptsMs,
      verbose: true,
    });
    expect(paymentResults.success).toBe(true);
  });
});
