import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';

export type GetAuditedTransactionViews = Awaited<
  ReturnType<
    typeof TransactionViewScopedRepository.prototype.getAuditedTransactionViews
  >
>[0];
