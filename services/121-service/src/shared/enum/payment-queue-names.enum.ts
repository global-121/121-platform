// Queues for processing payments
export enum PaymentQueueNames {
  sendPayment = 'sendPayment',
  financialServiceProviderCallback = 'financialServiceProviderCallback',
  financialServiceProviderTimeoutCallback = 'financialServiceProviderTimeoutCallback',
}
