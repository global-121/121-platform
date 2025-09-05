import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { TransactionJobsProcessorIntersolveVoucher } from '@121-service/src/transaction-jobs/processors/transaction-jobs-intersolve-voucher.processor';
import { TransactionJobsIntersolveVoucherService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-voucher.service';

const mockPaymentJob = {
  id: 11,
  programId: 3,
  userId: 1,
  paymentNumber: 3,
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  transactionAmount: 25,
  isRetry: false,
  bulkSize: 10,
  name: 'mock-fail-create-debit-card',
  addressStreet: 'Straat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: 'A',
  addressPostalCode: '1234AB',
  addressCity: 'Den Haag',
  phoneNumber: '14155238886',
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  let transactionJobsIntersolveVoucherService: jest.Mocked<TransactionJobsIntersolveVoucherService>;
  let paymentProcessor: TransactionJobsProcessorIntersolveVoucher;
  let redisClient: jest.Mocked<Redis>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsProcessorIntersolveVoucher,
    )
      .mock(TransactionJobsIntersolveVoucherService)
      .using(transactionJobsIntersolveVoucherService)
      .mock(REDIS_CLIENT)
      .using(redisClient)
      .compile();

    paymentProcessor = unit;
    transactionJobsIntersolveVoucherService = unitRef.get(
      TransactionJobsIntersolveVoucherService,
    );
    redisClient = unitRef.get(REDIS_CLIENT);
  });

  it('should call processIntersolveVoucherTransactionJob', async () => {
    // Arrange
    transactionJobsIntersolveVoucherService.processIntersolveVoucherTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleIntersolveVoucherTransactionJob(testJob);

    // Assert
    expect(
      transactionJobsIntersolveVoucherService.processIntersolveVoucherTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
