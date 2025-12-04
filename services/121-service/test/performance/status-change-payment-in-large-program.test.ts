import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { performance } from 'node:perf_hooks';

import { env } from '@121-service/src/env';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  createAndStartPayment,
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
import {
  getPaymentResults,
  updateRegistrationStatusAndLog,
} from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const PERFORMANCE_TEST_SHARD = 1;
void PERFORMANCE_TEST_SHARD; // Used by CI workflow for test discovery
const duplicateLowNumber = 5;
const duplicateHighNumber = 15; // cronjob duplicate number should be 2^15 = 32768
const passRate = 10; // 10%
const maxRetryDurationMs = 1_200_000; // 20 minutes
const delayBetweenAttemptsMs = 5000; // 5 seconds
const amount = 25;
const testTimeout = 18_000_000; // 30 minutes
const isPerformanceCronjob =
  // eslint-disable-next-line n/no-process-env -- Required to detect CI environment for performance testing
  process.env.CI === 'true' &&
  // eslint-disable-next-line n/no-process-env -- Required to detect GitHub Actions workflow name
  process.env.GITHUB_WORKFLOW?.includes('Test: Jest Performance Tests Cronjob');
const duplicateNumber = isPerformanceCronjob
  ? duplicateHighNumber
  : duplicateLowNumber;

jest.setTimeout(testTimeout);
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
    // Duplicate registration between 20k - 50k
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
    // Get program with registrations and validate load time is less than 300ms
    const startTime = performance.now();
    const getProgramResponse = await getProgram(programIdOCW, accessToken);
    const elapsedTime = performance.now() - startTime;
    expect(getProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(elapsedTime).toBeLessThan(200); // 200 ms = 0.2 seconds
    // Change status of all PAs to included
    await updateRegistrationStatusAndLog({
      programId: programIdOCW,
      accessToken,
      status: 'included',
      maxRetryDurationMs,
    });
    // Do the payment with dryRun first
    const paymentDryRunResponse = await createAndStartPayment({
      programId: programIdOCW,
      referenceIds: [],
      accessToken,
      transferValue: amount,
      filter: { dryRun: 'true' },
    });
    expect(paymentDryRunResponse.statusCode).toBe(HttpStatus.OK);
    // Do payment
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdOCW,
      transferValue: amount,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Monitor that 10% of payments is successful and then stop the test
    await getPaymentResults({
      programId: programIdOCW,
      paymentId: doPaymentResponse.body.id,
      accessToken,
      totalAmountPowerOfTwo: duplicateNumber,
      passRate,
      maxRetryDurationMs,
      delayBetweenAttemptsMs,
      verbose: true,
    });
  });
});
