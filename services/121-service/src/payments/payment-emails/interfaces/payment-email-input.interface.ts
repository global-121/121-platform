export interface PendingApprovalEmailInput {
  readonly email: string;
  readonly displayName: string;
  readonly paymentUrl: string;
}

export interface PaymentApprovedEmailInput {
  readonly email: string;
  readonly displayName: string;
  readonly paymentUrl: string;
  readonly paymentCreatedAt: string;
}
