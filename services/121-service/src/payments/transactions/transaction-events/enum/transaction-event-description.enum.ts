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
  nedbankCallbackReceived = 'Nedbank callback received',
  // Airtel processing-step events
  airtelRequestSent = 'Airtel request sent',
  // Visa processing-step events
  visaPaymentRequested = 'Visa payment requested',
  // Commercial Bank Ethiopia processing-step events
  commercialBankEthiopiaRequestSent = 'Commercial Bank Ethiopia request sent',
  // Intersolve Voucher processing-step events
  intersolveVoucherCreationRequest = 'Intersolve Voucher creation requested',
  intersolveVoucherInitialMessageSent = 'Intersolve Voucher initial message sent',
  intersolveVoucherVoucherMessageSent = 'Intersolve Voucher voucher message sent',
  intersolveVoucherMessageCallback = 'Intersolve Voucher message callback received', // ##TODO: do we want to distinguish between callback on initial vs voucher message?
}
