export class SafaricomTransferResponseDto {
  public data: SafaricomTransferResponseBodyDto;
}

export class SafaricomTransferResponseBodyDto {
  public ConversationID: string;
  public OriginatorConversationID: string;
  public ResponseCode: string;
  public ResponseDescription: string;
  public errorMessage?: string;
}

export class SafaricomAuthResponseDto {
  public data: SafaricomAuthDataResponseDto;
}

class SafaricomAuthDataResponseDto {
  public access_token: string;
  public expires_in: number;
}

export class SafaricomPaymentResult {
  public Result: {
    OriginatorConversationID: string;
    ResultCode: number;
    ResultDesc?: string;
  };
}
