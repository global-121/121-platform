import { TransactionJobProcessorSafaricom } from '@121-service/src/transaction-job-processors/processors/transaction-job-safaricom.processor';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { TestBed } from '@automock/jest';
import { Job } from 'bull';

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
