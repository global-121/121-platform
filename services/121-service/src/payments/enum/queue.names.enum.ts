//TODO: What is the purpose of this enum? Can we refactor (move, rename, ...)? ####
export enum ProcessNamePayment {
  sendPayment = 'sendPayment',
}

//TODO: REFACTOR: move this enum to the TransferQueues module and name it: TransferQueueNames ####
export enum QueueNamePayment {
  paymentIntersolveVisa = 'paymentIntersolveVisa',
  paymentIntersolveVoucher = 'paymentIntersolveVoucher',
  paymentCommercialBankEthiopia = 'paymentCommercialBankEthiopia',
  paymentSafaricom = 'paymentSafaricom',
}
