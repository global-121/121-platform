import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { TransactionJobProcessorNedbank } from '@121-service/src/transaction-job-processors/processors/transaction-job-nedbank.processor';
import { TransactionJobProcessorsNedbankService } from '@121-service/src/transaction-job-processors/services/transaction-job-processors-nedbank.service';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const mockPaymentJob: NedbankTransactionJobDto = {
  programId: 3,
  userId: 1,
  paymentNumber: 3,
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  transactionAmount: 25,
  isRetry: false,
  bulkSize: 10,
  phoneNumber: registrationNedbank.phoneNumber,
  programFspConfigurationId: 1,
};
const testJob = { data: mockPaymentJob } as Job;

describe('TransactionJobProcessorNedbank', () => {
  let transactionJobProcessorsNedbankService: jest.Mocked<TransactionJobProcessorsNedbankService>;
  let processor: TransactionJobProcessorNedbank;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks(); // To esnure the call count is not influenced by other tests

    const { unit, unitRef } = TestBed.create(TransactionJobProcessorNedbank)
      .mock(TransactionJobProcessorsNedbankService)
      .using(transactionJobProcessorsNedbankService)
      .mock(REDIS_CLIENT)
      .using(redisClient)
      .compile();

    processor = unit;
    transactionJobProcessorsNedbankService = unitRef.get(
      TransactionJobProcessorsNedbankService,
    );
    redisClient = unitRef.get(REDIS_CLIENT);
  });

  it('should call processNedbankTransactionJob and remove job from Redis set', async () => {
    // Arrange
    transactionJobProcessorsNedbankService.processNedbankTransactionJob.mockResolvedValue();

    // Act
    await processor.handleNedbankTransactionJob(testJob);

    // Assert
    expect(
      transactionJobProcessorsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledTimes(1);
    expect(
      transactionJobProcessorsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledWith(mockPaymentJob);

    expect(redisClient.srem).toHaveBeenCalledTimes(1);
  });

  it('should handle errors and still remove job from Redis set', async () => {
    // Arrange
    const error = new Error('Test error');
    transactionJobProcessorsNedbankService.processNedbankTransactionJob.mockRejectedValue(
      error,
    );

    // Act & Assert
    await expect(
      processor.handleNedbankTransactionJob(testJob),
    ).rejects.toThrow(error);
    expect(
      transactionJobProcessorsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledTimes(1);
    expect(
      transactionJobProcessorsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledWith(mockPaymentJob);
    expect(redisClient.srem).toHaveBeenCalledTimes(1);
  });
});
