export enum TransactionEventDescription {
  created = 'Transaction created',
  initiated = 'Transaction initiated',
  retry = 'Transaction retried',
  // NOTE: all description below should be phrased generically, so they can be suffixed with either "succeeded" or "failed"
  // ##TODO optimize all this UX copy + re-evaluate this setup of 'description + succeeded/failed'
  // Onafriq processing-step events
  onafriqRequestSent = 'Onafriq payment request',
  onafriqCallbackReceived = 'Onafriq payment distribution',
  // Safaricom processing-step events
  safaricomRequestSent = 'Safaricom payment request',
  safaricomCallbackReceived = 'Safaricom payment distribution',
  // Nedbank processing-step events
  nedbankVoucherCreationRequested = 'Nedbank voucher creation',
  nedbankCallbackReceived = 'Nedbank voucher collection',
  // Airtel processing-step events
  airtelRequestSent = 'Airtel payment request',
  // Visa processing-step events
  visaPaymentRequested = 'Visa payment request',
  // Commercial Bank Ethiopia processing-step events
  commercialBankEthiopiaRequestSent = 'Commercial Bank Ethiopia payment request',
  // Intersolve Voucher processing-step events
  intersolveVoucherCreationRequest = 'AH voucher creation',
  intersolveVoucherInitialMessageSent = 'Notification to claim voucher',
  intersolveVoucherVoucherMessageSent = 'Voucher message sending',
  intersolveVoucherMessageCallback = 'Message delivery',
  // Excel fsp processing-step events
  excelPreparationForExport = 'Preparation for export',
  excelReconciliationFileUpload = 'Reconciliation file upload',
}
