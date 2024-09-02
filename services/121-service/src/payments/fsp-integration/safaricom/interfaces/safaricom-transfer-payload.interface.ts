export interface SafaricomTransferPayloadParams {
  readonly InitiatorName: string;
  readonly SecurityCredential: string;
  readonly CommandID: string;
  readonly Amount: number;
  readonly PartyA: string;
  readonly PartyB: string;
  readonly Remarks: string;
  readonly QueueTimeOutURL: string;
  readonly ResultURL: string;
  readonly Occassion: string;
  readonly OriginatorConversationID: string;
  readonly IDType: string;
  readonly IDNumber: string | undefined;
  readonly conversationId?: string;
  readonly status?: string;
  readonly requestResult?: Record<string, unknown>;
  readonly paymentResult?: Record<string, unknown>;
}
