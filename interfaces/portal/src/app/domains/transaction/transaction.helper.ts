import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatusEnum, string> =
  {
    [TransactionStatusEnum.pendingApproval]: $localize`:@@transaction-status-created:Pending approval`,
    [TransactionStatusEnum.approved]: $localize`:@@transaction-status-approved:Approved`,
    [TransactionStatusEnum.waiting]: $localize`:@@transaction-status-waiting:Processing`,
    [TransactionStatusEnum.error]: $localize`:@@transaction-status-error:Failed`,
    [TransactionStatusEnum.success]: $localize`:@@transaction-status-success:Successful`,
  };
