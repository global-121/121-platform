export interface SafaricomTransferCallbackJobDto {
  originatorConversationId: string;
  mpesaConversationId: string;
  mpesaTransactionId: string;
  resultCode: number;
  resultDescription: string;
}
