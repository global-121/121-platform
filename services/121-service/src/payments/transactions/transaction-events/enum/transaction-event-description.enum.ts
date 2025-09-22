export enum TransactionEventDescription {
  created = 'Transaction created',
  initiated = 'Transaction initiated',
  retry = 'Transaction retry initiated',
  // Onafriq processing-step events
  onafriqRequestSent = 'Onafriq request sent', // ##TODO: separate descriptions for success and error?
  onafriqCallbackReceived = 'Onafriq callback received',
}
