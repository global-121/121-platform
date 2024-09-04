import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DoTransferReturnParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { SafaricomTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer.interface';
import { SafaricomTransferPayloadParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-payload.interface';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-transfer.entity';
import { REDIS_CLIENT } from '@121-service/src/payments/redis/redis-client';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { QueueNamePaymentCallBack } from '@121-service/src/shared/enum/queue-process.names.enum';
import { getQueueName } from '@121-service/src/utils/unit-test.helpers';

const mockedSafaricomTransferParams: SafaricomTransferParams = {
  userId: 1,
  programId: 3,
  paymentNr: 1,
  transactionAmount: 100,
  phoneNumber: '254708374149',
  referenceId: 'mocked_reference_id',
  nationalId: 'mocked_national_id',
  registrationProgramId: 2,
};

const mockedSafaricomTransferPayloadParams: SafaricomTransferPayloadParams = {
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
  let safaricomTransferRepository: Repository<SafaricomTransferEntity>;

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
          provide: QueueNamePaymentCallBack.safaricom,
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getQueueName(QueueNamePaymentCallBack.safaricom),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SafaricomService>(SafaricomService);
    safaricomApiService = module.get<SafaricomApiService>(SafaricomApiService);
    safaricomTransferRepository = module.get<
      Repository<SafaricomTransferEntity>
    >(getRepositoryToken(SafaricomTransferEntity));
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
      const result: DoTransferReturnParams = {
        amountTransferredInMajorUnit: 100,
        customData: {
          requestResult: { ResponseCode: '0' },
        },
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
        3,
        1,
        100,
        '254708374149',
        'mocked_reference_id',
        'mocked_national_id',
        2,
      );
      expect(service.sendPaymentPerPa).toHaveBeenCalledWith(
        mockedSafaricomTransferPayloadParams,
      );
      expect(transferResult).toEqual(result);
    });
  });

  describe('createAndSaveSafaricomTransferData', () => {
    it('should create and save a safaricom transfer entity', async () => {
      const transferResult: DoTransferReturnParams = {
        amountTransferredInMajorUnit: 100,
        customData: {
          requestResult: {
            ConversationID: 'mocked_conversation_id',
            OriginatorConversationID: 'mocked_originator_conversation_id',
          },
        },
      };

      const transaction = { id: 1 } as TransactionEntity;
      const saveSpy = jest
        .spyOn(safaricomTransferRepository, 'save')
        .mockResolvedValue({ id: 1 } as SafaricomTransferEntity);

      await service.createAndSaveSafaricomTransferData(
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
        await service.getSafaricomTransferByOriginatorConversationId(
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

      await service.updateSafaricomTransfer(safaricomTransferEntity);

      expect(saveSpy).toHaveBeenCalledWith(safaricomTransferEntity);
    });
  });
});
