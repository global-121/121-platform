export class CooperativeBankOfOromiaApiTransferRequestBodyDto {
  readonly accountNumber: string;
  readonly amount: string;
  readonly debitAccount: string;
  readonly creditAccount: string;
  readonly creditAmount: string;
  readonly narrative: string;
  readonly messageId: string;
}
