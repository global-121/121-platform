import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  duplicateRegistrations,
  seedRegistrationsWithStatus,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  getPaymentResults,
  isServiceUp,
  kill121Service,
} from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateCount = 7; // 2^7 = 128

jest.setTimeout(3_600_000); // 60 minutes
describe('Retry failed jobs on startup during queue processing', () => {
  let accessToken: string;
  it('Retry failed jobs on startup', async () => {
    // Arrange
    const startTime = Date.now();
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    // Upload registration
    const importRegistrationResponse = await seedRegistrationsWithStatus(
      [registrationVisa],
      programIdOCW,
      accessToken,
      RegistrationStatusEnum.included,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Duplicate registration
    const duplicateRegistrationsResponse = await duplicateRegistrations(
      duplicateCount,
      accessToken,
      {
        secret: 'fill_in_secret',
      },
    ); // 2^7 = 128
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Do payment
    const doPaymentResponse = await doPayment({
      programId: programIdOCW,
      amount: 25,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Assert
    // Wait long enough so that jobs are added to the queue, but not so long that all are processed already
    await getPaymentResults({
      programId: programIdOCW,
      paymentId: 1,
      accessToken,
      totalAmountPowerOfTwo: duplicateCount,
      passRate: 1,
      maxRetryDurationMs: 5_000,
      delayBetweenAttemptsMs: 1_000,
      verbose: true,
    });
    // Kill 121-service to simulate crash
    await kill121Service({ secret: 'fill_in_secret' });
    // Restart 121-service
    let serviceUp = false;
    while (!serviceUp) {
      // Wait until service is up
      // eslint-disable-next-line no-await-in-loop
      await waitFor(1_000);
      const isServiceUpResponse = await isServiceUp();
      serviceUp = isServiceUpResponse.statusCode === HttpStatus.OK;
    }
    // expect(isServiceUpResponse).toBe(HttpStatus.OK);
    // Monitor that 100% of payments is successful
    await getPaymentResults({
      programId: programIdOCW,
      paymentId: 1,
      accessToken,
      totalAmountPowerOfTwo: duplicateCount,
      passRate: 100,
      maxRetryDurationMs: 10_000,
      delayBetweenAttemptsMs: 2_000,
      verbose: true,
    });
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(3_600_000); // 60 minutes
  });
});
