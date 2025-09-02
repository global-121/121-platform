import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from 'ioredis';

import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-timeout-callback.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-transfer-callback.dto';
import { SafaricomReconciliationService } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

describe('SafaricomReconciliationService', () => {
  let safaricomReconciliationService: SafaricomReconciliationService;
  let redisClient: Redis;
  let queuesService: QueuesRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafaricomReconciliationService,
        {
          provide: QueuesRegistryService,
          useValue: {
            safaricomTransferCallbackQueue: {
              add: jest.fn(),
            },
            safaricomTimeoutCallbackQueue: {
              add: jest.fn(),
            },
          },
        },
        {
          provide: SafaricomTransferScopedRepository,
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

    safaricomReconciliationService = module.get<SafaricomReconciliationService>(
      SafaricomReconciliationService,
    );
    queuesService = module.get<QueuesRegistryService>(QueuesRegistryService);
    redisClient = module.get<Redis>(REDIS_CLIENT);
  });

  describe('processTransferCallback', () => {
    it('should add job to safaricomTransferCallbackQueue and update Redis', async () => {
      const mockCallback: SafaricomTransferCallbackDto = {
        Result: {
          OriginatorConversationID: 'originator-conversation-id',
          ConversationID: 'conversation-id',
          TransactionID: 'transaction-id',
          ResultCode: 0,
          ResultDesc: 'Success',
        },
      };

      const mockJob = {
        id: 'job-id',
        data: { programId: 3 },
      };

      jest.spyOn(redisClient, 'sadd').mockResolvedValue(1);
      jest
        .spyOn(queuesService.safaricomTransferCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await safaricomReconciliationService.processTransferCallback(
        mockCallback,
      );

      expect(
        queuesService.safaricomTransferCallbackQueue.add,
      ).toHaveBeenCalledWith(JobNames.default, {
        originatorConversationId: mockCallback.Result.OriginatorConversationID,
        mpesaConversationId: mockCallback.Result.ConversationID,
        mpesaTransactionId: mockCallback.Result.TransactionID,
        resultCode: mockCallback.Result.ResultCode,
        resultDescription: mockCallback.Result.ResultDesc,
      });

      expect(redisClient.sadd).toHaveBeenCalledWith(
        getRedisSetName(mockJob.data.programId),
        mockJob.id,
      );
    });
  });

  describe('processTimeoutCallback', () => {
    it('should add job to safaricomTimeoutCallbackQueue and update Redis', async () => {
      const mockTimeoutCallback: SafaricomTimeoutCallbackDto = {
        OriginatorConversationID: 'originator-conversation-id',
        InitiatorName: 'initiator-name',
        SecurityCredential: 'security-credential',
        CommandID: 'command-id',
        Amount: 0,
        PartyA: 'party-A',
        PartyB: 'party-B',
        Remarks: 'remarks',
        QueueTimeOutURL: 'http://example.org/timeout',
        ResultURL: 'http://example.org/result',
        IDType: 'id-type',
        IDNumber: 'id-number',
      };

      const mockJob = {
        id: 'job-id',
        data: { programId: 3 },
      };

      jest.spyOn(redisClient, 'sadd').mockResolvedValue(1);
      jest
        .spyOn(queuesService.safaricomTimeoutCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await safaricomReconciliationService.processTimeoutCallback(
        mockTimeoutCallback,
      );

      expect(
        queuesService.safaricomTimeoutCallbackQueue.add,
      ).toHaveBeenCalledWith(JobNames.default, {
        originatorConversationId: mockTimeoutCallback.OriginatorConversationID,
      });

      expect(redisClient.sadd).toHaveBeenCalledWith(
        getRedisSetName(mockJob.data.programId),
        mockJob.id,
      );
    });
  });
});
