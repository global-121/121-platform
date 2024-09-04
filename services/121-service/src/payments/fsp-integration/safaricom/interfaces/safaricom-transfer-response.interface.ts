export interface SafaricomTransferResponseParams {
  readonly data: SafaricomTransferResponseBody;
}

interface SafaricomTransferResponseBody {
  readonly ConversationID: string;
  readonly OriginatorConversationID: string;
  readonly ResponseCode: string;
  readonly ResponseDescription: string;
}
