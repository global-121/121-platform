import { TestBed } from '@automock/jest/dist/testbed-factory';

import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { AlfouadTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-transaction-state.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

jest.mock('@121-service/src/env', () => ({
  env: {
    ALFOUAD_MODE: 'MOCK',
  },
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

describe('AlfouadService', () => {
  let alfouadService: AlfouadService;

  beforeEach(() => {
    const { unit } = TestBed.create(AlfouadService).compile();
    alfouadService = unit;
  });

  describe('mapAlfouadStateToTransactionStatus', () => {
    it('should map paid to success', () => {
      const result = alfouadService.mapAlfouadStateToTransactionStatus({
        alfouadState: AlfouadTransactionState.paid,
      });

      expect(result).toBe(TransactionStatusEnum.success);
    });

    it.each([
      AlfouadTransactionState.pendingApproval,
      AlfouadTransactionState.approved,
      AlfouadTransactionState.hold,
    ])('should map state %s to waiting', (alfouadState) => {
      const result = alfouadService.mapAlfouadStateToTransactionStatus({
        alfouadState,
      });

      expect(result).toBe(TransactionStatusEnum.waiting);
    });

    it('should map canceled to error', () => {
      const result = alfouadService.mapAlfouadStateToTransactionStatus({
        alfouadState: AlfouadTransactionState.canceled,
      });

      expect(result).toBe(TransactionStatusEnum.error);
    });
  });
});
