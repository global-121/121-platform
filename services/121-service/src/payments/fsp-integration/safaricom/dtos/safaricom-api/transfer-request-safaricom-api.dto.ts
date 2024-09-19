export interface TransferRequestSafaricomApiDto {
  readonly InitiatorName: string;
  readonly SecurityCredential: string;
  readonly CommandID: string;
  readonly Amount: number;
  readonly PartyA: string;
  readonly PartyB: string;
  readonly Remarks: string;
  readonly QueueTimeOutURL: string;
  readonly ResultURL: string;
  readonly OriginatorConversationID: string;
  readonly IDType: string;
  readonly IDNumber: string;
}
