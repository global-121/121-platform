import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { TransactionJobProcessorSafaricom } from '@121-service/src/transaction-job-processors/processors/transaction-job-safaricom.processor';
import { TransactionJobProcessorsSafaricomService } from '@121-service/src/transaction-job-processors/services/transaction-job-processors-safaricom.service';

const mockPaymentJob = {
  id: 11,
  programId: 3,
  paymentNumber: 3,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '254708374149',
  idNumber: 'nat-123',
  registrationProgramId: 2,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let transactionJobProcessorsSafaricomService: jest.Mocked<TransactionJobProcessorsSafaricomService>;
  let paymentProcessor: TransactionJobProcessorSafaricom;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TransactionJobProcessorSafaricom)
      .mock(TransactionJobProcessorsSafaricomService)
      .using(transactionJobProcessorsSafaricomService)
      .compile();

    paymentProcessor = unit;
    transactionJobProcessorsSafaricomService = unitRef.get(
      TransactionJobProcessorsSafaricomService,
    );
  });

  it('should call processSafaricomTransactionJob', async () => {
    // Arrange
    transactionJobProcessorsSafaricomService.processSafaricomTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleSafaricomTransactionJob(testJob);

    // Assert
    expect(
      transactionJobProcessorsSafaricomService.processSafaricomTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
