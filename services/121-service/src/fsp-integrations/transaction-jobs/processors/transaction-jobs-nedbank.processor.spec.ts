import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import Redis from 'ioredis';

import { TransactionJobsProcessorNedbank } from '@121-service/src/fsp-integrations/transaction-jobs/processors/transaction-jobs-nedbank.processor';
import { TransactionJobsNedbankService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-nedbank.service';
import { NedbankTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/nedbank-transaction-job.dto';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const mockPaymentJob: NedbankTransactionJobDto = {
  programId: 3,
  userId: 1,
  transactionId: 3,
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  transferValue: 25,
  isRetry: false,
  bulkSize: 10,
  phoneNumber: registrationNedbank.phoneNumber,
  programFspConfigurationId: 1,
};
const testJob = { data: mockPaymentJob } as Job;

// This processor code is the same for every FSP, so we only need to test one of them
// REFACTOR: move common code into helper file, and put the unit test on that that one
describe('TransactionJobsProcessorNedbank', () => {
  let transactionJobsNedbankService: jest.Mocked<TransactionJobsNedbankService>;
  let processor: TransactionJobsProcessorNedbank;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks(); // To ensure the call count is not influenced by other tests

    const { unit, unitRef } = TestBed.create(TransactionJobsProcessorNedbank)
      .mock(TransactionJobsNedbankService)
      .using(transactionJobsNedbankService)
      .mock(REDIS_CLIENT)
      .using(redisClient)
      .compile();

    processor = unit;
    transactionJobsNedbankService = unitRef.get(TransactionJobsNedbankService);
    redisClient = unitRef.get(REDIS_CLIENT);
  });

  it('should call processNedbankTransactionJob and remove job from Redis set', async () => {
    // Arrange
    transactionJobsNedbankService.processNedbankTransactionJob.mockResolvedValue();

    // Act
    await processor.handleNedbankTransactionJob(testJob);

    // Assert
    expect(
      transactionJobsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledTimes(1);
    expect(
      transactionJobsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledWith(mockPaymentJob);

    expect(redisClient.srem).toHaveBeenCalledTimes(1);
  });

  it('should handle errors and still remove job from Redis set', async () => {
    // Arrange
    const error = new Error('Test error');
    transactionJobsNedbankService.processNedbankTransactionJob.mockRejectedValue(
      error,
    );

    // Act & Assert
    await expect(
      processor.handleNedbankTransactionJob(testJob),
    ).rejects.toThrow(error);
    expect(
      transactionJobsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledTimes(1);
    expect(
      transactionJobsNedbankService.processNedbankTransactionJob,
    ).toHaveBeenCalledWith(mockPaymentJob);
    expect(redisClient.srem).toHaveBeenCalledTimes(1);
  });
});
