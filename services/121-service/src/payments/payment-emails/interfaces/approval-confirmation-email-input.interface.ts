export interface ApprovalConfirmationEmailInput {
  readonly email: string;
  readonly displayName: string;
  readonly paymentUrl: string;
  readonly paymentCreatedAt: string;
}
