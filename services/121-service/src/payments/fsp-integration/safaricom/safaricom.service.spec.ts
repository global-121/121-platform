import { TestBed } from '@automock/jest';
import { Redis } from 'ioredis';

import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-params.interface';
import { TransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/transfer-return-type.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

const mockedDoTransferParams: DoTransferParams = {
  transferAmount: 100,
  phoneNumber: '254708374149',
  originatorConversationId: 'mocked_originator_conversation_id',
  idNumber: 'mocked_national_id',
};

describe('SafaricomService', () => {
  let safaricomService: SafaricomService;
  let safaricomApiService: SafaricomApiService;
  let safaricomTransferScopedRepository: SafaricomTransferScopedRepository;
  let redisClient: Redis;
  let queuesService: QueuesRegistryService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(SafaricomService)
      .mock(QueuesRegistryService)
      .using({
        safaricomTransferCallbackQueue: {
          add: jest.fn(),
        },
        safaricomTimeoutCallbackQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    safaricomService = unit;
    safaricomApiService = unitRef.get(SafaricomApiService);
    queuesService = unitRef.get(QueuesRegistryService);
    safaricomTransferScopedRepository = unitRef.get(
      SafaricomTransferScopedRepository,
    );
    redisClient = unitRef.get(REDIS_CLIENT);
  });

  describe('sendPayment', () => {
    it('should throw an error when called', async () => {
      await expect(safaricomService.sendPayment([], 1, 1)).rejects.toThrow(
        'Method should not be called anymore.',
      );
    });
  });

  // ##TODO: See comment in SafaricomService.doTransfer
  describe('doTransfer', () => {
    it('should do transfer', async () => {
      const transferResult: TransferReturnType = {
        mpesaConversationId: 'mocked_conversation_id',
      };

      jest.spyOn(safaricomTransferScopedRepository, 'update');
      jest
        .spyOn(safaricomApiService, 'transfer')
        .mockResolvedValue(transferResult);

      await safaricomService.doTransfer(mockedDoTransferParams);

      expect(safaricomApiService.transfer).toHaveBeenCalledWith({
        transferAmount: mockedDoTransferParams.transferAmount,
        phoneNumber: mockedDoTransferParams.phoneNumber,
        idNumber: mockedDoTransferParams.idNumber,
        originatorConversationId:
          mockedDoTransferParams.originatorConversationId,
      });
      expect(safaricomTransferScopedRepository.update).toHaveBeenCalled();
    });
  });

  // ##TODO: See comment in SafaricomService.processTransferCallback
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

      await safaricomService.processTransferCallback(mockCallback);

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

  // ##TODO: See comment in SafaricomService.processTimeoutCallback
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

      await safaricomService.processTimeoutCallback(mockTimeoutCallback);

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
