import { TransferParams } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-params.interface';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DoTransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { SafaricomTransferRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { FinancialServiceProviderCallbackQueuesNames } from '@121-service/src/shared/enum/financial-service-provider-callback-queue-names.enum';
import { getQueueName } from '@121-service/src/utils/unit-test.helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const mockedSafaricomTransferParams: DoTransferParams = {
  transactionAmount: 100,
  phoneNumber: '254708374149',
  remarks: 'Payment 1',
  occasion: 'mocked_occasion',
  originatorConversationId: 'mocked_originator_conversation_id',
  idNumber: 'mocked_national_id',
};

const mockedSafaricomTransferPayloadParams: TransferParams = {
  InitiatorName: 'initiator_name',
  SecurityCredential: 'security_credential',
  CommandID: 'command_id',
  Amount: 100,
  PartyA: 'party_A',
  PartyB: '254708374149',
  Remarks: 'Payment#1',
  QueueTimeOutURL: 'https://mocked-url.com/timeout',
  ResultURL: 'https://mocked-url.com/callback',
  Occassion: 'occassion',
  OriginatorConversationID: 'originator_conversation_id',
  IDType: 'mocked_id_type',
  IDNumber: 'mocked_id_number',
};

describe('SafaricomService', () => {
  let service: SafaricomService;
  let safaricomApiService: SafaricomApiService;
  let safaricomTransferRepository: SafaricomTransferRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafaricomService,
        {
          provide: SafaricomApiService,
          useValue: {
            authenticate: jest.fn(),
            transfer: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SafaricomTransferEntity),
          useClass: Repository,
        },
        {
          provide: REDIS_CLIENT,
          useValue: {
            sadd: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TransactionEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SafaricomTransferEntity),
          useClass: Repository,
        },
        {
          provide:
            FinancialServiceProviderCallbackQueuesNames.safaricomTransferCallback,
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getQueueName(
            FinancialServiceProviderCallbackQueuesNames.safaricomTransferCallback,
          ),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SafaricomService>(SafaricomService);
    safaricomApiService = module.get<SafaricomApiService>(SafaricomApiService);
    safaricomTransferRepository = module.get<SafaricomTransferRepository>(
      SafaricomTransferRepository,
    );
  });

  describe('sendPayment', () => {
    it('should throw an error when called', async () => {
      await expect(service.sendPayment([], 1, 1)).rejects.toThrow(
        'Method should not be called anymore.',
      );
    });
  });

  describe('doTransfer', () => {
    it('should authenticate and send payment', async () => {
      const result: DoTransferReturnType = {
        conversationId: 'mocked_conversation_id',
        originatorConversationId: 'mocked_originator_conversation_id',
      };

      jest
        .spyOn(service, 'createPayloadPerPa')
        .mockReturnValue(mockedSafaricomTransferPayloadParams);
      jest.spyOn(service, 'sendPaymentPerPa').mockResolvedValue(result);
      jest
        .spyOn(safaricomApiService, 'authenticate')
        .mockResolvedValue('mocked-access-token');

      const transferResult = await service.doTransfer(
        mockedSafaricomTransferParams,
      );

      expect(safaricomApiService.authenticate).toHaveBeenCalled();
      expect(service.createPayloadPerPa).toHaveBeenCalledWith(
        mockedSafaricomTransferParams,
      );
      expect(service.sendPaymentPerPa).toHaveBeenCalledWith(
        mockedSafaricomTransferPayloadParams,
      );
      expect(transferResult).toEqual(result);
    });
  });

  describe('createAndSaveSafaricomTransferData', () => {
    it('should create and save a safaricom transfer entity', async () => {
      const transferResult: DoTransferReturnType = {
<<<<<<< HEAD
        amountTransferredInMajorUnit: 100,
=======
>>>>>>> 197d97614 (fix: rename and update TransferParams)
        conversationId: 'mocked_conversation_id',
        originatorConversationId: 'mocked_originator_conversation_id',
      };

      const transaction = { id: 1 } as TransactionEntity;
      const saveSpy = jest
        .spyOn(safaricomTransferRepository, 'save')
        .mockResolvedValue({ id: 1 } as SafaricomTransferEntity);

      await safaricomTransferRepository.createAndSaveSafaricomTransferData(
        transferResult,
        transaction,
      );

      expect(saveSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          mpesaConversationId: 'mocked_conversation_id',
          originatorConversationId: 'mocked_originator_conversation_id',
          transactionId: 1,
        }),
      );
    });
  });

  describe('getSafaricomTransferByOriginatorConversationId', () => {
    it('should return safaricom transfer entities by originatorConversationId', async () => {
      const originatorConversationId = 'OriginatorConversationID';

      const safaricomTransferEntities: SafaricomTransferEntity[] = [
        { id: 1, originatorConversationId } as SafaricomTransferEntity,
      ];

      jest
        .spyOn(safaricomTransferRepository, 'createQueryBuilder')
        .mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(safaricomTransferEntities),
        } as any);

      const result =
        await safaricomTransferRepository.getSafaricomTransferByOriginatorConversationId(
          originatorConversationId,
        );

      expect(result).toEqual(safaricomTransferEntities);
    });
  });

  describe('updateSafaricomTransfer', () => {
    it('should save the updated safaricom transfer entity', async () => {
      const safaricomTransferEntity = { id: 1 } as SafaricomTransferEntity;

      const saveSpy = jest
        .spyOn(safaricomTransferRepository, 'save')
        .mockResolvedValue(safaricomTransferEntity);

      // TODO: fix this test
      // await safaricomTransferRepository.updateSafaricomTransfer(safaricomTransferEntity);

      expect(saveSpy).toHaveBeenCalledWith(safaricomTransferEntity);
    });
  });
});
