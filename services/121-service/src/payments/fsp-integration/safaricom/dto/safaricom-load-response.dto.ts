export interface SafaricomTransferResponseDto {
  data: SafaricomTransferResponseBodyDto;
}

export interface SafaricomTransferResponseBodyDto {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
  errorMessage?: string;
}

export interface SafaricomAuthResponseDto {
  data: SafaricomAuthDataResponseDto;
}

interface SafaricomAuthDataResponseDto {
  access_token: string;
  expires_in: number;
}

export interface SafaricomPaymentResult {
  Result?: {
    OriginatorConversationID: string;
    ResultCode: number;
    ResultDesc?: string;
  };
}
