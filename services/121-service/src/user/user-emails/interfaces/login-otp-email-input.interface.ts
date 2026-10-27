export interface LoginOtpEmailInput {
  readonly email: string;
  readonly recipientName: string;
  readonly otp: string;
  readonly expirationMinutes: number;
}
