export enum QueueNames {
  //transaction jobs
  transactionJobsIntersolveVisa = 'intersolveVisa-transaction-jobs',
  transactionJobsIntersolveVoucher = 'intersolveVoucher-transaction-jobs',
  transactionJobsCommercialBankEthiopia = 'commercialBankEthiopia-transaction-jobs',
  transactionJobsSafaricom = 'safaricom-transaction-jobs',
  transactionJobsNedbank = 'nedbank-transaction-jobs',
  transactionJobsOnafriq = 'onafriq-transaction-jobs',
  transactionJobsAirtel = 'airtel-transaction-jobs',
  transactionJobsExcel = 'excel-transaction-jobs',

  // payment callback jobs
  paymentCallbackSafaricomTransfer = 'safaricomTransferCallback',
  paymentCallbackSafaricomTimeout = 'safaricomTimeoutCallback',
  paymentCallbackOnafriq = 'onafriqCallback',

  // create message jobs
  createMessageReplyOnIncoming = 'replyOnIncoming',
  createMessageSmallBulk = 'smallBulk',
  createMessageMediumBulk = 'mediumBulk',
  createMessageLargeBulk = 'largeBulk',
  createMessageLowPriority = 'lowPriority',

  // message callback jobs
  messageCallbackStatus = 'messageStatusCallback',
  messageCallbackIncoming = 'incomingMessage',

  // registration jobs
  registration = 'registration',
}
