export enum CooperativeBankOfOromiaTransferMessageEnum {
  // Cooperative Bank of Oromia API has a lot more messages but this is the only one we use in our code base
  duplicateMessageId = 'DUPLICATE.TRAP:1:1=TRUE', // It was indicated that this message should be stable and should be used to identify duplicate messageId errors
}
