import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatusEnum, string> =
  {
    [TransactionStatusEnum.created]: $localize`:@@transaction-status-initiated:Created`,
    [TransactionStatusEnum.waiting]: $localize`:@@transaction-status-waiting:Pending`,
    [TransactionStatusEnum.error]: $localize`:@@transaction-status-error:Failed`,
    [TransactionStatusEnum.success]: $localize`:@@transaction-status-success:Successful`,
  };
