export enum TransactionEventDescription {
  created = 'Transaction created',
  initiated = 'Transaction initiated',
  retry = 'Transaction retry initiated',
  // Onafriq processing-step events
  visaPaymentRequested = 'Visa payment requested',
  onafriqRequestSent = 'Onafriq request sent',
  onafriqCallbackReceived = 'Onafriq callback received',
  // Safaricom processing-step events // ##TODO: these are exactly the same as onafriq, can we generalize?
  safaricomRequestSent = 'Safaricom request sent',
  safaricomCallbackReceived = 'Safaricom callback received',
}
