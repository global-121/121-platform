import { TestBed } from '@automock/jest';

import { DoTransferParams } from '@121-service/src/fsp-integrations/integrations/safaricom/interfaces/do-transfer-params.interface';
import { TransferResult } from '@121-service/src/fsp-integrations/integrations/safaricom/interfaces/transfer-result.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/fsp-integrations/integrations/safaricom/safaricom.service';
import { SafaricomApiService } from '@121-service/src/fsp-integrations/integrations/safaricom/services/safaricom.api.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';

const mockedDoTransferParams: DoTransferParams = {
  transferValue: 100,
  phoneNumber: '254708374149',
  originatorConversationId: 'mocked_originator_conversation_id',
  idNumber: 'mocked_national_id',
};

describe('SafaricomService', () => {
  let safaricomService: SafaricomService;
  let safaricomApiService: SafaricomApiService;
  let safaricomTransferScopedRepository: SafaricomTransferScopedRepository;

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
    safaricomTransferScopedRepository = unitRef.get(
      SafaricomTransferScopedRepository,
    );
  });

  describe('doTransfer', () => {
    it('should do transfer', async () => {
      const transferResult: TransferResult = {
        mpesaConversationId: 'mocked_conversation_id',
      };

      jest.spyOn(safaricomTransferScopedRepository, 'update');
      jest
        .spyOn(safaricomApiService, 'transfer')
        .mockResolvedValue(transferResult);

      await safaricomService.doTransfer(mockedDoTransferParams);

      expect(safaricomApiService.transfer).toHaveBeenCalledWith({
        transferValue: mockedDoTransferParams.transferValue,
        phoneNumber: mockedDoTransferParams.phoneNumber,
        idNumber: mockedDoTransferParams.idNumber,
        originatorConversationId:
          mockedDoTransferParams.originatorConversationId,
      });
      expect(safaricomTransferScopedRepository.update).toHaveBeenCalled();
    });
  });
});
