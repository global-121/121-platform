import { TestBed } from '@automock/jest/dist/testbed-factory';

import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { AlfouadTransferStatus } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-transfer-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

describe('AlfouadService', () => {
  let alfouadService: AlfouadService;

  beforeEach(() => {
    const { unit } = TestBed.create(AlfouadService).compile();
    alfouadService = unit;
  });

  describe('mapAlfouadStatusToTransactionStatus', () => {
    it('should map successful to success', () => {
      const result = alfouadService.mapAlfouadStatusToTransactionStatus({
        alfouadStatus: AlfouadTransferStatus.successful,
      });

      expect(result).toBe(TransactionStatusEnum.success);
    });

    it('should map pending to waiting', () => {
      const result = alfouadService.mapAlfouadStatusToTransactionStatus({
        alfouadStatus: AlfouadTransferStatus.pending,
      });

      expect(result).toBe(TransactionStatusEnum.waiting);
    });

    it('should map failed to error', () => {
      const result = alfouadService.mapAlfouadStatusToTransactionStatus({
        alfouadStatus: AlfouadTransferStatus.failed,
      });

      expect(result).toBe(TransactionStatusEnum.error);
    });
  });
});
