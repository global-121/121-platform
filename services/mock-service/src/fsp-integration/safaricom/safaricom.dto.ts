export class SafaricomTransferPayload {
  public InitiatorName: string;
  public SecurityCredential: string;
  public CommandID: string;
  public Amount: number;
  public PartyA: string;
  public PartyB: string;
  public Remarks: string;
  public QueueTimeOutURL: string;
  public ResultURL: string;
  public OriginatorConversationID: string;
  public IDType: string;
  public IDNumber: string;
}

export class SafaricomTransferResponseBodyDto {
  public ConversationID: string;
  public OriginatorConversationID: string;
  readonly ResponseCode?: string;
  readonly ResponseDescription?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}
