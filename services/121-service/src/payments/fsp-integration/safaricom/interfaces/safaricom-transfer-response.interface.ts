export interface SafaricomTransferResponseParams {
  readonly data: SafaricomTransferResponseBody;
}

export interface SafaricomTransferResponseBody {
  readonly ConversationID: string;
  readonly OriginatorConversationID: string;
  readonly ResponseCode: string;
  readonly ResponseDescription: string;
}
