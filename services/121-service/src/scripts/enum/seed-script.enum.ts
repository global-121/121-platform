export enum SeedScript {
  productionInitialState = 'production-initial-state',
  testMultiple = 'test-multiple',
  nlrcMultiple = 'nlrc-multiple',
  nlrcMultipleMock = 'nlrc-multiple-mock-data',
  // we keep one specific program for each FSP at least (Intersolve Visa/Voucher are covered in nlrcMultiple)
  cbeProgram = 'cbe-program',
  safaricomProgram = 'safari-program',
  // excelProgram = 'excel-program',
  nedbankProgram = 'nedbank-program',
  // this is needed for testing matching columns in excel fsp
  nlrcPvExcelFail = 'nlrc-pv-excel-fail',
}
