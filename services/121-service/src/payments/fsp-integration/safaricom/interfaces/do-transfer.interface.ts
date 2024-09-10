export interface DoTransferParams {
  readonly transactionId: number;
  readonly transferAmount: number;
  readonly phoneNumber: string;
  readonly idNumber: string;
  readonly remarks: string;
  readonly occasion: string; // Safaricom API has misspelled this field: occassion
  readonly originatorConversationId: string;
}
