// Refactor once all FSPs are migrated to new architecture: then this can move from 'shared' to transaction-queue module
export enum TransactionJobQueueNames {
  intersolveVisa = 'intersolveVisa-transaction-jobs',
  intersolveVoucher = 'intersolveVoucher-transaction-jobs',
  commercialBankEthiopia = 'commercialBankEthiopia-transaction-jobs',
  safaricom = 'safaricom-transaction-jobs',
  nedbank = 'nedbank-transaction-jobs',
}
