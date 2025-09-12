import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationAHWhatsapp } from '@121-service/src/seed-data/mock/registration-pv.data';
import {
  getPaymentSummary,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

// Context
const seedScript = SeedScript.nlrcMultiple;
const programId = 2;

const registrationSuccess = {
  ...registrationAHWhatsapp,
  referenceId: 'ref-success',
  fullName: 'Success Payment',
};
const registrationError1 = {
  ...registrationAHWhatsapp,
  whatsappPhoneNumber: '15005550001', // number that will always cause an error
  referenceId: 'ref-error1',
  fullName: 'Error Payment 1',
};

const registrationError2 = {
  ...registrationAHWhatsapp,
  whatsappPhoneNumber: '16005550006', // number that will always cause an error
  referenceId: 'ref-error2',
  fullName: 'Error Payment 2',
};

const registrationWaiting = {
  ...registrationAHWhatsapp,
  whatsappPhoneNumber: '16005550002', // number that will always cause a waiting status
  referenceId: 'ref-waiting',
  fullName: 'Waiting Payment',
};
describe('Do payment retry', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(seedScript, __filename);
    accessToken = await getAccessToken();
  });

  it('should thrown an error if payment does not exist yet', async () => {
    // Arrange
    await seedPaidRegistrations([registrationSuccess], programId);

    // Act
    const nonExistingPaymentId = 9999;
    const retryResponse = await retryPayment({
      programId,
      paymentId: nonExistingPaymentId,
      accessToken,
    });

    // Assert
    expect(retryResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(retryResponse.body).toMatchSnapshot();
  });

  it('should thrown an error if payment has no failed transactions', async () => {
    // Arrange
    const successfulPaymentId = await seedPaidRegistrations(
      [registrationSuccess],
      programId,
    );

    // Act
    const retryResponse = await retryPayment({
      programId,
      paymentId: successfulPaymentId,
      accessToken,
    });

    // Assert
    expect(retryResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(retryResponse.body).toMatchSnapshot();
  });

  it('should retry all failed transactions if no referenceId filter is used', async () => {
    // Arrange
    const amount = 230;
    const paymentId = await seedPaidRegistrations(
      [registrationSuccess, registrationError1, registrationWaiting],
      programId,
      amount,
      Object.values(TransactionStatusEnum),
    );

    // Act
    await updateRegistration(
      programId,
      registrationError1.referenceId,
      { whatsappPhoneNumber: '14155238889' }, // change to a number that will succeed
      'test',
      accessToken,
    );

    const paymentAggregatesBeforeRetry = await getPaymentSummary({
      programId,
      paymentId,
      accessToken,
    });

    // Do retry without filter
    const retryResponse = await retryPayment({
      programId,
      paymentId,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationError1.referenceId],
      paymentId,
      accessToken,
      maxWaitTimeMs: 5000,
      completeStatusses: [TransactionStatusEnum.success],
    });

    const paymentAggregatesAfterRetry = await getPaymentSummary({
      programId,
      paymentId,
      accessToken,
    });

    // Assert
    // Only the failed transaction should be retried
    expect(retryResponse.status).toBe(HttpStatus.OK);
    expect(retryResponse.body.applicableCount).toBe(1);
    expect(retryResponse.body.totalFilterCount).toBe(1);

    // Verify that only the failed transaction is retried and now succeeded
    expect(paymentAggregatesBeforeRetry.body).toMatchObject({
      success: { count: 1, amount },
      failed: { count: 1, amount },
      waiting: { count: 1, amount },
    });
    expect(paymentAggregatesAfterRetry.body).toMatchObject({
      success: { count: 2, amount: amount * 2 },
      failed: { count: 0, amount: 0 },
      waiting: { count: 1, amount },
    });
  });

  it('should retry only the failed transaction for the specified referenceId', async () => {
    // Arrange
    const amount = 230;
    const paymentId = await seedPaidRegistrations(
      [registrationSuccess, registrationError1, registrationError2],
      programId,
      amount,
      [TransactionStatusEnum.success, TransactionStatusEnum.error],
    );

    const paymentAggregatesBeforeRetry = await getPaymentSummary({
      programId,
      paymentId,
      accessToken,
    });

    // Act
    await updateRegistration(
      programId,
      registrationError1.referenceId,
      { whatsappPhoneNumber: '14155238889' }, // change to a number that will succeed
      'test',
      accessToken,
    );
    await updateRegistration(
      programId,
      registrationError2.referenceId,
      { whatsappPhoneNumber: '14155238887' }, // change to a number that will succeed
      'test',
      accessToken,
    );

    // // Do retry with filter on referenceId of registrationError1
    const retryResponse = await retryPayment({
      programId,
      paymentId,
      accessToken,
      referenceIds: [registrationError1.referenceId],
    });

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationError1.referenceId],
      paymentId,
      accessToken,
      maxWaitTimeMs: 5000,
      completeStatusses: [TransactionStatusEnum.success],
    });

    const paymentAggregatesAfterRetry = await getPaymentSummary({
      programId,
      paymentId,
      accessToken,
    });

    // // Assert
    // // Only the failed transaction should be retried
    expect(retryResponse.status).toBe(HttpStatus.OK);
    expect(retryResponse.body.applicableCount).toBe(1);
    expect(retryResponse.body.totalFilterCount).toBe(1);

    // Verify that only the failed transaction for registrationError1 is retried and now succeeded, while registrationError2 is still failed
    expect(paymentAggregatesBeforeRetry.body).toMatchObject({
      success: { count: 1, amount },
      failed: { count: 2, amount: amount * 2 },
    });
    expect(paymentAggregatesAfterRetry.body).toMatchObject({
      success: { count: 2, amount: amount * 2 },
      failed: { count: 1, amount },
    });
  });

  it('should thrown an error if referenceId filter is used but no failed transactions found for that referenceId', async () => {
    // Arrange
    const amount = 230;
    const paymentId = await seedPaidRegistrations(
      [registrationSuccess, registrationError1],
      programId,
      amount,
      [TransactionStatusEnum.success, TransactionStatusEnum.error],
    );

    // Act
    // Do retry with filter on referenceId of registrationSuccess (which has no failed transaction)
    const retryResponse = await retryPayment({
      programId,
      paymentId,
      accessToken,
      referenceIds: [registrationSuccess.referenceId],
    });

    // Assert
    expect(retryResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(retryResponse.body).toMatchSnapshot();
  });
});
