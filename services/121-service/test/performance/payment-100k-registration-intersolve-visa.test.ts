import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { createAndStartPayment } from '@121-service/test/helpers/program.helper';
import {
  changeRegistrationStatus,
  duplicateRegistrationsAndPaymentData,
  importRegistrations,
  waitForStatusChangeToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { getPaymentResults } from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// For now we decided to test only Safaricom and IntersolveVisa
// The reasoning behind this is that IntersolveVisa has the most complex logic and most API calls
// Safaricom is one of the payment providers which uses callbacks and therefore also has heavier/more complex
// The other FSPs are simpler or similar to Safaricom so we decided to not test them

const PERFORMANCE_TEST_SHARD = 2;
void PERFORMANCE_TEST_SHARD; // Used by CI workflow for test discovery
const duplicateLowNumber = 5;
const duplicateHighNumber = 17; // cronjob duplicate number should be 2^17 = 131072
const maxWaitTimeMs = 240_000; // 4 minutes
const passRate = 10; // 10%
const maxRetryDurationMs = 4_800_000; // 80 minutes
const delayBetweenAttemptsMs = 5_000; // 5 seconds
const transferValue = 25;
const testTimeout = 5_400_000; // 90 minutes
const isPerformanceCronjob =
  // eslint-disable-next-line n/no-process-env -- Required to detect CI environment for performance testing
  process.env.CI === 'true' &&
  // eslint-disable-next-line n/no-process-env -- Required to detect GitHub Actions workflow name
  process.env.GITHUB_WORKFLOW?.includes('Test: Jest Performance Tests Cronjob');
const duplicateNumber = isPerformanceCronjob
  ? duplicateHighNumber
  : duplicateLowNumber;

jest.setTimeout(testTimeout);
describe('Do payment for 100k registrations with Intersolve within expected range and successful rate threshold', () => {
  let accessToken: string;

  it('Setup and do payment', async () => {
    // Arrange
    const startTime = Date.now();
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    // Upload registration
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Change status of this registration to 'included'
    const changeStatusResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    expect(changeStatusResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Wait for all status changes to be processed
    await waitForStatusChangeToComplete({
      programId: programIdOCW,
      amountOfRegistrations: 1,
      status: RegistrationStatusEnum.included,
      maxWaitTimeMs,
      accessToken,
    });
    // Duplicate registration to be more than 100k
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        numberOfPayments: 0,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Do payment
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Assert
    // Check payment results have at least 10% success rate within 80 minutes
    const paymentResults = await getPaymentResults({
      programId: programIdOCW,
      paymentId: doPaymentResponse.body.id,
      accessToken,
      totalAmountPowerOfTwo: duplicateNumber,
      passRate,
      maxRetryDurationMs,
      delayBetweenAttemptsMs,
      verbose: true,
    });
    expect(paymentResults.success).toBe(true);
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(testTimeout);
  });
});
