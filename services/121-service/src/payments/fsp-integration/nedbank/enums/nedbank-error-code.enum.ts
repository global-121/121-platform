// These error codes are an abstraction of the error codes that can be thrown by the Nedbank API and are used outside of the Nedbank Module (encapsulation).
export enum NedbankErrorCode {
  genericApiError = 'genericApiError', // This error code is used when we get an error from Nedbank API that we do not have a specific error code for
  tooManyRequestsForThisVoucher = 'tooManyRequestsForThisVoucher',
  voucherNotFound = 'voucherNotFound',
  invalidParameter = 'invalidParameter',
}
