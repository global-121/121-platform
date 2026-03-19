export interface AirtelApiUserLookupResponseBodyDto {
  readonly data: {
    readonly user_name: string;
    readonly msisdn: string;
    readonly is_airtel_money_user: boolean;
  };
  readonly status: {
    readonly response_code: string;
    readonly code: string;
    readonly success: boolean;
    readonly message: string;
  };
}
