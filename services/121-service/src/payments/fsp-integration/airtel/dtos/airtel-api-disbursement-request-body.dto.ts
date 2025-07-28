export interface AirtelApiDisbursementRequestBodyDto {
  readonly payee: {
    readonly currency: string;
    readonly msisdn: string;
  };
  reference: string;
  readonly pin: string;
  readonly transaction: {
    readonly amount: number;
    readonly id: string;
    readonly type: 'B2C';
  };
}
