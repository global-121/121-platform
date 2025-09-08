import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { TransactionJobsProcessorExcel } from '@121-service/src/transaction-jobs/processors/transaction-jobs-excel.processor';
import { TransactionJobsExcelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-excel.service';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';

const mockPaymentJob: ExcelTransactionJobDto = {
  programId: 1,
  paymentId: 1,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 1,
  phoneNumber: '254708374149',
  programFspConfigurationId: 1,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  let transactionJobsExcelService: jest.Mocked<TransactionJobsExcelService>;
  let paymentProcessor: TransactionJobsProcessorExcel;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TransactionJobsProcessorExcel)
      .mock(TransactionJobsExcelService)
      .using(transactionJobsExcelService)
      .compile();

    paymentProcessor = unit;
    transactionJobsExcelService = unitRef.get(TransactionJobsExcelService);
  });

  it('should call processExcelTransactionJob', async () => {
    // Arrange
    transactionJobsExcelService.processExcelTransactionJob.mockResolvedValue();

    // Act
    await paymentProcessor.handleExcelTransactionJob(testJob);

    // Assert
    expect(
      transactionJobsExcelService.processExcelTransactionJob,
    ).toHaveBeenCalledTimes(1);
  });
});
