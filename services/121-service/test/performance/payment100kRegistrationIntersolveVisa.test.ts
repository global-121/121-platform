import { HttpStatus } from '@nestjs/common';

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

const duplicateCount = 17; // 2^17 = 131072
const duplicateTarget = Math.pow(2, duplicateCount);

jest.setTimeout(4_800_000); // 80 minutes
describe('Find duplicates in 100k registrations within expected range', () => {
  let accessToken: string;

  it('Should find duplicates within time threshold', async () => {
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
      duplicateCount,
      accessToken,
      {
        secret: 'fill_in_secret',
      },
    ); // 2^17 = 131072
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
      240_000,
      RegistrationStatusEnum.included,
    );
    // Do payment
    const doPaymentResponse = await doPayment({
      programId: programIdOCW,
      amount: 25,
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
      totalAmountPowerOfTwo: duplicateCount,
      passRate: 10,
      maxRetryDurationMs: 4_790_000,
      delayBetweenAttemptsMs: 5_000,
      verbose: true,
    });
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(4_800_000); // 80 minutes
  });
});
