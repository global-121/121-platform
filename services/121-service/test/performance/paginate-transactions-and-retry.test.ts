import { HttpStatus } from '@nestjs/common';
import { env } from 'process';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getTransactionsByPaymentIdPaginated,
  retryPayment,
} from '@121-service/test/helpers/program.helper';
import {
  duplicateRegistrationsAndPaymentData,
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdSafaricom,
  registrationSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

const duplicateNumber = parseInt(env.DUPLICATE_NUMBER || '5'); // cronjob duplicate number should be 2^17 = 131072

const testTimeout = 5_400_000; // 90 minutes

jest.setTimeout(testTimeout);
describe('Retry payment for 100k registrations with Safaricom within expected range and successful rate threshold', () => {
  let accessToken: string;

  it('Setup and do payment', async () => {
    const registration = { ...registrationSafaricom };
    registration.phoneNumber = '254000000000'; // Fail number to force retry

    // Arrange
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
    // Upload registration
    const paymentId = await seedPaidRegistrations(
      [registration],
      programIdSafaricom,
      10,
      [TransactionStatusEnum.error],
    );

    // Change phone number
    await updateRegistration(
      programIdSafaricom,
      registration.referenceId,
      {
        phoneNumber: '254708374149', // Phonenumber that does not fail
      },
      'test reason',
      accessToken,
    );
    // Duplicate registrations
    const mockResponse = await duplicateRegistrationsAndPaymentData({
      powerNumberRegistration: duplicateNumber,
      numberOfPayments: 1,
      accessToken,
      body: {
        secret: env.RESET_SECRET,
      },
    });
    expect(mockResponse.statusCode).toBe(HttpStatus.CREATED);

    // Get one page of transaction to test the duration of the api response
    const getTransactionsStartTime = Date.now();
    const paginatedTransactionsResponse =
      await getTransactionsByPaymentIdPaginated({
        programId: programIdSafaricom,
        accessToken,
        page: 1,
        limit: 10,
        paymentId,
        search: '3', // This is random filter to reduce result set, it seems likely that referenceIds contain '3'
        filter: {
          'filter.registrationReferenceId': '2', // This is random filter to reduce result set, it seems likely that referenceIds contain '2'
        },
      });
    const getTransactionsElapsedTime = Date.now() - getTransactionsStartTime;

    const twoSeconds = 2 * 1000;
    expect(getTransactionsElapsedTime).toBeLessThan(twoSeconds);

    expect(paginatedTransactionsResponse.statusCode).toBe(HttpStatus.OK);

    // Get all transactions to simulate export
    const supportedNumberOrRegistrations = 100_000; // Adjust based on expected supported number
    const getAllTransactionsStartTime = Date.now();
    const allTransactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdSafaricom,
      accessToken,
      paymentId,
      limit: supportedNumberOrRegistrations,
    });
    const allTransactions = allTransactionsResponse.body.data;
    expect(allTransactions.length).toBe(
      Math.min(supportedNumberOrRegistrations, Math.pow(2, duplicateNumber)),
    );
    const getAllTransactionsElapsedTime =
      Date.now() - getAllTransactionsStartTime;

    const twoMinutes = 2 * 60 * 1000;
    expect(getAllTransactionsElapsedTime).toBeLessThan(twoMinutes);

    // Retry payment
    const patchRetryRequestStartTime = Date.now();
    const doPaymentResponse = await retryPayment({
      programId: programIdSafaricom,
      paymentId,
      accessToken,
      filter: { 'filter.status': `${TransactionStatusEnum.error}` },
    });

    const totalTransactions = Math.pow(2, duplicateNumber);
    const patchRetryRequestElapsedTime =
      Date.now() - patchRetryRequestStartTime;
    const fourMinutes = 4 * 60 * 1000;
    expect(patchRetryRequestElapsedTime).toBeLessThan(fourMinutes);
    expect(doPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(totalTransactions);
  });
});
