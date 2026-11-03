import { OtpVerificationFailureReason } from '@121-service/src/user/user-otp/enum/otp-verification-failure-reason.enum';

export type VerifyOtpResult =
  | { readonly isVerified: true }
  | {
      readonly isVerified: false;
      readonly failureReason: OtpVerificationFailureReason;
      readonly lockedUntil?: Date;
    };
