import { HttpStatus } from '@nestjs/common';
import { env } from 'process';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  changeRegistrationStatus,
  duplicateRegistrations,
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

const duplicateNumber = parseInt(env.DUPLICATE_NUMBER || '5'); // cronjob duplicate number should be 2^17 = 131072
const duplicateTarget = Math.pow(2, duplicateNumber);
const maxWaitTimeMs = 240_000; // 4 minutes
const passRate = 10; // 10%
const maxRetryDurationMs = 4_800_000; // 80 minutes
const delayBetweenAttemptsMs = 5_000; // 5 seconds
const amount = 25;
const testTimeout = 5_400_000; // 90 minutes

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
    // Duplicate registration to be more than 100k
    const duplicateRegistrationsResponse = await duplicateRegistrations(
      duplicateNumber,
      accessToken,
      {
        secret: env.RESET_SECRET,
      },
    );
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Change status of all registrations to 'included'
    const changeStatusResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    expect(changeStatusResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Wait for all status changes to be processed
    await waitForStatusChangeToComplete(
      programIdOCW,
      duplicateTarget,
      accessToken,
      maxWaitTimeMs,
      RegistrationStatusEnum.included,
    );
    // Do payment
    const doPaymentResponse = await doPayment({
      programId: programIdOCW,
      amount,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Assert
    // Check payment results have at least 10% success rate within 80 minutes
    await getPaymentResults({
      programId: programIdOCW,
      paymentId: 1,
      accessToken,
      totalAmountPowerOfTwo: duplicateNumber,
      passRate,
      maxRetryDurationMs,
      delayBetweenAttemptsMs,
      verbose: true,
    });
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(testTimeout);
  });
});
