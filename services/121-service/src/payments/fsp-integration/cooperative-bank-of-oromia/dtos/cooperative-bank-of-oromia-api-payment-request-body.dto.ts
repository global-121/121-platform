export interface CooperativeBankOfOromiaApiPaymentRequestBodyDto {
  readonly from_account: string;
  readonly to_account: string;
  readonly amount: number;
  readonly currency: string;
  readonly paymentType: string;
  readonly status: string;
}
