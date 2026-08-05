import { TestBed } from '@automock/jest';
import Redis from 'ioredis';

import { IntersolveVisaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/fsp-integrations/transaction-queues/transaction-queues.service';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

const mockIntersolveVisaTransactionJobDto: IntersolveVisaTransactionJobDto[] = [
  {
    programId: 3,
    userId: 1,
    transactionId: 3,
    referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
    transferValue: 25,
    isRetry: false,
    bulkSize: 10,
    name: 'mock-fail-create-debit-card',
    addressStreet: 'Straat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: 'A',
    addressPostalCode: '1234AB',
    addressCity: 'Den Haag',
    phoneNumber: '14155238886',
    programFspConfigurationId: 1,
  },
];

const mockSafaricomTransactionJobDto: SafaricomTransactionJobDto[] = [
  {
    programId: 3,
    transactionId: 3,
    referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
    transferValue: 25,
    isRetry: false,
    userId: 1,
    bulkSize: 10,
    phoneNumber: '254708374149',
    idNumber: 'nat-123',
    programFspConfigurationId: 1,
  },
];

describe('TransactionQueuesService', () => {
  let transactionQueuesService: TransactionQueuesService;
  let queuesService: QueuesRegistryService;
  let mockPipeline: { sadd: jest.Mock; exec: jest.Mock };
  let mockRedisClient: { pipeline: jest.Mock };

  beforeEach(() => {
    mockPipeline = {
      sadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    mockRedisClient = {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
    };

    const { unit, unitRef } = TestBed.create(TransactionQueuesService)
      .mock(QueuesRegistryService)
      .using({
        transactionJobIntersolveVisaQueue: {
          addBulk: jest.fn(),
        },
        transactionJobSafaricomQueue: {
          addBulk: jest.fn(),
        },
      })
      .mock<Redis>(REDIS_CLIENT)
      .using(mockRedisClient as unknown as Redis)
      .compile();

    transactionQueuesService = unit;
    queuesService = unitRef.get(QueuesRegistryService);
  });

  it('should be defined', () => {
    expect(transactionQueuesService).toBeDefined();
  });

  it('should add transaction job to queue: intersolve-visa', async () => {
    jest
      .spyOn(queuesService.transactionJobIntersolveVisaQueue as any, 'addBulk')
      .mockResolvedValue([{ id: 1 }]);

    // Act
    await transactionQueuesService.addIntersolveVisaTransactionJobs(
      mockIntersolveVisaTransactionJobDto,
    );

    // Assert
    expect(
      queuesService.transactionJobIntersolveVisaQueue.addBulk,
    ).toHaveBeenCalledTimes(1);
    expect(
      queuesService.transactionJobIntersolveVisaQueue.addBulk,
    ).toHaveBeenCalledWith([
      {
        name: JobNames.default,
        data: mockIntersolveVisaTransactionJobDto[0],
      },
    ]);
  });

  it('should add transaction job to queue: safaricom', async () => {
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'addBulk')
      .mockResolvedValue([{ id: 1 }]);

    // Act
    await transactionQueuesService.addSafaricomTransactionJobs(
      mockSafaricomTransactionJobDto,
    );

    // Assert
    expect(
      queuesService.transactionJobSafaricomQueue.addBulk,
    ).toHaveBeenCalledTimes(1);
    expect(
      queuesService.transactionJobSafaricomQueue.addBulk,
    ).toHaveBeenCalledWith([
      {
        name: JobNames.default,
        data: mockSafaricomTransactionJobDto[0],
      },
    ]);
  });

  it('should pipeline sadd calls in batches of 10,000', async () => {
    const jobCount = 25_000;
    const mockJobs = Array.from({ length: jobCount }, (_, i) => ({
      id: i + 1,
    }));
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'addBulk')
      .mockResolvedValue(mockJobs);
    mockPipeline.exec.mockResolvedValue(
      Array.from({ length: 3 }, () => [null, jobCount]),
    );

    // Act
    await transactionQueuesService.addSafaricomTransactionJobs(
      mockSafaricomTransactionJobDto,
    );

    // Assert
    expect(mockRedisClient.pipeline).toHaveBeenCalledTimes(1);
    expect(mockPipeline.sadd).toHaveBeenCalledTimes(3); // 10k + 10k + 5k
    expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
  });

  it('should make a single sadd call when job count is under batch size', async () => {
    const mockJobs = [{ id: 1 }, { id: 2 }, { id: 3 }];
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'addBulk')
      .mockResolvedValue(mockJobs);
    mockPipeline.exec.mockResolvedValue([[null, 3]]);

    // Act
    await transactionQueuesService.addSafaricomTransactionJobs(
      mockSafaricomTransactionJobDto,
    );

    // Assert
    expect(mockPipeline.sadd).toHaveBeenCalledTimes(1);
    expect(mockPipeline.sadd).toHaveBeenCalledWith(
      'program:3:jobs',
      '1',
      '2',
      '3',
    );
  });

  it('should not call pipeline when there are no job IDs', async () => {
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'addBulk')
      .mockResolvedValue([]);

    // Act
    await transactionQueuesService.addSafaricomTransactionJobs(
      mockSafaricomTransactionJobDto,
    );

    // Assert
    expect(mockRedisClient.pipeline).not.toHaveBeenCalled();
  });

  it('should throw when pipeline exec returns null', async () => {
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'addBulk')
      .mockResolvedValue([{ id: 1 }]);
    mockPipeline.exec.mockResolvedValue(null);

    // Act & Assert
    await expect(
      transactionQueuesService.addSafaricomTransactionJobs(
        mockSafaricomTransactionJobDto,
      ),
    ).rejects.toThrow('pipeline aborted');
  });

  it('should throw when a pipeline command returns an error', async () => {
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'addBulk')
      .mockResolvedValue([{ id: 1 }]);
    mockPipeline.exec.mockResolvedValue([
      [new Error('Redis SADD failed'), null],
    ]);

    // Act & Assert
    await expect(
      transactionQueuesService.addSafaricomTransactionJobs(
        mockSafaricomTransactionJobDto,
      ),
    ).rejects.toThrow('Redis SADD failed');
  });
});
