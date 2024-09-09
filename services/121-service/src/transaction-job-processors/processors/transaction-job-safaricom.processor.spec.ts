import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { TransactionJobProcessorSafaricom } from '@121-service/src/transaction-job-processors/processors/transaction-job-safaricom.processor';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';

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
  let transactionJobProcessorsService: jest.Mocked<TransactionJobProcessorsService>;
  let paymentProcessor: TransactionJobProcessorSafaricom;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TransactionJobProcessorSafaricom)
      .mock(TransactionJobProcessorsService)
      .using(transactionJobProcessorsService)
      .compile();

    paymentProcessor = unit;
    transactionJobProcessorsService = unitRef.get(
      TransactionJobProcessorsService,
    );
  });

  it('should call processSafaricomTransactionJob', async () => {
    // Arrange
    transactionJobProcessorsService.processSafaricomTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleSafaricomTransactionJob(testJob);

    // Assert
    expect(
      transactionJobProcessorsService.processSafaricomTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
