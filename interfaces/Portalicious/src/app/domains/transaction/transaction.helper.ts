import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { ChipVariant } from '~/components/colored-chip/colored-chip.component';

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatusEnum, string> =
  {
    [TransactionStatusEnum.waiting]: $localize`:@@transaction-status-waiting:Pending`,
    [TransactionStatusEnum.error]: $localize`:@@transaction-status-error:Error`,
    [TransactionStatusEnum.success]: $localize`:@@transaction-status-success:Success`,
  };

export const TRANSACTION_STATUS_CHIP_VARIANTS: Record<
  TransactionStatusEnum,
  ChipVariant
> = {
  [TransactionStatusEnum.waiting]: 'blue',
  [TransactionStatusEnum.error]: 'red',
  [TransactionStatusEnum.success]: 'green',
};
