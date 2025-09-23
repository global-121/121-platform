export enum TransactionEventDescription {
  created = 'Transaction created',
  initiated = 'Transaction initiated',
  retry = 'Transaction retry initiated',
  // Onafriq processing-step events
  onafriqRequestSent = 'Onafriq request sent', // ##TODO: separate descriptions for success and error?
  onafriqCallbackReceived = 'Onafriq callback received',
  // Safaricom processing-step events // ##TODO: these are exactly the same as onafriq, can we generalize?
  safaricomRequestSent = 'Safaricom request sent',
  safaricomCallbackReceived = 'Safaricom callback received',
}
