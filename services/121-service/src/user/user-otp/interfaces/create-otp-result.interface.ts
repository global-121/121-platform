export interface CreateOtpResult {
  readonly otp: string;
  readonly expiresAt: Date;
}
