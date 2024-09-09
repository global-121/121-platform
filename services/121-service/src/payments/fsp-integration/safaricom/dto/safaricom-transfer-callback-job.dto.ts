export class SafaricomTransferCallbackJobDto {
  public readonly Result: SafaricomTransferCallbackResultDto;
}

class SafaricomTransferCallbackResultDto {
  public readonly ResultCode: number;
  public readonly ResultDesc: string;
  public readonly OriginatorConversationID: string;
  public readonly ConversationID: string;
  public readonly TransactionID: string;
}
