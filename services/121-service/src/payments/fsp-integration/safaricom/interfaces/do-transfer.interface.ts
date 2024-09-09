export interface DoTransferParams {
  readonly transactionAmount: number;
  readonly phoneNumber: string;
  readonly remarks: string;
  readonly occasion: string;
  readonly originatorConversationId: string;
  readonly idNumber: string;
  readonly transactionId: number;
}
