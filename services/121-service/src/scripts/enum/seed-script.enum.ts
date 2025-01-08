export enum SeedScript {
  testMultiple = 'test-multiple',
  nlrcMultiple = 'nlrc-multiple',
  nlrcMultipleMock = 'nlrc-multiple-mock-data',
  // we keep one specific program for each FSP at least (Intersolve Visa/Voucher are covered in nlrcMultiple)
  cbeProgram = 'cbe-program',
  safaricomProgram = 'safari-program',
  excelProgram = 'excel-program',
  // nedbankProgram = 'nedbank-program',
  // ##TODO: refactor out the need for this script
  oneAdmin = 'one-admin',
}
