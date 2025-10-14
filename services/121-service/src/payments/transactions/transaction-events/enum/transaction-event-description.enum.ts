export enum TransactionEventDescription {
  created = 'Transaction created',
  initiated = 'Transaction initiated',
  retry = 'Transaction retry initiated',
  // Onafriq processing-step events
  onafriqRequestSent = 'Onafriq request sent',
  onafriqCallbackReceived = 'Onafriq callback received',
  // Safaricom processing-step events // ##TODO: these are exactly the same as onafriq, can we generalize? Go over all these things in general at the end.
  safaricomRequestSent = 'Safaricom request sent',
  safaricomCallbackReceived = 'Safaricom callback received',
  // Nedbank processing-step events
  nedbankVoucherCreationRequested = 'Nedbank voucher creation requested',
  nedbankCallbackReceived = 'Nedbank voucher collection',
  // Airtel processing-step events
  airtelRequestSent = 'Airtel request sent',
  // Visa processing-step events
  visaPaymentRequested = 'Visa payment requested',
  // Commercial Bank Ethiopia processing-step events
  commercialBankEthiopiaRequestSent = 'Commercial Bank Ethiopia request sent',
  // Intersolve Voucher processing-step events

  intersolveVoucherCreationRequest = 'AH voucher creation',
  intersolveVoucherInitialMessageSent = 'Notification to claim voucher',
  intersolveVoucherVoucherMessageSent = 'Voucher message sending',
  intersolveVoucherMessageCallback = 'Message delivery', // ##TODO: do we want to distinguish between callback on initial vs voucher message? Also: don't store separate events for delivered/read/etc.
  // Excel fsp processing-step events
  excelPreparationForExport = 'Preparation for export',
  excelReconciliationFileUpload = 'Reconciliation file upload',
}
