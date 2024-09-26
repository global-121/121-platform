export interface DoTransferParams {
  readonly transactionId: number;
  readonly transferAmount: number;
  readonly phoneNumber: string;
  readonly idNumber: string;
  readonly originatorConversationId: string;
}
