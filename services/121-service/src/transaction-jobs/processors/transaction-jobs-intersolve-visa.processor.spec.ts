import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { TransactionJobsProcessorIntersolveVisa } from '@121-service/src/transaction-jobs/processors/transaction-jobs-intersolve-visa.processor';
import { TransactionJobsIntersolveVisaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-visa.service';

const mockPaymentJob = {
  id: 11,
  projectId: 3,
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
  // All message processors are the same, so we only test one
  let transactionJobsIntersolveVisaService: jest.Mocked<TransactionJobsIntersolveVisaService>;
  let paymentProcessor: TransactionJobsProcessorIntersolveVisa;
  let redisClient: jest.Mocked<Redis>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsProcessorIntersolveVisa,
    )
      .mock(TransactionJobsIntersolveVisaService)
      .using(transactionJobsIntersolveVisaService)
      .mock(REDIS_CLIENT)
      .using(redisClient)
      .compile();

    paymentProcessor = unit;
    transactionJobsIntersolveVisaService = unitRef.get(
      TransactionJobsIntersolveVisaService,
    );
    redisClient = unitRef.get(REDIS_CLIENT);
  });

  it('should call processIntersolveVisaTransactionJob', async () => {
    // Arrange
    //intersolveVisaService.processQueuedPayment.mockResolvedValue();
    transactionJobsIntersolveVisaService.processIntersolveVisaTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleIntersolveVisaTransactionJob(testJob);

    // Assert
    expect(
      transactionJobsIntersolveVisaService.processIntersolveVisaTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
