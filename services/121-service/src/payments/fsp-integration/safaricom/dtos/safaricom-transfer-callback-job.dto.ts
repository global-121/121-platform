export interface SafaricomTransferCallbackJobDto {
  readonly originatorConversationId: string;
  readonly mpesaConversationId: string;
  readonly mpesaTransactionId: string;
  readonly resultCode: number;
  readonly resultDescription: string;
}
