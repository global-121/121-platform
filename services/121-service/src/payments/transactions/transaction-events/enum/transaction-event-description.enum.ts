export enum TransactionEventDescription {
  // 1. Generic events
  created = 'Transaction created',
  initiated = 'Transaction started',
  retry = 'Transaction retried',
  // IMPORTANT: all descriptions below should be phrased generically with a noun instead of with a verb that implies success (like 'started' above), as these steps can fail or succeed.
  // TODO re-evaluate this setup as it is prone to mistakes, yields ugly UX copy, and is not translatable
  approval = 'Transaction approval', // this is not FSP-specific but is generically phrased with a noun instead of a verb because it can fail.
  // 2. FSP-specific events (of type 'processingStep')
  onafriqRequestSent = 'Onafriq payment request',
  onafriqCallbackReceived = 'Onafriq payment distribution',
  safaricomRequestSent = 'Safaricom payment request',
  safaricomCallbackReceived = 'Safaricom payment distribution',
  nedbankVoucherCreationRequested = 'Nedbank voucher creation',
  nedbankCallbackReceived = 'Nedbank voucher collection',
  airtelRequestSent = 'Airtel payment request',
  visaPaymentRequested = 'Visa payment request',
  commercialBankEthiopiaRequestSent = 'Commercial Bank of Ethiopia payment request',
  intersolveVoucherCreationRequest = 'AH voucher creation',
  intersolveVoucherInitialMessageSent = 'AH voucher-is-ready message dispatch',
  intersolveVoucherVoucherMessageSent = 'AH voucher message dispatch',
  intersolveVoucherMessageCallback = 'AH message delivery',
  excelPreparationForExport = 'Preparation for export',
  excelReconciliationFileUpload = 'Reconciliation file upload',
}
