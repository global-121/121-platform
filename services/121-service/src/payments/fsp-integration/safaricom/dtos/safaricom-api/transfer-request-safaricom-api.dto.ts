export interface TransferRequestSafaricomApiDto {
  readonly InitiatorName: string;
  readonly SecurityCredential: string;
  readonly CommandID: string;
  readonly Amount: number;
  readonly PartyA: string;
  readonly PartyB: string;
  readonly Remarks: string; // fields 'Remarks' and 'Occassion' are not used for reconciliation by clients. 'Remarks' is required, so filled with default value, 'Occassion' is optional, so ommitted.
  readonly QueueTimeOutURL: string;
  readonly ResultURL: string;
  readonly OriginatorConversationID: string;
  readonly IDType: string;
  readonly IDNumber: string;
}
