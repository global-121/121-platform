export interface SaveAndDoTransferParams {
  readonly transactionId: number;
  readonly transferAmount: number;
  readonly phoneNumber: string;
  readonly idNumber: string;
  readonly originatorConversationId: string;
}
