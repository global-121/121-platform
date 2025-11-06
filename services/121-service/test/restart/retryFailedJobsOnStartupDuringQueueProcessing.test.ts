import { HttpStatus } from '@nestjs/common';
import { env } from 'process';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
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
import {
  kill121Service,
  waitForServiceToBeUp,
} from '@121-service/test/restart/helpers/restart.helper';

// The test set up and its enviroment differs a bit from all other integration and performance tests. The configuration of this test is explained in the wiki page linked below.
// See: https://github.com/global-121/121-platform/wiki/Integration-tests/#exception-running-retryfailedjobsonstartupduringqueueprocessingtestts

const duplicateNumber = 5; // 2^5 = 32
const maxWaitTimeMs = 5_000; // 5 seconds
const passRate = 100; // 100%
const maxRetryDurationMs = 30_000; // 30 seconds
const delayBetweenAttemptsMs = 3_000; // 3 seconds
const transferValue = 25;
const testTimeout = 50_000; // 50 seconds

jest.setTimeout(testTimeout);
describe('Retry Failed Jobs On Startup During Queue Processing', () => {
  let accessToken: string;

  it('Setup, do payment, kill service and restart', async () => {
    // Arrange
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
    // Duplicate registration to be 32
    const duplicateRegistrationsResponse = await duplicateRegistrations({
      powerNumberRegistration: duplicateNumber,
      accessToken,
      body: {
        secret: env.RESET_SECRET,
      },
    });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Do payment
    const doPaymentResponse = await doPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Wait long enough so that jobs are added to the queue but not finished processing
    await waitFor(2_000);
    // Kill 121 service to simulate crash during queue processing
    void kill121Service().catch(() => {
      // Ignore error of the service being killed that causes: 'Error: socket hang up'
    });
    // Wait for service to be back up
    await waitForServiceToBeUp();
    // Assert
    // Check payment results to have 100% success rate
    const paymentResults = await getPaymentResults({
      programId: programIdOCW,
      paymentId: 1,
      accessToken,
      totalAmountPowerOfTwo: duplicateNumber,
      passRate,
      maxRetryDurationMs,
      delayBetweenAttemptsMs,
      verbose: true,
    });

    expect(paymentResults.success).toBe(true);
  });
});
