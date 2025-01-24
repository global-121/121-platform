export enum NedbankVoucherStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REDEEMABLE = 'REDEEMABLE',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED', // This status is used in the 121-platform to indicate that the voucher failed to be created because we got a negative response from Nedbank
}
