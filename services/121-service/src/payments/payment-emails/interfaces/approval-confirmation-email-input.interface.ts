export interface ApprovalConfirmationEmailInput {
  readonly email: string;
  readonly recipientName: string;
  readonly paymentUrl: string;
  readonly paymentCreatedAt: string;
}
