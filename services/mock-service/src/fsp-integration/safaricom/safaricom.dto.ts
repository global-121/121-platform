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
  public Occassion: string;
  public OriginatorConversationID: string;
  public IDType: string;
  public IDNumber: string;
  public conversationId?: string;
  public status?: string;
  public requestResult?: JSON;
  public paymentResult?: JSON;
}

export class SafaricomTransferResponseBodyDto {
  public ConversationID: string;
  public OriginatorConversationID: string;
  public ResponseCode: string;
  public ResponseDescription: string;
}
