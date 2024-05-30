export class OnafriqCallbackResponseDto {
  data: OnafriqDataDetails;
}

class OnafriqDataDetails {
  public thirdPartyTransId: string;
  public mfsTransId: string;
  public eTransId: string;
  public fxRate: number;
  public status: OnafriqStatus;
  public sendAmount: OnafriqAmount;
  public receiveAmount: OnafriqAmount;
}

class OnafriqStatus {
  public code: string;
  public message: string;
}

class OnafriqAmount {
  public amount: number;
  public currencyCode: string;
}
