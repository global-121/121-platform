import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

export function mapAlfouadStateToTransactionStatus({
  alfouadState,
}: {
  alfouadState: AlfouadApiTransactionStateEnum;
}): TransactionStatusEnum {
  switch (alfouadState) {
    case AlfouadApiTransactionStateEnum.paid:
      return TransactionStatusEnum.success;
    case AlfouadApiTransactionStateEnum.pendingApproval:
    case AlfouadApiTransactionStateEnum.approved:
    case AlfouadApiTransactionStateEnum.hold:
      return TransactionStatusEnum.waiting;
    case AlfouadApiTransactionStateEnum.canceled:
      return TransactionStatusEnum.error;
    default:
      return TransactionStatusEnum.error;
  }
}
