import { TestBed } from '@automock/jest';

import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-params.interface';
import { TransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/transfer-return-type.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';

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
});
