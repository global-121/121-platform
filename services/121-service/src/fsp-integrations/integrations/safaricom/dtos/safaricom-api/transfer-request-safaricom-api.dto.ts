export interface TransferRequestSafaricomApiDto {
  readonly InitiatorName: string | undefined;
  readonly SecurityCredential: string | undefined;
  readonly CommandID: string;
  readonly Amount: number;
  readonly PartyA: string | undefined;
  readonly PartyB: string;
  readonly Remarks: string; // fields 'Remarks' and 'Occassion' are not used for reconciliation by clients. 'Remarks' is required, so filled with default value, 'Occassion' is optional, so omitted.
  readonly QueueTimeOutURL: string;
  readonly ResultURL: string;
  readonly OriginatorConversationID: string;
  readonly IDType: string | undefined;
  readonly IDNumber: string;
}
