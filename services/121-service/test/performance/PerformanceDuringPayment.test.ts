import { HttpStatus } from '@nestjs/common';
import { env } from 'process';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { createAndStartPayment } from '@121-service/test/helpers/program.helper';
import {
  duplicateRegistrations,
  exportRegistrations,
  seedRegistrationsWithStatus,
  sendMessage,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { getPaymentResults } from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateNumber = parseInt(env.DUPLICATE_NUMBER || '5'); // cronjob duplicate number should be 2^15 = 32768
const passRate = 50; // 50%
const maxRetryDurationMs = 4_800_000; // 80 minutes
const amount = 25;
const testTimeout = 5_400_000; // 90 minutes

jest.setTimeout(testTimeout);
describe('Measure performance during payment', () => {
  let accessToken: string;
  it('Setup and do payment', async () => {
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
    const duplicateRegistrationsResponse = await duplicateRegistrations({
      powerNumberRegistration: duplicateNumber,
      accessToken,
      body: {
        secret: env.RESET_SECRET,
      },
    });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Do payment
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdOCW,
      transferValue: amount,
      referenceIds: [],
      accessToken,
    });
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    // Assert
    // Check payment results have at least 50% success rate within 60 minutes
    await getPaymentResults({
      programId: programIdOCW,
      paymentId: 1,
      accessToken,
      totalAmountPowerOfTwo: duplicateNumber,
      passRate,
      maxRetryDurationMs,
      verbose: true,
    });
    // When payment is still ongoing get export list and send bulk message
    // Get export list
    const getExportListResponse = await exportRegistrations(
      programIdOCW,
      'preferredLanguage',
      accessToken,
    );
    expect(getExportListResponse.statusCode).toBe(HttpStatus.OK);
    // Send bulk message
    const bulkMessageResponse = await sendMessage(
      accessToken,
      programIdOCW,
      [],
      'Your voucher can be picked up at the location',
    );
    expect(bulkMessageResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(testTimeout);
  });
});
