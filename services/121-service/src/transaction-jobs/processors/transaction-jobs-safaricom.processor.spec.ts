import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { TransactionJobsProcessorSafaricom } from '@121-service/src/transaction-jobs/processors/transaction-jobs-safaricom.processor';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';

const mockPaymentJob = {
  id: 11,
  projectId: 3,
  paymentNumber: 3,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '254708374149',
  idNumber: 'nat-123',
  registrationProjectId: 2,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let transactionJobsSafaricomService: jest.Mocked<TransactionJobsSafaricomService>;
  let paymentProcessor: TransactionJobsProcessorSafaricom;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TransactionJobsProcessorSafaricom)
      .mock(TransactionJobsSafaricomService)
      .using(transactionJobsSafaricomService)
      .compile();

    paymentProcessor = unit;
    transactionJobsSafaricomService = unitRef.get(
      TransactionJobsSafaricomService,
    );
  });

  it('should call processSafaricomTransactionJob', async () => {
    // Arrange
    transactionJobsSafaricomService.processSafaricomTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleSafaricomTransactionJob(testJob);

    // Assert
    expect(
      transactionJobsSafaricomService.processSafaricomTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
