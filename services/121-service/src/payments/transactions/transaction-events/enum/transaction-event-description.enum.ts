export enum TransactionEventDescription {
  created = 'Transfer created', // 'transfer' to align with front-end naming
  approved = 'Transfer approved',
  initiated = 'Transfer started',
  retry = 'Transfer retried',
  // IMPORTANT: all descriptions below should be phrased generically, so they can be suffixed with either "succeeded" or "failed"
  // TODO re-evaluate this setup as it is prone to mistakes and yields ugly UX copy, and is not translatable
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
  intersolveVoucherInitialMessageSent = 'AH voucher-is-ready message sending',
  intersolveVoucherVoucherMessageSent = 'AH voucher message sending',
  intersolveVoucherMessageCallback = 'AH message delivery',
  excelPreparationForExport = 'Preparation for export',
  excelReconciliationFileUpload = 'Reconciliation file upload',
}
