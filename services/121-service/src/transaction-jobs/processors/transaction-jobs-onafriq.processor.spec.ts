import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { TransactionJobsProcessorOnafriq } from '@121-service/src/transaction-jobs/processors/transaction-jobs-onafriq.processor';
import { TransactionJobsOnafriqService } from '@121-service/src/transaction-jobs/services/transaction-jobs-onafriq.service';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';

const mockPaymentJob: OnafriqTransactionJobDto = {
  projectId: 1,
  paymentId: 1,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 1,
  phoneNumber: '254708374149',
  firstName: 'Jane',
  lastName: 'Doe',
  projectFspConfigurationId: 1,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  let transactionJobsOnafriqService: jest.Mocked<TransactionJobsOnafriqService>;
  let paymentProcessor: TransactionJobsProcessorOnafriq;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TransactionJobsProcessorOnafriq)
      .mock(TransactionJobsOnafriqService)
      .using(transactionJobsOnafriqService)
      .compile();

    paymentProcessor = unit;
    transactionJobsOnafriqService = unitRef.get(TransactionJobsOnafriqService);
  });

  it('should call processOnafriqTransactionJob', async () => {
    // Arrange
    transactionJobsOnafriqService.processOnafriqTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleOnafriqTransactionJob(testJob);

    // Assert
    expect(
      transactionJobsOnafriqService.processOnafriqTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
