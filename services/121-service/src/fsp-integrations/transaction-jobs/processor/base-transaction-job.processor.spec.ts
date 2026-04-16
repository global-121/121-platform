import { Job } from 'bull';
import Redis from 'ioredis';

import { BaseTransactionJobProcessor } from '@121-service/src/fsp-integrations/transaction-jobs/processor/base-transaction-job.processor';
import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/transaction-job-service.interface';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const mockPaymentJob = {
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
const testJob = { data: mockPaymentJob, id: 'test-job-id' } as unknown as Job;

describe('BaseTransactionJobProcessor', () => {
  let mockService: jest.Mocked<TransactionJobService>;
  let mockRedisClient: jest.Mocked<Pick<Redis, 'srem'>>;
  let processor: BaseTransactionJobProcessor;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      processTransactionJob: jest.fn(),
    };
    mockRedisClient = {
      srem: jest.fn().mockResolvedValue(1),
    };

    class TestProcessor extends BaseTransactionJobProcessor {}
    processor = new TestProcessor(
      mockService,
      mockRedisClient as unknown as Redis,
    );
  });

  it('should call processTransactionJob and remove job from Redis set', async () => {
    // Arrange
    mockService.processTransactionJob.mockResolvedValue();

    // Act
    await processor.handleTransactionJob(testJob);

    // Assert
    expect(mockService.processTransactionJob).toHaveBeenCalledTimes(1);
    expect(mockService.processTransactionJob).toHaveBeenCalledWith(
      mockPaymentJob,
    );
    expect(mockRedisClient.srem).toHaveBeenCalledTimes(1);
  });

  it('should handle errors and still remove job from Redis set', async () => {
    // Arrange
    const error = new Error('Test error');
    mockService.processTransactionJob.mockRejectedValue(error);

    // Act & Assert
    await expect(processor.handleTransactionJob(testJob)).rejects.toThrow(
      error,
    );
    expect(mockService.processTransactionJob).toHaveBeenCalledTimes(1);
    expect(mockService.processTransactionJob).toHaveBeenCalledWith(
      mockPaymentJob,
    );
    expect(mockRedisClient.srem).toHaveBeenCalledTimes(1);
  });
});
