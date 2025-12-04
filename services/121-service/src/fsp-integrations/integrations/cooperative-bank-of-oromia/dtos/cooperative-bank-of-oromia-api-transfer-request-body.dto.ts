export interface CooperativeBankOfOromiaApiTransferRequestBodyDto {
  readonly debitAccount: string;
  readonly creditAccount: string;
  readonly creditAmount: number;
  readonly narrative: string;
  readonly messageId: string;
}
