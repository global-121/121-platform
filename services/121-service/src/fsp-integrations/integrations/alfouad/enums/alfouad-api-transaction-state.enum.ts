export enum AlfouadApiTransactionStateEnum {
  // Transaction created, awaiting approval by Al Fouad
  pendingApproval = '1',
  // Approved by Al Fouad, ready for payout
  approved = '2',
  // Paid to beneficiary
  paid = '3',
  // Held by Al Fouad for compliance/other reasons; no agent action required
  hold = '4',
  // Canceled after an explicit TransactionCancel request accepted by Al Fouad ops
  canceled = '5',
}
