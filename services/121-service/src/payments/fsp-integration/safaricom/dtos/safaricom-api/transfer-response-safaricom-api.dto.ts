export interface TransferResponseSafaricomApiDto {
  readonly data: {
    readonly ConversationID: string;
    readonly OriginatorConversationID: string;
    readonly ResponseCode?: string;
    readonly ResponseDescription?: string;
    readonly errorCode?: string;
    readonly errorMessage?: string;
    readonly statusCode?: string;
    readonly error?: string;
  };
}
