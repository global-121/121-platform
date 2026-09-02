import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
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
import { isHighDataVolume } from '@121-service/test/performance/helpers/high-data-volume.helper';
import {
  programIdSafaricom,
  registrationSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

// Timing configuration
const testTimeout = 5_400_000; // 90 minutes
const maximumPaginatedTransactionsResponseTime = 2_000; // Performance assertion limit for one paginated page of transactions, 2 seconds
const maximumAllTransactionsResponseTime = 120_000; // Performance assertion limit for fetching all transactions, 2 minutes
const maximumRetryPaymentResponseTime = 240_000; // Performance assertion limit for the retry payment request, 4 minutes

// Performance test configuration
const duplicateLowNumber = 5;
const duplicateHighNumber = 17; // cronjob duplicate number should be 2^17 = 131072

const duplicateNumber = isHighDataVolume
  ? duplicateHighNumber
  : duplicateLowNumber;

jest.setTimeout(testTimeout);

describe('Retry payment for 100k registrations with Safaricom within expected range and successful rate threshold', () => {
  it('get transactions with filter and for export and retry', async () => {
    const registration = { ...registrationSafaricom };
    registration.phoneNumber = '254000000000'; // Fail number to force retry

    // Arrange
    await resetDB({ seedScript: SeedScript.safaricomProgram });
    const accessToken = await getAccessToken();

    // Upload registration
    const paymentId = await seedPaidRegistrations({
      registrations: [registration],
      programId: programIdSafaricom,
      transferValue: 10,
      completeStatuses: [TransactionStatusEnum.error],
    });

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
    const getTransactionsStartTime = performance.now();
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
    const getTransactionsElapsedTime =
      performance.now() - getTransactionsStartTime;

    expect(getTransactionsElapsedTime).toBeLessThan(
      maximumPaginatedTransactionsResponseTime,
    );

    expect(paginatedTransactionsResponse.statusCode).toBe(HttpStatus.OK);

    // Get all transactions to simulate export
    // TODO AB#39419: the exports are not using this paginated endpoint yet, this needs to be addressed
    const supportedNumberOrRegistrations = 100_000; // Adjust based on expected supported number
    const getAllTransactionsStartTime = performance.now();

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
      performance.now() - getAllTransactionsStartTime;

    expect(getAllTransactionsElapsedTime).toBeLessThan(
      maximumAllTransactionsResponseTime,
    );

    // Retry payment
    const patchRetryRequestStartTime = performance.now();
    const retryPaymentResponse = await retryPayment({
      programId: programIdSafaricom,
      paymentId,
      accessToken,
      filter: { 'filter.status': `${TransactionStatusEnum.error}` },
    });

    const totalTransactions = Math.pow(2, duplicateNumber);
    const patchRetryRequestElapsedTime =
      performance.now() - patchRetryRequestStartTime;

    expect(patchRetryRequestElapsedTime).toBeLessThan(
      maximumRetryPaymentResponseTime,
    );
    expect(retryPaymentResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(retryPaymentResponse.body.applicableCount).toBe(totalTransactions);
  });
});
