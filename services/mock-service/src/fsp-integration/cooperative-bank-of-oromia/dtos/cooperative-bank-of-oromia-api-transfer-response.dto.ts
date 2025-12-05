export class CooperativeBankOfOromiaApiTransferResponseDto {
  success: boolean;
  message?: string;
  data?: {
    transactionId: string;
    messageId: string;
    debitAccount: string;
    creditAccount: string;
    amountDebited: string;
    amountCredited: string;
    processingDate: string;
  };
  error?: any;
}
