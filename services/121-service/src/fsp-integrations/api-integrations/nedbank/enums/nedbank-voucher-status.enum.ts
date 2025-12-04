// This enum merges Nedbank Voucher and Nedbank order statuses
// TODO: REFACTOR: Consider refactoring this enum into two separate enums, together with refactoring NedbankVoucher into NedbankOrder and NedbankVoucher
export enum NedbankVoucherStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REDEEMABLE = 'REDEEMABLE',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED', // This status is used in the 121-platform to indicate that the voucher failed to be created because we got an error response from Nedbank
}
