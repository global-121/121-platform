export interface CooperativeBankOfOromiaApiPaymentResponseBodyDto {
  readonly success: boolean;
  readonly message: string;
  // When success is true
  readonly data?: {
    readonly transactionId: string;
    readonly messageId: string;
    readonly debitAccount: string;
    readonly creditAccount: string;
    readonly amountDebited: string;
    readonly amountCredited: string;
    readonly processingDate: string;
  };
  // When success is false
  readonly error?: {
    readonly code: string;
    readonly messages: string;
    readonly description: string;
  };
}
