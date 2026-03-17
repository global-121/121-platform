export interface PaymentEmailInput {
  readonly email: string;
  readonly displayName: string;
  readonly paymentUrl?: string;
  readonly paymentCreatedAt?: string;
}
