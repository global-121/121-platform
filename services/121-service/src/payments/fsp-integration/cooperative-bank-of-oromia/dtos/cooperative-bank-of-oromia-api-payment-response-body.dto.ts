export interface CooperativeBankOfOromiaApiPaymentResponseBodyDto {
  readonly status: string;
  readonly data: {
    readonly transfer_id: string;
    readonly from_account: string;
    readonly to_account: string;
    readonly amount: number;
    readonly currency: string;
    readonly status: string;
    readonly created_at: string;
  };
}
