import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { FinancialServiceProviderCallbackQueueNames } from '@121-service/src/financial-service-provider-callback-job-processors/enum/financial-service-provider-callback-queue-names.enum';
import { PaymentQueueNames } from '@121-service/src/payments/enum/payment-queue-names.enum';
import { TransferResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';

const mockedSafaricomTransferParams: DoTransferParams = {
  transferAmount: 100,
  phoneNumber: '254708374149',
  remarks: 'Payment 1',
  originatorConversationId: 'mocked_originator_conversation_id',
  idNumber: 'mocked_national_id',
  transactionId: 1,
};

describe('SafaricomService', () => {
  let service: SafaricomService;
  let safaricomApiService: SafaricomApiService;
  let safaricomTransferScopedRepository: SafaricomTransferScopedRepository;

  let redisClient: Redis;
  let safaricomTransferCallbackQueue: Queue;
  let safaricomTimeoutCallbackQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafaricomService,
        {
          provide: SafaricomApiService,
          useValue: {
            sendTransferAndHandleResponse: jest.fn(),
          },
        },
        {
          provide: SafaricomTransferScopedRepository,
          useValue: {
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: REDIS_CLIENT,
          useValue: {
            sadd: jest.fn(),
          },
        },
        {
          provide: getQueueToken(
            FinancialServiceProviderCallbackQueueNames.safaricomTransferCallback,
          ),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getQueueToken(
            FinancialServiceProviderCallbackQueueNames.safaricomTimeoutCallback,
          ),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SafaricomService>(SafaricomService);
    safaricomApiService = module.get<SafaricomApiService>(SafaricomApiService);
    safaricomTransferScopedRepository =
      module.get<SafaricomTransferScopedRepository>(
        SafaricomTransferScopedRepository,
      );
    safaricomTransferCallbackQueue = module.get(
      getQueueToken(
        FinancialServiceProviderCallbackQueueNames.safaricomTransferCallback,
      ),
    );
    safaricomTimeoutCallbackQueue = module.get(
      getQueueToken(
        FinancialServiceProviderCallbackQueueNames.safaricomTimeoutCallback,
      ),
    );
    redisClient = module.get(REDIS_CLIENT);
  });

  describe('sendPayment', () => {
    it('should throw an error when called', async () => {
      await expect(service.sendPayment([], 1, 1)).rejects.toThrow(
        'Method should not be called anymore.',
      );
    });
  });

  describe('doTransfer', () => {
    it('should do transfer', async () => {
      const sendTransferResult: TransferResponseSafaricomApiDto = {
        data: {
          ConversationID: 'mocked_conversation_id',
          OriginatorConversationID: 'mocked_originator_conversation_id',
          ResponseCode: '0',
          ResponseDescription: 'Success',
        },
      };

      jest.spyOn(safaricomTransferScopedRepository, 'save');
      jest.spyOn(safaricomTransferScopedRepository, 'update');
      jest
        .spyOn(safaricomApiService, 'sendTransferAndHandleResponse')
        .mockResolvedValue(sendTransferResult);

      const transferResult = await service.saveAndDoTransfer(
        mockedSafaricomTransferParams,
      );

      expect(safaricomTransferScopedRepository.save).toHaveBeenCalled();
      expect(
        safaricomApiService.sendTransferAndHandleResponse,
      ).toHaveBeenCalledWith(mockedSafaricomTransferParams);
      expect(safaricomTransferScopedRepository.update).toHaveBeenCalled();
      expect(transferResult).toEqual(undefined);
    });
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
        .spyOn(safaricomTransferCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await service.processTransferCallback(mockCallback);

      expect(safaricomTransferCallbackQueue.add).toHaveBeenCalledWith(
        PaymentQueueNames.financialServiceProviderCallback,
        {
          originatorConversationId:
            mockCallback.Result.OriginatorConversationID,
          mpesaConversationId: mockCallback.Result.ConversationID,
          mpesaTransactionId: mockCallback.Result.TransactionID,
          resultCode: mockCallback.Result.ResultCode,
          resultDescription: mockCallback.Result.ResultDesc,
        },
      );

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
        .spyOn(safaricomTimeoutCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await service.processTimeoutCallback(mockTimeoutCallback);

      expect(safaricomTimeoutCallbackQueue.add).toHaveBeenCalledWith(
        PaymentQueueNames.financialServiceProviderTimeoutCallback,
        {
          originatorConversationId:
            mockTimeoutCallback.OriginatorConversationID,
        },
      );

      expect(redisClient.sadd).toHaveBeenCalledWith(
        getRedisSetName(mockJob.data.programId),
        mockJob.id,
      );
    });
  });
});
