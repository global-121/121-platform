import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from 'ioredis';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqApiCallbackStatusCode } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-callback-status-code.enum';
import { OnafriqTransactionCallbackDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback.dto';
import { OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

describe('OnafriqReconciliationService', () => {
  let onafriqReconciliationService: OnafriqReconciliationService;
  let redisClient: Redis;
  let queuesService: QueuesRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnafriqReconciliationService,
        {
          provide: QueuesRegistryService,
          useValue: {
            onafriqTransactionCallbackQueue: {
              add: jest.fn(),
            },
          },
        },
        {
          provide: getScopedRepositoryProviderName(OnafriqTransactionEntity),
          useValue: {},
        },
        {
          provide: TransactionScopedRepository,
          useValue: {},
        },
        {
          provide: REDIS_CLIENT,
          useValue: {
            sadd: jest.fn(),
          },
        },
      ],
    }).compile();

    onafriqReconciliationService = module.get<OnafriqReconciliationService>(
      OnafriqReconciliationService,
    );
    queuesService = module.get<QueuesRegistryService>(QueuesRegistryService);
    redisClient = module.get<Redis>(REDIS_CLIENT);
  });

  describe('processTransferCallback', () => {
    it('should add job to onafriqTransferCallbackQueue and update Redis', async () => {
      const mockCallback: OnafriqTransactionCallbackDto = {
        thirdPartyTransId: 'third-party-trans-id',
        status: {
          code: OnafriqApiCallbackStatusCode.success,
          message: 'success',
        },
      };

      const mockJob = {
        id: 'job-id',
        data: { programId: 1 },
      };

      jest.spyOn(redisClient, 'sadd').mockResolvedValue(1);
      jest
        .spyOn(queuesService.onafriqTransactionCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await onafriqReconciliationService.processTransactionCallback(
        mockCallback,
      );

      expect(
        queuesService.onafriqTransactionCallbackQueue.add,
      ).toHaveBeenCalledWith(JobNames.default, {
        statusCode: mockCallback.status.code,
        statusMessage: mockCallback.status.message,
        thirdPartyTransId: mockCallback.thirdPartyTransId,
      });

      expect(redisClient.sadd).toHaveBeenCalledWith(
        getRedisSetName(mockJob.data.programId),
        mockJob.id,
      );
    });
  });
});
