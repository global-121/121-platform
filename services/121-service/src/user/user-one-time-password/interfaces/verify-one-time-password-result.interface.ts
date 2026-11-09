import { OneTimePasswordVerificationFailureReason } from '@121-service/src/user/user-one-time-password/enum/one-time-password-verification-failure-reason.enum';

export type VerifyOneTimePasswordResult =
  | { readonly isVerified: true }
  | {
      readonly isVerified: false;
      readonly failureReason: OneTimePasswordVerificationFailureReason;
      readonly lockedUntil?: Date;
    };
