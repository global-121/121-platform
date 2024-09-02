//TODO: replace these dto's with interfaces where necessary
export class SafaricomTransferResponseDto {
  public data: SafaricomTransferResponseBodyDto;
}

class SafaricomTransferResponseBodyDto {
  public ConversationID: string;
  public OriginatorConversationID: string;
  public ResponseCode: string;
  public ResponseDescription: string;
}

export class SafaricomAuthResponseDto {
  public data: SafaricomAuthDataResponseDto;
}

class SafaricomAuthDataResponseDto {
  public access_token: string;
  public expires_in: number;
}
