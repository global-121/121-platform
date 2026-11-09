export enum OneTimePasswordVerificationFailureReason {
  noCode = 'noCode',
  locked = 'locked',
  consumed = 'consumed',
  expired = 'expired',
  replaced = 'replaced',
  wrongCode = 'wrongCode',
}
