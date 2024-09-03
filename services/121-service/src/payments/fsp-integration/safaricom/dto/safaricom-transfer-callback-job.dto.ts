export class SafaricomTransferCallbackJobDto {
  public readonly Result: SafaricomTransferCallbackResultDto;
}

export class SafaricomTransferCallbackResultDto {
  public readonly ResultCode: number;
  public readonly ResultDesc: string;
  public readonly OriginatorConversationID: string;
  public readonly ConversationID: string;
  public readonly TransactionID: string;
}
