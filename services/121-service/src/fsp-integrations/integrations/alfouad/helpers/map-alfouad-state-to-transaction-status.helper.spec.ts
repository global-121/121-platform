import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { mapAlfouadStateToTransactionStatus } from '@121-service/src/fsp-integrations/integrations/alfouad/helpers/map-alfouad-state-to-transaction-status.helper';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

describe('mapAlfouadStateToTransactionStatus', () => {
  it('should map paid to success', () => {
    expect(
      mapAlfouadStateToTransactionStatus({
        alfouadState: AlfouadApiTransactionStateEnum.paid,
      }),
    ).toBe(TransactionStatusEnum.success);
  });

  it.each([
    AlfouadApiTransactionStateEnum.pendingApproval,
    AlfouadApiTransactionStateEnum.approved,
    AlfouadApiTransactionStateEnum.hold,
  ])('should map state %s to waiting', (alfouadState) => {
    expect(mapAlfouadStateToTransactionStatus({ alfouadState })).toBe(
      TransactionStatusEnum.waiting,
    );
  });

  it('should map canceled to error', () => {
    expect(
      mapAlfouadStateToTransactionStatus({
        alfouadState: AlfouadApiTransactionStateEnum.canceled,
      }),
    ).toBe(TransactionStatusEnum.error);
  });
});
