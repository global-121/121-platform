export class OnafriqTransferResponseDto {
  data: OnafriqDataDetails;
}

class OnafriqDataDetails {
  public totalTxSent: number;
  public noTxAccepted: number;
  public noTxRejected: number;
  public details: OnafriqResponseDetails;
  public timestamp: string;
}

class OnafriqResponseDetails {
  public transResponse: OnafriqTransResponse[];
}

class OnafriqTransResponse {
  public thirdPartyId: string;
  public status: OnafriqStatus;
}

class OnafriqStatus {
  public code: string;
  public message: string;
}
